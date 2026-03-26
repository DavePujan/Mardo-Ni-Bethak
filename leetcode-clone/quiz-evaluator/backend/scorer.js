import { supabase } from "./supabase.js";

export async function saveResult(submission, execResult, feedback) {
    const maxMarks = 10;
    // Prevent division by zero if total is 0 (though unlikely in this context)
    const score = execResult.total > 0
        ? Math.round((execResult.passed / execResult.total) * maxMarks)
        : 0;

    const { data, error } = await supabase.from("results").insert({
        student_id: submission.student_id,
        question_id: submission.question_id,
        marks: score,
        feedback
    }).select();

    if (error) {
        console.error("Error saving result:", error);
    }

    return { score, feedback };
}
