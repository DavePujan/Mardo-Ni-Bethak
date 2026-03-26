# Quiz Portal

This project is a comprehensive Quiz Portal and LeetCode-style coding platform, featuring a React frontend, Node.js backend, and Supabase integration.

## Key Features

- **Role-Based Access**: Specialized dashboards for Students, Teachers, and Admins.
- **Maintenance Mode**: Admin-toggleable maintenance mode that redirects all non-admin users to a maintenance page.
- **Access Requests**: New users can request access (Student/Teacher role) which admins must approve.
- **Admin Settings**: Admins can toggle registration permissions and maintenance mode dynamically.
- **Secure Auth**: JWT-based authentication with forced logout redirection and protected routes.
- **Code Execution**: Integrated Judge0 for executing code submissions in multiple languages.
- **Student Analytics**: Detailed performance analysis with topic proficiency charts and AI insights.
- **Robust Testing**: Comprehensive backend suite powered by Jest and Supertest.
- **API Documentation**: Auto-generated Swagger UI availability.
- **Async Job Processing**: BullMQ-powered submission queue with background workers, retry logic, and job status polling.

## Full Directory Structure

```text
leetcode-clone/
├── .github
│   └── workflows
├── backend
│   ├── .env
│   ├── config
│   │   └── redis.js
│   ├── controllers
│   │   └── analyticsController.js
│   ├── db.js
│   ├── docker-compose.dev.yml
│   ├── load-test.js
│   ├── metrics.js
│   ├── middleware
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   ├── model
│   │   ├── model.json
│   │   ├── vocab.json
│   │   └── weights.bin
│   ├── models
│   │   ├── AccessRequest.js
│   │   ├── Evaluation.js
│   │   ├── Leaderboard.js
│   │   ├── Question.js
│   │   ├── Quiz.js
│   │   └── User.js
│   ├── package-lock.json
│   ├── package.json
│   ├── nodemon.json
│   ├── prometheus.yml
│   ├── queues
│   │   └── submission.queue.js
│   ├── routes
│   │   ├── admin.js
│   │   ├── analytics.js
│   │   ├── auth.js
│   │   ├── job.js
│   │   ├── leaderboard.js
│   │   ├── student.js
│   │   ├── submit.js
│   │   └── teacher.js
│   ├── scripts
│   │   └── devBootstrap.js
│   ├── server.js
│   ├── swagger-output.json
│   ├── swagger.js
│   ├── test-queue.js
│   ├── tests
│   │   ├── auth.test.js
│   │   ├── quiz.test.js
│   │   └── submit.test.js
│   ├── utils
│   │   ├── ai.js
│   │   ├── boilerplates.js
│   │   ├── dynamicTopicGenerator.js
│   │   ├── judge0.js
│   │   ├── passport.js
│   │   └── topicClassifier.js
│   └── workers
│       └── submission.worker.js
├── frontend
│   ├── .env
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── public
│   │   └── vite.svg
│   ├── README.md
│   ├── src
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── auth
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── OAuthSuccess.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RequestAccess.jsx
│   │   ├── components
│   │   │   ├── CodeEditor.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context
│   │   │   └── AuthContext.jsx
│   │   ├── index.css
│   │   ├── layouts
│   │   │   └── DashboardLayout.jsx
│   │   ├── lib
│   │   │   └── supabase.js
│   │   ├── main.jsx
│   │   ├── pages
│   │   │   ├── admin
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminRequests.jsx
│   │   │   │   ├── AdminSettings.jsx
│   │   │   │   ├── AuditLogs.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── CreateProblem.jsx
│   │   │   ├── Maintenance.jsx
│   │   │   ├── Problem.jsx
│   │   │   ├── student
│   │   │   │   ├── ActiveQuizzes.jsx
│   │   │   │   ├── AttemptQuiz.jsx
│   │   │   │   ├── History.jsx
│   │   │   │   ├── Leaderboard.jsx
│   │   │   │   ├── QuestionReview.jsx
│   │   │   │   ├── StudentAnalysis.jsx
│   │   │   │   └── UpcomingQuizzes.jsx
│   │   │   ├── teacher
│   │   │   │   ├── CreateQuestion.jsx
│   │   │   │   ├── CreateQuiz.jsx
│   │   │   │   ├── Evaluations.jsx
│   │   │   │   ├── EvaluationViewer.jsx
│   │   │   │   ├── QuestionBank.jsx
│   │   │   │   ├── QuizAnalytics.jsx
│   │   │   │   ├── QuizBuilder.jsx
│   │   │   │   └── TeacherDashboard.jsx
│   │   │   └── TeacherDashboard.jsx
│   │   ├── styles
│   │   │   └── common.css
│   │   └── utils
│   │       ├── api.js
│   │       └── templates.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── quiz-evaluator
│   ├── .env
│   ├── backend
│   │   ├── csv.js
│   │   ├── index.js
│   │   ├── judge0.js
│   │   ├── llm.js
│   │   ├── schema.sql
│   │   ├── scorer.js
│   │   ├── supabase.js
│   │   └── test_judge.js
│   ├── commands.txt
│   └── docker
│       └── judge0
│           ├── docker-compose.yml
│           └── judge0.conf
├── tests-scripts
│   ├── backend-test.js
│   └── frontend-test.js
├── supabase
│   └── functions
│       ├── deno.json
│       └── evaluate-attempt
│           └── index.ts
└── zzzChanges.md
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

4. **Start the Server (auto bootstraps Redis + Prometheus + Grafana):**

   ```bash
   nodemon server.js
   ```

   > On startup, `backend/nodemon.json` runs `scripts/devBootstrap.js`, which attempts to bring up:
   > - Redis, Prometheus, and Grafana via `backend/docker-compose.dev.yml`
   > - Existing `judge0-official-*` containers (if present locally)
   > Backend still starts even if Docker is unavailable.
   > The server runs on port 5000 (or the port specified in `.env`).

5. **API Documentation:**
   The backend includes auto-generated API documentation using Swagger UI.
   - **Access Docs**: `http://localhost:5000/api-docs`
   - **Regenerate Docs**: Run `npm run swagger-gen` in the `backend` directory after modifying routes.

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

