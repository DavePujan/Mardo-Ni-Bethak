import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

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
                const res = await axios.get(`http://localhost:5000/api/submit/history/${submissionId}`, {
                    withCredentials: true
                });
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
    // Data structure assumption: 
    // history.questions = [{ id, title, type, marks, weightage, options: [], userAnswer, isCorrect, timeSpent }]

    return (
        <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900 md:flex-row">
            
            {/* Sidebar / Question Grid */}
            <div className="order-2 w-full overflow-y-auto border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-800 md:order-2 md:h-full md:w-80 md:border-l md:border-t-0">
                <div className="mb-4">
                    <Link to="/student/analysis" className="flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to Analysis
                    </Link>
                </div>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Questions</h3>
                <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                        const isCurrent = idx === currentQuestionIndex;
                        const bgColor = q.isCorrect ? 'bg-emerald-500' : 'bg-red-500';
                        const ring = isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-800' : '';
                        
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

                <div className="mt-8 space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-900/50">
                    <h4 className="text-xs font-semibold uppercase text-gray-500">Legend</h4>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <span className="mr-2 h-3 w-3 rounded-full bg-emerald-500"></span> Correct
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                        <span className="mr-2 h-3 w-3 rounded-full bg-red-500"></span> Incorrect
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="order-1 flex-1 overflow-y-auto p-6 md:order-1">
                {currentQ ? (
                    <div className="mx-auto max-w-3xl space-y-6">
                        
                        {/* Header Card */}
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                            <div className="flex flex-col justify-between sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Question {currentQuestionIndex + 1}</h2>
                                    <span className={`mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                        currentQ.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                        currentQ.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {currentQ.difficulty || 'Easy'}
                                    </span>
                                </div>
                                <div className="mt-4 flex space-x-6 text-sm text-gray-500 sm:mt-0">
                                    <div className="text-center">
                                        <p className="font-bold text-gray-900 dark:text-white">{currentQ.marks || 1}</p>
                                        <p>Marks</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`font-bold ${currentQ.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                                            {currentQ.marksObtained || 0}
                                        </p>
                                        <p>Obtained</p>
                                    </div>
                                    <div className="hidden text-center sm:block">
                                        <p className="flex items-center justify-center font-bold text-gray-900 dark:text-white">
                                            <Clock className="mr-1 h-3 w-3" />
                                            {currentQ.timeSpent || '45s'}
                                        </p>
                                        <p>Time Spent</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Question Card */}
                        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-800">
                            <p className="text-lg leading-relaxed text-gray-800 dark:text-gray-200">
                                {currentQ.title}
                            </p>

                            <div className="mt-8 space-y-3">
                                {currentQ.options && currentQ.options.map((opt, oIdx) => {
                                    // Determine styling based on correctness
                                    // Assumption: currentQ.userAnswer = index or value, currentQ.correctAnswer = index or value
                                    // Let's assume options are objects {id, text} and we compare IDs or text
                                    // Or simplified: options is array of strings. 
                                    const isSelected = currentQ.userAnswer === oIdx; 
                                    const isActualCorrect = currentQ.correctAnswer === oIdx; 
                                    
                                    let cardClass = "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750";
                                    let icon = null;

                                    if (isActualCorrect) {
                                        cardClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500";
                                        icon = <CheckCircle className="h-5 w-5 text-emerald-600" />;
                                    } else if (isSelected && !isActualCorrect) {
                                        cardClass = "border-red-500 bg-red-50 dark:bg-red-900/20 ring-1 ring-red-500";
                                        icon = <XCircle className="h-5 w-5 text-red-600" />;
                                    }

                                    return (
                                        <div key={oIdx} className={`flex items-center justify-between rounded-lg border p-4 transition-all ${cardClass}`}>
                                            <div className="flex items-center">
                                                <span className="mr-4 flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-sm font-bold text-gray-500 dark:border-gray-600">
                                                    {String.fromCharCode(65 + oIdx)}
                                                </span>
                                                <span className="text-gray-900 dark:text-gray-200">{opt.text || opt}</span>
                                            </div>
                                            {icon}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Solution / Explanation (Optional, if available) */}
                            {currentQ.explanation && (
                                <div className="mt-8 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900 dark:bg-indigo-900/20 dark:text-indigo-200">
                                    <p className="font-bold">Explanation:</p>
                                    <p className="mt-1">{currentQ.explanation}</p>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between pt-4">
                            <button
                                onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))}
                                disabled={currentQuestionIndex === 0}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 enabled:hover:text-indigo-600 disabled:opacity-50 dark:text-gray-400"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                            </button>
                            <button
                                onClick={() => setCurrentQuestionIndex(p => Math.min(questions.length - 1, p + 1))}
                                disabled={currentQuestionIndex === questions.length - 1}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-600 enabled:hover:text-indigo-600 disabled:opacity-50 dark:text-gray-400"
                            >
                                Next <ChevronRight className="ml-1 h-4 w-4" />
                            </button>
                        </div>

                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-500">
                        Select a question to view details.
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionReview;
