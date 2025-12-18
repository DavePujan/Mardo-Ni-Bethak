import React, { useEffect, useState } from "react";
import { getAdminStats } from "../../utils/api";
import axios from "axios";

export default function AdminDashboard() {
    const [requests, setRequests] = useState([]);
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

        // Fetch Requests
        // We need to add this to api.js or call axios directly. Assuming axios for now as api.js wasn't fully checked for exports 
        // (but likely we should use the configured instance if available).
        // Let's use fetch/axios directly for speed or if api.js is just wrappers.
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            // Use axios with credentials if needed, but assuming axios global config isn't set, we'll try to find if we can import it or use fetch.
            // Let's rely on standard fetch or axios if imported.
            // Since api.js is used, let's look at it, but for now I'll use a local fetch function assuming axios is available from context or I can import it.
            // Actually, wait, let me just use the imported context or nothing.
            // I'll import axios here to be safe.
            const res = await axios.get("http://localhost:5000/api/admin/requests", { withCredentials: true });
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    const approve = async (email) => {
        try {
            await axios.post("http://localhost:5000/api/admin/approve-request", { email }, { withCredentials: true });
            alert("Approved!");
            fetchRequests(); // Refresh
        } catch (err) {
            alert("Approval failed: " + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

            <div className="grid grid-cols-4 gap-4 mb-8">
                <Stat title="Total Users" value={stats.users} />
                <Stat title="Active Quizzes" value={stats.quizzes} />
                <Stat title="Quiz History" value={stats.history} />
                <Stat title="Pending Requests" value={requests.length} />
            </div>

            <div className="bg-white shadow rounded p-4">
                <h2 className="text-xl font-bold mb-4">Access Requests</h2>
                {requests.length === 0 ? (
                    <p className="text-gray-500">No pending requests.</p>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2">Email</th>
                                <th className="p-2">Name</th>
                                <th className="p-2">Role</th>
                                <th className="p-2">Provider</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.email} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{req.email}</td>
                                    <td className="p-2">{req.name || "-"}</td>
                                    <td className="p-2">{req.role}</td>
                                    <td className="p-2">{req.provider}</td>
                                    <td className="p-2">
                                        <button
                                            onClick={() => approve(req.email)}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            Approve
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
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
