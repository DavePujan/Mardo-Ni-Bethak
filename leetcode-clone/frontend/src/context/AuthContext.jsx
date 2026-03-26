import { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
    // Actual access token lives in HttpOnly cookie — this is a backward-compatible flag
    // so existing components that check `if (token)` still work without mass refactoring
    const [role, setRole] = useState(localStorage.getItem("role"));
    const [user, setUser] = useState(null);
    const token = role ? true : null; // Derived boolean for compatibility

    const login = (newRole) => {
        // We only track role superficially; actual auth is secure HTTP-Only cookies
        localStorage.setItem("role", newRole);
        setRole(newRole);
    };

    const logout = async () => {
        try {
            // Tell backend to explicitly purge both token cookies
            await import("axios").then(axios => axios.default.post("http://localhost:5000/auth/logout", {}, { withCredentials: true }));
        } catch(e) {}
        
        localStorage.clear();
        setRole(null);
        setUser(null);
        window.location.href = "/login";
    };

    useEffect(() => {
        const syncProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                setUser(user);

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
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
             setUser(session?.user ?? null);
             // Supabase access_tokens are ignored for our custom backend dual-cookie system
        });

        return () => subscription.unsubscribe();

    }, []);

    return (
        <AuthContext.Provider value={{ token, role, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
