import { useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function OAuthSuccess() {
    const [searchParams] = useSearchParams();
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get("token");
        const role = searchParams.get("role");

        if (token && role) {
            login(token, role);
            // Wait a moment or direct redirect
            setTimeout(() => navigate("/"), 500);
        } else {
            navigate("/login");
        }
    }, [searchParams, login, navigate]);

    return <div>Logging you in...</div>;
}
