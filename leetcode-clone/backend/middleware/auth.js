const jwt = require("jsonwebtoken");

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

exports.auth = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        // Check Maintenance Mode
        try {
            const { data: mSetting } = await supabase.from("settings").select("value").eq("key", "maintenanceMode").single();
            if (mSetting && mSetting.value === true) {
                if (req.user.role !== 'admin') {
                    return res.status(503).json({ error: "System is in maintenance mode." });
                }
            }
        } catch (sErr) {
            console.error("Maintenance check failed, proceeding anyway", sErr);
        }

        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};

exports.teacherOnly = (req, res, next) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};

exports.adminOnly = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
};
