const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Wrapper
const router = express.Router();

const passport = require("passport");
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret123";

const AccessRequest = require("../models/AccessRequest");

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Fallback: Check Supabase
        const { createClient } = require("@supabase/supabase-js");
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const { data: sbUser } = await supabase.from("profiles").select("*").eq("email", email).single();

        if (sbUser) {
            user = {
                id: sbUser.id,
                email: sbUser.email,
                role: sbUser.role,
                provider: sbUser.provider,
                password: sbUser.password || "", // Likely empty if from Supabase profiles, will fail local auth
                isVerified: true
            };
            User.push(user);
        }
    }

    if (!user) {
        // Check if there is a pending request
        const pending = AccessRequest.find(r => r.email === email);
        if (pending) {
            return res.status(403).json({ error: "Access request is pending approval by admin." });
        }
        return res.status(404).json({ error: "User not found. Please request access.", requestAccess: true });
    }

    if (user.provider !== "local" && user.provider !== undefined) return res.status(401).json({ error: `Please login with ${user.provider}` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ token, role: user.role });
});

router.post("/request-access", async (req, res) => {
    const { email, role, name, provider } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: "User already exists. Please login." });

    const existingReq = AccessRequest.find(r => r.email === email);
    if (existingReq) return res.status(400).json({ error: "Request already pending." });

    AccessRequest.push({
        email,
        role,
        name,
        provider: provider || "local",
        date: new Date()
    });

    res.json({ message: "Access request submitted. Please wait for admin approval." });
});

router.post("/refresh", (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ error: "No refresh token" });

    try {
        const u = jwt.verify(token, REFRESH_SECRET);
        const newAccess = jwt.sign({ id: u.id, email: u.email, role: u.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        res.json({ accessToken: newAccess });
    } catch (err) {
        res.status(403).json({ error: "Invalid refresh token" });
    }
});

// OAuth Routes
router.get("/google", passport.authenticate("google", { scope: ["email", "profile"] }));
router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            // User not found, redirect to request access with email pre-filled
            // Info contains { message, email, provider }
            const email = info?.email || "";
            return res.redirect(`http://localhost:5173/login?error=not_found&email=${email}&provider=google`);
        }

        // Success
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
        res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=${user.role}`);
    })(req, res, next);
});

router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback", (req, res, next) => {
    passport.authenticate("github", { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const email = info?.email || "";
            return res.redirect(`http://localhost:5173/login?error=not_found&email=${email}&provider=github`);
        }

        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
        res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=${user.role}`);
    })(req, res, next);
});

router.get("/verify", async (req, res) => {
    const user = await User.findOne({ verificationToken: req.query.token });
    if (!user) return res.status(400).send("Invalid token");

    user.isVerified = true;
    user.verificationToken = null;
    // user.save(); // In-memory reference update

    res.send("Email verified successfully! You can close this tab.");
});

module.exports = router;
