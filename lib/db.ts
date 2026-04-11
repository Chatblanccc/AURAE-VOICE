import 'server-only';
import { neon } from '@neondatabase/serverless';
import type { Message, Conversation, UserPlan } from '@/types';

/** Caps row reads to limit memory/response DoS from very large accounts. */
const MAX_CONVERSATIONS = 2000;
const MAX_MESSAGES = 10000;

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

  try {
    await sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS persona TEXT NOT NULL DEFAULT 'alex'`;
  } catch (e) { console.error('[schema] alter conversations persona:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS conv_user_idx     ON conversations(user_id, updated_at DESC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, user_id, timestamp ASC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS messages_user_idx ON messages(user_id, created_at)`; } catch {}

  // ── User plans & usage tracking ──────────────────────────────────────────

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        user_id    TEXT PRIMARY KEY,
        plan       TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ
      )
    `;
  } catch (e) { console.error('[schema] user_plans table:', String(e)); }

  try {
    await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
  } catch (e) { console.error('[schema] alter user_plans stripe_customer_id:', String(e)); }

  try {
    await sql`ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
  } catch (e) { console.error('[schema] alter user_plans stripe_subscription_id:', String(e)); }

  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_plans_stripe_cust_idx ON user_plans(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL`;
  } catch (e) { console.error('[schema] user_plans_stripe_cust_idx:', String(e)); }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_usage (
        id         BIGSERIAL PRIMARY KEY,
        user_id    TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_usage table:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS usage_user_time_idx ON user_usage(user_id, created_at DESC)`; } catch {}

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
    SELECT id, title, persona, created_at, updated_at
    FROM conversations
    WHERE user_id = ${userId}
    ORDER BY updated_at DESC
    LIMIT ${MAX_CONVERSATIONS}
  `;
  return rows.map(r => ({
    id: r.id as string,
    title: r.title as string,
    persona: (r.persona as string) === 'trump' ? 'trump' : 'alex',
    created_at: Number(r.created_at),
    updated_at: Number(r.updated_at),
  }));
}

export async function createConversation(userId: string, conv: Conversation): Promise<void> {
  const sql = getDb();
  const persona = conv.persona === 'trump' ? 'trump' : 'alex';
  await sql`
    INSERT INTO conversations (id, user_id, title, persona, created_at, updated_at)
    VALUES (${conv.id}, ${userId}, ${conv.title}, ${persona}, ${conv.created_at}, ${conv.updated_at})
    ON CONFLICT (id, user_id) DO NOTHING
  `;
}

export async function touchConversation(id: string, userId: string): Promise<void> {
  const sql = getDb();
  const now = Date.now();
  await sql`UPDATE conversations SET updated_at = ${now} WHERE id = ${id} AND user_id = ${userId}`;
}

export async function updateConversationPersona(id: string, userId: string, persona: string): Promise<void> {
  const sql = getDb();
  const p = persona === 'trump' ? 'trump' : 'alex';
  await sql`UPDATE conversations SET persona = ${p} WHERE id = ${id} AND user_id = ${userId}`;
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
    LIMIT ${MAX_MESSAGES}
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
      WHERE messages.user_id = EXCLUDED.user_id
  `;
}

// ── User ID migration ─────────────────────────────────────────────────────────

/**
 * Migrate all conversations & messages from oldId → newId.
 * Used when switching from random-UUID user IDs to stable provider IDs.
 */
export async function migrateUserId(oldId: string, newId: string): Promise<number> {
  if (oldId === newId) return 0;
  const sql = getDb();
  const [c1] = await sql`UPDATE conversations SET user_id = ${newId} WHERE user_id = ${oldId} RETURNING id`;
  const [m1] = await sql`UPDATE messages SET user_id = ${newId} WHERE user_id = ${oldId} RETURNING id`;
  const count = (c1 ? 1 : 0) + (m1 ? 1 : 0);
  if (count > 0) console.log(`[db] migrated user ${oldId.slice(0, 8)}… → ${newId.slice(0, 12)}…`);
  return count;
}

/**
 * Migrate ALL UUID-format user_ids to a stable provider ID.
 * Intended as a one-time migration for early adopters.
 */
export async function migrateAllUuidUsers(stableId: string): Promise<void> {
  const sql = getDb();
  const r1 = await sql`
    UPDATE conversations SET user_id = ${stableId}
    WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND user_id != ${stableId}
  `;
  const r2 = await sql`
    UPDATE messages SET user_id = ${stableId}
    WHERE user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND user_id != ${stableId}
  `;
  console.log('[db] migrateAllUuidUsers →', stableId.slice(0, 12), '| convs:', r1.length, '| msgs:', r2.length);
}

// ── Legacy flat-message helpers (kept for /api/messages backward compat) ──────

