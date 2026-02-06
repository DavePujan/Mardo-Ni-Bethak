const { Pool } = require("pg");
require("dotenv").config();
const dns = require("dns");

// Force IPv4 to avoid Supabase IPv6 timeouts (ETIMEDOUT 2406:...)
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}

if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL is missing in .env. Analytics endpoints may fail.");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

module.exports = pool;
