import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { token, role: userRole } = useContext(AuthContext);
    if (!token) return <Navigate to="/login" />;
    if (role && role !== userRole) return <Navigate to="/" />;
    return children;
}
