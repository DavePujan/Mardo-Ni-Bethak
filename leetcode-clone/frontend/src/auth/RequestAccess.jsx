import { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";

export default function RequestAccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("student");
    const [department, setDepartment] = useState("");
    const [provider, setProvider] = useState("local");

    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const e = searchParams.get("email");
        const p = searchParams.get("provider");
        if (e) setEmail(e);
        if (p) setProvider(p);
    }, [searchParams]);

    async function submit(e) {
        e.preventDefault();
        setMsg("");
        setError("");

        try {
            const res = await axios.post("http://localhost:5000/auth/request-access", {
                email, name, role, department, provider, password
            });
            setMsg(res.data.message);
            // Optionally redirect after some time
            setTimeout(() => navigate("/login"), 3000);
        } catch (err) {
            setError(err.response?.data?.error || "Submission failed");
        }
    }

    return (
        <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
            <h2>Request Access</h2>
            <p style={{ marginBottom: "20px", color: "#555" }}>
                You don't have access to the system. Please submit a request to the admin.
            </p>

            {msg && <div style={{ color: "green", marginBottom: "10px", padding: '10px', background: '#e6ffe6' }}>{msg}</div>}
            {error && <div style={{ color: "red", marginBottom: "10px", padding: '10px', background: '#ffe6e6' }}>{error}</div>}

            <form onSubmit={submit}>
                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Email</label>
                    <input
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        disabled={!!searchParams.get("email")} // Disable if pre-filled from OAuth
                        required
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Full Name</label>
                    <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Password (for manual login)</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Set a password"
                        required={provider === 'local'} // Required only for local requests
                        style={{ width: "100%", padding: "8px" }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Department</label>
                    <select
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        style={{ width: "100%", padding: "8px" }}
                    >
                        <option value="">Select Department</option>
                        <option value="Biomedical Engineering">Biomedical Engineering</option>
                        <option value="Computer Engineering">Computer Engineering</option>
                        <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                        <option value="General Department">General Department</option>
                        <option value="Information Technology">Information Technology</option>
                        <option value="Instrumentation & Control Engineering">Instrumentation & Control Engineering</option>
                        <option value="Metallurgy Engineering">Metallurgy Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Robotics and Automation Engineering">Robotics and Automation Engineering</option>
                        <option value="Electrical Engineering">Electrical Engineering</option>
                    </select>
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ display: "block", marginBottom: "5px" }}>Role</label>
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        style={{ width: "100%", padding: "8px" }}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                {provider !== 'local' && (
                    <div style={{ marginBottom: "15px", fontSize: "0.9em", color: "#666" }}>
                        Authenticating via: <b>{provider}</b>
                    </div>
                )}

                <button type="submit" style={{ width: "100%", padding: "10px", background: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    Submit Request
                </button>
            </form>

            <div style={{ marginTop: "15px", textAlign: "center" }}>
                <Link to="/login">Back to Login</Link>
            </div>
        </div>
    );
}
