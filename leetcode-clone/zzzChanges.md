# 🧠📊 QUIZ ANALYTICS FIX — AI-AUGMENTED, DATA-SCIENCE GRADE DESIGN

## Objective

Fix incorrect analytics (score distribution, topic performance, difficulty metrics) by:

1. Normalizing scores to **percentages**
2. Replacing brittle rule-based topic detection with **AI-assisted semantic labeling**
3. Refactoring backend to keep analytics **deterministic, scalable, and explainable**

---

# 1️⃣ SCORE DISTRIBUTION — PERCENTAGE-BASED BUCKETING (FINAL)

## ❌ Problem

Raw score bucketing assumed scores ∈ [0,100], producing impossible ranges like `30–309`.

## ✅ Decision

All analytics use **percentage-normalized scores**.

---

## Backend Assumption

Each quiz has:

- `score` → marks obtained
- `total_marks` → max possible marks

If `total_marks` is not stored, it **must be added**.

---

## ✅ Correct SQL (Final)

```sql
SELECT
  FLOOR((score / total_marks) * 100 / 10) * 10 AS bucket,
  COUNT(*) AS students
FROM quiz_attempts
WHERE quiz_id = $1
  AND status IN ('submitted', 'evaluated')
GROUP BY bucket
ORDER BY bucket;
```

### Frontend Labeling

```text
0–9
10–19
20–29
30–39
40–49
...
```

### Why this is non-negotiable

- Comparable across quizzes
- Matches teacher intuition
- Survives quiz format changes
- Industry standard in assessments

---

# 2️⃣ TOPIC PERFORMANCE — AI-ASSISTED SEMANTIC CLASSIFICATION

## ❌ Problem

Rule-based keyword matching (`ILIKE '%array%'`) fails for real educational language.

## ✅ Decision

Use **Groq LLM** to classify question topics **once**, store result, and run analytics purely in SQL.

> AI labels data.
> SQL analyzes data.

---

## 🧠 Topic Taxonomy (FINAL)

These are **allowed topics**.
Groq responses **must match one of these exactly**.

```text
Algorithms
Data Structures
Correctness
Complexity
Logic & Reasoning
Recursion
Mathematical Foundations
Programming Basics
Edge Cases & Testing
Other
```

📌 Notes:

- Small, stable, explainable
- Covers CS fundamentals
- Prevents hallucinated labels
- “Other” is allowed but monitored

---

## 🧠 EXACT GROQ PROMPT (COPY–PASTE SAFE)

```text
You are an expert computer science educator.

Your task is to classify the following quiz question into exactly ONE topic
from the allowed list below.

Allowed topics:
- Algorithms
- Data Structures
- Correctness
- Complexity
- Logic & Reasoning
- Recursion
- Mathematical Foundations
- Programming Basics
- Edge Cases & Testing
- Other

Question:
"<<QUESTION_TEXT>>"

Rules:
- Return ONLY the topic name
- Do NOT explain your answer
- Do NOT invent new topics
- If unsure, return "Other"
```

### ✅ Example Response

```text
Correctness
```

---

# 3️⃣ DATABASE DESIGN — CLEAN & FUTURE-PROOF

### Option A (Simple, Acceptable)

```sql
ALTER TABLE questions
ADD COLUMN topic TEXT;
```

---

### ✅ Option B (Recommended, Scalable)

```sql
CREATE TABLE question_topics (
  question_id UUID PRIMARY KEY REFERENCES questions(id),
  topic TEXT NOT NULL,
  confidence_score NUMERIC(3,2),
  generated_by TEXT DEFAULT 'groq',
  created_at TIMESTAMP DEFAULT NOW()
);
```

Why this wins:

- Allows reclassification
- Tracks AI confidence
- Auditable
- Extensible

---

# 4️⃣ BACKEND FLOW — REFACTORED CLEANLY

## When a Question Is Created

### Step 1 — Call Groq

```js
const topic = await classifyQuestionWithGroq(questionTitle);
```

### Step 2 — Validate Topic

```js
if (!ALLOWED_TOPICS.includes(topic)) {
  topic = "Other";
}
```

### Step 3 — Persist

```sql
INSERT INTO question_topics (question_id, topic)
VALUES ($1, $2)
ON CONFLICT (question_id)
DO UPDATE SET topic = EXCLUDED.topic;
```

📌 **Important Rule**
❌ NO AI calls during analytics
✅ AI only runs during content creation or admin reprocessing

---

# 5️⃣ ANALYTICS QUERY — TOPIC PERFORMANCE (FINAL)

```sql
SELECT
  qt.topic,
  ROUND(AVG(qa.marks_obtained)::numeric, 2) AS avg_marks
FROM quiz_answers qa
JOIN question_topics qt ON qt.question_id = qa.question_id
WHERE qa.attempt_id IN (
  SELECT id
  FROM quiz_attempts
  WHERE quiz_id = $1
    AND status IN ('submitted', 'evaluated')
)
GROUP BY qt.topic
ORDER BY avg_marks DESC;
```

✔ Deterministic
✔ Fast
✔ Explainable
✔ AI-augmented, not AI-dependent

---

# 6️⃣ QUESTION DIFFICULTY — METRIC CORRECTION

## ❌ Problem

```sql
COUNT(qa.id)
```

Overstates attempts and hides behavior patterns.

## ✅ Minimum Fix (Required)

```sql
COUNT(DISTINCT qa.attempt_id) AS attempts
```

## ✅ Correct Accuracy Metric

```sql
ROUND(
  SUM(CASE WHEN qa.is_correct THEN 1 ELSE 0 END) * 100.0
  / COUNT(DISTINCT qa.attempt_id),
  2
) AS accuracy_percentage
```

---

## Optional (Post-Hackathon Enhancements)

- Avg marks per question
- Discrimination index
- Time-spent correlation

---

# 7️⃣ OVERVIEW CARDS — UX FIX

## Backend Response

```json
{
  "avg_score": 30.7,
  "avg_percentage": 61.4,
  "max_percentage": 89.6,
  "min_percentage": 10.0
}
```

## Frontend Rule

> Always display **percentages**, optionally show raw marks as tooltip.

---

# 🔥 FINAL SYSTEM PRINCIPLES (FOR THE TEAM)

1. **Percentages, not raw marks**
2. **AI labels data once**
3. **Analytics is pure SQL**
4. **No heuristics in production analytics**
5. **Every metric must be explainable to a teacher**

---

# 🏆 WHY THIS DESIGN IS STRONG

- Judges see **correctness**
- Teachers see **intuition**
- Developers see **clarity**
- System scales without rework
- AI is used **responsibly**
