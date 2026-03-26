-- Submissions Table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  language TEXT NOT NULL, -- e.g., 'js', 'python'
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Testcases Table
CREATE TABLE IF NOT EXISTS testcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id TEXT NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  marks_per_testcase INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  marks INT NOT NULL,
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --- SEED DATA ---

-- 1. Insert Testcases for a "Sum of Two Numbers" question (Question ID: 'q1')
INSERT INTO testcases (question_id, input, expected_output, marks_per_testcase)
VALUES 
  ('q1', '1 2', '3', 5),
  ('q1', '10 20', '30', 5);

-- 2. Insert a Sample Submission (Correct JSON solution)
-- Note: Judge0 stdin is passed as string. For JS, we often need to read stdin.
-- This simple example assumes the code reads standard input.
INSERT INTO submissions (id, student_id, question_id, language, code)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed ID for testing endpoint easily
  'student_1',
  'q1',
  'js',
  'const fs = require("fs");
   const stdin = fs.readFileSync("/dev/stdin").toString().trim();
   const [a, b] = stdin.split(" ").map(Number);
   console.log(a + b);'
);

-- 3. Insert Testcases for "Check Prime" (Question ID: 'q2')
INSERT INTO testcases (question_id, input, expected_output, marks_per_testcase)
VALUES 
  ('q2', '7', 'true', 5),
  ('q2', '4', 'false', 5),
  ('q2', '1', 'false', 5);

-- 4. Insert Sample Submission for "Check Prime" (Correct Solution)
INSERT INTO submissions (id, student_id, question_id, language, code)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 
  'student_2',
  'q2',
  'js',
  'const fs = require("fs");
const stdin = fs.readFileSync("/dev/stdin").toString().trim();
const n = parseInt(stdin);

function isPrime(num) {
  if (num <= 1) return false;
  for (let i = 2; i <= Math.sqrt(num); i++) {
    if (num % i === 0) return false;
  }
  return true;
}

console.log(isPrime(n));'
);
