import { createClient } from "@supabase/supabase-js";
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Fallback to check if .env is in current directory or parent
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

console.log("Supabase URL DEBUG:", supabaseUrl);
console.log("Supabase Key DEBUG:", supabaseKey ? "Present" : "Missing");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env file");
}

let supabase;
try {
  supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder'
  );
  console.log("Supabase client initialized successfully.");
} catch (error) {
  console.error("Supabase Initialization Error:", error.message);
  process.exit(1);
}
export { supabase };
