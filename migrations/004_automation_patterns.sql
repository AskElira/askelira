-- 004: Automation patterns table and indexes (Phase 8)

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
