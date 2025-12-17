import { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const ActiveQuizzes = () => {
    const { token } = useContext(AuthContext);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                // We'll add this method to api.js next
                // const res = await api.get("/student/quizzes"); 
                // For now inline fetch matching our api util structure or use api if ready
                const response = await fetch("http://localhost:5000/api/student/quizzes", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) {
                    setQuizzes(data);
                } else {
                    console.error("Failed to fetch quizzes", data);
                }
            } catch (err) {
                console.error("Error fetching quizzes:", err);
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchQuizzes();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Active Quizzes
            </h1>

            {loading ? (
                <div className="text-center">Loading quizzes...</div>
            ) : quizzes.length === 0 ? (
                <div className="text-center text-gray-400">No active quizzes found.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition shadow-lg">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-2xl font-bold text-white">{quiz.title}</h2>
                                <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs uppercase tracking-wider">
                                    {quiz.subject}
                                </span>
                            </div>

                            <p className="text-gray-400 mb-6 line-clamp-2 h-12">
                                {quiz.description || "No description provided."}
                            </p>

                            <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-300">{quiz.duration} mins</span>
                                    <span>Duration</span>
                                </div>
                                <div className="flex flex-col text-right">
                                    <span className="font-semibold text-gray-300">{quiz.total_marks}</span>
                                    <span>Total Marks</span>
                                </div>
                            </div>

                            {quiz.status === "in_progress" || quiz.status === "submitted" || quiz.status === "evaluated" ? (
                                <button disabled className="w-full bg-gray-700 text-gray-400 py-3 rounded-lg font-medium cursor-not-allowed">
                                    Already Attempted
                                </button>
                            ) : (
                                <Link
                                    to={`/student/quiz/${quiz.id}`}
                                    className="block w-full text-center bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-medium transition active:scale-95"
                                >
                                    Start Quiz
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActiveQuizzes;
