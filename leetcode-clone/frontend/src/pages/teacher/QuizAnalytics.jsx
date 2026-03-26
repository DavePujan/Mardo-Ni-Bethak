import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import api, { exportTeacherQuizAnalytics } from "../../utils/api";

const QuizAnalytics = () => {
    const { id } = useParams(); // Start with local var, but wait, route likely uses :id or :quizId. 
    // Plan said :quizId in backend, but frontend route usually uses :id for consistency. 
    // Let's assume passed param is id. 
    // Wait, the user code used `({ quizId })` props in the request example, but as a page it receives params from router.
    
    // Changing to use useParams() to get ID from URL.
    const quizId = id; 

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState("all");
  const [integrityFilter, setIntegrityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("marks-desc");

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const response = await exportTeacherQuizAnalytics(quizId);
      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const disposition = response.headers?.["content-disposition"] || "";
      const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
      link.download = match?.[1] ? decodeURIComponent(match[1]) : `quiz-${quizId}-report.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    // Add timestamp to prevent caching old schema
    api.get(`/api/analytics/teacher/quiz/${quizId}?t=${Date.now()}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Analytics Fetch Error:", err);
        setError(err.response?.data?.error || err.message || "Failed to load analytics");
        setLoading(false);
      });
  }, [quizId]);

  if (loading) return <div className="p-6 text-white">Loading analytics...</div>;
  if (error) return <div className="p-6 text-red-400">{error}</div>;
  if (!data) return <div className="p-6 text-white">No data available</div>;

  const summary = data.summary || {};
  const rows = Array.isArray(data.studentReport) ? data.studentReport : [];

  const filteredRows = rows
    .filter((r) => performanceFilter === "all" ? true : r.performance === performanceFilter)
    .filter((r) => integrityFilter === "all" ? true : r.integrity_band === integrityFilter)
    .sort((a, b) => {
      if (sortBy === "marks-desc") return Number(b.percentage || 0) - Number(a.percentage || 0);
      if (sortBy === "marks-asc") return Number(a.percentage || 0) - Number(b.percentage || 0);
      if (sortBy === "integrity-desc") return Number(b.integrity_score || 0) - Number(a.integrity_score || 0);
      if (sortBy === "name-asc") return String(a.full_name || "").localeCompare(String(b.full_name || ""));
      return 0;
    });

  const performancePieData = [
    { name: "Good", value: Number(summary.performanceCounts?.good || 0), color: "#10b981" },
    { name: "Average", value: Number(summary.performanceCounts?.average || 0), color: "#f59e0b" },
    { name: "Needs Improvement", value: Number(summary.performanceCounts?.needsImprovement || 0), color: "#ef4444" }
  ];

  const integrityPieData = [
    { name: "Safe", value: Number(summary.integrityCounts?.safe || 0), color: "#10b981" },
    { name: "Suspicious", value: Number(summary.integrityCounts?.suspicious || 0), color: "#f59e0b" },
    { name: "High Risk", value: Number(summary.integrityCounts?.highRisk || 0), color: "#f97316" },
    { name: "Cheating Likely", value: Number(summary.integrityCounts?.cheatingLikely || 0), color: "#ef4444" }
  ];

  return (
    <div className="p-6 space-y-8 text-white">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold">Quiz Analytics</h1>
          <p className="text-sm text-gray-400 mt-1">
            Dept: <span className="text-gray-200">{data.quizInfo?.department || "-"}</span>
            {" | "}
            Sem: <span className="text-gray-200">{data.quizInfo?.semester || "-"}</span>
            {" | "}
            Subject: <span className="text-gray-200">{data.quizInfo?.subject || "General"}</span>
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${downloading ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"}`}
        >
          {downloading ? "Preparing..." : "Download Full Report (CSV)"}
        </button>
      </div>

      {data.live?.isLive && (
        <Card title="Live Activity">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MiniStat title="Students Active" value={data.live?.active || 0} />
            <MiniStat title="Submissions (Last 5 min)" value={data.live?.recent_submissions || 0} />
            <MiniStat title="Avg Time / Question" value={data.live?.avg_time || "-"} />
          </div>
        </Card>
      )}

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Attempts" value={data.overview.total_attempts} />
        <StatCard title="Avg Score" value={data.overview.avg_percentage !== undefined && data.overview.avg_percentage !== null ? data.overview.avg_percentage + "%" : "-"} />
        <StatCard title="Max Score" value={data.overview.max_percentage !== undefined && data.overview.max_percentage !== null ? data.overview.max_percentage + "%" : "-"} />
        <StatCard title="Min Score" value={data.overview.min_percentage !== undefined && data.overview.min_percentage !== null ? data.overview.min_percentage + "%" : "-"} />
      </div>

      <Card title="Quiz Summary">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <MiniStat title="Average" value={`${summary.averagePercentage ?? 0}%`} />
          <MiniStat title="Highest" value={`${summary.highestPercentage ?? 0}%`} />
          <MiniStat title="Lowest" value={`${summary.lowestPercentage ?? 0}%`} />
          <MiniStat title="Pass Rate" value={`${summary.passRate ?? 0}%`} />
          <MiniStat title="Total Students" value={summary.totalStudents ?? 0} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Top Performers">
          {(data.topStudents || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No submissions yet.</p>
          ) : (
            <div className="space-y-2">
              {(data.topStudents || []).slice(0, 5).map((s, i) => (
                <div key={`${s.name}-${i}`} className="flex justify-between py-2 border-b border-gray-700/60">
                  <span>{i + 1}. {s.name}{s.enrollment_no ? ` (${s.enrollment_no})` : ""}</span>
                  <span className="font-bold text-green-400">{s.score}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Critical Problem Areas">
          {(data.weakQuestions || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No weak areas detected yet.</p>
          ) : (
            <div className="space-y-2">
              {(data.weakQuestions || []).map((q, i) => (
                <div key={`${q.id || q.title}-${i}`} className="p-3 bg-red-500/5 border border-red-500/20 rounded">
                  <p className="text-red-400 font-semibold">{q.title}</p>
                  <p className="text-sm text-gray-400">Accuracy: {q.accuracy}%</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="AI Insights">
        <div className="space-y-3">
          {(data.aiInsights || []).map((insight, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-gray-300"
            >
              • {insight}
            </div>
          ))}
        </div>
      </Card>

      <Card title="Exam Integrity Report">
        {(data.integrityReport || []).length === 0 ? (
          <p className="text-gray-400 text-sm">No integrity records available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-2 px-4">Student</th>
                  <th className="py-2 px-4">Enrollment No.</th>
                  <th className="py-2 px-4">Integrity Score</th>
                  <th className="py-2 px-4">Risk</th>
                  <th className="py-2 px-4 text-right">Key Events</th>
                </tr>
              </thead>
              <tbody>
                {(data.integrityReport || []).map((row, idx) => {
                  const level = (row.risk_level || "safe").toLowerCase();
                  const displayName = row.student || row.student_name || row.email || (row.user_id ? `User ${String(row.user_id).slice(0, 8)}` : "Unknown");
                  const integrityScore = Number(row.final_score ?? row.score ?? 0);
                  const riskClass =
                    level === "cheating" ? "text-red-400 bg-red-500/10" :
                    level === "high-risk" ? "text-orange-400 bg-orange-500/10" :
                    level === "suspicious" ? "text-yellow-400 bg-yellow-500/10" :
                    "text-emerald-400 bg-emerald-500/10";

                  const eventSummary = [
                    `FS:${row.fullscreen_exits || 0}`,
                    `Tab:${row.tab_switches || 0}`,
                    `Blur:${row.window_blurs || 0}`,
                    `CP:${row.copy_events || row.copy_paste || 0}`,
                    `DT:${row.devtools_attempts || 0}`
                  ].join(" | ");

                  return (
                    <tr key={`${displayName}-${idx}`} className="border-b border-gray-800 hover:bg-gray-700/40">
                      <td className="py-3 px-4 font-medium text-gray-200">{displayName}</td>
                      <td className="py-3 px-4 text-gray-300">{row.enrollment_no || "-"}</td>
                      <td className="py-3 px-4 font-bold text-white">{integrityScore}/100</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${riskClass}`}>
                          {row.risk_level || "safe"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-gray-300">{eventSummary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Integrity Guide For Teachers">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm text-gray-300">
          <div className="space-y-3">
            <p className="text-gray-200 font-semibold">How to read Integrity Score (0-100)</p>
            <div className="p-3 rounded border border-emerald-500/30 bg-emerald-500/5">
              <span className="font-semibold text-emerald-300">0-19 Safe:</span> Normal exam behavior.
            </div>
            <div className="p-3 rounded border border-yellow-500/30 bg-yellow-500/5">
              <span className="font-semibold text-yellow-300">20-49 Suspicious:</span> Some unusual actions were detected.
            </div>
            <div className="p-3 rounded border border-orange-500/30 bg-orange-500/5">
              <span className="font-semibold text-orange-300">50-79 High Risk:</span> Multiple risky actions; needs manual review.
            </div>
            <div className="p-3 rounded border border-red-500/30 bg-red-500/5">
              <span className="font-semibold text-red-300">80-100 Cheating:</span> Severe or repeated suspicious behavior.
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-gray-200 font-semibold">Meaning of Key Events</p>
            <div className="p-3 rounded border border-gray-700 bg-gray-900/40">FS: Fullscreen exits during exam.</div>
            <div className="p-3 rounded border border-gray-700 bg-gray-900/40">Tab: Tab switched/minimized activity.</div>
            <div className="p-3 rounded border border-gray-700 bg-gray-900/40">Blur: Browser window lost focus.</div>
            <div className="p-3 rounded border border-gray-700 bg-gray-900/40">CP: Copy/Paste or context menu attempts.</div>
            <div className="p-3 rounded border border-gray-700 bg-gray-900/40">DT: Developer tools shortcut attempts.</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title="Performance Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={performancePieData} dataKey="value" nameKey="name" outerRadius={90}>
                {performancePieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Integrity Distribution">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={integrityPieData} dataKey="value" nameKey="name" outerRadius={90}>
                {integrityPieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Student Performance Report">
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" value={performanceFilter} onChange={(e) => setPerformanceFilter(e.target.value)}>
            <option value="all">All Performance</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Needs Improvement">Needs Improvement</option>
          </select>

          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" value={integrityFilter} onChange={(e) => setIntegrityFilter(e.target.value)}>
            <option value="all">All Integrity</option>
            <option value="Safe">Safe</option>
            <option value="Suspicious">Suspicious</option>
            <option value="High Risk">High Risk</option>
            <option value="Cheating Likely">Cheating Likely</option>
          </select>

          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="marks-desc">Sort: Highest Marks</option>
            <option value="marks-asc">Sort: Lowest Marks</option>
            <option value="integrity-desc">Sort: Highest Integrity Risk</option>
            <option value="name-asc">Sort: Name A-Z</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="py-2 px-4">Enrollment</th>
                <th className="py-2 px-4">Full Name</th>
                <th className="py-2 px-4">Marks / Out Of</th>
                <th className="py-2 px-4">%</th>
                <th className="py-2 px-4">Performance</th>
                <th className="py-2 px-4">Integrity (0-100)</th>
                <th className="py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-gray-500">No students match current filters.</td>
                </tr>
              ) : filteredRows.map((r, idx) => {
                const perfClass =
                  r.performance === "Good" ? "text-emerald-400 bg-emerald-500/10" :
                  r.performance === "Average" ? "text-yellow-400 bg-yellow-500/10" :
                  "text-red-400 bg-red-500/10";

                const integrityClass =
                  Number(r.integrity_score || 0) >= 80 ? "text-red-400 bg-red-500/10" :
                  Number(r.integrity_score || 0) >= 50 ? "text-orange-400 bg-orange-500/10" :
                  Number(r.integrity_score || 0) >= 20 ? "text-yellow-400 bg-yellow-500/10" :
                  "text-emerald-400 bg-emerald-500/10";

                return (
                  <tr key={`${r.attempt_id || r.full_name}-${idx}`} className="border-b border-gray-800 hover:bg-gray-700/40">
                    <td className="py-3 px-4 text-gray-300">{r.enrollment_no || "-"}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.full_name}</td>
                    <td className="py-3 px-4 text-gray-200">{Number(r.marks || 0)} / {Number(r.out_of || 0)}</td>
                    <td className="py-3 px-4 text-gray-200">{Number(r.percentage || 0).toFixed(2)}%</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${perfClass}`}>{r.performance}</span></td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded text-xs font-semibold ${integrityClass}`}>{Number(r.integrity_score || 0)} / 100</span></td>
                    <td className="py-3 px-4 text-gray-300 uppercase text-xs">{r.status || "submitted"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SCORE DISTRIBUTION */}
        <Card title="Score Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.scoreDistribution}>
              <XAxis dataKey="range" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                itemStyle={{ color: '#E5E7EB' }}
              />
              <Bar dataKey="students" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* TOPIC PERFORMANCE DETAILED */}
        <div className="col-span-1 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4 text-gray-200">Topic-wise Performance Analysis</h2>
            <div className="space-y-6">
                {data.topicPerformance.map((topic, index) => (
                    <TopicAnalysisCard key={index} topic={topic} index={index + 1} />
                ))}
            </div>
        </div>

      </div>

      {/* FINAL SUMMARY TABLE */}
      <Card title="Final Topic Performance Summary">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="py-2 px-4">Topic</th>
                <th className="py-2 px-4">Accuracy</th>
                <th className="py-2 px-4 text-right">Performance</th>
                </tr>
            </thead>
            <tbody>
                {data.topicPerformance.map((topic, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{topic.topic}</td>
                    <td className="py-3 px-4 font-bold text-gray-200">{topic.avg_score}%</td>
                    <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded text-xs font-semibold
                            ${topic.performance === "Very Weak" ? "text-red-400 bg-red-500/10" :
                              topic.performance === "Weak" ? "text-orange-400 bg-orange-500/10" :
                              topic.performance === "Moderate" ? "text-yellow-400 bg-yellow-500/10" :
                              topic.performance === "Good" ? "text-emerald-400 bg-emerald-500/10" :
                              "text-green-400 bg-green-500/10"
                            }`}>
                            {topic.performance}
                        </span>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </Card>

      {/* QUESTION DIFFICULTY HEATMAP */}
      <Card title="Question Difficulty">
        {/* ... existing table ... */}
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                <th className="py-2 px-4">Question</th>
                <th className="py-2 px-4">Type</th>
                <th className="py-2 px-4">Accuracy</th>
                <th className="py-2 px-4 text-right">Attempts</th>
                </tr>
            </thead>
            <tbody>
                {data.questionDifficulty.map(q => (
                <tr key={q.id} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{q.title}</td>
                    <td className="py-3 px-4 text-gray-400 uppercase text-xs">{q.type}</td>
                    <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        Number(q.accuracy) < 30 ? "bg-red-500/10 text-red-400" :
                        Number(q.accuracy) < 70 ? "bg-yellow-500/10 text-yellow-400" :
                        "bg-green-500/10 text-green-400"
                    }`}>
                        {q.accuracy}%
                    </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400">{q.attempts}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </Card>
    </div>
  );
};

// UI Components

const PerformanceBadge = ({ level }) => {
    const colors = {
        "Very Weak": "bg-red-500/10 text-red-400 border border-red-500/20",
        "Weak": "bg-orange-500/10 text-orange-400 border border-orange-500/20",
        "Moderate": "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
        "Good": "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        "Excellent": "bg-green-500/10 text-green-400 border border-green-500/20"
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[level] || "text-gray-400"}`}>
            {level}
        </span>
    );
};

const TopicAnalysisCard = ({ topic, index }) => {
    // Determine header color based on performance
    const headerColor = 
        topic.performance === "Very Weak" ? "text-red-400" : 
        topic.performance === "Weak" ? "text-orange-400" :
        topic.performance === "Moderate" ? "text-yellow-400" :
        "text-blue-400";

    return (
        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 hover:border-gray-600 transition-all">
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${headerColor}`}>
                <span className="bg-gray-700 text-white text-xs px-2 py-1 rounded">{index}</span> 
                {topic.topic}
            </h3>

            <div className="space-y-4 text-sm">
                
                {/* Questions List */}
                <div className="flex flex-col gap-2">
                    <span className="font-semibold text-gray-400 uppercase text-xs tracking-wider">Related Questions</span>
                    <ul className="pl-4 list-disc space-y-2 text-gray-300">
                        {(topic.questions || []).map((q, i) => (
                            <li key={i}>
                                <span className="text-gray-200">{q.title}</span> 
                                <span className="ml-2 text-xs font-mono text-gray-500 bg-gray-800 px-1 rounded">
                                    {q.accuracy}% Correct
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-900/40 p-4 rounded-lg">
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold text-gray-400 text-xs uppercase">Accuracy</span> 
                        <span className="font-mono text-xl text-white font-bold">{topic.avg_score}%</span>
                    </div>

                    <div className="flex flex-col gap-1 items-end">
                        <span className="font-semibold text-gray-400 text-xs uppercase">Performance</span>
                        <PerformanceBadge level={topic.performance} />
                    </div>
                </div>

                <div className="w-full bg-gray-700 h-2 rounded mt-2">
                  <div
                    className="h-2 rounded bg-indigo-500"
                    style={{ width: `${Math.max(0, Math.min(100, Number(topic.avg_score) || 0))}%` }}
                  />
                </div>

                <div className="mt-2 text-gray-300 bg-gray-800/50 p-3 rounded border-l-4 border-indigo-500">
                    <span className="font-bold text-gray-400 mr-2 uppercase text-xs">Insight:</span> 
                    {topic.insight}
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value }) => (
  <div className="p-4 rounded-xl bg-linear-to-r from-blue-900/40 to-indigo-900/40 border border-indigo-500/20">
    <p className="text-sm text-gray-400 mb-1">{title}</p>
    <p className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-400">
        {value !== null && value !== undefined ? value : "-"}
    </p>
  </div>
);

const MiniStat = ({ title, value }) => (
  <div className="p-4 rounded-lg bg-gray-900/60 border border-gray-700">
    <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold text-indigo-300 mt-1">{value}</p>
  </div>
);

const Card = ({ title, children }) => (
  <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
    <h2 className="mb-6 text-lg font-semibold text-gray-200">{title}</h2>
    {children}
  </div>
);

export default QuizAnalytics;
