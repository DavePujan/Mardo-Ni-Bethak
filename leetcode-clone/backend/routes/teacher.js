const router = require("express").Router();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { auth, teacherOnly } = require("../middleware/auth");

// Mock database for problems
// In reality, this should be in models/questions.js or independent db
// For now, we'll just log it or append to a local array if persistence within session implies.
// The user prompt showed "let problems = []".

const Quiz = require("../models/Quiz");
const Evaluation = require("../models/Evaluation");

// Dashboard Stats
router.get("/dashboard", auth, teacherOnly, async (req, res) => {
    try {
        const { count: quizCount, error: quizError } = await supabase
            .from("quizzes")
            .select("*", { count: 'exact', head: true });

        if (quizError) throw quizError;

        // Pending Evaluations (Evaluated status implies done, Submitted implies pending?)
        // Actually, my schema uses 'submitted' for code questions needing review.
        const { count: pendingCount, error: pendingError } = await supabase
            .from("quiz_attempts")
            .select("*", { count: 'exact', head: true })
            .eq("status", "submitted");

        if (pendingError) throw pendingError;

        // Total Students (Unique users in attempts? Or just total profiles with role student?)
        // Let's count profiles with role 'student' (assuming role is in profiles or we infer from metadata)
        // Since I don't have role strictly in profiles table in this context (it's in metadata),
        // I will count unique user_ids in quiz_attempts as "Active Students".
        // Or if I can access auth.users... no, service role can.
        // Let's stick to unique attempt users for now as a proxy for "Engaged Students".
        // Actually, let's just count total profiles for simplicity if possible, or 0.
        // Better: Count unique users who have attempted any quiz.
        // Supabase doesn't support distinct count easily via API without RPC.
        // I'll just count total attempts for now as a simple metric, or "Students" = 0 (placeholder).
        // Let's try to get count of profiles.
        const { count: studentCount } = await supabase
            .from("profiles")
            .select("*", { count: 'exact', head: true })
            .eq("role", "student");

        res.json({
            active: quizCount || 0,
            upcoming: 0, // Placeholder
            pending: pendingCount || 0,
            students: studentCount || 0
        });
    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Quiz Management - list all quizzes created by teacher
router.get("/quiz", auth, teacherOnly, async (req, res) => {
    try {
        const { data: quizzes, error } = await supabase
            .from("quizzes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json(quizzes);
    } catch (err) {
        console.error("Fetch Teacher Quizzes Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Create Quiz (Basic) - Keeping as is, but ensuring it uses real DB which it does in full route

// End Quiz
router.post("/quiz/:id/end", auth, teacherOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from("quizzes")
            .update({ is_active: false })
            .eq("id", id);

        if (error) throw error;
        res.json({ message: "Quiz ended successfully" });
    } catch (err) {
        console.error("End Quiz Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Evaluations
router.get("/evaluations", auth, teacherOnly, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("quiz_attempts")
            .select(`
                id,
                score,
                status,
                profiles(email),
                quizzes(title)
            `)
            .eq("status", "submitted");

        if (error) throw error;

        // Transform for frontend
        const formatted = data.map(item => ({
            id: item.id,
            student: item.profiles?.email || "Unknown",
            quiz: item.quizzes?.title || "Unknown",
            status: item.status
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Fetch Evaluations Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Single Evaluation Details
router.get("/evaluation/:id", auth, teacherOnly, async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch Attempt
        const { data: attempt, error: attemptError } = await supabase
            .from("quiz_attempts")
            .select(`
                id,
                score,
                status,
                profiles(email),
                quizzes(title)
            `)
            .eq("id", id)
            .single();

        if (attemptError) throw attemptError;

        // Fetch Answers
        const { data: answers, error: answersError } = await supabase
            .from("quiz_answers")
            .select(`
                question_id,
                selected_option,
                submitted_code,
                is_correct,
                marks_awarded,
                question:questions(title, type)
            `)
            .eq("attempt_id", id);

        if (answersError) throw answersError;

        res.json({
            id: attempt.id,
            student: attempt.profiles?.email || "Unknown",
            quiz: attempt.quizzes?.title || "Unknown",
            score: attempt.score,
            answers: answers.map(a => ({
                questionId: a.question_id,
                question: a.question?.title,
                selectedOption: a.selected_option,
                selectedOption: a.selected_option,
                code: a.submitted_code,
                isCorrect: a.is_correct,
                marks: a.marks_awarded
            }))
        });

    } catch (err) {
        console.error("Fetch Single Evaluation Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Finalize Evaluation (Update marks and status)
router.post("/evaluation/:id/finalize", auth, teacherOnly, async (req, res) => {
    try {
        const { id } = req.params;
        const { marks } = req.body; // Array of { questionId, marks, isCorrect }

        // 1. Update individual answers
        for (const m of marks) {
            await supabase
                .from("quiz_answers")
                .update({
                    marks_awarded: m.marks,
                    is_correct: m.isCorrect
                })
                .match({ attempt_id: id, question_id: m.questionId });
        }

        // 2. Calculate Total Score
        const totalScore = marks.reduce((sum, m) => sum + (Number(m.marks) || 0), 0);

        // 3. Update Attempt Status
        const { error } = await supabase
            .from("quiz_attempts")
            .update({
                score: totalScore,
                status: "evaluated",
                completed_at: new Date() // Ensure it's marked completed if not already
            })
            .eq("id", id);

        if (error) throw error;

        res.json({ message: "Evaluation finalized", totalScore });
    } catch (err) {
        console.error("Finalize Evaluation Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Existing route (modified to use Quiz model if needed, but keeping for now)
// Create Problem (Coding)
router.post("/problem", auth, teacherOnly, async (req, res) => {
    try {
        const { title, description, functionName, language, inputFormat, outputFormat, testCases } = req.body;

        const { data, error } = await supabase.from("problems").insert({
            title,
            description,
            language: language || "javascript",
            input_format: inputFormat,
            output_format: outputFormat,
            test_cases: testCases, // Assuming JSON structure { public: [], hidden: [] }
            created_by: req.user.email // or id
        }).select();

        if (error) throw error;

        res.json({ message: "Problem created", problem: data[0] });
    } catch (err) {
        console.error("Create Problem Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Unified Quiz Creation
router.post("/quiz/full", auth, teacherOnly, async (req, res) => {
    try {
        const { title, subject, duration, totalMarks, description, questions } = req.body;

        // Fetch valid UUID from Supabase profiles
        const { data: profile, error } = await supabase
            .from("profiles")
            .select("id")
            .ilike("email", req.user.email) // Changed to ilike for case-insensitivity
            .single();

        if (!profile) throw new Error(`Profile not found for user: ${req.user.email} (Error: ${error?.message})`);
        const userId = profile.id;

        // 1. Create Quiz
        const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .insert({
                title,
                subject,
                duration,
                total_marks: totalMarks,
                description,
                created_by: userId,
                quiz_type: "hybrid"
            })
            .select()
            .single();

        if (quizError) throw quizError;

        // 2. Process Questions
        for (const q of questions) {
            // Insert Question
            const { data: question, error: qError } = await supabase
                .from("questions")
                .insert({
                    title: q.question, // Frontend sends 'question' as title
                    type: q.type, // 'mcq' or 'code'
                    weightage: q.marks,
                    language: q.language,
                    input_format: q.inputFormat,
                    output_format: q.outputFormat,
                    created_by: userId,
                    image_url: q.image || null
                })
                .select()
                .single();

            if (qError) throw qError;

            // Map to Quiz
            await supabase.from("quiz_questions_map").insert({
                quiz_id: quiz.id,
                question_id: question.id,
                weightage: q.marks
            });

            // Insert Details based on Type
            if (q.type === "mcq") {
                // Options
                const optionsToInsert = q.options.map((optText, idx) => ({
                    question_id: question.id,
                    option_text: optText,
                    is_correct: optText === q.answer
                }));
                await supabase.from("mcq_options").insert(optionsToInsert);
            } else if (q.type === "code") {
                // Testcases
                const testcasesToInsert = q.testCases.map(tc => ({
                    question_id: question.id,
                    input: tc.input,
                    expected_output: tc.output,
                    is_hidden: tc.isHidden || false
                }));
                await supabase.from("testcases").insert(testcasesToInsert);
            }
        }

        res.json({ message: "Quiz created successfully", quizId: quiz.id });
    } catch (err) {
        console.error("Quiz Creation Error:", err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
