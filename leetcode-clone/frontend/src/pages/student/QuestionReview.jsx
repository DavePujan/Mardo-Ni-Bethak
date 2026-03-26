import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle, ChevronLeft, ChevronRight, ArrowLeft, Code2 } from 'lucide-react';
import api from '../../utils/api';

const QuestionReview = () => {
    const { submissionId } = useParams();
    const [history, setHistory] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We can reuse the existing 'history' endpoint but we might need more details.
        // The implementation plan suggested updating `quizController` or usage of `submit` endpoints.
        // Let's assume there is a generic endpoint or we use the `analytics` one if granular.
        // Actually, the plan said: "Update Endpoint: GET /api/submit/history/:submissionId".
        // Let's check `submit.js` first or assume we need to fetch a comprehensive review payload.
        // For now, I'll assume we use a specific URI: `/api/submit/history/${submissionId}`
        // and that it returns the detailed question data including options and user answers.
        
        const fetchReviewData = async () => {
            try {
                const res = await api.get(`/api/student/history/${submissionId}`);
                setHistory(res.data);
            } catch (err) {
                console.error("Failed to load review:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchReviewData();
    }, [submissionId]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
    );

    if (!history) return <div className="p-8 text-center text-gray-500">Review not found.</div>;

    const questions = history.questions || [];
    const currentQ = questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
            <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-6">
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <Link to="/history" className="flex items-center text-sm font-medium text-gray-400 hover:text-indigo-300">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to History
                        </Link>
                        <div className="text-sm text-gray-400">
                            Attempt: <span className="text-white font-semibold">{history.id}</span>
                        </div>
                    </div>

                    {currentQ ? (
                        <>
                            <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">Question {currentQuestionIndex + 1}</h2>
                                        <p className="text-sm text-gray-400 mt-1">{currentQ.type?.toUpperCase()} • {currentQ.language || "General"}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                            currentQ.isCorrect ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"
                                        }`}>
                                            {currentQ.isCorrect ? "Correct" : "Incorrect"}
                                        </span>
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
                                            {currentQ.marksObtained || 0} / {currentQ.marks || 1} Marks
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 space-y-5">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Question</p>
                                    <p className="text-base leading-relaxed">{currentQ.title}</p>
                                </div>

                                {currentQ.type === "code" ? (
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                                            <div className="flex items-center text-sm text-indigo-300 mb-2">
                                                <Code2 className="h-4 w-4 mr-2" />
                                                Your Submitted Code
                                            </div>
                                            <pre className="text-xs overflow-x-auto text-gray-200 whitespace-pre-wrap">{currentQ.codeReview?.submittedCode || "No code submitted."}</pre>
                                        </div>

                                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
                                            <p className="text-sm font-semibold text-blue-300 mb-1">AI Code Review</p>
                                            <p className="text-sm text-gray-300">{currentQ.codeReview?.feedback || "Code review unavailable for this attempt."}</p>
                                            {currentQ.codeReview?.suggestions ? (
                                                <p className="text-xs text-gray-400 mt-2">Suggestion: {currentQ.codeReview.suggestions}</p>
                                            ) : null}
                                            {currentQ.codeReview?.logicScore !== undefined && currentQ.codeReview?.logicScore !== null ? (
                                                <p className="text-xs text-indigo-300 mt-2">Logic Score: {(Number(currentQ.codeReview.logicScore) * 100).toFixed(1)}%</p>
                                            ) : null}
                                        </div>

                                        {Array.isArray(currentQ.codeReview?.sampleTests) && currentQ.codeReview.sampleTests.length > 0 ? (
                                            <div className="rounded-lg border border-gray-800 overflow-hidden">
                                                <div className="bg-gray-900/60 px-4 py-2 text-xs uppercase tracking-wider text-gray-400">Reference Test Cases</div>
                                                <table className="w-full text-left text-sm">
                                                    <thead className="text-gray-500 border-b border-gray-800">
                                                        <tr>
                                                            <th className="px-4 py-2">Input</th>
                                                            <th className="px-4 py-2">Expected Output</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentQ.codeReview.sampleTests.map((t, idx) => (
                                                            <tr key={idx} className="border-b border-gray-900 last:border-0">
                                                                <td className="px-4 py-2 font-mono text-xs text-gray-300">{t.input}</td>
                                                                <td className="px-4 py-2 font-mono text-xs text-emerald-300">{t.expected_output}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : null}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(currentQ.options || []).map((opt, oIdx) => {
                                            const isSelected = currentQ.userAnswer === oIdx;
                                            const isActualCorrect = currentQ.correctAnswer === oIdx;
                                            let cardClass = "border-gray-800 bg-gray-950";

                                            if (isActualCorrect) {
                                                cardClass = "border-emerald-500/40 bg-emerald-500/10";
                                            } else if (isSelected && !isActualCorrect) {
                                                cardClass = "border-red-500/40 bg-red-500/10";
                                            }

                                            return (
                                                <div key={oIdx} className={`flex items-center justify-between rounded-lg border p-4 ${cardClass}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="h-8 w-8 rounded-full border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                                                            {String.fromCharCode(65 + oIdx)}
                                                        </span>
                                                        <span className="text-sm">{opt}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {isSelected ? <span className="text-xs px-2 py-1 rounded bg-indigo-500/15 text-indigo-300">Your choice</span> : null}
                                                        {isActualCorrect ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : null}
                                                        {isSelected && !isActualCorrect ? <XCircle className="h-5 w-5 text-red-400" /> : null}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
                                            Correct Answer: <span className="text-emerald-300 font-semibold">{currentQ.correctAnswerText || "N/A"}</span>
                                            <br />
                                            Your Answer: <span className="text-indigo-300 font-semibold">{currentQ.userAnswerText || "Not answered"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between pt-2">
                                <button
                                    onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                                    disabled={currentQuestionIndex === 0}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 enabled:hover:text-indigo-300 disabled:opacity-50"
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                                </button>
                                <button
                                    onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))}
                                    disabled={currentQuestionIndex === questions.length - 1}
                                    className="flex items-center px-4 py-2 text-sm font-medium text-gray-300 enabled:hover:text-indigo-300 disabled:opacity-50"
                                >
                                    Next <ChevronRight className="ml-1 h-4 w-4" />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400">
                            No question data available.
                        </div>
                    )}
                </div>
            
                <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 h-fit">
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">Question Palette</h3>
                    <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex;
                        const bgColor = q.isCorrect ? 'bg-emerald-500/85' : 'bg-red-500/85';
                        const ring = isCurrent ? 'ring-2 ring-indigo-400' : '';
                        
                        return (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestionIndex(idx)}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white transition-all ${bgColor} ${ring}`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionReview;
