# Quiz Portal

This project is a comprehensive Quiz Portal and LeetCode-style coding platform, featuring a React frontend, Node.js backend, and Supabase integration.

## Full Directory Structure

```text
leetcode-clone/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Quiz.js
│   │   ├── QuizAttempt.js
│   │   ├── User.js
│   │   └── ...
│   ├── routes/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── leaderboard.js
│   │   ├── student.js
│   │   ├── submit.js
│   │   └── teacher.js
│   ├── utils/
│   │   ├── boilerplates.js
│   │   ├── judge0.js
│   │   └── passport.js
│   ├── server.js
│   ├── test_api.js
│   ├── verify_quiz.js
│   ├── verify_users.js
│   ├── package.json
│   └── ...
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   │   └── react.svg
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   ├── OAuthSuccess.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── components/
│   │   │   └── CodeEditor.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminSettings.jsx
│   │   │   │   ├── AuditLogs.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── student/
│   │   │   │   ├── ActiveQuizzes.jsx
│   │   │   │   ├── AttemptQuiz.jsx
│   │   │   │   └── Leaderboard.jsx
│   │   │   ├── teacher/
│   │   │   │   ├── CreateQuestion.jsx
│   │   │   │   ├── CreateQuiz.jsx
│   │   │   │   ├── Evaluations.jsx
│   │   │   │   ├── EvaluationViewer.jsx
│   │   │   │   ├── QuestionBank.jsx
│   │   │   │   ├── QuizBuilder.jsx
│   │   │   │   └── TeacherDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateProblem.jsx
│   │   │   ├── Problem.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── styles/
│   │   │   └── common.css
│   │   ├── utils/
│   │   │   ├── api.js
│   │   │   └── templates.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── supabase/
    └── functions/
        ├── evaluate-attempt/
        │   └── index.ts
        └── deno.json
```

## How to Run the Quiz Portal

This guide helps collaborative developers fork, setup, and run the application locally.

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **Git**
- **Supabase Account** (for Database & Auth)
- **Google Cloud Console Project** (for Google OAuth)
- **GitHub OAuth App** (for GitHub OAuth)
- **Judge0 API Key** (RapidAPI) for code execution features

### 1. Fork and Clone

1. **Fork the repository** on GitHub: [https://github.com/DavePujan/Mardo-Ni-Bethak](https://github.com/DavePujan/Mardo-Ni-Bethak)
2. **Clone your fork** locally:
   ```bash
   # Replace <YOUR-USERNAME> with your GitHub username
   git clone https://github.com/<YOUR-USERNAME>/Mardo-Ni-Bethak.git
   
   # Go into the project directory
   cd Mardo-Ni-Bethak
   ```

3. **Add the original repository as upstream** (to keep your fork synced):
   ```bash
   git remote add upstream https://github.com/DavePujan/Mardo-Ni-Bethak.git
   ```

### 2. Backend Setup

The backend is an Express.js application located in `leetcode-clone/backend`.

1. **Navigate to the backend directory:**
   ```bash
   cd leetcode-clone/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `backend` directory with the following keys:

   ```env
   # Database Configuration (Supabase)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # Server Configuration
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key
   CLIENT_URL=http://localhost:5173

   # OAuth Configuration
   GOOGLE_ID=your_google_client_id
   GOOGLE_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

   GITHUB_ID=your_github_client_id
   GITHUB_SECRET=your_github_client_secret
   GITHUB_CALLBACK_URL=http://localhost:5000/auth/github/callback

   # Judge0 API (For Code Execution)
   JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
   JUDGE0_API_KEY=your_judge0_api_key
   ```

4. **Start the Server:**
   ```bash
   node server.js
   ```
   > The server will start on port 5000 (or the port specified in .env).

### 3. Frontend Setup

The frontend is a React + Vite application located in `leetcode-clone/frontend`.

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   # Or from root: cd leetcode-clone/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend` directory:

   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

   > **Note:** The frontend currently expects the backend API at `http://localhost:5000`. If you changed the backend port, you may need to update `frontend/src/utils/api.js`.

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   > The application will typically run at `http://localhost:5173`.

### 4. Contribution Workflow

1. Create a new branch: `git checkout -b feature/your-feature-name`
2. Make changes and commit: `git commit -m "Description of changes"`
3. Push to your fork: `git push origin feature/your-feature-name`
4. Open a Pull Request.
