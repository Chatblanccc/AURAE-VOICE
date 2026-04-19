import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Run: export DATABASE_URL="your_neon_connection_string"');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log('Creating / migrating schema...');

const statements = [
  `CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT 'New Chat',
    created_at  BIGINT NOT NULL,
    updated_at  BIGINT NOT NULL,
    PRIMARY KEY (id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    conversation_id TEXT,
    role            TEXT NOT NULL,
    content         TEXT NOT NULL,
    timestamp       BIGINT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT NULL`,
  `ALTER TABLE conversations ADD COLUMN IF NOT EXISTS persona TEXT NOT NULL DEFAULT 'alex'`,
  `CREATE INDEX IF NOT EXISTS conv_user_idx ON conversations(user_id, updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, user_id, timestamp ASC)`,
  `CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at)`,

  `CREATE TABLE IF NOT EXISTS user_plans (
    user_id    TEXT PRIMARY KEY,
    plan       TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
  )`,
  `ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
  `ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_plans_stripe_cust_idx
     ON user_plans(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL`,
  `CREATE TABLE IF NOT EXISTS user_usage (
    id         BIGSERIAL PRIMARY KEY,
    user_id    TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS usage_user_time_idx ON user_usage(user_id, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS user_assessments (
    user_id         TEXT PRIMARY KEY,
    fluency         INT NOT NULL,
    accuracy        INT NOT NULL,
    pronunciation   INT NOT NULL,
    interaction     INT NOT NULL,
    overall_level   TEXT NOT NULL,
    completed_at_ms BIGINT NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS user_daily_plans (
    user_id      TEXT NOT NULL,
    date_key     TEXT NOT NULL,
    plan_json    JSONB NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, date_key)
  )`,
  `CREATE INDEX IF NOT EXISTS daily_plans_user_idx ON user_daily_plans(user_id, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS user_progress (
    user_id      TEXT PRIMARY KEY,
    xp           INT NOT NULL DEFAULT 0,
    streak_days  INT NOT NULL DEFAULT 1,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,

  `CREATE TABLE IF NOT EXISTS user_memory_facts (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    kind          TEXT NOT NULL,
    memory_key    TEXT NOT NULL,
    memory_value  TEXT NOT NULL,
    confidence    DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    updated_at_ms BIGINT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS user_memory_facts_user_idx ON user_memory_facts(user_id, updated_at_ms DESC)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_memory_facts_dedupe_idx
     ON user_memory_facts(user_id, kind, memory_key, memory_value)`,

  `CREATE TABLE IF NOT EXISTS user_public_profiles (
    user_id      TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS user_public_profiles_updated_idx ON user_public_profiles(updated_at DESC)`,

  `CREATE TABLE IF NOT EXISTS chat_round_profiles (
    id                 TEXT PRIMARY KEY,
    user_id            TEXT NOT NULL,
    conversation_id    TEXT,
    variant            TEXT NOT NULL,
    difficulty_band    TEXT NOT NULL,
    challenge_interval INT NOT NULL,
    correction_mode    TEXT NOT NULL,
    max_sentence_len   TEXT NOT NULL,
    reason_json        JSONB NOT NULL,
    created_at_ms      BIGINT NOT NULL,
    created_at         TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS chat_round_profiles_user_idx ON chat_round_profiles(user_id, created_at_ms DESC)`,

  `CREATE TABLE IF NOT EXISTS user_mission_rewards (
    id            TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL,
    date_key      TEXT NOT NULL,
    reward_xp     INT NOT NULL,
    created_at_ms BIGINT NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_mission_rewards_daily_idx
     ON user_mission_rewards(user_id, date_key)`,

  `CREATE TABLE IF NOT EXISTS user_daily_quest_status (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL,
    date_key        TEXT NOT NULL,
    quest_key       TEXT NOT NULL,
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at_ms BIGINT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS user_daily_quest_status_unique_idx
     ON user_daily_quest_status(user_id, date_key, quest_key)`,
  `CREATE INDEX IF NOT EXISTS user_daily_quest_status_user_idx
     ON user_daily_quest_status(user_id, date_key)`,

  `CREATE TABLE IF NOT EXISTS user_vocab_cards (
    id             TEXT PRIMARY KEY,
    user_id        TEXT NOT NULL,
    phrase         TEXT NOT NULL,
    meaning        TEXT NOT NULL DEFAULT '',
    example        TEXT NOT NULL DEFAULT '',
    source         TEXT NOT NULL DEFAULT 'manual',
    ease_factor    DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    interval_days  INT NOT NULL DEFAULT 0,
    due_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_count   INT NOT NULL DEFAULT 0,
    correct_count  INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS user_vocab_cards_due_idx ON user_vocab_cards(user_id, due_at ASC)`,
  `CREATE INDEX IF NOT EXISTS user_vocab_cards_updated_idx ON user_vocab_cards(user_id, updated_at DESC)`,
];

for (const statement of statements) {
  await sql.query(statement);
}

console.log('Done: schema is up to date.');
