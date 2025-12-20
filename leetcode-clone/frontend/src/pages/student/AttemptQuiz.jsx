import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import CodeEditor from "../../components/CodeEditor"; // Assuming we have this or similar

const AttemptQuiz = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useContext(AuthContext);

    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({}); // { questionId: { selectedOption, submittedCode } }
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/student/quiz/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setQuiz(data);
                } else {
                    setError(data.error || "Failed to load quiz");
                }
            } catch (err) {
                setError("Error fetching quiz");
            } finally {
                setLoading(false);
            }
        };
        if (token && id) fetchQuiz();
    }, [token, id]);

    const handleOptionSelect = (questionId, option) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], selectedOption: option }
        }));
    };

    const handleCodeChange = (questionId, code) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { ...prev[questionId], submittedCode: code }
        }));
    };

    const handleSubmit = async () => {
        if (!window.confirm("Are you sure you want to submit? This cannot be undone.")) return;
        setSubmitting(true);
        try {
            const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
                questionId: qId,
                selectedOption: val.selectedOption,
                submittedCode: val.submittedCode
            }));

            const response = await fetch(`http://localhost:5000/api/student/quiz/${id}/attempt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ answers: formattedAnswers })
            });

            const data = await response.json();
            if (response.ok) {
                alert(`Quiz Submitted! Score: ${data.attemptScore || 'Pending Evaluation'}`); // Check api response shape
                navigate("/");
            } else {
                alert("Submission Failed: " + data.error);
            }
        } catch (err) {
            console.error(err);
            alert("Error submitting quiz");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-white p-10 text-center">Loading Quiz...</div>;
    if (error) return <div className="text-red-500 p-10 text-center text-2xl font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8 border-b border-gray-700 pb-4">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                        {quiz.title}
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm">Created by: <span className="text-white">{quiz.creator?.full_name || 'Unknown'}</span></p>
                    <div className="flex justify-between mt-2 text-gray-400">
                        <span>Duration: {quiz.duration} mins</span>
                        <span>Total Marks: {quiz.total_marks}</span>
                    </div>
                </header>

                <div className="space-y-12">
                    {quiz.questions.map((q, idx) => (
                        <div key={q.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-xl font-semibold">Q{idx + 1}. {q.title}</h3>
                                <span className="bg-gray-700 px-3 py-1 rounded text-sm text-gray-300">
                                    {q.weightage} Marks
                                </span>
                            </div>

                            {q.image_url && (
                                <div className="mb-6">
                                    <img
                                        src={q.image_url}
                                        alt="Question Attachment"
                                        className="max-w-full h-auto rounded-lg border border-gray-600 shadow-md"
                                        style={{ maxHeight: '400px' }}
                                    />
                                </div>
                            )}

                            {q.type === "mcq" && (
                                <div className="space-y-3">
                                    {q.mcq_options.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className={`flex items-center p-4 rounded-lg cursor-pointer border transition ${answers[q.id]?.selectedOption === opt.option_text
                                                ? "bg-blue-600/20 border-blue-500"
                                                : "bg-[#2a2a2a] border-gray-600 hover:border-gray-500"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${q.id}`}
                                                className="mr-3 w-5 h-5 text-blue-500"
                                                onChange={() => handleOptionSelect(q.id, opt.option_text)}
                                                checked={answers[q.id]?.selectedOption === opt.option_text}
                                            />
                                            <span className="text-gray-200">{opt.option_text}</span>
                                        </label>
                                    ))}
                                </div>
                            )}

                            {q.type === "code" && (
                                <div className="mt-4">
                                    <p className="text-sm text-gray-400 mb-2">Write your code in {q.language} (Monaco Mode):</p>
                                    <div className="border border-gray-600 rounded overflow-hidden">
                                        <CodeEditor
                                            language={q.language || "javascript"}
                                            code={answers[q.id]?.submittedCode || ""}
                                            setCode={(val) => handleCodeChange(q.id, val)}
                                            template={(() => {
                                                // Helper to format input params e.g. "a b" -> "a, b"
                                                const formatParams = (fmt) => {
                                                    if (!fmt) return "";
                                                    // If contains commas, assume it's already correct
                                                    if (fmt.includes(",")) return fmt;
                                                    // Split by whitespace and join with comma
                                                    return fmt.trim().split(/\s+/).join(", ");
                                                };
                                                const params = formatParams(q.input_format);
                                                const funcName = q.function_name || "solution";

                                                if (q.language === "python") {
                                                    return `def ${funcName}(${params}):\n    # Write your code here\n    pass`;
                                                } else if (q.language === "cpp") {
                                                    return `auto ${funcName}(${params}) {\n    // Write your code here\n}`;
                                                } else {
                                                    return `function ${funcName}(${params}) {\n    // Write your code here\n}`;
                                                }
                                            })()}
                                            width="100%"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="fixed bottom-0 left-0 right-0 bg-gray-800 p-4 border-t border-gray-700 flex justify-center shadow-2xl">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-12 py-3 rounded-full font-bold text-lg shadow-lg transform transition active:scale-95 ${submitting
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            }`}
                    >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttemptQuiz;
