import React, { useEffect, useState } from "react";
import { getUsers, promoteUser } from "../../utils/api";

export default function UserManagement() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getUsers()
            .then(res => setUsers(res.data))
            .catch(err => {
                console.error("Failed to fetch users", err);
                setUsers([]);
            });
    }, []);

    const promote = (email, role) => {
        promoteUser(email, role)
            .then(() => {
                alert("User promoted!");
                // Refresh list
                getUsers().then(res => setUsers(res.data));
            })
            .catch(err => alert("Failed to promote: " + err.message));
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">User Management</h1>

            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Provider</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(u => (
                        <tr key={u.email}>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                            <td>{u.provider}</td>
                            <td>
                                {u.role !== "teacher" && u.role !== "admin" && (
                                    <button onClick={() => promote(u.email, "teacher")} className="btn-primary mr-2">
                                        Make Teacher
                                    </button>
                                )}
                                {u.role !== "admin" && (
                                    <button onClick={() => promote(u.email, "admin")} className="btn-secondary mr-2">
                                        Make Admin
                                    </button>
                                )}
                                {(u.role === "teacher" || u.role === "admin") && (
                                    <button onClick={() => promote(u.email, "student")} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
                                        Demote to Student
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
