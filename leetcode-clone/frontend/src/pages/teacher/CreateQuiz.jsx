import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { createFullQuiz } from "../../utils/api";

export default function CreateQuiz() {
    // Quiz Metadata
    const [quizDetails, setQuizDetails] = useState({
        title: "",
        subject: "",
        department: "",
        semester: "",
        duration: "",
        totalMarks: "",
        description: ""
    });

    // List of Questions
    const [questions, setQuestions] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    // Current Question Form State
    const [currentQ, setCurrentQ] = useState({
        question: "", // Title/Question Text
        type: "code", // 'mcq' or 'code'
        marks: 5,
        // Code specific
        language: "javascript",
        inputFormat: "",
        outputFormat: "",
        testCases: [{ input: "", output: "", isHidden: false }],
        // MCQ specific
        options: ["", "", "", ""],
        answer: "",
        image: "" // Optional Image URL
    });

    const handleQuizChange = (e) => setQuizDetails({ ...quizDetails, [e.target.name]: e.target.value });

    // --- Question Form Handlers ---
    const handleQChange = (field, value) => {
        setCurrentQ({ ...currentQ, [field]: value });
    };

    const handleOptionChange = (idx, val) => {
        const newOpts = [...currentQ.options];
        newOpts[idx] = val;
        setCurrentQ({ ...currentQ, options: newOpts });
    };

    const handleTestCaseChange = (idx, field, val) => {
        const newTC = [...currentQ.testCases];
        newTC[idx][field] = val;
        setCurrentQ({ ...currentQ, testCases: newTC });
    };

    const addTestCase = () => {
        setCurrentQ({
            ...currentQ,
            testCases: [...currentQ.testCases, { input: "", output: "", isHidden: false }]
        });
    };

    const removeTestCase = (idx) => {
        const newTC = currentQ.testCases.filter((_, i) => i !== idx);
        setCurrentQ({ ...currentQ, testCases: newTC });
    };

    const addQuestion = () => {
        // Validation could go here
        setQuestions([...questions, { ...currentQ }]);
        // Reset Current Question safely
        setCurrentQ({
            question: "",
            type: "code",
            marks: 5,
            language: "javascript",
            inputFormat: "",
            outputFormat: "",
            testCases: [{ input: "", output: "", isHidden: false }],
            options: ["", "", "", ""],
            answer: "",
            image: ""
        });
    };

    const deleteQuestion = (idx) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (questions.length === 0) {
            alert("Please add at least one question.");
            return;
        }
        // Validation: All fields required except description
        if (!quizDetails.title || !quizDetails.subject || !quizDetails.department || !quizDetails.semester || !quizDetails.duration || !quizDetails.totalMarks) {
            alert("Please fill in all Quiz Details (Title, Subject, Department, Semester, Duration, Total Marks).");
            return;
        }

        setSubmitting(true);
        try {
            // Process questions: Upload images if they are File objects
            const processedQuestions = await Promise.all(questions.map(async (q) => {
                if (q.image && q.image instanceof File) {
                    const fileName = `${Date.now()}_${q.image.name}`;
                    const { error } = await supabase.storage
                        .from("quiz_images")
                        .upload(fileName, q.image);

                    if (error) throw error;

                    const { data } = supabase.storage
                        .from("quiz_images")
                        .getPublicUrl(fileName);

                    return { ...q, image: data.publicUrl };
                }
                return q; // Already a URL or empty
            }));

            const payload = {
                ...quizDetails,
                questions: processedQuestions
            };

            await createFullQuiz(payload);
            alert("Quiz and Questions Created Successfully!");
            // Optional: Redirect or reset
            setQuestions([]);
            setQuizDetails({ title: "", subject: "", department: "", semester: "", duration: "", totalMarks: "", description: "" });
        } catch (error) {
            console.error(error);
            alert("Error creating quiz: " + (error.response?.data?.error || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto bg-black min-h-screen text-gray-300 font-sans">
            <h1 className="text-3xl font-bold mb-6 text-white border-b border-gray-700 pb-2">Create New Quiz</h1>

            {/* Quiz Details Section */}
            <div className="bg-[#1e1e1e] p-6 rounded-lg mb-8 shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-pink-400">1. Quiz Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="title" placeholder="Quiz Title" value={quizDetails.title} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white" />
                    <input name="subject" placeholder="Subject" value={quizDetails.subject} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white" />

                    <select name="department" value={quizDetails.department} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white">
                        <option value="">Select Department</option>
                        <option value="CS">Computer Science</option>
                        <option value="IT">Information Technology</option>
                        <option value="ECE">Electronics & Communication</option>
                        <option value="EE">Electrical Engineering</option>
                        <option value="ME">Mechanical Engineering</option>
                        <option value="CE">Civil Engineering</option>
                    </select>

                    <select name="semester" value={quizDetails.semester} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white">
                        <option value="">Select Semester</option>
                        <option value="1st">1st Semester</option>
                        <option value="2nd">2nd Semester</option>
                        <option value="3rd">3rd Semester</option>
                        <option value="4th">4th Semester</option>
                        <option value="5th">5th Semester</option>
                        <option value="6th">6th Semester</option>
                        <option value="7th">7th Semester</option>
                        <option value="8th">8th Semester</option>
                    </select>

                    <input name="duration" placeholder="Duration (mins)" type="number" value={quizDetails.duration} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white" />
                    <input name="totalMarks" placeholder="Total Marks" type="number" value={quizDetails.totalMarks} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white" />
                    <textarea name="description" placeholder="Description" value={quizDetails.description} onChange={handleQuizChange} className="input bg-[#252526] border-gray-700 text-white col-span-2 h-20" />
                </div>
            </div>

            {/* Add Question Section */}
            <div className="bg-[#1e1e1e] p-6 rounded-lg mb-8 shadow-lg border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-blue-400">2. Add Questions</h2>

                {/* Question Type Selector */}
                <div className="mb-4">
                    <label className="mr-3 font-bold">Question Type:</label>
                    <select
                        value={currentQ.type}
                        onChange={(e) => handleQChange("type", e.target.value)}
                        className="bg-[#252526] border border-gray-600 rounded p-1 text-white"
                    >
                        <option value="code">Code</option>
                        <option value="mcq">MCQ</option>
                    </select>

                    <label className="ml-6 mr-3 font-bold">Weightage:</label>
                    <input
                        type="number"
                        value={currentQ.marks}
                        onChange={(e) => handleQChange("marks", e.target.value)}
                        className="bg-[#252526] border border-gray-600 rounded p-1 text-white w-20 text-center"
                    />
                </div>

                <div className="mb-4">
                    <label className="block mb-1 text-gray-400">Question Title / Prompt:</label>
                    <input
                        value={currentQ.question}
                        onChange={(e) => handleQChange("question", e.target.value)}
                        className="w-full bg-[#252526] border border-gray-600 rounded p-2 text-white"
                        placeholder="e.g. Write a function to add two numbers..."
                    />
                </div>

                {/* Conditional Form Fields */}
                {currentQ.type === "code" ? (
                    <div className="bg-[#1e1e1e] border-l-4 border-blue-500 pl-4 py-2">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <select value={currentQ.language} onChange={e => handleQChange("language", e.target.value)} className="input bg-[#252526] border-gray-600 text-white">
                                <option value="javascript">JavaScript</option>
                                <option value="python">Python</option>
                                <option value="cpp">C++</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <input placeholder="Input Format (e.g. a, b)" value={currentQ.inputFormat} onChange={e => handleQChange("inputFormat", e.target.value)} className="input bg-[#252526] border-gray-600 text-white" />
                            <input placeholder="Output Format (e.g. sum)" value={currentQ.outputFormat} onChange={e => handleQChange("outputFormat", e.target.value)} className="input bg-[#252526] border-gray-600 text-white" />
                        </div>

                        <div className="mb-2">
                            <p className="mb-2 font-semibold">Test Cases:</p>
                            {currentQ.testCases.map((tc, i) => (
                                <div key={i} className="flex gap-2 mb-2 items-center">
                                    <span className="text-gray-500">{i + 1})</span>
                                    <input placeholder="Input" value={tc.input} onChange={e => handleTestCaseChange(i, "input", e.target.value)} className="flex-1 bg-[#2d2d2d] border border-gray-600 rounded p-1 text-green-400 font-mono text-sm" />
                                    <span className="text-gray-500">→</span>
                                    <input placeholder="Output" value={tc.output} onChange={e => handleTestCaseChange(i, "output", e.target.value)} className="flex-1 bg-[#2d2d2d] border border-gray-600 rounded p-1 text-green-400 font-mono text-sm" />
                                    <button onClick={() => removeTestCase(i)} className="text-red-500 hover:text-red-400 px-2">✕</button>
                                </div>
                            ))}
                            <button onClick={addTestCase} className="text-sm text-blue-400 hover:underline">+ Add Test Case</button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-[#1e1e1e] border-l-4 border-yellow-500 pl-4 py-2">
                        <div className="mb-4">
                            <label className="block mb-1 text-gray-400">Optional Image:</label>
                            {currentQ.image ? (
                                <div className="flex items-center gap-4 bg-[#252526] p-2 rounded border border-green-500">
                                    <span className="text-green-400 text-sm truncate max-w-xs">
                                        {currentQ.image instanceof File ? currentQ.image.name : "Image Uploaded"}
                                    </span>
                                    <button
                                        onClick={() => handleQChange("image", "")}
                                        className="text-red-400 hover:text-red-300 text-sm font-bold"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded inline-flex items-center transition">
                                        <span>+ Select Image</span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => {
                                                if (e.target.files[0]) {
                                                    handleQChange("image", e.target.files[0]);
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 mt-1">Supported: JPG, PNG, GIF</p>
                                </div>
                            )}
                        </div>

                        <p className="mb-2 font-semibold">Options:</p>
                        {currentQ.options.map((opt, i) => (
                            <div key={i} className="mb-2 flex items-center gap-2">
                                <span className="text-gray-400">Option {i + 1}:</span>
                                <input value={opt} onChange={e => handleOptionChange(i, e.target.value)} className="flex-1 bg-[#252526] border border-gray-600 rounded p-2 text-white" />
                            </div>
                        ))}
                        <p className="mt-2 mb-1 font-semibold">Correct Answer (must match option text exactly):</p>
                        <input value={currentQ.answer} onChange={e => handleQChange("answer", e.target.value)} className="w-full bg-[#252526] border border-gray-600 rounded p-2 text-white" placeholder="Copy correct option here" />
                    </div>
                )}

                <button onClick={addQuestion} className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded transition">
                    + Add Question to Quiz
                </button>
            </div>

            {/* Questions List Review */}
            {questions.length > 0 && (
                <div className="bg-[#1e1e1e] p-6 rounded-lg mb-8 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-green-400">3. Review Questions ({questions.length})</h2>
                    <div className="space-y-4">
                        {questions.map((q, i) => (
                            <div key={i} className="bg-[#252526] p-4 rounded border border-gray-700 flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white text-lg"><span className="text-gray-500">Q{i + 1}.</span> {q.question}</h3>
                                    <p className="text-sm text-gray-400">Type: <span className="uppercase text-yellow-500">{q.type}</span> | Marks: {q.marks}</p>
                                    {q.type === 'mcq' && <p className="text-xs text-gray-500 mt-1">Answer: {q.answer}</p>}
                                    {q.type === 'code' && <p className="text-xs text-gray-500 mt-1">Lang: {q.language} | Cases: {q.testCases.length}</p>}
                                </div>
                                <button onClick={() => deleteQuestion(i)} className="text-red-500 hover:text-red-400">Delete</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Final Submit */}
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className={`w-full font-bold py-4 rounded-lg text-xl shadow-lg transition transform hover:scale-[1.01] ${submitting
                    ? "bg-gray-600 cursor-wait"
                    : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
            >
                {submitting ? "Uploading & Creating Quiz..." : "🚀 Create Full Quiz"}
            </button>
        </div>
    );
}
