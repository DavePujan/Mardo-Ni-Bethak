# Project Tech Stack & Libraries

## Backend Libraries

**@google/generative-ai**
Used for →

- Generating coding questions and hints using Gemini
- Providing AI-driven feedback on student answers

**@supabase/supabase-js**
Used for →

- Interacting with the Supabase database
- Managing user authentication and sessions

**express**
Used for →

- Running the main API server
- Handling all API routes and requests

**passport / passport-google-oauth20 / passport-github2**
Used for →

- Handling user authentication strategies
- Enabling "Login with Google" and "Login with GitHub"

**jsonwebtoken (JWT)**
Used for →

- Securely transmitting user identity between server and client
- Verifying logged-in users for protected routes

**bcryptjs**
Used for →

- Hashing passwords before saving to database
- Verifying passwords during login safely

**cors**
Used for →

- Allowing the frontend (different port) to talk to the backend
- Preventing browser security blocks on API calls

**cookie-parser**
Used for →

- Reading authentication cookies from incoming requests
- Managing session tokens in HTTP-only cookies

**@tensorflow/tfjs**
Used for →

- Running Javascript-based machine learning models
- Potential client/server-side lightweight AI tasks

**natural**
Used for →

- Processing natural language text (NLP)
- Analyzing text complexity or keywords in questions

**groq-sdk**
Used for →

- High-speed AI model inference
- Alternative fast AI responses for chat/analysis

**openai**
Used for →

- Integrating GPT models for advanced question generation
- Fallback or alternative AI logic

**axios**
Used for →

- Making HTTP requests to external APIs
- Fetching data from other services (like judge engines)

**dotenv**
Used for →

- Loading sensitive keys (API keys, DB URLs) from `.env` files
- Keeping secrets out of the codebase

**swagger-autogen / swagger-ui-express**
Used for →

- Automatically generating API documentation from endpoints
- Providing an interactive UI to test API routes live

**jest / supertest**
Used for →

- Providing a robust testing backbone for the backend API
- Executing isolated integration tests with mock instances of Supabase and external libraries

---

## Frontend Libraries

**react / react-dom**
Used for →

- Building the user interface components
- Managing application state and rendering

**@monaco-editor/react**
Used for →

- Embedding a VS Code-like coding environment
- Syntax highlighting and code auto-completion for students

**react-router-dom**
Used for →

- Handling navigation between pages (Dashboard, generic routes)
- Managing URL parameters for quizzes or problems

**recharts**
Used for →

- Visualizing student performance data
- Drawing analytics charts and progress graphs

**lucide-react**
Used for →

- Providing clean, modern SVG icons
- Enhancing UI visuals with consistent iconography

**react-hot-toast**
Used for →

- Showing non-intrusive popup notifications
- Alerting users of success (Saved!) or errors (Failed!)

**axios**
Used for →

- Sending requests to your backend API
- Fetching user data and quiz content

**lodash.debounce**
Used for →

- Optimizing performance on search bars or inputs
- Preventing API spam while typing

**tailwindcss**
Used for →

- Rapidly styling components using utility classes
- Ensuring responsive design across mobile and desktop

**vite**
Used for →

- Running the fast local development server
- Building the optimized production app

What Redis will do in YOUR project

We’ll use Redis for:

✅ 1. Leaderboard caching

→ avoid hitting DB again & again

✅ 2. Rate limiting

→ protect login & AI APIs

✅ 3. (Later) session / token blacklist

→ logout

**prom-client**
Used for →

- Exposing runtime hardware and HTTP metrics to Prometheus
- Tracking fallback counters and gauge statistics

**grafana/prometheus & k6**
Used for →

- Providing a visual dashboard of system health, active requests, and circuit-breaker triggers
- K6 executes automated chaos-engineering load tests to prove fault-tolerance.

---

## What Redis will do in OUR project

We’ll use Redis for:

✅ 1. Leaderboard caching
→ avoid hitting DB again & again

✅ 2. Hybrid Rate-limiting & Circuit Breaking
→ protect login & AI APIs. If Redis crashes, our `GracefulStore` proxy instantly triggers a circuit breaker cooldown and pipes all traffic securely to a native MemoryStore without dropping connections or flooding the event loop.

✅ 3. Session / Token Blacklisting
→ Securely invalidates cookies on logout.

---

### Docker Start/Stop Protocols & URLs

- **Grafana Dashboard**: `http://localhost:3000` (Login: **`admin`** / **`admin`**)
- **Prometheus Metrics**: `http://localhost:9090` (or `http://localhost:5000/metrics`)
- **Container Management**:
  - `docker start quiz-redis` / `docker stop quiz-redis`
  - `docker start prometheus` / `docker stop prometheus`
  - `docker start grafana` / `docker stop grafana`

---

### Interview Talking Points (SRE & Observability)

> _"I built a strictly-typed Node.js backend defended by a dual-store Hybrid Rate Limiter. To ensure 100% uptime, I implemented a Circuit Breaker pattern that instantly falls back to an in-memory queue if the central Redis cache cluster fails. To prove its resilience, I instrumented the entire system with `prom-client` telemetry, ran concurrent HTTP bombardment tests using Grafana K6, and executed chaos-engineering by intentionally killing the Redis Docker container mid-flight. I proved via Prometheus/Grafana dashboards that the backend successfully bypassed the dropped socket, preserved the active rate limits, and never dropped a single 500-level HTTP request."_
