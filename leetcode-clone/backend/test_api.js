const axios = require("axios");

const API_URL = "http://localhost:5000";

async function runTests() {
    console.log("🚀 Starting System Verification...\n");

    let adminToken, teacherToken, studentToken;
    let refreshCookie;

    // 1. Login Admin
    try {
        console.log("🔹 Testing [POST] /auth/login (Admin)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: "admin@test.com",
            password: "password"
        });
        adminToken = res.data.token;
        console.log("✅ Admin Login Success. Token received.");

        // Check Refresh Token Cookie
        const cookies = res.headers["set-cookie"];
        if (cookies && cookies.some(c => c.startsWith("refreshToken="))) {
            console.log("✅ Refresh Token Cookie Set.");
            refreshCookie = cookies.find(c => c.startsWith("refreshToken=")).split(";")[0];
        } else {
            console.error("❌ Refresh Token Missing in Set-Cookie.");
        }

    } catch (err) {
        console.error("❌ Admin Login Failed:", err.response?.data || err.message);
        return;
    }

    // 2. Login Teacher
    try {
        console.log("\n🔹 Testing [POST] /auth/login (Teacher)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: "teacher@test.com",
            password: "password"
        });
        teacherToken = res.data.token;
        console.log("✅ Teacher Login Success.");
    } catch (err) {
        console.error("❌ Teacher Login Failed:", err.response?.data || err.message);
    }

    // 3. Login Student
    try {
        console.log("\n🔹 Testing [POST] /auth/login (Student)...");
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: "student@test.com",
            password: "password"
        });
        studentToken = res.data.token;
        console.log("✅ Student Login Success.");
    } catch (err) {
        console.error("❌ Student Login Failed:", err.response?.data || err.message);
    }

    // 4. Test RBAC: Student accessing Admin Route
    try {
        console.log("\n🔹 Testing RBAC: Student -> [GET] /admin/users...");
        await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.error("❌ RBAC Failed: Student could access Admin route.");
    } catch (err) {
        if (err.response?.status === 403) {
            console.log("✅ RBAC Success: Student blocked (403).");
        } else {
            console.error("❌ Unexpected Error:", err.message);
        }
    }

    // 5. Test Admin: Get Users
    try {
        console.log("\n🔹 Testing Admin: [GET] /admin/users...");
        const res = await axios.get(`${API_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log(`✅ Success. Retrieved ${res.data.length} users.`);
    } catch (err) {
        console.error("❌ Admin Get Users Failed:", err.response?.data || err.message);
    }

    // 6. Test Teacher: Create Problem
    try {
        console.log("\n🔹 Testing Teacher: [POST] /teacher/problem...");
        const problem = {
            title: "Test Problem",
            description: "Test Desc",
            functionName: "testFunc",
            testCases: { public: [], hidden: [] }
        };
        const res = await axios.post(`${API_URL}/teacher/problem`, problem, {
            headers: { Authorization: `Bearer ${teacherToken}` }
        });
        console.log("✅ Problem Created:", res.data.message);
    } catch (err) {
        console.error("❌ Teacher Create Problem Failed:", err.response?.data || err.message);
    }

    // 7. Test Submission (Mocking Judge0 response expectation)
    try {
        console.log("\n🔹 Testing Submission: [POST] /api/submit...");
        const payload = {
            questionId: "add-two", // Must exist in models/questions.js
            language: "js",
            code: "function addTwo(a,b){ return a+b; }"
        };
        const res = await axios.post(`${API_URL}/api/submit`, payload, {
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        console.log("✅ Submission Request Sent.");
        console.log("👉 Verdict:", res.data.verdict);
        if (res.data.verdict === "Accepted") {
            console.log("✅ Judge0 Execution Success!");
        } else {
            console.log("⚠️ Verdict not Accepted (Normal if Judge0 Key is invalid or Logic fail):", res.data);
        }
    } catch (err) {
        console.error("❌ Submission Failed:", err.response?.data || err.message);
    }

    // 8. Test Leaderboard
    try {
        console.log("\n🔹 Testing Leaderboard: [GET] /leaderboard/add-two...");
        const res = await axios.get(`${API_URL}/leaderboard/add-two`);
        console.log(`✅ Leaderboard Retrieved. Entries: ${res.data.length}`);
    } catch (err) {
        console.error("❌ Leaderboard Failed:", err.message);
    }

    // 9. Test Refresh Token
    try {
        console.log("\n🔹 Testing Refresh Token: [POST] /auth/refresh...");
        const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Cookie: refreshCookie }
        });
        if (res.data.accessToken) {
            console.log("✅ Access Token Refreshed.");
        } else {
            console.error("❌ Refresh Failed: No access token returned.");
        }
    } catch (err) {
        console.error("❌ Refresh Failed:", err.response?.data || err.message);
    }

    console.log("\n🏁 Verification Complete.");
}

runTests();
