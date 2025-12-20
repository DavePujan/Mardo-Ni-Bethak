# UI/UX Design Sprint Plan

This document outlines the implementation strategy for the Quiz Portal redesign, divided into prolonged 2-week sprints.

## 🏃 Sprint 1: Foundation & Core Identity
**Goal**: Establish the "Look & Feel" and handle entry points.

### Deliverables
1.  **Design System Setup**
    - [ ] Typography Scale & Font Selection (Inter/Roboto)
    - [ ] Color Palette (Dark Theme + Gradients)
    - [ ] Component Library (Buttons, Inputs, Cards, Modals)
    - [ ] Icon Set Selection
2.  **Authentication Pages**
    - [ ] Login / Sign Up Split Screen
    - [ ] Forgot Password Flow
3.  **Global Navigation**
    - [ ] Sidebar for Dashboards (Teacher/Admin)
    - [ ] Top Navbar for Students
    - [ ] Mobile Responsive Menu

### 🎨 Design Focus
- Master the "Glassmorphism" login page.
- Perfect the primary button gradient.

---

## 🏃 Sprint 2: Student Experience (The "User" Flow)
**Goal**: Engage the primary user base (Students).

### Deliverables
1.  **Dashboard / Home** ([ActiveQuizzes.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/student/ActiveQuizzes.jsx))
    - [ ] Quiz Card Design (Hover effects, Progress bars)
    - [ ] Filtering & Search Interface
2.  **Quiz Runtime** ([AttemptQuiz.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/student/AttemptQuiz.jsx))
    - [ ] **Critical**: Distraction-free Coding Environment
    - [ ] Question Navigator & Timer
    - [ ] Code Editor Theme Customization
3.  **Gamification** ([Leaderboard.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/student/Leaderboard.jsx))
    - [ ] Top 3 Pedestal Visualization
    - [ ] Ranking Table Design

### 🎨 Design Focus
- High readability for code and questions.
- Exciting, "Video Game" feel for Leaderboards.

---

## 🏃 Sprint 3: Teacher Experience (The "Creator" Flow)
**Goal**: Productivity and power for content creators.

### Deliverables
1.  **Teacher Dashboard** ([TeacherDashboard.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/TeacherDashboard.jsx))
    - [ ] Statistics Cards (Data Visualization/Charts)
    - [ ] Recent Activity Feeds
2.  **Quiz Builder** ([CreateQuiz.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/teacher/CreateQuiz.jsx) / [QuestionBank.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/teacher/QuestionBank.jsx))
    - [ ] **Complex**: Multi-step Form Wizard
    - [ ] Form Validation States
    - [ ] "Add Question" Dynamic Form Cards
3.  **Evaluations** ([Evaluations.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/teacher/Evaluations.jsx) / [EvaluationViewer.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/teacher/EvaluationViewer.jsx))
    - [ ] Split-screen Grading Interface
    - [ ] Feedback Input UX

### 🎨 Design Focus
- Clear information hierarchy (don't overwhelm with data).
- Smooth interactions for complex forms.

---

## 🏃 Sprint 4: Admin & System Health
**Goal**: Management and stability.

### Deliverables
1.  **Admin Dashboard** ([AdminDashboard.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/AdminDashboard.jsx))
    - [ ] High-level System Metrics
2.  **User Management** ([UserManagement.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/admin/UserManagement.jsx) / [AdminRequests.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/admin/AdminRequests.jsx))
    - [ ] Data Grids with Bulk Actions
    - [ ] Permission Toggle UX
3.  **Audit & Safety** ([AuditLogs.jsx](file:///e:/z_projects/Quiz%20Portal/leetcode-clone/frontend/src/pages/admin/AuditLogs.jsx))
    - [ ] Dense Data Logs (Monospace/Terminal feel)

### 🎨 Design Focus
- "Control Room" aesthetic.
- Serious, high-contrast data presentation.

---

## 🏁 Post-Sprint Polish
- **Animation Pass**: Add Framer Motion transitions between pages.
- **Accessibility Audit**: Check contrast ratios and tab navigation.
- **Mobile Regression**: Ensure complex tables work on phone screens.
