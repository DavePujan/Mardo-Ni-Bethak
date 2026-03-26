import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import api from "../../utils/api";

const MISTAKE_KEY = "practice-mistakes-v1";
const MASTERED_KEY = "practice-mastered-v1";

const updatePracticeMistakes = (mistakes) => {
  let existing = { subjects: {}, topics: {}, quizzes: {}, updatedAt: null };
  try {
    const raw = localStorage.getItem(MISTAKE_KEY);
    if (raw) existing = { ...existing, ...JSON.parse(raw) };
  } catch {
    // ignore malformed local cache and continue with defaults
  }

  mistakes.forEach((m) => {
    if (m.subject) existing.subjects[m.subject] = Number(existing.subjects[m.subject] || 0) + 1;
    if (m.topic) existing.topics[m.topic] = Number(existing.topics[m.topic] || 0) + 1;
    if (m.quizId) existing.quizzes[m.quizId] = Number(existing.quizzes[m.quizId] || 0) + 1;
  });

  existing.updatedAt = new Date().toISOString();
  localStorage.setItem(MISTAKE_KEY, JSON.stringify(existing));
};

const markQuizMastered = (quizId) => {
  if (!quizId) return;
  let mastered = {};
  try {
    const raw = localStorage.getItem(MASTERED_KEY);
    if (raw) mastered = JSON.parse(raw) || {};
  } catch {
    mastered = {};
  }

  mastered[quizId] = {
    masteredAt: new Date().toISOString()
  };
  localStorage.setItem(MASTERED_KEY, JSON.stringify(mastered));
};

