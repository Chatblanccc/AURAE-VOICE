import { neon } from '@neondatabase/serverless';
import type { Message, Conversation } from '@/types';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  return neon(url);
}

let schemaReady = false;

/**
 * Idempotent schema bootstrap — safe to call on every cold start.
 * Each statement is individually wrapped so a single failure
 * (e.g. column already exists) never cascades to skip later statements.
 */
export async function ensureSchema() {
  if (schemaReady) return;
  const sql = getDb();

  try {
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
  } catch (e) { console.error('[schema] conversations table:', String(e)); }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL,
        conversation_id TEXT,
        role            TEXT NOT NULL,
        content         TEXT NOT NULL,
        timestamp       BIGINT NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] messages table:', String(e)); }

  try {
    await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id TEXT DEFAULT NULL`;
  } catch (e) { console.error('[schema] alter messages:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS conv_user_idx     ON conversations(user_id, updated_at DESC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, user_id, timestamp ASC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at)`; } catch {}

  schemaReady = true;
}

// ── Conversation CRUD ─────────────────────────────────────────────────────────

/**
 * Recover orphaned messages: if there are messages with a conversation_id
 * but no matching row in conversations, auto-create the conversation record.
 * This handles data left by earlier buggy code paths.
 */
async function recoverOrphanedConversations(userId: string) {
  try {
    const sql = getDb();
    await sql`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      SELECT
        m.conversation_id,
        m.user_id,
        COALESCE(
          LEFT(MIN(CASE WHEN m.role = 'user' THEN m.content ELSE NULL END), 50),
          'Recovered Chat'
        ),
        MIN(m.timestamp),
        MAX(m.timestamp)
      FROM messages m
      WHERE m.user_id = ${userId}
        AND m.conversation_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM conversations c
          WHERE c.id = m.conversation_id AND c.user_id = m.user_id
        )
      GROUP BY m.conversation_id, m.user_id
      ON CONFLICT (id, user_id) DO NOTHING
    `;
  } catch (e) {
    console.error('[db] recoverOrphanedConversations:', String(e));
  }
}

export async function listConversations(userId: string): Promise<Conversation[]> {
  const sql = getDb();

  await recoverOrphanedConversations(userId);

  const rows = await sql`
    SELECT id, title, created_at, updated_at
    FROM conversations
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
  `;
  return rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
  }));
}

export async function createConversation(userId: string, conv: Conversation): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO conversations (id, user_id, title, created_at, updated_at)
    VALUES (${conv.id}, ${userId}, ${conv.title}, ${conv.created_at}, ${conv.updated_at})
    ON CONFLICT (id, user_id) DO NOTHING
  `;
}

export async function touchConversation(id: string, userId: string): Promise<void> {
  const sql = getDb();
  const now = Date.now();
  await sql`UPDATE conversations SET updated_at = ${now} WHERE id = ${id} AND user_id = ${userId}`;
}

export async function deleteConversation(id: string, userId: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM messages WHERE conversation_id = ${id} AND user_id = ${userId}`;
  await sql`DELETE FROM conversations WHERE id = ${id} AND user_id = ${userId}`;
}

// ── Per-conversation messages ─────────────────────────────────────────────────

export async function loadConversationMessages(convId: string, userId: string): Promise<Message[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, role, content, timestamp
    FROM messages
    WHERE conversation_id = ${convId} AND user_id = ${userId}
    ORDER BY timestamp ASC
  `;
  return rows.map(r => ({
    id: r.id as string,
    role: r.role as Message['role'],
    content: r.content as string,
    timestamp: Number(r.timestamp),
  }));
}

export async function saveMessageToConversation(convId: string, userId: string, msg: Message): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO messages (id, user_id, conversation_id, role, content, timestamp)
    VALUES (${msg.id}, ${userId}, ${convId}, ${msg.role}, ${msg.content}, ${msg.timestamp})
    ON CONFLICT (id) DO UPDATE
      SET content         = EXCLUDED.content,
          conversation_id = EXCLUDED.conversation_id
  `;
}

// ── Legacy flat-message helpers (kept for /api/messages backward compat) ──────

export async function loadMessages(userId: string): Promise<Message[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, role, content, timestamp
    FROM messages
    WHERE user_id = ${userId} AND conversation_id IS NULL
    ORDER BY created_at ASC, timestamp ASC
  `;
  return rows.map(r => ({
    id: r.id as string,
    role: r.role as Message['role'],
    content: r.content as string,
    timestamp: Number(r.timestamp),
  }));
}

export async function saveMessage(userId: string, msg: Message): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO messages (id, user_id, role, content, timestamp)
    VALUES (${msg.id}, ${userId}, ${msg.role}, ${msg.content}, ${msg.timestamp})
    ON CONFLICT (id) DO NOTHING
  `;
}

export async function clearMessages(userId: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM messages WHERE user_id = ${userId}`;
}
