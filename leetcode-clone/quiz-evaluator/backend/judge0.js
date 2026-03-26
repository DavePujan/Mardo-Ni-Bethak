import axios from "axios";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const JUDGE0_BASE = process.env.JUDGE0_URL || process.env.JUDGE0_API_URL || "http://127.0.0.1:2358";
const JUDGE0_HEADERS = {};
if (process.env.JUDGE0_API_KEY) {
    JUDGE0_HEADERS['X-Auth-Token'] = process.env.JUDGE0_API_KEY;
}

export async function evaluateCode(submission, testcases) {
    let passed = 0;

    // Create a promise for each testcase to run in parallel eventually, but sequential for now as per req
    // The user requirement implies a loop.

    const results = [];

    for (const tc of testcases) {
        try {
            const response = await axios.post(
                `${JUDGE0_BASE}/submissions?wait=true`,
                {
                    source_code: submission.code,
                    language_id: submission.language === "js" ? 63 : 71, // 63: Node.js, 71: Python
                    stdin: tc.input
                },
                { headers: JUDGE0_HEADERS }
            );

            const output = response.data.stdout?.trim();
            const expected = tc.expected_output.trim();

            const isPassed = output === expected;
            if (isPassed) {
                passed++;
            }

            results.push({
                input: tc.input,
                expected: expected,
                actual: output,
                passed: isPassed
            });

        } catch (error) {
            console.error("Judge0 Error:", error.message);
            results.push({
                input: tc.input,
                error: error.message,
                passed: false
            });
        }
    }

    return {
        total: testcases.length,
        passed,
        results // Return detailed results for debugging
    };
}
