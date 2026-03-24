-- 010: Archiving support for goals (Steven Delta SD-004)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_archived_at ON goals(archived_at) WHERE archived_at IS NULL;
