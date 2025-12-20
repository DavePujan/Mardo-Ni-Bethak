import axios from "axios";

// Create an axios instance to handle interceptors better
const api = axios.create({
    baseURL: "http://localhost:5000",
    withCredentials: true // For sending cookies
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor to handle 401 (Refresh Token)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await axios.post("http://localhost:5000/auth/refresh", {}, { withCredentials: true });
                const { accessToken } = res.data;
                localStorage.setItem("token", accessToken);
                // Force update context if possible (complex without redux/signals, user page reload might be needed to reflect in context, but for API call it works)
                // Ideally we update AuthContext too. For now let's just make the API call work.

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (err) {
                // Refresh failed, logout?
                console.error("Refresh failed", err);
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const submitCode = (data) => api.post("/api/submit", data);
export const createProblem = (data) => api.post("/api/teacher/problem", data);
export const getUsers = () => api.get("/api/admin/users");
export const promoteUser = (email, role) => api.patch("/api/admin/promote", { email, role });

// Teacher Quiz API
export const getDashboardStats = () => api.get("/api/teacher/dashboard");
export const getEvaluations = () => api.get("/api/teacher/evaluations");
export const getQuizzes = () => api.get("/api/teacher/quiz");
export const createQuiz = (data) => api.post("/api/teacher/quiz", data);

export const getAdminStats = () => api.get("/api/admin/dashboard");

export const getQuestionBank = () => api.get("/api/teacher/question-bank");
export const saveQuizQuestions = (questions) => api.post("/api/teacher/quiz/questions", { questions });
export const getSubmissions = () => api.get("/api/teacher/submissions");

export const getAuditLogs = () => api.get("/api/admin/logs");
export const updateSettings = (settings) => api.post("/api/admin/settings", settings);

export const createFullQuiz = (data) => api.post("/api/teacher/quiz/full", data);

export const deleteUser = (email) => api.delete("/api/admin/user", { data: { email } });

export default api;
