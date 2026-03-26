const express = require("express");
const { getQuizAnalytics, getStudentComprehensiveAnalytics } = require("../controllers/analyticsController");
const { auth, authorize } = require("../middleware/auth");

const router = express.Router();

router.get(
    "/teacher/quiz/:quizId",
    auth,
    authorize('teacher'),
    getQuizAnalytics
);

// Student Comprehensive Analytics
router.get(
    "/student/:studentId/comprehensive",
    auth,
    getStudentComprehensiveAnalytics
);

module.exports = router;
