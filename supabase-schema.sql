-- ============================================================
-- PEOPLElogy AI Readiness Assessment — Supabase Schema
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Table: cycles
-- Stores assessment cycle metadata
-- ============================================================
CREATE TABLE IF NOT EXISTS cycles (
  id          INTEGER PRIMARY KEY,
  label       TEXT NOT NULL,           -- e.g. "Cycle 1 — Jan 2026"
  start_date  DATE,
  end_date    DATE,
  is_active   BOOLEAN DEFAULT FALSE
);

-- Insert default first cycle
INSERT INTO cycles (id, label, start_date, is_active)
VALUES (1, 'Cycle 1 — 2026', '2026-01-01', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Table: responses
-- One row per completed assessment submission
-- ============================================================
CREATE TABLE IF NOT EXISTS responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name      TEXT NOT NULL,
  department      TEXT NOT NULL,
  cycle           INTEGER NOT NULL DEFAULT 1 REFERENCES cycles(id),
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Pillar total scores (sum of 12 question answers, max 60 each)
  pillar1_score   INTEGER NOT NULL DEFAULT 0,
  pillar2_score   INTEGER NOT NULL DEFAULT 0,
  pillar3_score   INTEGER NOT NULL DEFAULT 0,
  pillar4_score   INTEGER NOT NULL DEFAULT 0,
  pillar5_score   INTEGER NOT NULL DEFAULT 0,

  -- Derived overall metrics
  overall_score   FLOAT NOT NULL DEFAULT 0,   -- avg of 5 pillar percentages
  maturity_level  INTEGER NOT NULL DEFAULT 1, -- 1-5

  -- Pillar 1 individual question scores (Strategy & Leadership)
  p1_q1 INTEGER, p1_q2 INTEGER, p1_q3 INTEGER, p1_q4 INTEGER,
  p1_q5 INTEGER, p1_q6 INTEGER, p1_q7 INTEGER, p1_q8 INTEGER,
  p1_q9 INTEGER, p1_q10 INTEGER, p1_q11 INTEGER, p1_q12 INTEGER,

  -- Pillar 2 individual question scores (Data & Technology Infrastructure)
  p2_q1 INTEGER, p2_q2 INTEGER, p2_q3 INTEGER, p2_q4 INTEGER,
  p2_q5 INTEGER, p2_q6 INTEGER, p2_q7 INTEGER, p2_q8 INTEGER,
  p2_q9 INTEGER, p2_q10 INTEGER, p2_q11 INTEGER, p2_q12 INTEGER,

  -- Pillar 3 individual question scores (People & Workforce Skills)
  p3_q1 INTEGER, p3_q2 INTEGER, p3_q3 INTEGER, p3_q4 INTEGER,
  p3_q5 INTEGER, p3_q6 INTEGER, p3_q7 INTEGER, p3_q8 INTEGER,
  p3_q9 INTEGER, p3_q10 INTEGER, p3_q11 INTEGER, p3_q12 INTEGER,

  -- Pillar 4 individual question scores (Processes & AI Use Cases)
  p4_q1 INTEGER, p4_q2 INTEGER, p4_q3 INTEGER, p4_q4 INTEGER,
  p4_q5 INTEGER, p4_q6 INTEGER, p4_q7 INTEGER, p4_q8 INTEGER,
  p4_q9 INTEGER, p4_q10 INTEGER, p4_q11 INTEGER, p4_q12 INTEGER,

  -- Pillar 5 individual question scores (Governance, Risk & Responsible AI)
  p5_q1 INTEGER, p5_q2 INTEGER, p5_q3 INTEGER, p5_q4 INTEGER,
  p5_q5 INTEGER, p5_q6 INTEGER, p5_q7 INTEGER, p5_q8 INTEGER,
  p5_q9 INTEGER, p5_q10 INTEGER, p5_q11 INTEGER, p5_q12 INTEGER
);

-- ============================================================
-- Table: qualitative_responses
-- Open-text answers linked to a submission
-- ============================================================
CREATE TABLE IF NOT EXISTS qualitative_responses (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id     UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  pillar          INTEGER NOT NULL CHECK (pillar BETWEEN 1 AND 5),
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 13 AND 15),
  answer          TEXT,
  department      TEXT NOT NULL,
  cycle           INTEGER NOT NULL DEFAULT 1
);

-- ============================================================
-- Row Level Security (RLS) Policies
-- Allow public inserts; restrict reads where needed
-- ============================================================

-- Responses: anyone can insert (submit survey), anyone can read (public dashboard)
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert responses"
  ON responses FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can read responses"
  ON responses FOR SELECT USING (TRUE);

-- Qualitative responses: same as above
ALTER TABLE qualitative_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert qualitative"
  ON qualitative_responses FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Anyone can read qualitative"
  ON qualitative_responses FOR SELECT USING (TRUE);

-- Cycles: public read-only
ALTER TABLE cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read cycles"
  ON cycles FOR SELECT USING (TRUE);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_responses_cycle       ON responses(cycle);
CREATE INDEX IF NOT EXISTS idx_responses_dept        ON responses(department);
CREATE INDEX IF NOT EXISTS idx_responses_submitted   ON responses(submitted_at);
CREATE INDEX IF NOT EXISTS idx_qualitative_resp_id   ON qualitative_responses(response_id);
CREATE INDEX IF NOT EXISTS idx_qualitative_pillar    ON qualitative_responses(pillar);
CREATE INDEX IF NOT EXISTS idx_qualitative_dept      ON qualitative_responses(department);
