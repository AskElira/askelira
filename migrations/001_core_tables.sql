-- 001: Core tables (goals, floors, agent_logs, heartbeat_logs)
-- Phase 2 of AskElira 2.1

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
