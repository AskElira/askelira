-- 008: Floor snapshots table (Phase 10)

CREATE TABLE IF NOT EXISTS floor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  research_output TEXT,
  build_output TEXT,
  vex_gate1_report TEXT,
  vex_gate2_report TEXT,
  iteration_count INT DEFAULT 0,
  building_context TEXT,
  handoff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
