const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");
const { auth } = require("../middleware/auth");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Get All Active Quizzes for Students
router.get("/quizzes", auth, async (req, res) => {
    try {
        const { data: quizzes, error } = await supabase
            .from("quizzes")
            // Join with profiles using the foreign key 'created_by'
            // Syntax: select(*, alias:referenced_table!fk_check(cols))
            // Assuming simplified FK detection or explicit join:
            .select("*, creator:profiles!created_by(full_name, email)")
            .order("created_at", { ascending: false });

        console.log(`[Student] Fetching quizzes for ${req.user.email} (ID: ${req.user.id})`);
        console.log(`[Student] Found ${quizzes?.length || 0} quizzes`, error ? error : "");

        if (error) throw error;

        // Fetch correct profile UUID to check attempts (req.user.id is legacy Integer)
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", req.user.email)
            .single();

        const userId = profile?.id;

        // Fetch attempt status for each quiz for this user
        const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("quiz_id, status")
            .eq("user_id", userId);

        // Map attempts for easier lookup
        const attemptMap = {};
        attempts?.forEach(a => {
            attemptMap[a.quiz_id] = a.status;
        });

        let quizzesWithStatus = quizzes.map(q => ({
            ...q,
            status: attemptMap[q.id] || "not_started"
        }));

        // Allow fetching ALL quizzes (for Leaderboard), otherwise default to hiding submitted
        if (req.query.includeAttempted === "true") {
            // Fetching for history/leaderboard: Show everything
            return res.json(quizzesWithStatus);
        } else {
            // Filter logic for Student Dashboard
            const now = new Date(); // Current time

            const upcoming = [];
            const active = [];

            quizzesWithStatus.forEach(q => {
                const isTaken = q.status === "submitted" || q.status === "evaluated";
                if (isTaken) return; // Don't show already taken quizzes

                const manualActive = q.is_active !== false;
                if (!manualActive) return; // Teacher manually stopped it

                const scheduledTime = q.scheduled_at ? new Date(q.scheduled_at) : new Date(q.created_at);
                const durationMs = (q.duration || 60) * 60 * 1000;
                const endTime = new Date(scheduledTime.getTime() + durationMs);

                if (scheduledTime > now) {
                    upcoming.push(q);
                } else if (now >= scheduledTime && now < endTime) {
                    active.push(q);
                }
                // If now >= endTime, it's expired/history (hidden from here)
            });

            console.log(`[Student] Returning ${active.length} active and ${upcoming.length} upcoming quizzes.`);

            res.json({ active, upcoming });
        }
    } catch (err) {
        console.error("Fetch Quizzes Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Student Quiz History
router.get("/history", auth, async (req, res) => {
    try {
        // Fetch correct profile UUID
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", req.user.email)
            .single();

        const userId = profile?.id;
        console.log(`[History] Fetching history for email: ${req.user.email}, Profile ID: ${userId}`);

        if (!userId) {
            console.error("[History] Profile not found for user!");
            return res.json([]);
        }

        const { data: history, error } = await supabase
            .from("quiz_attempts")
            .select(`
                id,
                score,
                completed_at,
                status,
                quiz:quizzes (
                    id,
                    title,
                    subject,
                    total_marks,
                    scheduled_at,
                    created_at
                )
            `)
            .eq("user_id", userId)
            .order("completed_at", { ascending: false });

        if (error) throw error;

        res.json(history);
    } catch (err) {
        console.error("Fetch History Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Quiz Leaderboard
router.get("/leaderboard", auth, async (req, res) => {
    try {
        const { quizId } = req.query;

        let query = supabase
            .from("quiz_attempts")
            .select(`
                score,
                user:profiles(email),
                quiz:quizzes(title)
            `)
            .order("score", { ascending: false });

        if (quizId) {
            query = query.eq("quiz_id", quizId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform for frontend
        const leaderboard = data.map(row => ({
            username: row.user?.email?.split('@')[0] || "Unknown",
            score: row.score,
            quizTitle: row.quiz?.title,
            // runtime/memory not applicable for general quiz, but keeping structure if needed
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Single Quiz with Questions (for Attempt)
router.get("/quiz/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if already attempted
        const { data: existingAttempt } = await supabase
            .from("quiz_attempts")
            .select("id, status")
            .eq("user_id", req.user.id)
            .eq("quiz_id", id)
            .single();

        if (existingAttempt && existingAttempt.status !== "in_progress") { // Strict one-time rule? User said "only once".
            return res.status(403).json({ error: "You have already attempted this quiz." });
        }

        // Fetch Quiz Metadata
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("*, creator:profiles!created_by(full_name, email)")
            .eq("id", id)
            .single();

        if (quizError) throw quizError;

        // Fetch Questions via Map
        const { data: mapData, error: mapError } = await supabase
            .from("quiz_questions_map")
            .select(`
                question_id,
                weightage,
                question:questions (
                    id, title, type, language, input_format, output_format, image_url,
                    mcq_options (id, option_text)
                )
            `)
            .eq("quiz_id", id);
        // Note: For Code questions, we DO NOT send hidden testcases. Even public ones might be better hidden until run?
        // Usually we send example testcases. My DB schema has 'testcases' table.
        // Let's fetch public testcases for code questions.

        if (mapError) throw mapError;

        // Fetch Testcases separately or join? Join is deep.
        // Let's just enhance the mapped data.
        const questionsWithDetails = await Promise.all(mapData.map(async (item) => {
            const q = item.question;
            if (q.type === 'code') {
                const { data: visibleTests } = await supabase
                    .from("testcases")
                    .select("input, expected_output")
                    .eq("question_id", q.id)
                    .eq("is_hidden", false);
                q.testCases = visibleTests || [];
            }
            return {
                ...q,
                weightage: item.weightage
            };
        }));

        res.json({ ...quiz, questions: questionsWithDetails });

    } catch (err) {
        console.error("Fetch Single Quiz Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Submit Quiz Attempt
router.post("/quiz/:id/attempt", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // Array of { questionId, selectedOption, submittedCode }
        const { data: profile } = await supabase.from("profiles").select("id").eq("email", req.user.email).single();
        const userId = profile.id;

        // 1. Start Transaction (Simulated)
        // Check uniqueness again
        const { data: existing } = await supabase.from("quiz_attempts").select("id").eq("user_id", userId).eq("quiz_id", id).single();
        if (existing) return res.status(400).json({ error: "Attempt already exists" });

        // 2. Create Attempt Record
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .insert({
                user_id: userId,
                quiz_id: id,
                status: "submitted", // Or 'evaluated' if immediate
                completed_at: new Date()
            })
            .select()
            .single();

        if (attemptError) throw attemptError;

        // 3. Process Answers & Calculate Score (Basic Auto-Eval for MCQ)
        let totalScore = 0;
        const answerInserts = [];

        // Fetch correct answers for grading
        // For efficiency, fetch all questions in quiz
        const { data: quizQuestions } = await supabase
            .from("quiz_questions_map")
            .select(`
                weightage,
                question:questions (
                    id, type,
                    mcq_options (option_text, is_correct)
                )
            `)
            .eq("quiz_id", id);

        for (const userAns of answers) {
            const questionData = quizQuestions.find(q => q.question.id === userAns.questionId);
            if (!questionData) continue;

            const q = questionData.question;
            const weight = questionData.weightage;
            let isCorrect = false;
            let marks = 0;

            if (q.type === 'mcq') {
                const correctOpt = q.mcq_options.find(o => o.is_correct);
                if (correctOpt && correctOpt.option_text === userAns.selectedOption) {
                    isCorrect = true;
                    marks = weight;
                }
            } else if (q.type === 'code') {
                // TODO: Trigger Judge0 or leave for manual teacher review.
                // Status is 'submitted', Teacher will evaluate.
                // For now, no marks.
            }

            totalScore += marks;

            answerInserts.push({
                attempt_id: attempt.id,
                question_id: q.id,
                selected_option: userAns.selectedOption,
                submitted_code: userAns.submittedCode,
                is_correct: isCorrect,
                marks_awarded: marks
            });
        }

        // 4. Update Attempt Score
        await supabase.from("quiz_attempts").update({ score: totalScore, status: "evaluated" }).eq("id", attempt.id);
        // Note: If code questions exist, status might need to be 'submitted' (pending eval). 
        // Let's check if any code questions?
        const hasCode = quizQuestions.some(q => q.question.type === 'code');
        if (hasCode) {
            await supabase.from("quiz_attempts").update({ status: "submitted" }).eq("id", attempt.id);
        }

        // 5. Insert Details
        if (answerInserts.length > 0) {
            await supabase.from("quiz_answers").insert(answerInserts);
        }

        res.json({ message: "Quiz submitted successfully", score: totalScore, attemptId: attempt.id });

    } catch (err) {
        console.error("Submit Quiz Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Run Code (Test against first test case)
router.post("/quiz/:id/run", auth, async (req, res) => {
    try {
        const { id } = req.params; // quiz id
        const { questionId, code, language } = req.body;

        // 1. Fetch Question & First Test Case
        const { data: testCases, error } = await supabase
            .from("testcases")
            .select("input, expected_output")
            .eq("question_id", questionId)
            // .limit(1) // Just get all and pick first, or limit. 
            // Better to order by id or something stable? 
            // Let's just pick the first one returned.
            .order("id", { ascending: true })
            .limit(1)
            .single();

        if (error || !testCases) {
            // Fallback if no test cases?
            return res.json({
                status: { description: "No Test Cases Found" },
                stdout: "",
                stderr: "No test cases configured for this question."
            });
        }

        // 2. Prepare execution
        const judge0 = require("../utils/judge0");

        // Wrap code (reusing logic from teacher.js if possible, but duplicating for safety now to avoid wide Refactor)
        // Wrapper logic is crucial for JS/Python/C++ to read inputs.
        // User's previous teacher.js had a 'wrapCode' helper. I should probably use a shared utility, 
        // but for now I'll inline a simple version or try to extract it. 
        // Let's inline the basic wrapper for now to ensure it works.
        const wrapCode = (code, lang) => {
            if (lang === "javascript") {
                return `${code}\n\n// Driver Code\nconst fs = require('fs');\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/).map(Number);\nconsole.log(solution(...input));`;
            } else if (lang === "python") {
                return `${code}\n\n# Driver Code\nimport sys\ninput_data = sys.stdin.read().strip().split()\nargs = [int(x) for x in input_data]\nprint(solution(*args))`;
            } else if (lang === "cpp") {
                return `#include <iostream>\n#include <vector>\n#include <sstream>\nusing namespace std;\n\n${code}\n\nint main() {\n    // Simplified C++ driver for demo "a b"\n    // Assuming solution(int, int)\n    int a, b;\n    if (cin >> a >> b) cout << solution(a, b) << endl;\n    return 0;\n}`;
            }
            return code;
        };

        const finalCode = wrapCode(code, language);
        // Map language name to ID
        // JS: 63, Python: 71, C++: 54
        const langId = language === "python" ? 71 : language === "cpp" ? 54 : 63;

        // 3. Run on Judge0
        const result = await judge0.run({
            source_code: finalCode,
            language_id: langId,
            stdin: testCases.input, // Pass input! 
            expected_output: testCases.expected_output
        });

        // judge0.run doesn't support 'stdin' in the signature I viewed?
        // Let's double check judge0.js view.
        // judge0.js run function signature: ({ source_code, language_id, expected_output ... })
        // It DOES NOT take stdin in destructuring line 13!
        // I need to update judge0.js to accept stdin or pass it through options.
        // Wait, line 23 sends { ... } to axios. It doesn't include stdin! 
        // I need to fix judge0.js first! 

        // Assuming I fix judge0.js locally or here. 
        // I will first fix judge0.js in next step, but writing this route assuming it works.
        // Actually, I can pass strict object to `run` if I update it.

        res.json({
            ...result,
            input: testCases.input,
            expected: testCases.expected_output
        });

    } catch (err) {
        console.error("Run Code Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Detailed Quiz History (Review Mode)
router.get("/history/:attemptId", auth, async (req, res) => {
    try {
        const { attemptId } = req.params;
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", req.user.email)
            .single();

        const userId = profile?.id;

        // 1. Verify Attempt ownership
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .select("id, quiz_id, score, total_marks, status, created_at, completed_at")
            .eq("id", attemptId)
            .eq("user_id", userId)
            .single();

        if (attemptError || !attempt) {
            return res.status(404).json({ error: "Attempt not found" });
        }

        // 2. Fetch Questions & Answers
        // We need question details + user's answer + correct answer (for review)
        const { data: answers } = await supabase
            .from("quiz_answers")
            .select(`
                question_id,
                selected_option,
                submitted_code,
                is_correct,
                marks_awarded,
                question:questions (
                    id, title, type, difficulty, explanation, weightage,
                    mcq_options (option_text, is_correct)
                )
            `)
            .eq("attempt_id", attemptId);

        // 3. Transform Data
        const questions = answers.map((ans, idx) => {
            const q = ans.question;
            const options = q.mcq_options.map(o => o.option_text);
            const correctOptionIndex = q.mcq_options.findIndex(o => o.is_correct);
            const userOptionIndex = q.mcq_options.findIndex(o => o.option_text === ans.selected_option);

            return {
                id: q.id,
                title: q.title,
                type: q.type,
                difficulty: q.difficulty || "medium",
                marks: q.weightage,
                marksObtained: ans.marks_awarded,
                // Mock time spent per question if not tracked
                timeSpent: "45s",
                isCorrect: ans.is_correct,
                userAnswer: userOptionIndex, // Index for Frontend
                correctAnswer: correctOptionIndex, // Index for Frontend
                options: options,
                explanation: q.explanation
            };
        });

        res.json({
            ...attempt,
            questions
        });

    } catch (err) {
        console.error("Detailed History Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
