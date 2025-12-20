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
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Answer Evaluation</h1>

            {submission && (
                <div className="bg-white shadow rounded p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <p className="font-semibold">Student: {submission.student}</p>
                            <p className="text-sm text-gray-500">Quiz: {submission.quiz}</p>
                            <p className="text-sm text-gray-500">Total Score: {submission.score}</p>
                        </div>
                        <button
                            onClick={handleAutoEvaluate}
                            disabled={loading}
                            className={`px-4 py-2 rounded text-white font-medium ${loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
                        >
                            {loading ? "Evaluating..." : "Auto Evaluate with AI"}
                        </button>
                    </div>

                    {submission.answers.map((a, i) => (
                        <div key={i} className="border-t pt-2 mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-700">Q{i + 1}: {a.question}</span>
                                {a.ai_analysis && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">AI Reviewed</span>}
                            </div>

                            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm overflow-x-auto">
                                <pre>{a.code || a.selectedOption || "No Answer"}</pre>
                            </div>

                            {a.feedback && (
                                <div className="mt-2 bg-blue-50 p-3 rounded text-sm text-gray-700 border border-blue-100">
                                    <p className="font-semibold text-blue-800 mb-1">AI Feedback:</p>
                                    {a.feedback}
                                    {a.test_cases_passed !== undefined && (
                                        <p className="mt-1 text-xs text-blue-600">
                                            Test Cases: {a.test_cases_passed} / {a.total_test_cases} passed.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center mt-3 gap-4">
                                <label className="text-sm text-gray-600">
                                    Marks: <input
                                        type="number"
                                        className="border rounded p-1 w-20"
                                        defaultValue={a.marks}
                                        onChange={(e) => {
                                            // Ideally update state, but for quick fix we can use ref or local logic
                                            // Let's assume we want to submit all
                                            a.newMarks = e.target.value;
                                        }}
                                    />
                                </label>
                                <label className="flex items-center text-sm gap-2">
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
