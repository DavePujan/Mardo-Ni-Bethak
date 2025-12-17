import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

interface QuizQuestion {
    correct_answer: string;
    marks: number;
}

interface Answer {
    answer: string;
    quiz_questions: QuizQuestion | QuizQuestion[] | null;
}

Deno.serve(async (req: Request) => {
    try {
        const { attempt_id } = await req.json();

        if (!attempt_id) {
            return new Response(JSON.stringify({ error: "Missing attempt_id" }), { status: 400 });
        }

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: rawAnswers, error } = await supabase
            .from("quiz_answers")
            .select("answer, quiz_questions(correct_answer, marks)")
            .eq("attempt_id", attempt_id);

        if (error) {
            console.error("Supabase error:", error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        let score = 0;
        const answers = rawAnswers as unknown as Answer[];

        if (answers) {
            answers.forEach((a) => {
                // Handle possibility of quiz_questions being an array or object
                const question = Array.isArray(a.quiz_questions) ? a.quiz_questions[0] : a.quiz_questions;

                if (question && a.answer === question.correct_answer) {
                    score += question.marks;
                }
            });
        }

        const { error: updateError } = await supabase
            .from("quiz_attempts")
            .update({ score, status: "evaluated" })
            .eq("id", attempt_id);

        if (updateError) {
            console.error("Update error:", updateError);
            return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true, score }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error("Unexpected error:", err);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
});
