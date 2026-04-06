import { neon } from '@neondatabase/serverless';
import type { Message } from '@/types';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  return neon(url);
}

/** One-time table + index creation. Call from a setup script or API route. */
export async function ensureSchema() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      role        TEXT NOT NULL,
      content     TEXT NOT NULL,
      timestamp   BIGINT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at)
  `;
}

/** Return all messages for a user, ordered oldest-first. */
export async function loadMessages(userId: string): Promise<Message[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, role, content, timestamp
    FROM messages
    WHERE user_id = ${userId}
    ORDER BY created_at ASC, timestamp ASC
  `;
  return rows.map((r) => ({
    id: r.id as string,
    role: r.role as Message['role'],
    content: r.content as string,
    timestamp: Number(r.timestamp),
  }));
}

/** Persist a single message for a user. Silently ignores duplicate IDs. */
export async function saveMessage(userId: string, msg: Message): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO messages (id, user_id, role, content, timestamp)
    VALUES (${msg.id}, ${userId}, ${msg.role}, ${msg.content}, ${msg.timestamp})
    ON CONFLICT (id) DO NOTHING
  `;
}

/** Delete all messages for a user. */
export async function clearMessages(userId: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM messages WHERE user_id = ${userId}`;
}
