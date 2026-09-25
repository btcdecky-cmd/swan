-- Swan protocol tables (Postgres / Supabase)
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  priority TEXT NOT NULL,
  budget_lamports BIGINT NOT NULL DEFAULT 0,
  spent_lamports BIGINT NOT NULL DEFAULT 0,
  reward_per_completion_lamports BIGINT NOT NULL DEFAULT 0,
  max_completions INT NOT NULL DEFAULT 0,
  completion_count INT NOT NULL DEFAULT 0,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  participant TEXT NOT NULL,
  task_id TEXT,
  reward_lamports BIGINT NOT NULL,
  proof_signature TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (campaign_id, participant)
);

CREATE TABLE IF NOT EXISTS delivery_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  zone_key TEXT NOT NULL,
  campaign_id TEXT,
  wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
