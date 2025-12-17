const axios = require("axios");

const API_URL = "http://localhost:5000";

async function verify() {
    try {
        console.log("1. Logging in as Teacher...");
        const teacherLogin = await axios.post(`${API_URL}/auth/login`, {
            email: "teacher@test.com",
            password: "password"
        });
        const teacherToken = teacherLogin.data.token;
        console.log("   Success! Token received.");

        console.log("2. Testing Teacher Dashboard...");
        const teacherDash = await axios.get(`${API_URL}/api/teacher/dashboard`, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        console.log("   Data:", teacherDash.data);

        console.log("3. Testing Teacher Evaluations...");
        const evaluations = await axios.get(`${API_URL}/api/teacher/evaluations`, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        console.log("   Evaluations:", evaluations.data);

        console.log("--------------------------------");

        console.log("4. Logging in as Admin...");
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@test.com",
            password: "password"
        });
        const adminToken = adminLogin.data.token;
        console.log("   Success! Token received.");

        console.log("5. Testing Admin Dashboard...");
        const adminDash = await axios.get(`${API_URL}/api/admin/dashboard`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("   Data:", adminDash.data);

        console.log("6. Testing User Management...");
        const users = await axios.get(`${API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`   Users found: ${users.data.length}`);

        console.log("\n✅ All Quiz Portal Endpoints Verified!");

    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
        if (error.response) {
            console.error("   Status:", error.response.status);
            console.error("   Data:", error.response.data);
        }
    }
}

verify();
