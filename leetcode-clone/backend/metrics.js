const client = require("prom-client");

// Exposes standard Node.js/V8 metrics (CPU, RAM, Event Loop lag)
client.collectDefaultMetrics();

const httpRequests = new client.Counter({
    name: "http_requests_total",
    help: "Total HTTP Requests",
    labelNames: ["method", "route", "status"],
});

const redisStatus = new client.Gauge({
    name: "redis_status",
    help: "Redis availability (1 = up, 0 = down)",
});

const fallbackCounter = new client.Counter({
    name: "rate_limiter_fallback_total",
    help: "Number of times the Graceful circuit breaker bypassed Redis",
});

module.exports = { client, httpRequests, redisStatus, fallbackCounter };
