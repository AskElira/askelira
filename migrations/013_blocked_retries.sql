-- Migration 013: Add blocked floor retry tracking columns
-- Supports automatic retry of blocked floors through the agent pipeline

ALTER TABLE floors ADD COLUMN IF NOT EXISTS blocked_retries INTEGER DEFAULT 0;
ALTER TABLE floors ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ;

-- Index for efficient blocked floor queries
CREATE INDEX IF NOT EXISTS idx_floors_blocked ON floors (status, blocked_retries) WHERE status = 'blocked';
