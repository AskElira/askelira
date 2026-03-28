-- 012: Steven local runner heartbeat tracking
-- Adds columns for Steven to report live status from local runner

ALTER TABLE goals ADD COLUMN IF NOT EXISTS steven_status TEXT DEFAULT 'idle';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS steven_current_agent TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS steven_current_step TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS steven_last_heartbeat TIMESTAMPTZ;

-- Index for quickly finding goals that need Steven
CREATE INDEX IF NOT EXISTS idx_goals_steven_status ON goals(steven_status) WHERE steven_status = 'active';
