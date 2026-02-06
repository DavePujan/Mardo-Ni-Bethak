const express = require("express");
const { getQuizAnalytics } = require("../controllers/analyticsController");
const { auth, teacherOnly } = require("../middleware/auth");

const router = express.Router();

router.get(
    "/teacher/quiz/:quizId",
    auth,
    teacherOnly,
    getQuizAnalytics
);

module.exports = router;
