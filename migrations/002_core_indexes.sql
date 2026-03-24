-- 002: Core indexes for goals, floors, agent_logs, heartbeat_logs

CREATE INDEX IF NOT EXISTS idx_floors_goal_id ON floors(goal_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_floor_id ON agent_logs(floor_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_goal_id ON agent_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_floor_id ON heartbeat_logs(floor_id);
CREATE INDEX IF NOT EXISTS idx_heartbeat_logs_goal_id ON heartbeat_logs(goal_id);
CREATE INDEX IF NOT EXISTS idx_goals_customer_id ON goals(customer_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);
