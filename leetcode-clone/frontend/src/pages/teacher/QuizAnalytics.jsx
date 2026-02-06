import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";
import api from "../../utils/api";

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

  return (
    <div className="p-6 space-y-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Quiz Analytics</h1>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Attempts" value={data.overview.total_attempts} />
        <StatCard title="Avg Score" value={data.overview.avg_percentage !== undefined && data.overview.avg_percentage !== null ? data.overview.avg_percentage + "%" : "-"} />
        <StatCard title="Max Score" value={data.overview.max_percentage !== undefined && data.overview.max_percentage !== null ? data.overview.max_percentage + "%" : "-"} />
        <StatCard title="Min Score" value={data.overview.min_percentage !== undefined && data.overview.min_percentage !== null ? data.overview.min_percentage + "%" : "-"} />
      </div>

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

const Card = ({ title, children }) => (
  <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 backdrop-blur-sm">
    <h2 className="mb-6 text-lg font-semibold text-gray-200">{title}</h2>
    {children}
  </div>
);

export default QuizAnalytics;
