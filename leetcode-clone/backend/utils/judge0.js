require("dotenv").config();
const axios = require("axios");
const https = require("https");
const http = require("http");

const BASE_URL = (process.env.JUDGE0_API_URL || "").replace(/\/+$/, "");
console.log("JUDGE0 URL:", BASE_URL || "(missing)");

const LANGUAGE_MAP = {
    javascript: 63,
    js: 63,
    python: 71,
    cpp: 54,
    c: 50,
    java: 62,
    php: 68
};

const normalizeLanguage = (language) => {
    const normalized = String(language || "").trim().toLowerCase();
    if (normalized === "js") return "javascript";
    return normalized;
};

const resolveLanguageId = (language, questionLangMap = {}) => {
    const raw = String(language || "").trim().toLowerCase();
    const normalized = normalizeLanguage(raw);
    const questionMap = questionLangMap || {};

    const fromQuestionMap =
        questionMap[raw] ??
        questionMap[normalized] ??
        (normalized === "javascript" ? questionMap.js : undefined);

    if (Number.isInteger(Number(fromQuestionMap))) {
        return Number(fromQuestionMap);
    }

    return LANGUAGE_MAP[raw] ?? LANGUAGE_MAP[normalized];
};

// 1. Keep-Alive Agent to reuse TCP connections
const agentOptions = { keepAlive: true };
const axiosInstance = axios.create({
    httpAgent: new http.Agent(agentOptions),
    httpsAgent: new https.Agent(agentOptions),
    timeout: 20000 // 20s — handles heavier submissions
});

const delay = ms => new Promise(res => setTimeout(res, ms));

const resolveSubmissionResult = async (token, headers, maxPolls = 20, pollMs = 1000) => {
    let data = null;
    for (let i = 0; i < maxPolls; i++) {
        const pollRes = await axiosInstance.get(`${BASE_URL}/submissions/${token}`, { headers });
        data = pollRes.data;
        if (data?.status?.id > 2) return data;
        await delay(pollMs);
    }
    return data;
};

exports.LANGUAGE_MAP = LANGUAGE_MAP;
exports.normalizeLanguage = normalizeLanguage;
exports.resolveLanguageId = resolveLanguageId;

exports.run = async (params, retries = 3) => {
    if (!BASE_URL) {
        throw new Error("JUDGE0_API_URL is missing");
    }

    const headers = { "Content-Type": "application/json" };
    if (process.env.JUDGE0_API_KEY) {
        headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
    }

    let attempt = 0;
    while (attempt < retries) {
        try {
            const { source_code, language_id, stdin, expected_output, cpu_time_limit = 2, memory_limit = 128000 } = params;

            // wait=true → Judge0 returns final result directly, no polling needed
            const res = await axiosInstance.post(
                `${BASE_URL}/submissions?wait=true`,
                {
                    source_code,
                    language_id,
                    stdin,
                    expected_output,
                    cpu_time_limit,
                    memory_limit,
                    enable_network: false,
                    max_processes_and_or_threads: 30
                },
                { headers }
            );

            return res.data;
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
    if (!BASE_URL) {
        throw new Error("JUDGE0_API_URL is missing");
    }

    try {
        const headers = { "Content-Type": "application/json" };
        if (process.env.JUDGE0_API_KEY) {
            headers["X-Auth-Token"] = process.env.JUDGE0_API_KEY;
        }

        const res = await axiosInstance.post(
            `${BASE_URL}/submissions/batch?wait=true`,
            { submissions },
            { headers }
        );

        if (!res.data || res.data.length === 0) {
            throw new Error("Judge0 returned empty response");
        }

        // Some Judge0 CE builds return only tokens for batch even with wait=true.
        const tokenOnlyBatch = Array.isArray(res.data) && res.data.every(item => item?.token && !item?.status);
        if (tokenOnlyBatch) {
            const resolved = await Promise.all(
                res.data.map(async (item) => {
                    return resolveSubmissionResult(item.token, headers);
                })
            );
            return resolved;
        }

        const unresolvedBatch = Array.isArray(res.data) && res.data.some(item => item?.token && item?.status?.id <= 2);
        if (unresolvedBatch) {
            const resolved = await Promise.all(
                res.data.map(async (item) => {
                    if (!item?.token || item?.status?.id > 2) return item;
                    return resolveSubmissionResult(item.token, headers);
                })
            );
            return resolved;
        }

        return res.data;
    } catch (err) {
        console.error("Judge0 Batch Error:", err.message);
        throw err;
    }
};
