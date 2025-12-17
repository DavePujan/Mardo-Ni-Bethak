import React, { useEffect, useState } from "react";
import { getAdminStats } from "../../utils/api";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        quizzes: 0,
        pendingRoles: 0
    });

    useEffect(() => {
        getAdminStats()
            .then(res => {
                setStats({
                    users: res.data.totalUsers || 0,
                    quizzes: res.data.activeQuizzes || 0,
                    history: res.data.historyQuizzes || 0,
                    pendingRoles: res.data.pendingRequests || 0
                });
            })
            .catch(err => {
                console.error("Admin Dashboard stats unavailable", err);
                // Keep default state
            });
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-4 gap-4">
                <Stat title="Total Users" value={stats.users} />
                <Stat title="Active Quizzes" value={stats.quizzes} />
                <Stat title="Quiz History" value={stats.history} />
                <Stat title="Pending Requests" value={stats.pendingRoles} />
            </div>
        </div>
    );
}

function Stat({ title, value }) {
    return (
        <div className="bg-white p-5 shadow rounded">
            <p className="text-gray-500">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
    );
}
