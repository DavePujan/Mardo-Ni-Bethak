import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Problem from "./pages/Problem";
import Login from "./auth/Login";
import ProtectedRoute from "./auth/ProtectedRoute";
import OAuthSuccess from "./auth/OAuthSuccess";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import "./styles/common.css";

import RequestAccess from "./auth/RequestAccess";

// Student Page
import Leaderboard from "./pages/student/Leaderboard";
import ActiveQuizzes from "./pages/student/ActiveQuizzes";
import AttemptQuiz from "./pages/student/AttemptQuiz";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateQuiz from "./pages/teacher/CreateQuiz";
import Evaluations from "./pages/teacher/Evaluations";
import QuizBuilder from "./pages/teacher/QuizBuilder";
import EvaluationViewer from "./pages/teacher/EvaluationViewer";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import AuditLogs from "./pages/admin/AuditLogs";
import AdminSettings from "./pages/admin/AdminSettings";


function NavBar() {
  const { token, logout, role } = useContext(AuthContext);
  return (
    <nav style={{ padding: "10px", borderBottom: "1px solid #ccc", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <Link to="/" style={{ marginRight: "15px", fontWeight: "bold" }}>QuizPortal</Link>

        {role === "student" && (
          <>
            <Link to="/" style={{ marginRight: "10px" }}>Active Quizzes</Link>
            <Link to="/leaderboard" style={{ marginRight: "10px" }}>Leaderboard</Link>
          </>
        )}

        {role === "teacher" && (
          <>
            <Link to="/teacher" style={{ marginRight: "10px" }}>Dashboard</Link>
            <Link to="/teacher/create-quiz" style={{ marginRight: "10px" }}>New Quiz</Link>
            <Link to="/teacher/evaluations" style={{ marginRight: "10px" }}>Evals</Link>
          </>
        )}

        {role === "admin" && (
          <>
            <Link to="/admin" style={{ marginRight: "10px" }}>Dashboard</Link>
            <Link to="/admin/users" style={{ marginRight: "10px" }}>Users</Link>
          </>
        )}
      </div>
      <div>
        {token ? (
          <button onClick={logout} className="btn-secondary" style={{ padding: "5px 10px" }}>Logout ({role})</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/request-access" element={<RequestAccess />} />
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          {/* Student / Public */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ActiveQuizzes />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/quiz/:id"
            element={
              <ProtectedRoute>
                <AttemptQuiz />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes */}
          <Route path="/teacher" element={<ProtectedRoute role="teacher"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/create-quiz" element={<ProtectedRoute role="teacher"><CreateQuiz /></ProtectedRoute>} />
          <Route path="/teacher/quiz-builder" element={<ProtectedRoute role="teacher"><QuizBuilder /></ProtectedRoute>} />
          <Route path="/teacher/evaluations" element={<ProtectedRoute role="teacher"><Evaluations /></ProtectedRoute>} />
          <Route path="/teacher/evaluation/:id" element={<ProtectedRoute role="teacher"><EvaluationViewer /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute role="admin"><UserManagement /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute role="admin"><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

