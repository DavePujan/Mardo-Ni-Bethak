// Quick BullMQ integration test — run with: node test-queue.js
const http = require("http");

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = "";
            // Capture set-cookie headers
            const cookies = res.headers["set-cookie"] || [];
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ status: res.statusCode, data, cookies }));
        });
        req.on("error", reject);
        if (body) req.write(body);
        req.end();
    });
}

(async () => {
    console.log("=== BullMQ Integration Test ===\n");

    // Step 1: Login to get cookies
    console.log("1️⃣  Logging in...");
    const loginRes = await request({
        hostname: "localhost", port: 5000,
        path: "/auth/login", method: "POST",
        headers: { "Content-Type": "application/json" }
    }, JSON.stringify({ email: "test@example.com", password: "123456" }));

    console.log(`   Status: ${loginRes.status}`);
    console.log(`   Body: ${loginRes.data}`);

    if (loginRes.status !== 200) {
        console.log("\n⚠️  Login failed (expected if test user doesn't exist).");
        console.log("   Testing queue directly instead...\n");

        // Direct queue test — bypass HTTP
        const { submissionQueue } = require("./queues/submission.queue");
        const job = await submissionQueue.add("run-code", {
            code: "function addTwo(a,b){return a+b}",
            language: "js",
            questionId: "add-two",
            userId: "test-user-123"
        }, {
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 }
        });

        console.log(`2️⃣  Job enqueued! ID: ${job.id}`);
        console.log("   Waiting for worker to process...\n");

        // Poll for completion
        for (let i = 0; i < 30; i++) {
            await new Promise(r => setTimeout(r, 1000));
            // Re-fetch job to get updated returnvalue
            const freshJob = await submissionQueue.getJob(job.id);
            const state = await freshJob.getState();
            console.log(`   ⏳ Poll ${i + 1}: state = ${state}`);
            if (state === "completed") {
                console.log(`\n✅ Job COMPLETED!`);
                console.log(`   Result: ${JSON.stringify(freshJob.returnvalue, null, 2)}`);
                break;
            }
            if (state === "failed") {
                console.log(`\n❌ Job FAILED: ${freshJob.failedReason}`);
                break;
            }
        }

        await submissionQueue.close();
        process.exit(0);
        return;
    }

    // Step 2: Extract cookies
    const cookieHeader = loginRes.cookies.map(c => c.split(";")[0]).join("; ");
    console.log(`   Cookies: ${cookieHeader}\n`);

    // Step 3: Submit async
    console.log("2️⃣  Submitting code async...");
    const submitRes = await request({
        hostname: "localhost", port: 5000,
        path: "/api/submit-async", method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Cookie": cookieHeader
        }
    }, JSON.stringify({
        code: "function addTwo(a,b){return a+b}",
        language: "js",
        questionId: "add-two"
    }));

    console.log(`   Status: ${submitRes.status}`);
    console.log(`   Body: ${submitRes.data}\n`);

    const { jobId } = JSON.parse(submitRes.data);
    if (!jobId) { console.log("❌ No jobId returned"); process.exit(1); }

    // Step 4: Poll job status
    console.log(`3️⃣  Polling job ${jobId}...`);
    for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 1000));
        const pollRes = await request({
            hostname: "localhost", port: 5000,
            path: `/api/job/${jobId}`, method: "GET",
            headers: { "Cookie": cookieHeader }
        });
        const job = JSON.parse(pollRes.data);
        console.log(`   ⏳ Poll ${i + 1}: state = ${job.state}`);
        if (job.state === "completed") {
            console.log(`\n✅ Job COMPLETED!`);
            console.log(`   Result: ${JSON.stringify(job.result, null, 2)}`);
            break;
        }
        if (job.state === "failed") {
            console.log(`\n❌ Job FAILED`);
            break;
        }
    }

    process.exit(0);
})();
