const router = require("express").Router();
const leaderboard = require("../models/Leaderboard"); // Using in-memory array

router.get("/:questionId", (req, res) => {
    console.log("Accessing leaderboard for:", req.params.questionId);
    const { questionId } = req.params;

    // Filter by question
    const entries = leaderboard.filter(e => e.questionId === questionId);

    // Default sort: Runtime ASC, then Memory ASC
    entries.sort((a, b) => {
        if (parseFloat(a.runtime) !== parseFloat(b.runtime)) {
            return parseFloat(a.runtime) - parseFloat(b.runtime);
        }
        return a.memory - b.memory;
    });

    // Limit 10
    res.json(entries.slice(0, 10));
});

module.exports = router;
