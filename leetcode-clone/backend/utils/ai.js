const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Helper: Safe JSON Parser
function safeParseJSON(raw) {
    try {
        if (!raw) return null;
        // remove invisible chars & markdown
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Validate expected schema
        if (typeof parsed.logic_score !== "number" || parsed.logic_score < 0 || parsed.logic_score > 1) {
            // Attempt to clamp or fix if it's close? Or just throw.
            // Let's be strict as per requirements, or maybe lenient if it's > 1 (normalize)?
            // User asked for 0-1.
            if (parsed.logic_score > 1 && parsed.logic_score <= 10) parsed.logic_score /= 10; // Auto-fix 0-10 to 0-1
        }
        return parsed;
    } catch (e) {
        return null;
    }
}

exports.analyzeCode = async ({ code, question, language, input_format, output_format, max_marks }) => {
    try {
        const prompt = `
You are an academic code evaluator for beginners.

Question:
${question}

Language: ${language}
Input Format: ${input_format || "Not specified"}
Output Format: ${output_format || "Not specified"}
Max Marks: ${max_marks}

Student Code:
${code}

Evaluation Rules:
- Assume beginner/student level (1st/2nd year CSE).
- Do NOT deduct marks for minor syntax or style issues.
- Focus primarily on the CORRECTNESS OF LOGIC and ALGORITHM.
- If the logic is correct but there are minor syntax errors or missing imports, give a HIGH logic_score (0.8 - 1.0).
- Ignore performance optimizations unless the code is fundamentally broken.
- Be generous. If the student clearly understands the concept, award full marks for logic.

Return ONLY a valid JSON object with EXACT keys:
{
  "logic_score": number between 0 and 1,
  "feedback": "Short, student-friendly explanation",
  "suggestions": "Simple improvement tips or empty string"
}

IMPORTANT:
- Do NOT include markdown.
- Do NOT include extra text.
- Output ONLY JSON.
`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            temperature: 0.1,
            messages: [
                { role: "system", content: "Return only valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            // timeout: 10000 // Groq SDK might not support timeout directly in create options, use axios signal if needed, but SDK defaults are usually fine.
        });

        const raw = completion.choices[0]?.message?.content;
        const parsed = safeParseJSON(raw);

        if (!parsed) throw new Error("Invalid AI response: " + raw);

        return parsed;

    } catch (err) {
        console.error("Groq AI Error:", err.message);
        // Fallback
        return {
            logic_score: 0,
            feedback: "AI evaluation skipped due to system error.",
            suggestions: ""
        };
    }
};
