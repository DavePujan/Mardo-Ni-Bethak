import React, { useState, useEffect } from "react";


export default function Evaluations() {
    const [list, setList] = useState([]);

    useEffect(() => {
        async function fetchEvaluations() {
            try {
                const response = await fetch("http://localhost:5000/api/teacher/evaluations", {
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                const data = await response.json();
                if (response.ok) {
                    setList(data);
                } else {
                    console.error("Failed to fetch evaluations:", data.error);
                }
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            }
        }
        fetchEvaluations();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Pending Evaluations</h1>

            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr>
                        <th>Student</th>
                        <th>Quiz</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {list.map(item => (
                        <tr key={item.id}>
                            <td>{item.student}</td>
                            <td>{item.quiz}</td>
                            <td>{item.status}</td>
                            <td>
                                <button
                                    className="btn-primary"
                                    onClick={() => window.location.href = `/teacher/evaluation/${item.id}`}
                                >
                                    Evaluate
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
