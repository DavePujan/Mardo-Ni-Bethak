import { createContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [role, setRole] = useState(localStorage.getItem("role"));

    const login = (newToken, newRole) => {
        localStorage.setItem("token", newToken);
        localStorage.setItem("role", newRole);
        setToken(newToken);
        setRole(newRole);
    };

    const logout = () => {
        localStorage.clear();
        setToken(null);
        setRole(null);
    };

    useEffect(() => {
        const syncProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Upsert profile to Supabase
            // Note: Use token/session management if user is logged in via Supabase Auth
            // But if we are using external auth (JWT from backend), this might fail if we don't have a Supabase session.
            // However, the instructions imply using supabase.auth.getUser().
            // If the user logs in via our backend, they might not have a Supabase session unless we bridge it.
            // Or maybe the instruction assumes we switched to Supabase Auth?
            // "Everything below is copy-paste ready and matches your current app"
            // Let's assume the user handles the session or the JWT from backend can be exchanged?
            // NO, wait. The user instruction said: "AUTH -> PROFILE SYNC (IMPORTANT)"
            // "const { data: { user } } = await supabase.auth.getUser();"
            // This implies the user IS logging in via Supabase Auth or we need to sign them in.
            // If our App uses custom backend JWT, supabase.auth.getUser() will be null.
            // But I must follow instructions.
            // Maybe the user expects us to use Supabase Auth for login?
            // But we have "Login.jsx" using our backend.
            // I will implement the code as requested.

            await supabase.from("profiles").upsert({
                id: user.id,
                email: user.email,
                provider: user.app_metadata.provider,
                role: "student",
                is_verified: true
            });
        };

        syncProfile();
    }, []);

    return (
        <AuthContext.Provider value={{ token, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
