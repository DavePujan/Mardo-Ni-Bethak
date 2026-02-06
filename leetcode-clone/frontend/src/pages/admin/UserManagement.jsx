import React, { useEffect, useState } from "react";
import { getUsers, promoteUser, deleteUser } from "../../utils/api";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [roleFilter, setRoleFilter] = useState("all");
    const [deptFilter, setDeptFilter] = useState("all");

    const departments = [
        "Biomedical Engineering", "Computer Engineering", "Electronics & Communication Engineering",
        "General Department", "Information Technology", "Instrumentation & Control Engineering",
        "Metallurgy Engineering", "Mechanical Engineering", "Civil Engineering",
        "Robotics and Automation Engineering", "Electrical Engineering"
    ];

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = () => {
        getUsers()
            .then(res => setUsers(res.data))
            .catch(err => {
                console.error("Failed to fetch users", err);
                setUsers([]);
            });
    };

    const promote = (email, role) => {
        promoteUser(email, role)
            .then(() => {
                alert("User updated!");
                fetchUsers();
            })
            .catch(err => alert("Failed to update: " + err.message));
    };

    const removeUser = (email) => {
        if (!confirm(`Are you sure you want to remove access for ${email}? This action is irreversible.`)) return;

        deleteUser(email)
            .then(() => {
                alert("User removed.");
                fetchUsers();
            })
            .catch(err => alert("Failed to remove user: " + (err.response?.data?.error || err.message)));
    };

    const handleDemote = (u) => {
        if (u.role === "student") {
            alert("Cannot demote anymore!");
            return;
        }

        let newRole = "student";
        if (u.role === "admin") newRole = "teacher";

        if (confirm(`Demote ${u.email} to ${newRole}?`)) {
            promote(u.email, newRole);
        }
    };

    const filteredUsers = users.filter(u => {
        if (roleFilter !== "all" && u.role !== roleFilter) return false;
        // If role is admin, show all admins (ignore dept)
        if (roleFilter === "admin") return true;
        // If role is NOT admin (or 'all'), apply dept filter if set
        if (deptFilter !== "all" && u.department !== deptFilter) return false;
        return true;
    });

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-purple-500 mb-8">User Management</h1>

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

            <div className="card p-0 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-medium">Name</th>
                            <th className="p-4 font-medium">Email</th>
                            <th className="p-4 font-medium">Role</th>
                            <th className="p-4 font-medium">Department</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 font-light text-gray-300">
                        {filteredUsers.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">No users found matching filters.</td></tr>
                        ) : (
                            filteredUsers.map(u => (
                                <tr key={u.email} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium text-white">{u.full_name || "-"}</td>
                                    <td className="p-4 text-gray-400">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                                                u.role === 'teacher' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                                    'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">{u.department || "-"}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        {u.role !== "teacher" && u.role !== "admin" && (
                                            <button onClick={() => promote(u.email, "teacher")} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors text-sm">
                                                Make Teacher
                                            </button>
                                        )}
                                        {u.role !== "admin" && (
                                            <button onClick={() => promote(u.email, "admin")} className="px-3 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded hover:bg-gray-500/20 transition-colors text-sm">
                                                Make Admin
                                            </button>
                                        )}

                                        <button onClick={() => handleDemote(u)} className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded hover:bg-orange-500/20 transition-colors text-sm">
                                            Demote
                                        </button>

                                        <button onClick={() => removeUser(u.email)} className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors text-sm">
                                            Remove
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
