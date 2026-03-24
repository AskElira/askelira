-- 009: Soft delete support for goals (Steven Delta SD-003)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_goals_deleted_at ON goals(deleted_at) WHERE deleted_at IS NULL;
