-- 011: Additional indexes for performance (Steven Delta SD-008)

CREATE INDEX IF NOT EXISTS idx_floors_status ON floors(status);
CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_checked_at ON heartbeat_logs(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_subs_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_templates_is_public ON building_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_floor_snapshots_floor_id ON floor_snapshots(floor_id);
CREATE INDEX IF NOT EXISTS idx_goals_created_at ON goals(created_at DESC);
