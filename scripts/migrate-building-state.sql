-- AskElira 2.1 Phase 2: Building State Database
-- Run this migration against Vercel Postgres to create the building state tables.
-- These tables support the goal -> floors -> agent_logs -> heartbeat pipeline.

-- ============================================================
-- STEP 1: goals table
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  goal_text TEXT NOT NULL,
  customer_context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'planning'
    CHECK (status IN ('planning','building','goal_met','blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 2: floors table
-- ============================================================
CREATE TABLE IF NOT EXISTS floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  floor_number INT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  success_condition TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending','researching','building',
      'auditing','live','broken','blocked'
    )),
  research_output TEXT,
  build_output TEXT,
  vex_gate1_report TEXT,
  vex_gate2_report TEXT,
  iteration_count INT DEFAULT 0,
  building_context TEXT,
  handoff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- STEP 3: agent_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID REFERENCES floors(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  iteration INT DEFAULT 1,
  action TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  tool_calls_made JSONB DEFAULT '[]',
  tokens_used INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STEP 4: heartbeat_logs table
-- ============================================================
CREATE TABLE IF NOT EXISTS heartbeat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  condition_met BOOLEAN NOT NULL DEFAULT FALSE,
  steven_observation TEXT,
  action_taken TEXT
    CHECK (action_taken IN ('healthy','rerun','escalate','billing_paused'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_floors_goal_id ON floors(goal_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_floor_id ON agent_logs(floor_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_goal_id ON agent_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_floor_id ON heartbeat_logs(floor_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_goal_id ON heartbeat_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_customer_id ON goals(customer_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

-- ============================================================
-- STEP 5: automation_patterns table (Phase 8 — Daily Intelligence Scraping)
-- ============================================================
CREATE TABLE IF NOT EXISTS automation_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  pattern_description TEXT NOT NULL,
  source_url TEXT,
  implementation_notes TEXT,
  confidence FLOAT NOT NULL DEFAULT 0.5,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  use_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  failure_count INT DEFAULT 0,
  source TEXT DEFAULT 'scraper'
    CHECK (source IN ('scraper','customer_build','manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patterns_category ON automation_patterns(category);
CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON automation_patterns(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_patterns_category_confidence ON automation_patterns(category, confidence DESC);

-- ============================================================
-- STEP 6: Add validation report columns to floors table
-- (supports step-runner pattern/risk/swarm validation reports)
-- ============================================================
ALTER TABLE floors ADD COLUMN IF NOT EXISTS pattern_validation_report TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS risk_analysis_report TEXT;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS swarm_validation_report TEXT;

-- ============================================================
-- STEP 7: Add complexity column to automation_patterns
-- (used by pattern-matcher for complexity similarity scoring)
-- ============================================================
ALTER TABLE automation_patterns ADD COLUMN IF NOT EXISTS complexity FLOAT;
