import express from "express";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { supabase } from "./supabase.js";
import { evaluateCode } from "./judge0.js";
import { llmFeedback } from "./llm.js";
import { saveResult } from "./scorer.js";
import { exportCSV } from "./csv.js";

const app = express();
app.use(express.json());

// Endpoint to trigger evaluation
app.post("/evaluate/:submissionId", async (req, res) => {
    try {
        const { submissionId } = req.params;

        console.log(`Fetching submission ${submissionId}...`);
        const { data: submission, error: subError } = await supabase
            .from("submissions")
            .select("*")
            .eq("id", submissionId)
            .single();

        if (subError || !submission) {
            return res.status(404).json({ error: "Submission not found", details: subError });
        }

        console.log(`Fetching testcases for question ${submission.question_id}...`);
        const { data: testcases, error: tcError } = await supabase
            .from("testcases")
            .select("*")
            .eq("question_id", submission.question_id);

        if (tcError) {
            return res.status(500).json({ error: "Error fetching testcases", details: tcError });
        }

        console.log("Evaluating code...");
        const execResult = await evaluateCode(submission, testcases);

        console.log("Getting LLM feedback...");
        const feedback = await llmFeedback(submission.code, execResult);

        console.log("Saving results...");
        const finalScore = await saveResult(submission, execResult, feedback);

        res.json({
            ...finalScore,
            details: execResult.results // Send details to client
        });
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Helper point to trigger CSV export
app.get("/export-results", async (req, res) => {
    try {
        const { data } = await supabase.from("results").select("*");
        exportCSV(data);
        res.send("CSV exported. Check backend/results.csv");
    } catch (e) {
        res.status(500).send("Error exporting CSV");
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
