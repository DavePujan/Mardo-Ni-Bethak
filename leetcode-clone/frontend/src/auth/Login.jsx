import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Login() {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        // Check for tokens from OAuth redirect
        const token = searchParams.get("token");
        const role = searchParams.get("role");
        if (token && role) {
            login(token, role);
            if (role === 'teacher') navigate("/teacher");
            else if (role === 'admin') navigate("/admin");
            else navigate("/");
        }
    }, [searchParams, login, navigate]);

    async function submit() {
        try {
            const res = await axios.post("http://localhost:5000/auth/login", {
                email,
                password
            }, { withCredentials: true }); // Important for setting Refresh Token cookie

            login(res.data.token, res.data.role);

            if (res.data.role === 'teacher') navigate("/teacher");
            else if (res.data.role === 'admin') navigate("/admin");
            else navigate("/");

        } catch (err) {
            if (err.response?.data?.requestAccess) {
                setError(<span style={{ margin: 0 }}>User not found. <a href="/request-access" style={{ color: "blue", cursor: "pointer" }}>Request Access</a></span>);
            } else {
                setError(err.response?.data?.error || "Login failed");
            }
        }
    }

    // Check URL for error params (from OAuth redirect)
    useEffect(() => {
        const err = searchParams.get("error");
        if (err === "not_found") {
            setError(
                <span>
                    User not found. <a href={`/request-access?email=${searchParams.get("email")}&provider=${searchParams.get("provider")}`} style={{ color: "blue" }}>Request Access</a>
                </span>
            );
        }
    }, [searchParams]);

    return (
        <div style={{ padding: "2rem" }}>
            <h2>Login</h2>
            {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
            <div style={{ marginBottom: "10px" }}>
                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    style={{ padding: "8px", width: "200px" }}
                />
            </div>
            <div style={{ marginBottom: "10px" }}>
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    style={{ padding: "8px", width: "200px" }}
                />
            </div>
            <button onClick={submit} style={{ padding: "8px 16px", marginRight: "10px" }}>Login</button>

            <div style={{ marginTop: "20px" }}>
                <p>Or Login with:</p>
                <button onClick={() => window.location.href = "http://localhost:5000/auth/google"}>Google</button>
                <span style={{ margin: "0 10px" }}></span>
                <button onClick={() => window.location.href = "http://localhost:5000/auth/github"}>GitHub</button>
            </div>

            <div style={{ marginTop: "20px", fontSize: "0.8em", color: "#666" }}>
                <p>Test Credentials:</p>
                <p>teacher@test.com / password</p>
                <p>student@test.com / password</p>
                <p>admin@test.com / password</p>
            </div>
        </div>
    );
}
