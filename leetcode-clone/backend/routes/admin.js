const router = require("express").Router();
const { auth, adminOnly } = require("../middleware/auth");
const User = require("../models/User");


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

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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
    if (!["teacher", "admin"].includes(role)) {
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

module.exports = router;
