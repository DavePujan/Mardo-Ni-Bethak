const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { auth, adminOnly } = require("../middleware/auth");
const User = require("../models/User");
const AccessRequest = require("../models/AccessRequest");
const crypto = require("crypto");



router.get("/requests", auth, adminOnly, async (req, res) => {
    try {
        console.log("Fetching pending access requests...");
        const { data, error } = await supabase
            .from("access_requests")
            .select("*")
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Supabase Error fetching requests:", error);
            throw error;
        }

        console.log("Pending Requests Found:", data?.length, data);
        res.json(data);
    } catch (err) {
        console.error("Route Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/approve-request", auth, adminOnly, async (req, res) => {
    const { email } = req.body;

    try {
        // 1. Fetch Request
        const { data: reqData, error: fetchError } = await supabase
            .from("access_requests")
            .select("*")
            .eq("email", email)
            .single();

        if (fetchError || !reqData) return res.status(404).json({ error: "Request not found" });

        // 2. Insert into Profiles (Create User)
        // Check if profile exists (maybe created via OAuth just now?)
        const { data: existingProfile } = await supabase.from("profiles").select("id").eq("email", email).single();

        const profileData = {
            id: existingProfile?.id || crypto.randomUUID(), // Preserve ID if exists
            email: reqData.email,
            role: reqData.role,
            department: reqData.department, // Transfer department
            provider: reqData.provider,
            full_name: reqData.name || null, // Transfer name
            password: reqData.password || null, // Transfer hashed password
            is_verified: true
        };

        const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: 'email' });

        if (upsertError) throw upsertError;

        // 3. Delete Request (or update status to approved)
        // Let's delete to keep table clean as per user wish "shifted"
        const { error: deleteError } = await supabase
            .from("access_requests")
            .delete()
            .eq("email", email);

        if (deleteError) throw deleteError;

        // Update local memory if still using it for quick lookups (optional but safer)
        // const newUser = { ...profileData, id: profileData.id, isVerified: true };
        // User.push(newUser); // simplified sync

        res.json({ message: "Access request approved & user created." });

    } catch (err) {
        console.error("Approve Request Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.get("/dashboard", auth, adminOnly, async (req, res) => {
    try {
        const { count: totalUsers } = await supabase.from("profiles").select("*", { count: "exact", head: true });

        // Active Quizzes (is_active = true)
        const { count: activeQuizzes } = await supabase
            .from("quizzes")
            .select("*", { count: "exact", head: true })
            .eq("is_active", true);

        // History Quizzes (is_active = false)
        const { count: historyQuizzes } = await supabase
            .from("quizzes")
            .select("*", { count: "exact", head: true })
            .eq("is_active", false);

        const { count: pendingRequests } = await supabase.from("audit_logs").select("*", { count: "exact", head: true });

        res.json({
            totalUsers: totalUsers || 0,
            activeQuizzes: activeQuizzes || 0,
            historyQuizzes: historyQuizzes || 0,
            pendingRequests: pendingRequests || 0,
            systemHealth: "Good"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get("/users", auth, adminOnly, async (req, res) => {
    try {
        const { data, error } = await supabase.from("profiles").select("*");
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.patch("/user/role", auth, adminOnly, async (req, res) => {
    const { userId, role } = req.body;
    const user = await User.findOne({ id: parseInt(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = role;
    res.json({ message: "Role updated", user });
});

router.patch("/promote", auth, adminOnly, async (req, res) => {
    const { email, role } = req.body;
    if (!["teacher", "admin", "student"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
    }

    // Update Supabase
    const { data, error } = await supabase
        .from("profiles")
        .update({ role: role })
        .eq("email", email)
        .select();

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0) return res.status(404).json({ error: "User not found in database" });

    res.json({ message: "Role updated" });
});

router.post("/reject-request", auth, adminOnly, async (req, res) => {
    const { email } = req.body;

    try {
        const { error } = await supabase
            .from("access_requests")
            .delete()
            .eq("email", email);

        if (error) throw error;

        res.json({ message: "Access request rejected and removed." });
    } catch (err) {
        console.error("Reject Request Error:", err);
        res.status(500).json({ error: err.message });
    }
});

router.delete("/user", auth, adminOnly, async (req, res) => {
    const { email } = req.body;

    try {
        const { error } = await supabase
            .from("profiles")
            .delete()
            .eq("email", email);

        if (error) throw error;

        // Also delete from users array if using mock (optional cleanup)
        // const idx = User.findIndex(u => u.email === email);
        // if (idx >= 0) User.splice(idx, 1);

        res.json({ message: "User removed successfully." });
    } catch (err) {
        console.error("Delete User Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
