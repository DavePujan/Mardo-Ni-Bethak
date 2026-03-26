require("dotenv").config();
const dns = require("dns");
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
}
const express = require("express");
const cors = require("cors");
const submitRoutes = require("./routes/submit");

const authRoutes = require("./routes/auth");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const { auth, authorize } = require("./middleware/auth");

const cookieParser = require("cookie-parser");
require("./utils/passport"); // Config passport
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true })); // Important for cookies
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

// Metrics Collection Middleware
const { client, httpRequests } = require("./metrics");
app.use((req, res, next) => {
    res.on("finish", () => {
        httpRequests.inc({
            method: req.method,
            route: req.route?.path || req.url,
            status: res.statusCode,
        });
    });
    next();
});

app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
});

// Debug Logging
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} `);
    next();
});

app.use("/api/teacher", auth, authorize('teacher'), teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api", submitRoutes);

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger-output.json');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error"
    });
});

if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Backend running on port ${PORT}`);
    });
}

module.exports = app;
