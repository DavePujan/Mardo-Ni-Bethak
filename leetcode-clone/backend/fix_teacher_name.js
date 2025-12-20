const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixName() {
    const { data, error } = await supabase
        .from("profiles")
        .update({ full_name: "Dr. Teacher" })
        .eq("email", "teacher@test.com")
        .select();

    if (error) {
        console.error("Update Error:", error);
    } else {
        console.log("Updated Profile:", data);
    }
}

fixName();
