const express = require("express");
const router = express.Router();
const { runBatch } = require("../utils/judge0");
const boilerplates = require("../utils/boilerplates");
const questions = require("../models/Question");
const { auth } = require("../middleware/auth");
const leaderboard = require("../models/Leaderboard");
const crypto = require("crypto");
const redisClient = require("../config/redis");

// Simple In-Memory Cache (LRU-like but just map for now)
const submissionCache = new Map();

// Mock Problems List
const problemsList = [
    { id: "add-two", title: "Add Two Numbers" },
    { id: "fibonacci", title: "Fibonacci Number" },
    { id: "two-sum", title: "Two Sum" }
];

router.get("/problems", async (req, res) => {
    res.json(problemsList);
});

router.post("/submit", auth, async (req, res) => {
    const { code, language, questionId } = req.body;
    const q = questions[questionId];
    const userId = req.user.id;

    if (!q) return res.status(404).json({ verdict: "Question not found" });

    // 1. Security Checks
    if (code.includes("require('fs')") || code.includes("System.exit") || code.includes("window.")) {
        return res.json({ verdict: "Security Violation: Unsafe Code Detected" });
    }

    // 2. Cache Check (Hash: code + lang + question)
    const cacheKey = crypto.createHash("sha256").update(code + language + questionId).digest("hex");
    if (submissionCache.has(cacheKey)) {
        console.log("⚡ Cache Hit for submission");
        return res.json(submissionCache.get(cacheKey));
    }

    try {
        // Prepare Public Batch
        if (!boilerplates[language]) return res.json({ verdict: "Language not supported" });

        const publicSubmissions = q.testCases.public.map(tc => ({
            source_code: boilerplates[language](code, q.functionName, tc.input),
            language_id: q.langMap[language],
            expected_output: tc.output,
            cpu_time_limit: 2,
            memory_limit: 128000
        }));

        // Run Public Batch
        const publicResults = await runBatch(publicSubmissions);

        // Check Public Results
        let maxRuntime = 0;
        let maxMemory = 0;

        for (let i = 0; i < publicResults.length; i++) {
            const result = publicResults[i];
            const tc = q.testCases.public[i];

            if (!result.status || result.status.description !== "Accepted") {
                const response = {
                    verdict: "Wrong Answer (Public Case)",
                    debug: {
                        input: tc.input,
                        output: result.stdout,
                        expected: tc.output,
                        error: result.stderr
                    }
                };
                submissionCache.set(cacheKey, response);
                return res.json(response);
            }
            maxRuntime = Math.max(maxRuntime, parseFloat(result.time || 0));
            maxMemory = Math.max(maxMemory, result.memory || 0);
        }

        // If Public Passed, Run Hidden
        const hiddenSubmissions = q.testCases.hidden.map(tc => ({
            source_code: boilerplates[language](code, q.functionName, tc.input),
            language_id: q.langMap[language],
            expected_output: tc.output,
            cpu_time_limit: 2,
            memory_limit: 128000
        }));

        const hiddenResults = await runBatch(hiddenSubmissions);

        for (let result of hiddenResults) {
            if (!result.status || result.status.description !== "Accepted") {
                const response = { verdict: "Wrong Answer (Hidden Test Case)" };
                submissionCache.set(cacheKey, response);
                return res.json(response);
            }
            maxRuntime = Math.max(maxRuntime, parseFloat(result.time || 0));
            maxMemory = Math.max(maxMemory, result.memory || 0);
        }

        // Success
        const response = {
            verdict: "Accepted",
            stats: { runtime: maxRuntime, memory: maxMemory }
        };
        submissionCache.set(cacheKey, response);

        // Update Leaderboard
        const existingIndex = leaderboard.findIndex(e => e.userId === userId && e.questionId === questionId);
        if (existingIndex !== -1) {
            if (maxRuntime < leaderboard[existingIndex].runtime) {
                leaderboard[existingIndex] = {
                    userId, questionId, language, runtime: maxRuntime, memory: maxMemory, submittedAt: new Date()
                };
                // STEP 4: Cache validation (Invalidate Redis exactly for this question's leaderboard)
                if (redisClient.isAvailable) {
                    await redisClient.del(`leaderboard:question:${questionId}`);
                }
            }
        } else {
            leaderboard.push({
                userId, questionId, language, runtime: maxRuntime, memory: maxMemory, submittedAt: new Date()
            });
            // STEP 4: Cache Invalidation
            if (redisClient.isAvailable) {
                await redisClient.del(`leaderboard:question:${questionId}`);
            }
        }

        res.json(response);

    } catch (error) {
        console.error(error);
        res.status(500).json({ verdict: "Server Error" });
    }
});

module.exports = router;
