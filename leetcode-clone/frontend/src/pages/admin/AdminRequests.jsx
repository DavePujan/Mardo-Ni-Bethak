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
                <h1 className="text-2xl font-bold">Access Requests</h1>
                <Link to="/admin" className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">Back to Dashboard</Link>
            </div>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

            <div className="flex gap-4 mb-6 bg-white p-4 rounded shadow-sm">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Role</label>
                    <select
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            if (e.target.value === 'admin') setDeptFilter('all');
                        }}
                        className="p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Teacher</option>
                        <option value="student">Student</option>
                    </select>
                </div>

                {roleFilter !== 'admin' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Department</label>
                        <select
                            value={deptFilter}
                            onChange={(e) => setDeptFilter(e.target.value)}
                            className="p-2 border rounded shadow-sm focus:ring-blue-500 focus:border-blue-500 min-w-[250px]"
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
                <p>Loading requests...</p>
            ) : filteredRequests.length === 0 ? (
                <div className="bg-white shadow rounded p-8 text-center text-gray-500">
                    No matching requests found.
                </div>
            ) : (
                <div className="bg-white shadow rounded overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-4 border-b">Date</th>
                                <th className="p-4 border-b">Email</th>
                                <th className="p-4 border-b">Name</th>
                                <th className="p-4 border-b">Role</th>
                                <th className="p-4 border-b">Dept</th>
                                <th className="p-4 border-b">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map(req => (
                                <tr key={req.id || req.email} className="border-b hover:bg-gray-50">
                                    <td className="p-4 text-gray-500 text-sm">
                                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : "-"}
                                    </td>
                                    <td className="p-4 font-medium">{req.email}</td>
                                    <td className="p-4">{req.name || "-"}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${req.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {req.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{req.department || "-"}</td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => approve(req.email)}
                                            className="bg-green-600 text-white px-4 py-1.5 rounded hover:bg-green-700 font-medium text-sm shadow-sm transition mr-2"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => reject(req.email)}
                                            className="bg-red-600 text-white px-4 py-1.5 rounded hover:bg-red-700 font-medium text-sm shadow-sm transition"
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
