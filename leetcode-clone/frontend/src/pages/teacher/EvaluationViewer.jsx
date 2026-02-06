import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function EvaluationViewer() {
    const { id } = useParams();
    const [submission, setSubmission] = useState(null);
    const [loading, setLoading] = useState(false);

    // Mock getSubmissions
    async function getSubmissions() {
        return fetch(`http://localhost:5000/api/teacher/evaluation/${id}`, {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        }).then(r => r.json()).then(d => ({ data: d }));
    }

    useEffect(() => {
        if (!id) return;
        getSubmissions()
            .then(res => {
                // The backend route returns object { ..., answers: [] }
                setSubmission(res.data);
            })
            .catch(() => setSubmission(null));
    }, [id]);

    const handleAutoEvaluate = async () => {
        if (!confirm("Run Auto-Evaluation? This will use AI and Judge0 to grade code questions.")) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/teacher/evaluate/${id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                alert("Auto-Evaluation Complete!");
                window.location.reload(); // Refresh to see scores
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 text-gray-300">
            <h1 className="text-xl font-semibold mb-4 text-white">Answer Evaluation</h1>

            {submission && (
                <div className="bg-[#1e1e1e] shadow rounded p-4 mb-4 border border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="font-semibold text-gray-200">Student: {submission.student}</p>
                            <p className="text-sm text-gray-400">Quiz: {submission.quiz}</p>
                            <p className="text-sm text-gray-400">Total Score: {submission.score}</p>
                        </div>
                        <button
                            onClick={handleAutoEvaluate}
                            disabled={loading}
                            className={`px-4 py-2 rounded text-white font-medium ${loading ? "bg-gray-600" : "bg-purple-600 hover:bg-purple-700"}`}
                        >
                            {loading ? "Evaluating..." : "Auto Evaluate with AI"}
                        </button>
                    </div>

                    {submission.answers.map((a, i) => (
                        <div key={i} className="border-t border-gray-700 pt-2 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-200">Q{i + 1}: {a.question} <span className="text-gray-500 text-xs ml-2">(Max: {a.maxMarks})</span></span>
                                {a.ai_analysis && <span className="text-xs bg-purple-900/50 text-purple-200 border border-purple-700 px-2 py-0.5 rounded">AI Reviewed</span>}
                            </div>

                            <div className="bg-[#2d2d2d] p-2 rounded mt-1 font-mono text-sm overflow-x-auto text-gray-300 border border-gray-700">
                                <pre>{a.code || a.selectedOption || "No Answer"}</pre>
                            </div>

                            {a.feedback && (
                                <div className="mt-2 bg-blue-900/20 p-3 rounded text-sm text-gray-300 border border-blue-800/50">
                                    <p className="font-semibold text-blue-300 mb-1">AI Feedback:</p>
                                    {a.feedback}
                                    {a.test_cases_passed !== undefined && (
                                        <p className="mt-1 text-xs text-blue-400">
                                            Test Cases: {a.test_cases_passed} / {a.total_test_cases} passed.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center mt-3 gap-4">
                                <label className="text-sm text-gray-400">
                                    Marks: <input
                                        type="number"
                                        className="border border-gray-600 rounded p-1 w-20 bg-[#2d2d2d] text-white ml-2"
                                        defaultValue={a.marks}
                                        max={a.maxMarks}
                                        min={0}
                                        onChange={(e) => {
                                            let val = parseFloat(e.target.value);
                                            if (val > a.maxMarks) {
                                                val = a.maxMarks;
                                                e.target.value = val;
                                            }
                                            if (val < 0) {
                                                val = 0;
                                                e.target.value = val;
                                            }
                                            a.newMarks = val;
                                        }}
                                    />
                                </label>
                                <label className="flex items-center text-sm gap-2 text-gray-400">
                                    <input
                                        type="checkbox"
                                        defaultChecked={a.isCorrect}
                                        onChange={(e) => a.newIsCorrect = e.target.checked}
                                    />
                                    Correct
                                </label>
                            </div>
                        </div>
                    ))}

                    <button
                        className="btn-primary mt-6 w-full"
                        onClick={async () => {
                            if (!window.confirm("Finalize Evaluation?")) return;

                            // Gather updates
                            const updates = submission.answers.map(a => ({
                                questionId: a.questionId, // Need to ensure backend sends this!
                                marks: a.newMarks !== undefined ? a.newMarks : a.marks,
                                isCorrect: a.newIsCorrect !== undefined ? a.newIsCorrect : a.isCorrect
                            }));

                            try {
                                const res = await fetch(`http://localhost:5000/api/teacher/evaluation/${id}/finalize`, {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                                    },
                                    body: JSON.stringify({ marks: updates })
                                });
                                if (res.ok) {
                                    alert("Evaluated Successfully!");
                                    window.location.href = "/teacher/evaluations";
                                } else {
                                    alert("Failed!");
                                }
                            } catch (e) { console.error(e); }
                        }}
                    >
                        Finalize & Submit
                    </button>
                </div>
            )}
        </div>
    );
}
