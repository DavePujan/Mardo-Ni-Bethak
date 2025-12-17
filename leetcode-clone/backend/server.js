require("dotenv").config();
const express = require("express");
const cors = require("cors");
const submitRoutes = require("./routes/submit");

const authRoutes = require("./routes/auth");
const teacherRoutes = require("./routes/teacher");
const studentRoutes = require("./routes/student");
const { auth, teacherOnly } = require("./middleware/auth");

const cookieParser = require("cookie-parser");
require("./utils/passport"); // Config passport
const adminRoutes = require("./routes/admin");

const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true })); // Important for cookies
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);

// Debug Logging
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} `);
    next();
});

app.use("/api/teacher", auth, teacherOnly, teacherRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", submitRoutes);

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
