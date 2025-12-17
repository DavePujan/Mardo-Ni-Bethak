import React, { useEffect, useState } from "react";


export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        active: 0,
        upcoming: 0,
        pending: 0,
        students: 0
    });

    const [quizzes, setQuizzes] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token");
                const headers = { "Authorization": `Bearer ${token}` };

                // Fetch Stats
                const statsResponse = await fetch("http://localhost:5000/api/teacher/dashboard", { headers });
                if (statsResponse.ok) setStats(await statsResponse.json());

                // Fetch Quizzes
                const quizResponse = await fetch("http://localhost:5000/api/teacher/quiz", { headers });
                if (quizResponse.ok) setQuizzes(await quizResponse.json());

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            }
        };
        fetchData();
    }, []);

    const endQuiz = async (id) => {
        if (!window.confirm("Are you sure you want to end this quiz?")) return;
        try {
            await fetch(`http://localhost:5000/api/teacher/quiz/${id}/end`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });
            // Refresh
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const activeQuizzes = quizzes.filter(q => q.is_active !== false);
    const historyQuizzes = quizzes.filter(q => q.is_active === false);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Teacher Dashboard</h1>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <StatCard title="Active Quizzes" value={activeQuizzes.length} />
                <StatCard title="Past Quizzes" value={historyQuizzes.length} />
                <StatCard title="Pending Evaluations" value={stats.pending} />
                <StatCard title="Total Students" value={stats.students} />
            </div>

            <h2 className="text-xl font-bold mb-4">Active Quizzes</h2>
            <div className="bg-white shadow rounded overflow-hidden mb-8">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Code</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeQuizzes.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center">No active quizzes.</td></tr>
                        ) : (
                            activeQuizzes.map(q => (
                                <tr key={q.id} className="border-b">
                                    <td className="p-4">{q.title}</td>
                                    <td className="p-4 font-mono text-sm">{q.id.slice(0, 8)}...</td>
                                    <td className="p-4 text-sm text-gray-500">{new Date(q.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => endQuiz(q.id)}
                                            className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                                        >
                                            End Quiz
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <h2 className="text-xl font-bold mb-4">Quiz History</h2>
            <div className="bg-white shadow rounded overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4">Title</th>
                            <th className="p-4">Code</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {historyQuizzes.length === 0 ? (
                            <tr><td colSpan="4" className="p-4 text-center">No past quizzes.</td></tr>
                        ) : (
                            historyQuizzes.map(q => (
                                <tr key={q.id} className="border-b bg-gray-50">
                                    <td className="p-4 text-gray-600">{q.title}</td>
                                    <td className="p-4 font-mono text-sm text-gray-500">{q.id.slice(0, 8)}...</td>
                                    <td className="p-4 text-sm text-gray-500">{new Date(q.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <button
                                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                                            onClick={() => alert("Analysis feature coming soon!")}
                                        >
                                            View Analysis
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

function StatCard({ title, value }) {
    return (
        <div className="bg-white shadow rounded p-5">
            <p className="text-gray-500">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}
