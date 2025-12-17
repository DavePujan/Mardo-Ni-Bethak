import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

export default function EvaluationViewer() {
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        getSubmissions()
            .then(res => {
                setSubmissions(res.data);
            })
            .catch(() => setSubmissions([]));
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Answer Evaluation</h1>

            {submission && (
                <div className="bg-white shadow rounded p-4 mb-4">
                    <p className="font-semibold">Student: {submission.student}</p>
                    <p className="text-sm text-gray-500 mb-2">Quiz: {submission.quiz}</p>
                    <p className="text-sm text-gray-500 mb-4">Total Score: {submission.score}</p>

                    {submission.answers.map((a, i) => (
                        <div key={i} className="border-t pt-2 mt-2">
                            <p className="font-medium">Q{i + 1}: {a.question}</p>
                            <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-sm">
                                {a.code || a.selectedOption || "No Answer"}
                            </div>

                            <div className="flex items-center mt-2 gap-4">
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