const PracticeQuiz = () => {
  const { id } = useParams();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [runResults, setRunResults] = useState({});
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/api/student/practice/quiz/${id}`);
        setPayload(res.data);
      } catch (err) {
        setError(err?.response?.data?.error || "Failed to load practice quiz");
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  const questions = payload?.questions || [];
  const quiz = payload?.quiz;
  const currentQ = questions[currentIndex];

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const setMcqAnswer = (questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        optionId
      }
    }));
  };

  const setCodeAnswer = (questionId, code) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || {}),
        code
      }
    }));
  };

  const handleRunCode = async () => {
    if (!currentQ || currentQ.type !== "code") return;
    const code = answers[currentQ.id]?.code || "";

    if (!code.trim()) {
      setRunResults((prev) => ({
        ...prev,
        [currentQ.id]: {
          status: { description: "No Code" },
          stdout: "",
          stderr: "Write some code before running."
        }
      }));
      return;
    }

    try {
      setRunLoading(true);
      const res = await api.post(`/api/student/quiz/${quiz?.id}/run`, {
        questionId: currentQ.id,
        code,
        language: currentQ.language || "javascript"
      });

      setRunResults((prev) => ({
        ...prev,
        [currentQ.id]: res.data
      }));
    } catch (err) {
      setRunResults((prev) => ({
        ...prev,
        [currentQ.id]: {
          status: { description: "Run Failed" },
          stdout: "",
          stderr: err?.response?.data?.error || "Unable to run code right now."
        }
      }));
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmitPractice = async () => {
    const review = [];
    const mistakes = [];

    for (const q of questions) {
      const response = answers[q.id] || {};
      const options = Array.isArray(q.options) ? q.options : [];

      if (q.type === "mcq" || (q.type !== "code" && options.length > 0)) {
        const selected = options.find((o) => o.id === response.optionId);
        const correct = options.find((o) => o.is_correct);
        const isCorrect = Boolean(selected && correct && selected.id === correct.id);

        review.push({
          questionId: q.id,
          title: q.title,
          type: "mcq",
          subject: quiz?.subject || "General",
          topic: q.topic || "General",
          isCorrect,
          selectedText: selected?.option_text || "Not answered",
          correctText: correct?.option_text || "N/A"
        });

        if (!isCorrect) {
          mistakes.push({
            quizId: quiz?.id,
            subject: quiz?.subject || "General",
            topic: q.topic || "General"
          });
        }
      } else {
        const submittedCode = response.code || "";
        let codeFeedback = {
          logicScore: 0,
          isLikelyCorrect: false,
          feedback: "No code submitted.",
          suggestions: ""
        };

        if (submittedCode.trim()) {
          try {
            const feedbackRes = await api.post("/api/student/practice/code-feedback", {
              questionText: q.title,
              code: submittedCode,
              language: q.language,
              input_format: q.input_format,
              output_format: q.output_format,
              max_marks: q.weightage || 1
            });
            codeFeedback = feedbackRes.data;
          } catch {
            codeFeedback = {
              logicScore: 0,
              isLikelyCorrect: false,
              feedback: "Unable to generate AI feedback right now.",
              suggestions: "Try again with a complete solution."
            };
          }
        }

        review.push({
          questionId: q.id,
          title: q.title,
          type: "code",
          subject: quiz?.subject || "General",
          topic: q.topic || "General",
          isCorrect: Boolean(codeFeedback.isLikelyCorrect),
          submittedCode,
          codeFeedback
        });

        if (!codeFeedback.isLikelyCorrect) {
          mistakes.push({
            quizId: quiz?.id,
            subject: quiz?.subject || "General",
            topic: q.topic || "General"
          });
        }
      }
    }

    const total = review.length;
    const correct = review.filter((r) => r.isCorrect).length;
    updatePracticeMistakes(mistakes);

    if (total > 0 && correct === total) {
      markQuizMastered(quiz?.id);
    }

    setResult({
      total,
      correct,
      accuracy: total > 0 ? ((correct * 100) / total).toFixed(1) : "0.0",
      review,
      mistakes
    });
    setSubmitted(true);
  };

  if (loading) return <div className="p-6 text-white">Loading practice quiz...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!payload) return <div className="p-6 text-gray-300">No practice quiz data.</div>;

  if (submitted && result) {
    return (
      <div className="p-6 text-white space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Practice Summary</h1>
          <Link to="/student/practice" className="text-indigo-300 hover:text-indigo-200 text-sm">Back to Practice Recommendations</Link>
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <p className="text-lg font-semibold">{quiz?.title}</p>
          <p className="text-sm text-gray-400 mt-1">Accuracy: <span className="text-white font-semibold">{result.accuracy}%</span> ({result.correct}/{result.total})</p>
          <p className="text-xs text-gray-500 mt-2">Practice mode only: this attempt is not stored in official records.</p>
        </div>

        <div className="space-y-4">
          {result.review.map((r, idx) => (
            <div key={r.questionId} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium">Q{idx + 1}. {r.title}</p>
                {r.isCorrect ? (
                  <span className="text-emerald-300 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30 inline-flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Correct</span>
                ) : (
                  <span className="text-red-300 text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/30 inline-flex items-center gap-1"><XCircle className="h-3.5 w-3.5" /> Incorrect</span>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-1">Topic: {r.topic}</p>

              {r.type === "mcq" ? (
                <div className="mt-3 text-sm space-y-1">
                  <p>Your answer: <span className="text-indigo-300">{r.selectedText}</span></p>
                  <p>Correct answer: <span className="text-emerald-300">{r.correctText}</span></p>
                </div>
              ) : (
                <div className="mt-3 text-sm space-y-2">
                  <p className="text-gray-300">AI Feedback: {r.codeFeedback?.feedback}</p>
                  {r.codeFeedback?.suggestions ? <p className="text-gray-400">Suggestion: {r.codeFeedback.suggestions}</p> : null}
                  <p className="text-indigo-300">Logic Score: {(Number(r.codeFeedback?.logicScore || 0) * 100).toFixed(1)}%</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-white space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Practice: {quiz?.title}</h1>
          <p className="text-sm text-gray-400 mt-1">Untimed mode. Results are not saved to history.</p>
        </div>
        <Link to="/student/practice" className="inline-flex items-center text-sm text-indigo-300 hover:text-indigo-200">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Link>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-center justify-between text-sm">
        <span>Answered: {answeredCount}/{questions.length}</span>
        <span className="text-gray-400">Subject: {quiz?.subject || "General"}</span>
      </div>

      {currentQ && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500">Question {currentIndex + 1} of {questions.length}</p>
            <p className="text-lg mt-1">{currentQ.title}</p>
            <p className="text-xs text-gray-400 mt-1">Topic: {currentQ.topic || "General"}</p>
          </div>

          {currentQ.type === "code" ? (
            <div className="space-y-3">
              <textarea
                value={answers[currentQ.id]?.code || ""}
                onChange={(e) => setCodeAnswer(currentQ.id, e.target.value)}
                rows={12}
                placeholder="Write your solution here..."
                className="w-full rounded-lg bg-gray-950 border border-gray-800 p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex justify-end">
                <button
                  onClick={handleRunCode}
                  disabled={runLoading}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                >
                  {runLoading ? "Running..." : "Run Code"}
                </button>
              </div>

              {runResults[currentQ.id] && (
                <div className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm space-y-2">
                  <p className="text-gray-300">
                    Status: <span className="text-indigo-300">{runResults[currentQ.id]?.status?.description || "Unknown"}</span>
                  </p>

                  {runResults[currentQ.id]?.stdout ? (
                    <p className="text-emerald-300 whitespace-pre-wrap">Output: {runResults[currentQ.id].stdout}</p>
                  ) : null}

                  {runResults[currentQ.id]?.stderr ? (
                    <p className="text-red-300 whitespace-pre-wrap">Error: {runResults[currentQ.id].stderr}</p>
                  ) : null}

                  {runResults[currentQ.id]?.compile_output ? (
                    <p className="text-red-300 whitespace-pre-wrap">Compile: {runResults[currentQ.id].compile_output}</p>
                  ) : null}

                  {runResults[currentQ.id]?.input !== undefined ? (
                    <p className="text-gray-400 whitespace-pre-wrap">Input: {runResults[currentQ.id].input}</p>
                  ) : null}

                  {runResults[currentQ.id]?.expected !== undefined ? (
                    <p className="text-gray-400 whitespace-pre-wrap">Expected: {runResults[currentQ.id].expected}</p>
                  ) : null}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {(currentQ.options || []).map((opt, idx) => {
                const selected = answers[currentQ.id]?.optionId === opt.id;
                return (
                  <button
                    key={opt.id || idx}
                    onClick={() => setMcqAnswer(currentQ.id, opt.id)}
                    className={`w-full text-left rounded-lg border p-3 transition-colors ${selected ? "border-indigo-500 bg-indigo-500/10" : "border-gray-800 bg-gray-950 hover:bg-gray-900"}`}
                  >
                    <span className="text-xs text-gray-400 mr-2">{String.fromCharCode(65 + idx)}.</span>
                    {opt.option_text}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded bg-gray-800 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {currentQ.type === "code" ? (
                <button
                  onClick={handleRunCode}
                  disabled={runLoading}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold disabled:opacity-60"
                >
                  {runLoading ? "Running..." : "Run Code"}
                </button>
              ) : null}

              <button
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                disabled={currentIndex === questions.length - 1}
                className="px-4 py-2 rounded bg-gray-800 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleSubmitPractice}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 py-3 font-semibold"
      >
        Finish Practice (No Save)
      </button>
    </div>
  );
};

export default PracticeQuiz;
