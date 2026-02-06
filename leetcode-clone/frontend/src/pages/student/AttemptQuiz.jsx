
import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import CodeEditor from "../../components/CodeEditor";
import api, { runCode } from "../../utils/api";

const AttemptQuiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [markedForReview, setMarkedForReview] = useState(new Set());
    const [visited, setVisited] = useState(new Set([0]));
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    
    // Run Code State
    const [runResult, setRunResult] = useState(null);
    const [runLoading, setRunLoading] = useState(false);

    // UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Fetch Quiz
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await api.get(`/api/student/quiz/${id}`);
                const data = response.data;
                // if (response.ok) check removal - api throws on error

                setQuiz(data);

                // Calculate Time Left based on Scheduled Time + Duration
                // If scheduled_at is null, fallback to created_at (not ideal but safe)
                const startTime = data.scheduled_at ? new Date(data.scheduled_at).getTime() : new Date(data.created_at).getTime();
                const durationMs = (data.duration || 60) * 60 * 1000;
                const endTime = startTime + durationMs;
                const now = Date.now();
                const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

                setTimeLeft(remaining);

            } catch (err) {
                setError(err.response?.data?.error || "Error fetching quiz");
            } finally {
                setLoading(false);
            }
        };
        if (token && id) fetchQuiz();
    }, [token, id]);

    // Timer Logic - Sync with Server Time
    useEffect(() => {
        if (!quiz) return;

        const intervalId = setInterval(() => {
            const startTime = quiz.scheduled_at ? new Date(quiz.scheduled_at).getTime() : new Date(quiz.created_at).getTime();
            const durationMs = (quiz.duration || 60) * 60 * 1000;
            const endTime = startTime + durationMs;
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

            setTimeLeft(remaining);

            if (remaining <= 0 && !submitting) {
                clearInterval(intervalId);
                handleSubmit(true); // Auto submit
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [quiz, submitting]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleQuestionChange = (index) => {
        setCurrentQuestionIndex(index);
        setRunResult(null); // Clear console
        setVisited((prev) => new Set(prev).add(index));
        // On mobile, close sidebar after selection
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            handleQuestionChange(currentQuestionIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            handleQuestionChange(currentQuestionIndex - 1);
        }
    };

    const handleSaveAndNext = () => handleNext();

    const handleMarkForReview = () => {
        const qId = quiz.questions[currentQuestionIndex].id;
        setMarkedForReview((prev) => {
            const next = new Set(prev);
            if (next.has(qId)) next.delete(qId);
            else next.add(qId);
            return next;
        });
        handleNext();
    };

    const handleClearResponse = () => {
        const qId = quiz.questions[currentQuestionIndex].id;
        setAnswers((prev) => {
            const next = { ...prev };
            delete next[qId];
            return next;
        });
    };

    const handleOptionSelect = (qId, option) => {
        setAnswers((prev) => {
            const currentSelected = prev[qId]?.selectedOption;
            // Toggle Logic: If clicking the same option, deselect it (remove from answers)
            if (currentSelected === option) {
                const next = { ...prev };
                delete next[qId];
                return next;
            }
            // Otherwise select the new option
            return {
                ...prev,
                [qId]: { ...prev[qId], selectedOption: option, type: 'mcq' }
            };
        });
    };

    const handleCodeChange = (qId, code) => {
        setAnswers((prev) => ({
            ...prev,
            [qId]: { ...prev[qId], submittedCode: code, type: 'code' }
        }));
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm("Are you sure you want to submit?")) return;

        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
                questionId: qId,
                selectedOption: val.selectedOption,
                submittedCode: val.submittedCode
            }));

            const response = await api.post(`/api/student/quiz/${id}/attempt`, { answers: formattedAnswers });
            const data = response.data;

            if (!auto) alert(`Quiz Submitted! Score: ${data.attemptScore || 'Pending Evaluation'}`);
            navigate("/");

        } catch (err) {
            console.error(err);
            const errMsg = err.response?.data?.error || "Error submitting quiz";
            if (!auto) alert("Submission Failed: " + errMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRunCode = async () => {
        const qId = quiz.questions[currentQuestionIndex].id;
        const currentCode = answers[qId]?.submittedCode;
        const language = quiz.questions[currentQuestionIndex].language || "javascript";

        if (!currentCode) {
            alert("Please write some code first!");
            return;
        }

        setRunLoading(true);
        setRunResult(null);

        try {
            const res = await runCode(id, {
                questionId: qId,
                code: currentCode,
                language: language
            });
            setRunResult(res.data);
        } catch (err) {
            console.error(err);
            setRunResult({ status: { description: "Error" }, stderr: "Failed to execute code." });
        } finally {
            setRunLoading(false);
        }
    };

    const getStatusColor = (idx, qId) => {
        const isAnswered = !!answers[qId];
        const isMarked = markedForReview.has(qId);
        const isVisited = visited.has(idx);

        if (isMarked) return "bg-purple-600 text-white border-purple-400";
        if (isAnswered) return "bg-green-600 text-white border-green-400";
        if (isVisited && !isAnswered) return "bg-red-500 text-white border-red-400";
        return "bg-gray-700 text-gray-300 border-gray-600";
    };

    if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading Quiz...</div>;
    if (error) return <div className="h-screen flex items-center justify-center text-red-500 font-bold text-xl">{error}</div>;

    const now = new Date();
    const startTime = quiz.scheduled_at ? new Date(quiz.scheduled_at) : new Date(quiz.created_at);
    // Add small buffer (e.g. 2s) to prevent immediate redirect if clocks are slightly off
    if (now < startTime) return <div className="text-white text-center mt-20">Quiz not started yet.</div>;

    const currentQ = quiz.questions[currentQuestionIndex];

    return (
        <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-200 font-sans overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-[#252526] border-b border-[#333] flex items-center justify-between px-4 md:px-6 shrink-0 z-20 relative">
                <div className="flex items-center gap-4">
                    {/* Mobile Hamburger to toggle Palette */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="md:hidden p-2 text-gray-400 hover:text-white border border-gray-700 rounded"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="font-bold text-base md:text-xl text-blue-400 truncate max-w-[150px] md:max-w-none">{quiz.title}</div>
                </div>

                <div className="flex items-center gap-2 bg-black/30 px-3 py-1 md:px-4 md:py-2 rounded-lg border border-gray-700">
                    <span className="text-xs md:text-sm text-gray-400 font-semibold uppercase hidden md:inline">Time Left:</span>
                    <span className={`font-mono text-lg md:text-xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-green-400'}`}>
                        {formatTime(timeLeft)}
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                        <div className="text-sm font-medium text-white">Candidate</div>
                        <div className="text-xs text-gray-400">Student ID: ****</div>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm md:text-base">
                        S
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Left: Question Area */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e] w-full">
                    {/* Header for Question */}
                    <div className="p-3 md:p-4 border-b border-[#333] flex justify-between items-center bg-[#252526]">
                        <h2 className="text-base md:text-lg font-bold text-white">Question {currentQuestionIndex + 1}</h2>
                        <div className="flex gap-4 text-xs md:text-sm font-medium">
                            <span className="text-green-400">+1.0 Marks</span>
                        </div>
                    </div>

                    {/* Scrollable Question Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-base md:text-lg mb-6 leading-relaxed text-gray-100 whitespace-pre-wrap">
                                {currentQ.title}
                            </p>

                            {currentQ.image_url && (
                                <img src={currentQ.image_url} alt="Reference" className="max-h-64 rounded-lg border border-gray-700 mb-6" />
                            )}

                            {currentQ.type === 'mcq' && (
                                <div className="space-y-3">
                                    {currentQ.mcq_options.map((opt) => (
                                        <div
                                            key={opt.id}
                                            onClick={() => handleOptionSelect(currentQ.id, opt.option_text)}
                                            className={`
                                                flex items-center p-3 md:p-4 rounded-lg cursor-pointer border-2 transition-all
                                                ${answers[currentQ.id]?.selectedOption === opt.option_text
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-[#333] bg-[#2d2d2d] hover:bg-[#333] hover:border-gray-500'}
                                            `}
                                        >
                                            <div className={`
                                                w-5 h-5 min-w-5 rounded-full border mr-3 flex items-center justify-center
                                                ${answers[currentQ.id]?.selectedOption === opt.option_text ? 'border-blue-500' : 'border-gray-500'}
                                            `}>
                                                {answers[currentQ.id]?.selectedOption === opt.option_text && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                            </div>
                                            <span className="text-sm md:text-base text-gray-200">{opt.option_text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'code' && (
                                <div className="border border-gray-700 rounded-lg overflow-hidden flex flex-col">
                                    <CodeEditor
                                        language={currentQ.language || "javascript"}
                                        code={answers[currentQ.id]?.submittedCode || ""}
                                        setCode={(val) => handleCodeChange(currentQ.id, val)}
                                        template={`// Write your code here...`}
                                        width="100%"
                                        lockFirstLine={false}
                                    />
                                    {/* Console / Run Output */}
                                    <div className="border-t border-gray-700 bg-[#1e1e1e]">
                                        <div className="flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-gray-700">
                                            <span className="text-xs font-bold uppercase text-gray-400">Console</span>
                                            <button 
                                                onClick={handleRunCode} 
                                                disabled={runLoading}
                                                className={`px-3 py-1 rounded text-xs font-bold flex items-center gap-2 transition-colors ${runLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600 text-green-400 border border-green-500/30'}`}
                                            >
                                                {runLoading ? (
                                                    <><span className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span> Running...</>
                                                ) : (
                                                    <>▶ Run Code</>
                                                )}
                                            </button>
                                        </div>
                                        
                                        {runResult && (
                                            <div className="p-4 text-sm font-mono max-h-40 overflow-y-auto">
                                                {runResult.status?.description === "Accepted" ? (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="text-green-400 font-bold mb-1">✔ Accepted</div>
                                                        <div><span className="text-gray-500">Input:</span> <code className="text-gray-300">{runResult.input || "-"}</code></div>
                                                        <div><span className="text-gray-500">Output:</span> <code className="text-white">{runResult.stdout?.trim() || "-"}</code></div>
                                                        <div><span className="text-gray-500">Expected:</span> <code className="text-gray-300">{runResult.expected || "-"}</code></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col gap-2">
                                                        <div className="text-red-400 font-bold mb-1">✘ {runResult.status?.description || "Runtime Error"}</div>
                                                        {runResult.stderr ? (
                                                            <pre className="text-red-300 whitespace-pre-wrap bg-red-900/10 p-2 rounded border border-red-500/20">{runResult.stderr}</pre>
                                                        ) : (
                                                            <>
                                                                <div><span className="text-gray-500">Input:</span> <code className="text-gray-300">{runResult.input || "-"}</code></div>
                                                                <div><span className="text-gray-500">Output:</span> <code className="text-white">{runResult.stdout?.trim() || "-"}</code></div>
                                                                <div><span className="text-gray-500">Expected:</span> <code className="text-gray-300">{runResult.expected || "-"}</code></div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {!runResult && !runLoading && (
                                            <div className="p-4 text-xs text-gray-600 italic">Run code to see output for the first test case.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="p-3 md:p-4 border-t border-[#333] bg-[#252526] flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handleMarkForReview}
                                className="flex-1 md:flex-none px-3 py-2 rounded bg-purple-600/20 text-purple-400 border border-purple-600/50 hover:bg-purple-600/30 transition text-xs md:text-sm font-medium whitespace-nowrap"
                            >
                                Mark Review
                            </button>
                            <button
                                onClick={handleClearResponse}
                                className="flex-1 md:flex-none px-3 py-2 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition text-xs md:text-sm font-medium whitespace-nowrap"
                            >
                                Clear
                            </button>
                        </div>

                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handlePrev}
                                disabled={currentQuestionIndex === 0}
                                className="flex-1 md:flex-none px-4 md:px-6 py-2 rounded bg-gray-700 text-white disabled:opacity-50 hover:bg-gray-600 transition text-sm font-medium"
                            >
                                Prev
                            </button>
                            <button
                                onClick={handleSaveAndNext}
                                className="flex-1 md:flex-none px-4 md:px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 transition text-sm font-bold shadow-lg"
                            >
                                {currentQuestionIndex === quiz.questions.length - 1 ? 'Save' : 'Next'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: Palette Sidebar - Responsive Overlay */}
                <div className={`
                    fixed inset-y-0 right-0 w-80 bg-[#1e1e1e] border-l border-[#333] flex flex-col z-30 transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    md:relative md:translate-x-0 md:flex
                `}>
                    {/* Mobile Close Button */}
                    <div className="md:hidden absolute top-2 right-2">
                        <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400">✕</button>
                    </div>

                    <div className="p-4 border-b border-[#333] bg-[#252526]">
                        <h3 className="font-bold text-white mb-2 pt-2 md:pt-0">Question Palette</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 font-medium">
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-green-600"></span> Answered</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-red-500"></span> Not Answered</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-purple-600"></span> Review</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-gray-700"></span> Not Visited</div>
                            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-blue-500"></span> Current</div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Choose a Question</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {quiz.questions.map((q, idx) => (
                                <button
                                    key={q.id}
                                    onClick={() => handleQuestionChange(idx)}
                                    className={`
                                        aspect-square flex items-center justify-center rounded-lg font-bold text-lg border-2 transition-all shadow-sm
                                        ${getStatusColor(idx, q.id)}
                                        ${currentQuestionIndex === idx ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1e1e1e] border-blue-500' : ''}
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-4 border-t border-[#333] bg-[#252526]">
                        <button
                            onClick={() => handleSubmit(false)}
                            disabled={submitting}
                            className={`w-full py-3 rounded-lg font-bold text-white shadow-lg transition-transform active:scale-95 ${submitting ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-500'}`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Test'}
                        </button>
                    </div>
                </div>

                {/* Backdrop for mobile */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}
            </div>
        </div>
    );
};

export default AttemptQuiz;
