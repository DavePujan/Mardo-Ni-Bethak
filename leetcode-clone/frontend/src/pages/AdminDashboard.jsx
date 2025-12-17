import { useState, useEffect } from "react";
import { getUsers, promoteUser } from "../utils/api";

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        getUsers()
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
    }, []);

    async function handlePromote(userId, role) {
        try {
            await promoteUser(userId, role);
            alert(`User promoted to ${role}`);
            setUsers(users.map(u => u.id === userId ? { ...u, role } : u));
        } catch (error) {
            alert("Failed to promote user");
        }
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>Admin Dashboard</h1>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
                <thead>
                    <tr style={{ textAlign: "left", background: "#f0f0f0" }}>
                        <th style={{ padding: "10px" }}>ID</th>
                        <th style={{ padding: "10px" }}>Email</th>
                        <th style={{ padding: "10px" }}>Role</th>
                        <th style={{ padding: "10px" }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={{ borderBottom: "1px solid #ddd" }}>
                            <td style={{ padding: "10px" }}>{user.id}</td>
                            <td style={{ padding: "10px" }}>{user.email}</td>
                            <td style={{ padding: "10px" }}>{user.role}</td>
                            <td style={{ padding: "10px" }}>
                                {user.role === "student" && (
                                    <>
                                        <button onClick={() => handlePromote(user.id, "teacher")} style={{ marginRight: "10px" }}>Make Teacher</button>
                                        <button onClick={() => handlePromote(user.id, "admin")}>Make Admin</button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
