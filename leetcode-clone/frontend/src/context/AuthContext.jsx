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
        window.location.href = "/login";
    };

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                await supabase.from("profiles").upsert({
                    id: user.id,
                    email: user.email,
                    provider: user.app_metadata.provider,
                    role: "student",
                    is_verified: true
                });
            } catch (err) {
                console.warn("Supabase profile sync failed (possibly missing config):", err);
            }
        };

        syncProfile();
    }, []);

    return (
        <AuthContext.Provider value={{ token, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
