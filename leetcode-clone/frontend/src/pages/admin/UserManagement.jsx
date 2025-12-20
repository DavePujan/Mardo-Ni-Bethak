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
            <h1 className="text-xl font-semibold mb-4">User Management</h1>

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

            <table className="w-full bg-white shadow rounded text-left border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-4 border-b">Name</th>
                        <th className="p-4 border-b">Email</th>
                        <th className="p-4 border-b">Role</th>
                        <th className="p-4 border-b">Department</th>
                        <th className="p-4 border-b">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr><td colSpan="5" className="p-4 text-center text-gray-500">No users found matching filters.</td></tr>
                    ) : (
                        filteredUsers.map(u => (
                            <tr key={u.email} className="border-b hover:bg-gray-50">
                                <td className="p-4 font-medium">{u.full_name || "-"}</td>
                                <td className="p-4 text-gray-600">{u.email}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs uppercase font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-800' :
                                        u.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-500">{u.department || "-"}</td>
                                <td className="p-4 flex gap-2">
                                    {u.role !== "teacher" && u.role !== "admin" && (
                                        <button onClick={() => promote(u.email, "teacher")} className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm">
                                            Make Teacher
                                        </button>
                                    )}
                                    {u.role !== "admin" && (
                                        <button onClick={() => promote(u.email, "admin")} className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 text-sm">
                                            Make Admin
                                        </button>
                                    )}

                                    <button onClick={() => handleDemote(u)} className="bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 text-sm">
                                        Demote
                                    </button>

                                    <button onClick={() => removeUser(u.email)} className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm">
                                        Remove Access
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
