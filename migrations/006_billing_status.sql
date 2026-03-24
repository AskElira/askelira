-- 006: Add billing_status to goals (Phase 9)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'unpaid';
