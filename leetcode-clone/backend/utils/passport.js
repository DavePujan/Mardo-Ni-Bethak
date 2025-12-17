const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User"); // Now wraps the array
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to sync with Supabase
async function syncToSupabase(user) {
    try {
        // Try to find existing profile to keep UUID if exists
        let { data: existing } = await supabase.from("profiles").select("id").eq("email", user.email).single();

        const profile = {
            id: existing ? existing.id : crypto.randomUUID(),
            email: user.email,
            role: user.role,
            provider: user.provider
        };

        // Update local user ID to match Supabase if needed, or just keep them separate.
        // For now, just ensuring the profile exists for Frontend to see.
        const { error } = await supabase.from("profiles").upsert(profile);

        if (error) {
            console.error("❌ [Supabase] Sync Error:", error.message);
        } else {
            console.log(`✅ [Supabase] Synced profile for ${user.email}`);
        }
    } catch (err) {
        console.error("[Supabase] Sync failed (Exception):", err.message);
    }
}

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let userRole = "student";

                // 1. Check Supabase for existing profile (ID & Role)
                const { data: existingProfile } = await supabase.from("profiles").select("id, role").eq("email", email).single();

                if (existingProfile) {
                    userRole = existingProfile.role;
                }

                // 2. Setup User Object (Mock + Session)
                let user = await User.findOne({ email });
                if (!user) {
                    user = {
                        id: User.findAll().length + 1,
                        email: email,
                        role: userRole,
                        provider: "google",
                        isVerified: true
                    };
                    User.push(user);
                } else {
                    user.role = userRole;
                }

                // 3. Sync/Ensure Profile Exists
                const { error } = await supabase.from("profiles").upsert({
                    id: existingProfile?.id || crypto.randomUUID(), // Fix: Ensure ID is present
                    email: user.email,
                    role: user.role,
                    provider: user.provider,
                    is_verified: true
                }, { onConflict: 'email' });

                if (error) console.error("❌ [Supabase] Sync Error:", error.message);

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
                let userRole = "student";

                // 1. Check Supabase
                const { data: existingProfile } = await supabase.from("profiles").select("id, role").eq("email", email).single();
                if (existingProfile) {
                    userRole = existingProfile.role;
                }

                let user = await User.findOne({ email });
                if (!user) {
                    user = {
                        id: User.findAll().length + 1,
                        email,
                        role: userRole,
                        provider: "github",
                        isVerified: false,
                        verificationToken: crypto.randomBytes(32).toString("hex")
                    };
                    User.push(user);
                } else {
                    user.role = userRole;
                }

                // 3. Sync
                const { error } = await supabase.from("profiles").upsert({
                    id: existingProfile?.id || crypto.randomUUID(), // Fix: Ensure ID is present
                    email: user.email,
                    role: user.role,
                    provider: user.provider
                }, { onConflict: 'email' });

                if (error) console.error("❌ [Supabase] Sync Error:", error.message);

                done(null, user);
            } catch (err) {
                done(err, null);
            }
        }
    )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
