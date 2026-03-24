-- 007: Building templates table and index (Phase 10)

CREATE TABLE IF NOT EXISTS building_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_text TEXT NOT NULL,
  building_summary TEXT NOT NULL DEFAULT '',
  category TEXT,
  floor_blueprints JSONB NOT NULL DEFAULT '[]',
  use_count INT DEFAULT 0,
  avg_completion_hours FLOAT,
  is_public BOOLEAN DEFAULT TRUE,
  source_goal_id UUID REFERENCES goals(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_category ON building_templates(category);
