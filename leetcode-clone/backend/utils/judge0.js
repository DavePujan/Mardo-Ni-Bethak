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

const delay = ms => new Promise(res => setTimeout(res, ms));

exports.run = async (params, retries = 3) => {
    const headers = { "Content-Type": "application/json" };
    if (process.env.JUDGE0_API_KEY) {
        headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
    }

    let attempt = 0;
    while (attempt < retries) {
        try {
            const { source_code, language_id, stdin, expected_output, cpu_time_limit = 2, memory_limit = 128000 } = params;

            const res = await axiosInstance.post(
                `${process.env.JUDGE0_API_URL}/submissions?wait=true`,
                {
                    source_code,
                    language_id,
                    stdin,
                    expected_output,
                    cpu_time_limit,
                    memory_limit,
                    enable_network: false,
                    max_processes_and_or_threads: 1
                },
                { headers }
            );

            let data = res.data;
            const token = data.token;

            // Simple status polling cleaner for Processing/In Queue
            let polls = 0;
            while (token && data.status_id <= 2 && polls < 10) { // status 1 = In Queue, 2 = Processing
                await delay(1000);
                const pollRes = await axiosInstance.get(`${process.env.JUDGE0_API_URL}/submissions/${token}`, { headers });
                data = pollRes.data;
                polls++;
            }

            return data;
        } catch (err) {
            console.error(`Judge0 Error (Attempt ${attempt + 1}):`, err.message);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                return { status: { description: "Invalid Judge0 API Key" } };
            }
            attempt++;
            if (attempt >= retries) {
                return { status: { description: "Runtime Error (Judge0 after retries)" } };
            }
            await delay(2000);
        }
    }
};

exports.runBatch = async (submissions) => {
    try {
        const headers = { "Content-Type": "application/json" };
        if (process.env.JUDGE0_API_KEY) {
            headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
        }

        const res = await axiosInstance.post(
            `${process.env.JUDGE0_API_URL}/submissions/batch?wait=true`,
            { submissions },
            { headers }
        );
        return res.data;
    } catch (err) {
        console.error("Judge0 Batch Error:", err.message);
        return [];
    }
};
