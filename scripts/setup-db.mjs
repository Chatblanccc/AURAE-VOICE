import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Run: export DATABASE_URL="your_neon_connection_string"');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

console.log('Creating / migrating schema…');

await sql`
  CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT NOT NULL,
    user_id     TEXT NOT NULL,
    title       TEXT NOT NULL DEFAULT 'New Chat',
    created_at  BIGINT NOT NULL,
    updated_at  BIGINT NOT NULL,
    PRIMARY KEY (id, user_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS conv_user_idx ON conversations(user_id, updated_at DESC)`;

await sql`
  CREATE TABLE IF NOT EXISTS messages (
    id              TEXT NOT NULL,
    user_id         TEXT NOT NULL,
    conversation_id TEXT,
    role            TEXT NOT NULL,
    content         TEXT NOT NULL,
    timestamp       BIGINT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
  )
`;
await sql`CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, user_id, timestamp ASC)`;
await sql`CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at)`;

// Add conversation_id column to existing messages table if it doesn't exist
await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT NULL`;

console.log('Done — schema is up to date.');