export async function loadMessages(userId: string): Promise<Message[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT id, role, content, timestamp
    FROM messages
    WHERE user_id = ${userId} AND conversation_id IS NULL
    ORDER BY created_at ASC, timestamp ASC
    LIMIT ${MAX_MESSAGES}
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

// ── User plan helpers ─────────────────────────────────────────────────────────

export async function getUserPlan(userId: string): Promise<UserPlan> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT plan, expires_at, stripe_subscription_id
      FROM user_plans
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    if (rows.length === 0 || !rows[0].plan) return 'free';

    const raw = rows[0].plan as string;
    if (raw !== 'plus' && raw !== 'pro' && raw !== 'free') return 'free';
    if (raw === 'free') return 'free';

    const subId = rows[0].stripe_subscription_id as string | null | undefined;
    const exp = rows[0].expires_at as Date | string | null | undefined;

    // Active Stripe subscription — plan follows subscription (period end in expires_at).
    if (subId) {
      return raw as UserPlan;
    }

    // Prepaid / one-time access: no subscription; honour expires_at.
    if (exp) {
      const expMs = exp instanceof Date ? exp.getTime() : new Date(exp).getTime();
      if (!Number.isNaN(expMs) && expMs < Date.now()) {
        try {
          await sql`
            UPDATE user_plans
            SET plan = 'free', expires_at = NULL
            WHERE user_id = ${userId} AND stripe_subscription_id IS NULL
          `;
        } catch (e) {
          console.error('[db] getUserPlan prepaid expiry update:', String(e));
        }
        return 'free';
      }
    }

    return raw as UserPlan;
  } catch (e) {
    console.error('[db] getUserPlan:', String(e));
  }
  return 'free';
}

export async function recordUsage(userId: string): Promise<void> {
  const sql = getDb();
  await sql`INSERT INTO user_usage (user_id) VALUES (${userId})`;
}

/** Count usage rows since a given UTC timestamp (milliseconds). */
export async function getUsageCount(userId: string, sinceMs: number): Promise<number> {
  const sql = getDb();
  const sinceIso = new Date(sinceMs).toISOString();
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_usage
    WHERE user_id = ${userId}
      AND created_at >= ${sinceIso}::timestamptz
  `;
  return Number(rows[0]?.cnt ?? 0);
}

/** Count usage rows in the current calendar month (UTC). */
export async function getMonthlyUsageCount(userId: string): Promise<number> {
  const sql = getDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_usage
    WHERE user_id = ${userId}
      AND date_trunc('month', created_at) = date_trunc('month', NOW())
  `;
  return Number(rows[0]?.cnt ?? 0);
}

// ── Stripe helpers ────────────────────────────────────────────────────────────

export interface UpsertPlanParams {
  userId: string;
  plan: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  expiresAt?: Date | null;
}

/**
 * Insert or update a user's plan row, preserving existing stripe IDs
 * if the caller does not supply new ones.
 */
export async function upsertUserPlan(params: UpsertPlanParams): Promise<void> {
  const { userId, plan, stripeCustomerId, stripeSubscriptionId, expiresAt } = params;
  const sql = getDb();
  await sql`
    INSERT INTO user_plans (user_id, plan, stripe_customer_id, stripe_subscription_id, expires_at)
    VALUES (
      ${userId},
      ${plan},
      ${stripeCustomerId ?? null},
      ${stripeSubscriptionId ?? null},
      ${expiresAt ?? null}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      plan                  = EXCLUDED.plan,
      stripe_customer_id    = COALESCE(EXCLUDED.stripe_customer_id, user_plans.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, user_plans.stripe_subscription_id),
      expires_at            = EXCLUDED.expires_at
  `;
}

/** Look up a user_id from a Stripe customer ID (used in webhook handlers). */
export async function getUserIdByStripeCustomerId(stripeCustomerId: string): Promise<string | null> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT user_id FROM user_plans WHERE stripe_customer_id = ${stripeCustomerId} LIMIT 1
    `;
    return (rows[0]?.user_id as string) ?? null;
  } catch (e) {
    console.error('[db] getUserIdByStripeCustomerId:', String(e));
    return null;
  }
}

/** Get the stored Stripe customer ID for a user (if any). */
export async function getStripeCustomerId(userId: string): Promise<string | null> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT stripe_customer_id FROM user_plans WHERE user_id = ${userId} LIMIT 1
    `;
    return (rows[0]?.stripe_customer_id as string) ?? null;
  } catch (e) {
    console.error('[db] getStripeCustomerId:', String(e));
    return null;
  }
}

/** Active subscription id from DB (if any). */
export async function getStripeSubscriptionId(userId: string): Promise<string | null> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT stripe_subscription_id FROM user_plans WHERE user_id = ${userId} LIMIT 1
    `;
    return (rows[0]?.stripe_subscription_id as string) ?? null;
  } catch (e) {
    console.error('[db] getStripeSubscriptionId:', String(e));
    return null;
  }
}
