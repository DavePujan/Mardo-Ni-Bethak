const express = require("express");
const router = express.Router();
const { submissionQueue } = require("../queues/submission.queue");
const { auth } = require("../middleware/auth");

// GET /job/:jobId — Poll job status and result
router.get("/:jobId", auth, async (req, res) => {
    try {
        const job = await submissionQueue.getJob(req.params.jobId);

        if (!job) return res.status(404).json({ error: "Job not found" });

        const state = await job.getState();

        res.json({
            jobId: job.id,
            state,
            result: job.returnvalue || null,
            progress: job.progress || 0
        });
    } catch (err) {
        console.error("Job Status Error:", err.message);
        res.status(500).json({ error: "Failed to fetch job status" });
    }
});

module.exports = router;
