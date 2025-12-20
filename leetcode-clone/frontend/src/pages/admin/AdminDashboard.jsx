import React, { useEffect, useState } from "react";
import { getAdminStats } from "../../utils/api";
import axios from "axios";

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
            .catch(err => console.error("Admin stats error", err));
    }, []);





    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <Stat title="Total Users" value={stats.users} />
                <Stat title="Active Quizzes" value={stats.quizzes} />
                <Stat title="Quiz History" value={stats.history} />
                <Stat title="Pending Requests" value={stats.pendingRoles} />
            </div>

            <div className="bg-white shadow rounded p-6">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = "/admin/requests"}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded shadow"
                    >
                        Manage Access Requests
                    </button>
                    <button
                        onClick={() => window.location.href = "/admin/users"}
                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded shadow"
                    >
                        Manage Users
                    </button>
                </div>
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
