const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User"); // Wrapper
const router = express.Router();

const passport = require("passport");
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshsecret123";

router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.provider !== "local" && user.provider !== undefined) return res.status(401).json({ error: `Please login with ${user.provider}` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
        // For local users we'd check verification too, but for now enforcing generally
        // return res.status(403).json({ error: "Email not verified" });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
    res.json({ token, role: user.role });
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
router.get("/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/login" }),
    (req, res) => {
        const user = req.user;
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
        res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=${user.role}`);
    }
);

router.get("/github", passport.authenticate("github", { scope: ["user:email"] }));
router.get("/github/callback",
    passport.authenticate("github", { session: false, failureRedirect: "/login" }),
    (req, res) => {
        const user = req.user;
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, REFRESH_SECRET, { expiresIn: "7d" });

        res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "strict" });
        res.redirect(`http://localhost:5173/oauth-success?token=${token}&role=${user.role}`);
    }
);

router.get("/verify", async (req, res) => {
    const user = await User.findOne({ verificationToken: req.query.token });
    if (!user) return res.status(400).send("Invalid token");

    user.isVerified = true;
    user.verificationToken = null;
    // user.save(); // In-memory reference update

    res.send("Email verified successfully! You can close this tab.");
});

module.exports = router;
