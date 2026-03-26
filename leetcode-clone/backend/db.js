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

// Retry Logic and Connection Logging
const connectWithRetry = async (retries = 5, delay = 5000) => {
    while (retries > 0) {
        try {
            const client = await pool.connect();
            console.log("DB Connected");
            client.release();
            return;
        } catch (err) {
            console.error("DB Failed", err.message);
            retries -= 1;
            console.log(`Retries left: ${retries}. Retrying in ${delay / 1000}s...`);
            if (retries === 0) {
                console.error("Could not connect to the database.");
            } else {
                await new Promise(res => setTimeout(res, delay));
            }
        }
    }
};

if (process.env.NODE_ENV !== 'test') {
    connectWithRetry();
}

module.exports = pool;
