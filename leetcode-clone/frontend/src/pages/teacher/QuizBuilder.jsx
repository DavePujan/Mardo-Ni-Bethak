import React, { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function QuizBuilder() {
    const [questions, setQuestions] = useState([]);
    const [current, setCurrent] = useState({
        type: "MCQ",
        question: "",
        options: ["", "", "", ""],
        answer: "",
        marks: 1
    });

    const addQuestion = () => {
        setQuestions([...questions, current]);
        setCurrent({
            type: "MCQ",
            question: "",
            options: ["", "", "", ""],
            answer: "",
            marks: 1
        });
    };

    const saveQuiz = async () => {
        // Assuming quiz_id is available in context or passed as prop. 
        // Logic: previously this just posted { questions }. 
        // The user guide says: "await supabase.from('quiz_questions').insert(...)"
        // But we need quiz_id. Let's obtain it from prompt or assume it's missing in this simplified view.
        // I will add a prompt or mock it for now, or check if I should update Component to accept quizId.
        // Actually, looking at App.jsx, CreateQuiz and QuizBuilder are separate routes. 
        // Maybe the user intends to create quiz then redirect to builder?
        // Use a placeholder ID or prompt.
        const quiz_id = prompt("Enter Quiz ID to attach questions to:");
        if (!quiz_id) return;

        const { error } = await supabase.from("quiz_questions").insert(
            questions.map(q => ({
                quiz_id,
                type: q.type,
                question: q.question,
                options: q.type === "MCQ" ? q.options : null,
                correct_answer: q.answer,
                marks: q.marks
            }))
        );

        if (error) {
            alert("Error saving questions: " + error.message);
        } else {
            alert("Quiz Questions Saved");
        }
    };

    return (
        <div className="p-6 max-w-4xl">
            <h1 className="text-xl font-semibold mb-4">Quiz Builder</h1>

            <select
                className="input"
                value={current.type}
                onChange={e => setCurrent({ ...current, type: e.target.value })}
            >
                <option value="MCQ">MCQ</option>
                <option value="DESCRIPTIVE">Descriptive</option>
            </select>

            <textarea
                className="input"
                placeholder="Question"
                value={current.question}
                onChange={e => setCurrent({ ...current, question: e.target.value })}
            />

            {current.type === "MCQ" &&
                current.options.map((opt, i) => (
                    <input
                        key={i}
                        className="input"
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => {
                            const opts = [...current.options];
                            opts[i] = e.target.value;
                            setCurrent({ ...current, options: opts });
                        }}
                    />
                ))}

            <input
                className="input"
                placeholder="Correct Answer"
                value={current.answer}
                onChange={e => setCurrent({ ...current, answer: e.target.value })}
            />

            <input
                className="input"
                type="number"
                placeholder="Marks"
                value={current.marks}
                onChange={e => setCurrent({ ...current, marks: e.target.value })}
            />

            <button className="btn-primary mr-2" onClick={addQuestion}>
                Add Question
            </button>

            <button className="btn-secondary" onClick={saveQuiz}>
                Save Quiz
            </button>
        </div>
    );
}
