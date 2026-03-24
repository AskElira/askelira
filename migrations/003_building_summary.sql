-- 003: Add building_summary column to goals (Phase 3)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS building_summary TEXT;
