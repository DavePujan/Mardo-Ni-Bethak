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
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Stat title="Total Users" value={stats.users} icon="users" />
                <Stat title="Active Quizzes" value={stats.quizzes} icon="activity" />
                <Stat title="Quiz History" value={stats.history} icon="history" />
                <Stat title="Pending Requests" value={stats.pendingRoles} icon="alert" />
            </div>

            <div className="card">
                <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.href = "/admin/requests"}
                        className="btn-primary shadow-lg shadow-blue-500/20"
                    >
                        Manage Access Requests
                    </button>
                    <button
                        onClick={() => window.location.href = "/admin/users"}
                        className="px-6 py-3 rounded-lg font-bold text-gray-300 border border-gray-600 hover:bg-white/5 transition-colors"
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
        <div className="card flex flex-col justify-between h-32 relative overflow-hidden group">
            <div>
                <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</p>
                <p className="text-4xl font-extrabold text-white mt-2">{value}</p>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-linear-to-br from-blue-500/10 to-purple-500/10 rounded-full group-hover:scale-110 transition-transform duration-300"></div>
        </div>
    );
}
