import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";

export default function AdminRequests() {
    const [requests, setRequests] = useState([]);
    const [roleFilter, setRoleFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    const departments = [
        "Biomedical Engineering", "Computer Engineering", "Electronics & Communication Engineering",
        "General Department", "Information Technology", "Instrumentation & Control Engineering",
        "Metallurgy Engineering", "Mechanical Engineering", "Civil Engineering",
        "Robotics and Automation Engineering", "Electrical Engineering"
    ];
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get("/api/admin/requests");
            setRequests(res.data);
            setError("");
        } catch (err) {
            console.error("Failed to fetch requests", err);
            setError("Failed to fetch requests: " + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    const approve = async (email) => {
        if (!confirm(`Approve access for ${email}?`)) return;

        try {
            await api.post("/api/admin/approve-request", { email });
            alert("Approved!");
            fetchRequests(); // Refresh
        } catch (err) {
            alert("Approval failed: " + (err.response?.data?.error || err.message));
        }
    };

    const reject = async (email) => {
        if (!confirm(`Reject access for ${email}? This will remove the request.`)) return;

        try {
            await api.post("/api/admin/reject-request", { email });
            alert("Rejected!");
            fetchRequests(); // Refresh
        } catch (err) {
            alert("Rejection failed: " + (err.response?.data?.error || err.message));
        }
    };

    const filteredRequests = requests.filter(req => {
        if (roleFilter !== "all" && req.role !== roleFilter) return false;
        // If role is admin, show all admins (ignore dept)
        if (roleFilter === "admin") return true;
        // If role is NOT admin (or 'all'), apply dept filter if set
        if (deptFilter !== "all" && req.department !== deptFilter) return false;
        return true;
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500">Access Requests</h1>
                <Link to="/admin" className="px-4 py-2 rounded-lg bg-gray-700/50 hover:bg-gray-700 text-gray-300 font-medium transition-colors border border-gray-600">Back to Dashboard</Link>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded mb-4">{error}</div>}

            <div className="flex flex-col md:flex-row gap-4 mb-6 card p-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            if (e.target.value === 'admin') setDeptFilter('all');
                        }}
                        className="input min-w-[200px]"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                    </select>
                </div>

                {roleFilter !== 'admin' && (
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Filter by Department</label>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="input min-w-[250px]"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : filteredRequests.length === 0 ? (
                <div className="card p-12 text-center">
                    <p className="text-xl text-gray-500 font-medium">No matching requests found.</p>
                </div>
            ) : (
                <div className="card overflow-hidden p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Name</th>
                                <th className="p-4 font-medium">Role</th>
                                <th className="p-4 font-medium">Dept</th>
                                <th className="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 font-light text-gray-300">
                            {filteredRequests.map(req => (
                                <tr key={req.id || req.email} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 text-gray-500 text-sm">
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="p-4 font-medium text-white">{req.email}</td>
                                    <td className="p-4 text-gray-300">{req.name || "-"}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${req.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'}`}>
                                            {req.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">{req.department || "-"}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => approve(req.email)}
                                            className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 transition-colors text-sm mr-2"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => reject(req.email)}
                                            className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors text-sm"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
