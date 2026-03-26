import React, { useState, useEffect } from "react";
import api from "../../utils/api";


export default function Evaluations() {
    const [list, setList] = useState([]);

    useEffect(() => {
        async function fetchEvaluations() {
            try {
                const response = await api.get("/api/teacher/evaluations");
                setList(response.data);
            } catch (error) {
                console.error("Error fetching evaluations:", error);
            }
        }
        fetchEvaluations();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 mb-8">Pending Evaluations</h1>

            <div className="card overflow-hidden p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Student</th>
                            <th className="p-4 font-medium">Enrollment No.</th>
                            <th className="p-4 font-medium">Quiz</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 font-light text-gray-300">
                        {list.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">No evaluations pending.</td></tr>
                        ) : (
                            list.map(item => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-white font-medium">{item.student}</td>
                                    <td className="p-4 text-gray-300">{item.enrollmentNo || "-"}</td>
                                    <td className="p-4 text-gray-400">{item.quiz}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded text-xs uppercase font-bold tracking-wider">
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            className="btn-primary py-1.5 px-4 text-sm shadow-lg shadow-purple-500/20"
                                            onClick={() => window.location.href = `/teacher/evaluation/${item.id}`}
                                        >
                                            Evaluate
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
