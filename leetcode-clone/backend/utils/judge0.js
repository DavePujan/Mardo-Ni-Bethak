const axios = require("axios");
const https = require("https");
const http = require("http");

// 1. Keep-Alive Agent to reuse TCP connections
const agentOptions = { keepAlive: true };
const axiosInstance = axios.create({
    httpAgent: new http.Agent(agentOptions),
    httpsAgent: new https.Agent(agentOptions),
    timeout: 10000
});

exports.run = async ({ source_code, language_id, expected_output, cpu_time_limit = 2, memory_limit = 128000 }) => {
    try {
        const res = await axiosInstance.post(
            `${process.env.JUDGE0_URL}/submissions?wait=true`,
            {
                source_code,
                language_id,
                expected_output,
                cpu_time_limit,
                memory_limit,
                enable_network: false,
                max_processes_and_or_threads: 1
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Auth-Token": process.env.JUDGE0_TOKEN
                }
            }
        );
        return res.data;
    } catch (err) {
        console.error("Judge0 Error:", err.message);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            return { status: { description: "Invalid Judge0 API Key" } };
        }
        return { status: { description: "Runtime Error (Judge0)" } };
    }
};

exports.runBatch = async (submissions) => {
    try {
        // Judge0 Batch endpoint requires array of submission objects
        // and returns array of results
        const res = await axiosInstance.post(
            `${process.env.JUDGE0_URL}/submissions/batch?wait=true`,
            { submissions },
            {
                headers: {
                    "Content-Type": "application/json",
                    "X-Auth-Token": process.env.JUDGE0_TOKEN
                }
            }
        );
        return res.data;
    } catch (err) {
        console.error("Judge0 Batch Error:", err.message);
        // Fallback? If batch fails, return empty or error.
        return [];
    }
};