### 4. Observability & SRE Stack (Grafana, Prometheus, Redis)

The backend includes enterprise telemetry, hybrid rate limiting, and ML classifier support.
With the new bootstrap flow, infra starts automatically when you run `nodemon server.js` from `backend`.
You can still manage containers manually when needed:

1. **Manual start all observability services:**

   ```bash
   cd leetcode-clone/backend
   npm run infra:up
   ```

2. **Manual stop all observability services:**

   ```bash
   cd leetcode-clone/backend
   npm run infra:down
   ```

3. **Service URLs:**

   | Service    | URL                             | Credentials       |
   | ---------- | ------------------------------- | ----------------- |
   | Redis      | `localhost:6379`                | —                 |
   | Prometheus | `http://localhost:9090`         | —                 |
   | Grafana    | `http://localhost:3000`         | `admin` / `admin` |
   | Metrics    | `http://localhost:5000/metrics` | —                 |

### 5. Zero-Friction Local Dev (What to run daily)

From two terminals:

```bash
# Terminal 1
cd leetcode-clone/backend
nodemon server.js

# Terminal 2
cd leetcode-clone/frontend
npm run dev
```

This starts the app plus required local infra automatically (when Docker is available), starts existing `judge0-official-*` containers if present, and validates ML model artifacts at backend boot.

### 6. Troubleshooting Startup

- If backend says `Port 5000 is already in use`, stop the previous backend process and run again.
- If Docker is not running, backend will still boot; Redis/Grafana/Prometheus features may be degraded.
- If model files are missing under `backend/model/`, topic classification will fall back safely instead of crashing startup.

### 7. Testing

The backend implements a comprehensive test coverage suite powered by Jest and Supertest, complete with `jest.mock` profiles to simulate Supabase and Judge0 without affecting live database integrity or API limits. You can also run load tests using K6:

```bash
# Run K6 chaos engineering bombardments concurrently
docker run --rm -v "${PWD}/leetcode-clone/backend/load-test.js:/script.js" -e API_HOST=host.docker.internal grafana/k6 run /script.js
```

1. **Run Unit and Integration Tests:**
   ```bash
   cd leetcode-clone/backend
   npm test
   ```

2. **Use centralized test runners (`tests-scripts`)**
   ```bash
   # Backend runner
   cd leetcode-clone/backend
   npm run test:runner

   # Frontend runner (build smoke test)
   cd ../frontend
   npm run test:runner
   ```

   These runners are located in:
   - `leetcode-clone/tests-scripts/backend-test.js`
   - `leetcode-clone/tests-scripts/frontend-test.js`

## Commands to use now

### Backend tests

```bash
cd leetcode-clone/backend
npm run test:runner
```

### Frontend tests

```bash
cd leetcode-clone/frontend
npm run test:runner
```
