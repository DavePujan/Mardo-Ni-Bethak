const { GoogleGenerativeAI } = require("@google/generative-ai");

// Provider Abstraction Setup
const generateAIResponse = async (prompt, apiKey, isJson = true) => {
    if (!apiKey) throw new Error("AI API Key is required.");
    const genAI = new GoogleGenerativeAI(apiKey);
    const config = isJson ? { responseMimeType: "application/json" } : {};
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest", generationConfig: config });
    const result = await model.generateContent(prompt);
    return result.response.text();
};

// Helper: Safe JSON Parser
function safeParseJSON(raw) {
    try {
        if (!raw) return null;
        // remove invisible chars & markdown
        const cleaned = raw.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);

        // Validate expected schema
        if (typeof parsed.logic_score !== "number" || parsed.logic_score < 0 || parsed.logic_score > 1) {
            if (parsed.logic_score > 1 && parsed.logic_score <= 10) parsed.logic_score /= 10; // Auto-fix 0-10 to 0-1
        }
        return parsed;
    } catch (e) {
        return null;
    }
}

exports.analyzeCode = async ({ code, question, language, input_format, output_format, max_marks, apiKey }) => {
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
`;

        const raw = await generateAIResponse(prompt, apiKey, true);
        const parsed = safeParseJSON(raw);

        if (!parsed) throw new Error("Invalid AI response: " + raw);

        return parsed;

    } catch (err) {
        console.error("Gemini AI Error:", err.message);
        // Fallback
        return {
            logic_score: 0,
            feedback: "AI evaluation skipped due to system error: " + err.message,
            suggestions: ""
        };
    }
};

exports.generateQuiz = async ({ prompt, apiKey }) => {
    try {

        const aiPrompt = `
You are a quiz generation assistant.
User Request: "${prompt}"

Generate a list of questions based on the user's request. 
Format the output as a valid JSON array of objects.

Each object should follow this schema:
{
  "question": "Question text...",
  "type": "mcq" | "code",
  "marks": number,
  "options": ["Opt1", "Opt2", "Opt3", "Opt4"], // Only for MCQ (4 options)
  "answer": "Correct Option Text", // Matches one of the options exactly
  "language": "javascript" | "python" | "cpp", // Only for Code
  "functionName": "solution", // Only for Code (The name of the function to be called)
  "inputFormat": "e.g. n lines of integers", // Only for Code
  "outputFormat": "e.g. a single integer", // Only for Code
  "testCases": [ // Only for Code (provide 2-3 examples)
    { "input": "...", "output": "...", "isHidden": false }
  ]
}

IMPORTANT Rules:
- If type is 'mcq', ensure 'options' has 4 items and 'answer' matches one exactly.
- If type is 'code', ensure 'testCases' are provided and valid.
- Be creative with the content but strict with the JSON structure.
`;

        const raw = await generateAIResponse(aiPrompt, apiKey, true);
        const parsed = safeParseJSON(raw);

        // Expecting an array, but safeParseJSON might return object if wrapped.
        if (parsed) {
            if (Array.isArray(parsed)) return parsed;
            if (parsed.questions && Array.isArray(parsed.questions)) return parsed.questions;
        }

        throw new Error("Invalid AI response structure");

    } catch (err) {
        console.error("Gemini AI Generate Error:", err.message);
        throw new Error("Failed to generate quiz from AI: " + err.message);
    }
};

exports.classifyQuestion = async ({ questionText, apiKey }) => {
    try {

        const prompt = `
You are an expert computer science educator.

Your task is to classify the following quiz question into exactly ONE topic
from the allowed list below.

Allowed topics:
- Algorithms
- Data Structures
- Correctness
- Complexity
- Logic & Reasoning
- Recursion
- Mathematical Foundations
- Programming Basics
- Edge Cases & Testing
- Other

Question:
"${questionText}"

Rules:
- Return ONLY the topic name
- Do NOT explain your answer
- Do NOT invent new topics
- If unsure, return "Other"
`;

        const rawTopic = await generateAIResponse(prompt, apiKey, false);
        const topic = rawTopic.trim();

        // Basic validation against allowing list
        const allowed = [
            "Algorithms", "Data Structures", "Correctness", "Complexity",
            "Logic & Reasoning", "Recursion", "Mathematical Foundations",
            "Programming Basics", "Edge Cases & Testing", "Other"
        ];

        const normalized = allowed.find(t => t.toLowerCase() === topic.toLowerCase()) || "Other";
        return normalized;

    } catch (err) {
        console.error("AI Classification Error:", err.message);
        return "Other"; // Fallback
    }
};
