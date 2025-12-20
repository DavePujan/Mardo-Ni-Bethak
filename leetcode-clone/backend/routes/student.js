const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");
const { auth } = require("../middleware/auth");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Get All Active Quizzes for Students
router.get("/quizzes", auth, async (req, res) => {
    try {
        const { data: quizzes, error } = await supabase
            .from("quizzes")
            // Join with profiles using the foreign key 'created_by'
            // Syntax: select(*, alias:referenced_table!fk_check(cols))
            // Assuming simplified FK detection or explicit join:
            .select("*, creator:profiles!created_by(full_name, email)")
            .order("created_at", { ascending: false });

        console.log(`[Student] Fetching quizzes for ${req.user.email} (ID: ${req.user.id})`);
        console.log(`[Student] Found ${quizzes?.length || 0} quizzes`, error ? error : "");

        if (error) throw error;

        // Fetch correct profile UUID to check attempts (req.user.id is legacy Integer)
        const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", req.user.email)
            .single();

        const userId = profile?.id;

        // Fetch attempt status for each quiz for this user
        const { data: attempts } = await supabase
            .from("quiz_attempts")
            .select("quiz_id, status")
            .eq("user_id", userId);

        // Map attempts for easier lookup
        const attemptMap = {};
        attempts?.forEach(a => {
            attemptMap[a.quiz_id] = a.status;
        });

        let quizzesWithStatus = quizzes.map(q => ({
            ...q,
            status: attemptMap[q.id] || "not_started"
        }));

        // Allow fetching ALL quizzes (for Leaderboard), otherwise default to hiding submitted
        if (req.query.includeAttempted === "true") {
            // Fetching for history/leaderboard: Show everything
        } else {
            quizzesWithStatus = quizzesWithStatus.filter(q => {
                const isTaken = q.status === "submitted" || q.status === "evaluated";

                // Enhanced Logic: Handle string "false" if DB returns JSON strings, though unlikely with Supabase JS
                // But strict check is active !== false.
                const isActive = q.is_active !== false;

                if (isTaken) return false; // Don't show in active list if taken

                // If not taken, only show if active
                return isActive;
            });
        }

        console.log(`[Student] Returning ${quizzesWithStatus.length} active quizzes.`);

        res.json(quizzesWithStatus);
    } catch (err) {
        console.error("Fetch Quizzes Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Quiz Leaderboard
router.get("/leaderboard", auth, async (req, res) => {
    try {
        const { quizId } = req.query;

        let query = supabase
            .from("quiz_attempts")
            .select(`
                score,
                user:profiles(email),
                quiz:quizzes(title)
            `)
            .order("score", { ascending: false });

        if (quizId) {
            query = query.eq("quiz_id", quizId);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Transform for frontend
        const leaderboard = data.map(row => ({
            username: row.user?.email?.split('@')[0] || "Unknown",
            score: row.score,
            quizTitle: row.quiz?.title,
            // runtime/memory not applicable for general quiz, but keeping structure if needed
        }));

        res.json(leaderboard);
    } catch (err) {
        console.error("Leaderboard Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Get Single Quiz with Questions (for Attempt)
router.get("/quiz/:id", auth, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if already attempted
        const { data: existingAttempt } = await supabase
            .from("quiz_attempts")
            .select("id, status")
            .eq("user_id", req.user.id)
            .eq("quiz_id", id)
            .single();

        if (existingAttempt && existingAttempt.status !== "in_progress") { // Strict one-time rule? User said "only once".
            return res.status(403).json({ error: "You have already attempted this quiz." });
        }

        // Fetch Quiz Metadata
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("*, creator:profiles!created_by(full_name, email)")
            .eq("id", id)
            .single();

        if (quizError) throw quizError;

        // Fetch Questions via Map
        const { data: mapData, error: mapError } = await supabase
            .from("quiz_questions_map")
            .select(`
                question_id,
                weightage,
                question:questions (
                    id, title, type, language, input_format, output_format, image_url,
                    mcq_options (id, option_text)
                )
            `)
            .eq("quiz_id", id);
        // Note: For Code questions, we DO NOT send hidden testcases. Even public ones might be better hidden until run?
        // Usually we send example testcases. My DB schema has 'testcases' table.
        // Let's fetch public testcases for code questions.

        if (mapError) throw mapError;

        // Fetch Testcases separately or join? Join is deep.
        // Let's just enhance the mapped data.
        const questionsWithDetails = await Promise.all(mapData.map(async (item) => {
            const q = item.question;
            if (q.type === 'code') {
                const { data: visibleTests } = await supabase
                    .from("testcases")
                    .select("input, expected_output")
                    .eq("question_id", q.id)
                    .eq("is_hidden", false);
                q.testCases = visibleTests || [];
            }
            return {
                ...q,
                weightage: item.weightage
            };
        }));

        res.json({ ...quiz, questions: questionsWithDetails });

    } catch (err) {
        console.error("Fetch Single Quiz Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Submit Quiz Attempt
router.post("/quiz/:id/attempt", auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // Array of { questionId, selectedOption, submittedCode }
        const { data: profile } = await supabase.from("profiles").select("id").eq("email", req.user.email).single();
        const userId = profile.id;

        // 1. Start Transaction (Simulated)
        // Check uniqueness again
        const { data: existing } = await supabase.from("quiz_attempts").select("id").eq("user_id", userId).eq("quiz_id", id).single();
        if (existing) return res.status(400).json({ error: "Attempt already exists" });

        // 2. Create Attempt Record
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .insert({
                user_id: userId,
                quiz_id: id,
                status: "submitted", // Or 'evaluated' if immediate
                completed_at: new Date()
            })
            .select()
            .single();

        if (attemptError) throw attemptError;

        // 3. Process Answers & Calculate Score (Basic Auto-Eval for MCQ)
        let totalScore = 0;
        const answerInserts = [];

        // Fetch correct answers for grading
        // For efficiency, fetch all questions in quiz
        const { data: quizQuestions } = await supabase
            .from("quiz_questions_map")
            .select(`
                weightage,
                question:questions (
                    id, type,
                    mcq_options (option_text, is_correct)
                )
            `)
            .eq("quiz_id", id);

        for (const userAns of answers) {
            const questionData = quizQuestions.find(q => q.question.id === userAns.questionId);
            if (!questionData) continue;

            const q = questionData.question;
            const weight = questionData.weightage;
            let isCorrect = false;
            let marks = 0;

            if (q.type === 'mcq') {
                const correctOpt = q.mcq_options.find(o => o.is_correct);
                if (correctOpt && correctOpt.option_text === userAns.selectedOption) {
                    isCorrect = true;
                    marks = weight;
                }
            } else if (q.type === 'code') {
                // TODO: Trigger Judge0 or leave for manual teacher review.
                // Status is 'submitted', Teacher will evaluate.
                // For now, no marks.
            }

            totalScore += marks;

            answerInserts.push({
                attempt_id: attempt.id,
                question_id: q.id,
                selected_option: userAns.selectedOption,
                submitted_code: userAns.submittedCode,
                is_correct: isCorrect,
                marks_awarded: marks
            });
        }

        // 4. Update Attempt Score
        await supabase.from("quiz_attempts").update({ score: totalScore, status: "evaluated" }).eq("id", attempt.id);
        // Note: If code questions exist, status might need to be 'submitted' (pending eval). 
        // Let's check if any code questions?
        const hasCode = quizQuestions.some(q => q.question.type === 'code');
        if (hasCode) {
            await supabase.from("quiz_attempts").update({ status: "submitted" }).eq("id", attempt.id);
        }

        // 5. Insert Details
        if (answerInserts.length > 0) {
            await supabase.from("quiz_answers").insert(answerInserts);
        }

        res.json({ message: "Quiz submitted successfully", score: totalScore, attemptId: attempt.id });

    } catch (err) {
        console.error("Submit Quiz Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
