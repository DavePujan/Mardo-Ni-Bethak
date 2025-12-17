require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSystem() {
    console.log("--- Checking Supabase Tables ---");
    // There is no direct "list tables" API in js client easily without rpc or specific permissions usually, 
    // but we can try to selecting from the known tables to check existence.

    const tables = ["profiles", "quizzes", "quiz_questions", "quiz_attempts", "quiz_answers", "audit_logs"];

    for (const t of tables) {
        process.stdout.write(`Checking table '${t}'... `);
        const { data, error } = await supabase.from(t).select("count", { count: "exact", head: true });

        if (error) {
            console.log("❌ ERROR: " + error.message);
        } else {
            console.log(`✅ Exists(Rows: ${data !== null ? "Access OK" : "Unknown"})`);
        }
    }

    console.log("\n--- Checking Profiles Content ---");
    const { data: profiles, error: pError } = await supabase.from("profiles").select("*");
    if (pError) console.error(pError);
    else console.log("Profiles found:", profiles.length, profiles);
}

checkSystem();
