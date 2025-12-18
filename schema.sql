-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  action text,
  performed_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid,
  evaluator_id uuid,
  remarks text,
  evaluated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT evaluations_pkey PRIMARY KEY (id),
  CONSTRAINT evaluations_evaluator_id_fkey FOREIGN KEY (evaluator_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.mcq_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid,
  option_text text,
  is_correct boolean DEFAULT false,
  CONSTRAINT mcq_options_pkey PRIMARY KEY (id),
  CONSTRAINT mcq_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  role text DEFAULT 'student'::text CHECK (role = ANY (ARRAY['student'::text, 'teacher'::text, 'admin'::text])),
  provider text,
  is_verified boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.question_bank (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  text text NOT NULL,
  type text CHECK (type = ANY (ARRAY['MCQ'::text, 'DESCRIPTIVE'::text])),
  options jsonb,
  difficulty text CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  created_by uuid,
  usage_count integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT question_bank_pkey PRIMARY KEY (id),
  CONSTRAINT question_bank_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  function_name text,
  language text,
  input_format text,
  output_format text,
  type text CHECK (type = ANY (ARRAY['mcq'::text, 'code'::text, 'hybrid'::text])),
  weightage integer DEFAULT 10,
  created_by uuid,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT questions_pkey PRIMARY KEY (id),
  CONSTRAINT questions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.quiz_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  attempt_id uuid,
  question_id uuid,
  selected_option text,
  submitted_code text,
  is_correct boolean DEFAULT false,
  marks_awarded numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT quiz_answers_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.quiz_attempts(id),
  CONSTRAINT quiz_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  quiz_id uuid,
  score numeric DEFAULT 0,
  status text DEFAULT 'in_progress'::text CHECK (status = ANY (ARRAY['in_progress'::text, 'submitted'::text, 'evaluated'::text])),
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid,
  type text CHECK (type = ANY (ARRAY['MCQ'::text, 'DESCRIPTIVE'::text])),
  question text NOT NULL,
  options jsonb,
  correct_answer text,
  marks integer DEFAULT 1,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quiz_questions_map (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid,
  question_id uuid,
  weightage integer NOT NULL,
  CONSTRAINT quiz_questions_map_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_map_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id),
  CONSTRAINT quiz_questions_map_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subject text,
  description text,
  duration integer,
  total_marks integer,
  created_by uuid,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'completed'::text])),
  created_at timestamp without time zone DEFAULT now(),
  quiz_type text DEFAULT 'code'::text CHECK (quiz_type = ANY (ARRAY['mcq'::text, 'code'::text, 'hybrid'::text])),
  is_active boolean DEFAULT true,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.settings (
  key text NOT NULL,
  value boolean,
  CONSTRAINT settings_pkey PRIMARY KEY (key)
);
CREATE TABLE public.testcases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid,
  input text NOT NULL,
  expected_output text NOT NULL,
  is_hidden boolean DEFAULT false,
  CONSTRAINT testcases_pkey PRIMARY KEY (id),
  CONSTRAINT testcases_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);