import React, { useState, useEffect } from "react";
import { getQuestionBank } from "../../utils/api";

export default function QuestionBank() {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        getQuestionBank()
            .then(res => setQuestions(res.data))
            .catch(() => setQuestions([]));
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-xl font-semibold mb-4">Question Bank</h1>

            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr>
                        <th>Question</th>
                        <th>Type</th>
                        <th>Difficulty</th>
                        <th>Usage</th>
                    </tr>
                </thead>
                <tbody>
                    {questions.map(q => (
                        <tr key={q.id}>
                            <td>{q.text}</td>
                            <td>{q.type}</td>
                            <td>{q.difficulty}</td>
                            <td>{q.used}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
