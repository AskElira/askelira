-- AskElira database schema
-- Run against your Vercel Postgres instance

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  name          VARCHAR(255),
  image         TEXT,
  plan          VARCHAR(20) NOT NULL DEFAULT 'free',
  debates_used  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debates (
  id            VARCHAR(64) PRIMARY KEY,
  user_email    VARCHAR(255) REFERENCES users(email),
  question      TEXT NOT NULL,
  decision      VARCHAR(50),
  confidence    INTEGER,
  result_json   JSONB,
  cost          NUMERIC(10, 6) DEFAULT 0,
  duration_ms   INTEGER,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage (
  id            SERIAL PRIMARY KEY,
  user_email    VARCHAR(255) NOT NULL,
  month         VARCHAR(7) NOT NULL,
  debate_count  INT DEFAULT 0,
  total_cost    DECIMAL(10,4) DEFAULT 0,
  UNIQUE(user_email, month)
);

CREATE INDEX IF NOT EXISTS idx_debates_user ON debates(user_email);
CREATE INDEX IF NOT EXISTS idx_debates_created ON debates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_email_month ON usage(user_email, month);

-- Reset debate counts monthly (run via cron)
-- UPDATE users SET debates_used = 0;
