const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfile() {
    const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("email", "teacher@test.com")
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profile Data:", profile);
    }
}

checkProfile();
