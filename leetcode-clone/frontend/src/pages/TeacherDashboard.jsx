import { Link } from "react-router-dom";

export default function TeacherDashboard() {
    return (
        <div style={{ padding: "20px" }}>
            <h1>Teacher Dashboard</h1>
            <p>Welcome! Manage your coding problems here.</p>
            <div style={{ marginTop: "20px" }}>
                <Link to="/teacher/create">
                    <button style={{ padding: "10px 20px", fontSize: "16px" }}>Create New Problem</button>
                </Link>
            </div>

            <div style={{ marginTop: "40px" }}>
                <h3>Your Problems</h3>
                <p>No problems created yet (Placeholder).</p>
            </div>
        </div>
    );
}
