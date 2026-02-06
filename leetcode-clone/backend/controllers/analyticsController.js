const pool = require("../db");

// ================================
// GET QUIZ ANALYTICS (TEACHER)
// ================================
const getQuizAnalytics = async (req, res) => {
  const { quizId } = req.params;

  try {
    /* --------------------------------
       1. OVERVIEW CARDS
       - Now returns avg_score AND avg_percentage
       - Uses total_marks from quiz_attempts
    -------------------------------- */
    const overviewQuery = `
      SELECT
        COUNT(*) AS total_attempts,
        ROUND(AVG(score)::numeric, 2) AS avg_score,
        ROUND(AVG(CASE WHEN total_marks > 0 THEN (score / total_marks) * 100 ELSE 0 END)::numeric, 2) AS avg_percentage,
        ROUND(MAX(CASE WHEN total_marks > 0 THEN (score / total_marks) * 100 ELSE 0 END)::numeric, 2) AS max_percentage,
        ROUND(MIN(CASE WHEN total_marks > 0 THEN (score / total_marks) * 100 ELSE 0 END)::numeric, 2) AS min_percentage
      FROM quiz_attempts
      WHERE quiz_id = $1
        AND status IN ('submitted', 'evaluated');
    `;
    const overviewResult = await pool.query(overviewQuery, [quizId]);

    /* --------------------------------
       2. SCORE DISTRIBUTION (Percentage Based)
       - Buckets: 0, 10, 20... 90, 100
    -------------------------------- */
    const scoreDistQuery = `
      SELECT
        FLOOR((CASE WHEN total_marks > 0 THEN (score / total_marks) * 100 ELSE 0 END) / 10) * 10 AS bucket,
        COUNT(*) AS students
      FROM quiz_attempts
      WHERE quiz_id = $1
        AND status IN ('submitted', 'evaluated')
      GROUP BY bucket
      ORDER BY bucket;
    `;
    const scoreDistResult = await pool.query(scoreDistQuery, [quizId]);

    // Fill missing buckets for cleaner chart
    const fullBuckets = [];
    const resultMap = {};
    scoreDistResult.rows.forEach(r => resultMap[r.bucket] = parseInt(r.students));

    for (let i = 0; i <= 100; i += 10) {
      fullBuckets.push({
        range: `${i}%-${i + 9}%`, // e.g. "0%-9%", "10%-19%"
        students: resultMap[i] || 0
      });
    }

    /* --------------------------------
       3. QUESTION DIFFICULTY
       - Uses COUNT(DISTINCT attempt_id)
    -------------------------------- */
    const questionDifficultyQuery = `
      SELECT
        q.id,
        q.title,
        q.type,
        COUNT(DISTINCT qa.attempt_id) AS attempts,
        ROUND(
          (SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT qa.attempt_id), 0))::numeric,
          2
        ) AS accuracy
      FROM quiz_answers qa
      JOIN questions q ON q.id = qa.question_id
      WHERE qa.attempt_id IN (
        SELECT id FROM quiz_attempts
        WHERE quiz_id = $1
        AND status IN ('submitted', 'evaluated')
      )
      GROUP BY q.id, q.title, q.type;
    `;
    const questionDifficultyResult = await pool.query(
      questionDifficultyQuery,
      [quizId]
    );

    /* --------------------------------
       4. DETAILED TOPIC ANALYSIS
       - Hierarchy: Topic -> Questions
       - Includes insights and performance labels
    -------------------------------- */
    const topicRawQuery = `
      SELECT
        COALESCE(t.name, 'Other') as topic,
        q.id as question_id,
        q.title as question_title,
        ROUND(AVG(CASE WHEN q.weightage > 0 THEN (qa.marks_obtained / q.weightage) * 100 ELSE 0 END)::numeric, 2) AS accuracy
      FROM quiz_answers qa
      JOIN questions q ON q.id = qa.question_id
      LEFT JOIN topics t ON t.id = q.topic_id
      WHERE qa.attempt_id IN (
        SELECT id FROM quiz_attempts
        WHERE quiz_id = $1
        AND status IN ('submitted', 'evaluated')
      )
      GROUP BY t.name, q.id, q.title
      ORDER BY t.name;
    `;
    const topicRawResult = await pool.query(topicRawQuery, [quizId]);

    // Grouping & Insight Generation
    const topicMap = {};

    topicRawResult.rows.forEach(row => {
      if (!topicMap[row.topic]) {
        topicMap[row.topic] = {
          topic: row.topic,
          questions: [],
          totalAccuracy: 0,
          count: 0
        };
      }
      topicMap[row.topic].questions.push({
        title: row.question_title,
        accuracy: parseFloat(row.accuracy)
      });
      topicMap[row.topic].totalAccuracy += parseFloat(row.accuracy);
      topicMap[row.topic].count++;
    });

    const detailedTopicAnalysis = Object.values(topicMap).map(t => {
      const avgAccuracy = t.count > 0 ? (t.totalAccuracy / t.count).toFixed(2) : 0;
      let performance = "Moderate";
      let insight = "";

      // Rule-based Insights
      if (avgAccuracy < 30) {
        performance = "Very Weak";
        insight = "Learners struggled significantly with this concept. Fundamental review required.";
      } else if (avgAccuracy < 50) {
        performance = "Weak";
        insight = "Confusion exists. Concepts are not fully grasped.";
      } else if (avgAccuracy < 70) {
        performance = "Moderate";
        insight = "Conceptual understanding exists, but consistency is lacking.";
      } else if (avgAccuracy < 90) {
        performance = "Good";
        insight = "Most learners understand this concept well.";
      } else {
        performance = "Excellent";
        insight = "This concept is mastered by the class.";
      }

      return {
        topic: t.topic,
        avg_score: avgAccuracy, // Keep 'avg_score' for backwards compatibility if needed
        performance,
        insight,
        questions: t.questions
      };
    }).sort((a, b) => b.avg_score - a.avg_score);

    /* --------------------------------
       FINAL RESPONSE
    -------------------------------- */
    return res.json({
      overview: overviewResult.rows[0],
      scoreDistribution: fullBuckets,
      questionDifficulty: questionDifficultyResult.rows,
      topicPerformance: detailedTopicAnalysis // New Structure
    });

  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
};

module.exports = { getQuizAnalytics };
