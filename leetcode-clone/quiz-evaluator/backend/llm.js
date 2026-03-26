import axios from "axios";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export async function llmFeedback(code, execResult) {
    try {
        const prompt = `
Student code:
${code}

Execution:
Passed ${execResult.passed}/${execResult.total}

Give short feedback. No marks.
`;

        const res = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: prompt }]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
                }
            }
        );

        return res.data.choices[0].message.content;
    } catch (error) {
        console.error("LLM Error:", error.message);
        return "Feedback unavailable due to an error.";
    }
}
