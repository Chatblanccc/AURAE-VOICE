import 'server-only';
import { neon } from '@neondatabase/serverless';
import type {
  Conversation,
  MemoryCandidate,
  Message,
  PersonalizationVariant,
  UserMemoryFact,
  UserPlan,
  VocabCard,
  VocabReviewRating,
} from '@/types';

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

  // ── Onboarding assessment & daily plans ──────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_assessments (
        user_id         TEXT PRIMARY KEY,
        fluency         INT NOT NULL,
        accuracy        INT NOT NULL,
        pronunciation   INT NOT NULL,
        interaction     INT NOT NULL,
        overall_level   TEXT NOT NULL,
        completed_at_ms BIGINT NOT NULL,
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_assessments table:', String(e)); }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_daily_plans (
        user_id      TEXT NOT NULL,
        date_key     TEXT NOT NULL,
        plan_json    JSONB NOT NULL,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, date_key)
      )
    `;
  } catch (e) { console.error('[schema] user_daily_plans table:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS daily_plans_user_idx ON user_daily_plans(user_id, created_at DESC)`; } catch {}

  // ── User XP / rank progression ───────────────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id      TEXT PRIMARY KEY,
        xp           INT NOT NULL DEFAULT 0,
        streak_days  INT NOT NULL DEFAULT 1,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_progress table:', String(e)); }

  // ── Personalization memory & experiments ─────────────────────────────────
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_memory_facts (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        kind          TEXT NOT NULL,
        memory_key    TEXT NOT NULL,
        memory_value  TEXT NOT NULL,
        confidence    DOUBLE PRECISION NOT NULL DEFAULT 0.5,
        updated_at_ms BIGINT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_memory_facts table:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS user_memory_facts_user_idx ON user_memory_facts(user_id, updated_at_ms DESC)`; } catch {}
  try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_memory_facts_dedupe_idx ON user_memory_facts(user_id, kind, memory_key, memory_value)`; } catch {}

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_public_profiles (
        user_id      TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_public_profiles table:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS user_public_profiles_updated_idx ON user_public_profiles(updated_at DESC)`; } catch {}

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS chat_round_profiles (
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
      )
    `;
  } catch (e) { console.error('[schema] chat_round_profiles table:', String(e)); }

  try { await sql`CREATE INDEX IF NOT EXISTS chat_round_profiles_user_idx ON chat_round_profiles(user_id, created_at_ms DESC)`; } catch {}

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_mission_rewards (
        id            TEXT PRIMARY KEY,
        user_id       TEXT NOT NULL,
        date_key      TEXT NOT NULL,
        reward_xp     INT NOT NULL,
        created_at_ms BIGINT NOT NULL,
        created_at    TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_mission_rewards table:', String(e)); }
  try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_mission_rewards_daily_idx ON user_mission_rewards(user_id, date_key)`; } catch {}

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_daily_quest_status (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL,
        date_key        TEXT NOT NULL,
        quest_key       TEXT NOT NULL,
        is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
        completed_at_ms BIGINT,
        created_at      TIMESTAMPTZ DEFAULT NOW(),
        updated_at      TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch (e) { console.error('[schema] user_daily_quest_status table:', String(e)); }
  try { await sql`CREATE UNIQUE INDEX IF NOT EXISTS user_daily_quest_status_unique_idx ON user_daily_quest_status(user_id, date_key, quest_key)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS user_daily_quest_status_user_idx ON user_daily_quest_status(user_id, date_key)`; } catch {}

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_vocab_cards (
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
      )
    `;
  } catch (e) { console.error('[schema] user_vocab_cards table:', String(e)); }
  try { await sql`CREATE INDEX IF NOT EXISTS user_vocab_cards_due_idx ON user_vocab_cards(user_id, due_at ASC)`; } catch {}
  try { await sql`CREATE INDEX IF NOT EXISTS user_vocab_cards_updated_idx ON user_vocab_cards(user_id, updated_at DESC)`; } catch {}

  schemaReady = true;
}

function normalizeDisplayName(input: string): string {
  const trimmed = input.trim().replace(/\s+/g, ' ');
  return trimmed.slice(0, 40);
}

export async function upsertPublicProfile(userId: string, displayName: string): Promise<void> {
  const normalized = normalizeDisplayName(displayName);
  if (!normalized) return;
  const sql = getDb();
  try {
    await sql`
      INSERT INTO user_public_profiles (user_id, display_name, updated_at)
      VALUES (${userId}, ${normalized}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
    `;
  } catch (e) {
    console.error('[db] upsertPublicProfile:', String(e));
  }
}

export async function listRecentPublicDisplayNames(limit = 24): Promise<string[]> {
  const safeLimit = Math.max(1, Math.min(60, Math.floor(limit)));
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT display_name, MAX(updated_at) AS last_seen
      FROM user_public_profiles
      WHERE display_name IS NOT NULL
        AND LENGTH(TRIM(display_name)) > 0
      GROUP BY display_name
      ORDER BY last_seen DESC
      LIMIT ${safeLimit}
    `;
    return rows
      .map((row) => String(row.display_name ?? '').trim())
      .filter((name): name is string => name.length > 0);
  } catch (e) {
    console.error('[db] listRecentPublicDisplayNames:', String(e));
    return [];
  }
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
    if (rows.length === 0 || !rows[0].plan) {
      // Ensure every signed-in user has a row in Neon, including free users.
      await sql`
        INSERT INTO user_plans (user_id, plan)
        VALUES (${userId}, 'free')
        ON CONFLICT (user_id) DO NOTHING
      `;
      return 'free';
    }

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

/**
 * For rolling windows, compute the next reset edge when a user is at/over limit.
 * Returns null when the user is below limit in the given window.
 */
export async function getUsageResetAtMs(
  userId: string,
  args: { windowMs: number; limit: number; nowMs?: number },
): Promise<number | null> {
  const sql = getDb();
  const nowMs = args.nowMs ?? Date.now();
  const windowStartIso = new Date(nowMs - args.windowMs).toISOString();
  const safeLimit = Math.max(1, Math.floor(args.limit));

  try {
    const rows = await sql`
      SELECT created_at
      FROM user_usage
      WHERE user_id = ${userId}
        AND created_at >= ${windowStartIso}::timestamptz
      ORDER BY created_at DESC
      OFFSET ${safeLimit - 1}
      LIMIT 1
    `;

    const anchor = rows[0]?.created_at as Date | string | null | undefined;
    if (!anchor) return null;
    const anchorMs = anchor instanceof Date ? anchor.getTime() : new Date(anchor).getTime();
    if (!Number.isFinite(anchorMs)) return null;
    return anchorMs + args.windowMs;
  } catch (e) {
    console.error('[db] getUsageResetAtMs:', String(e));
    return null;
  }
}

/** Count usage rows in the current calendar month (UTC). */
export async function getMonthlyUsageCount(userId: string): Promise<number> {
  const sql = getDb();
  const now = new Date();
  const monthStartIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const nextMonthStartIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();
  const rows = await sql`
    SELECT COUNT(*)::int AS cnt
    FROM user_usage
    WHERE user_id = ${userId}
      AND created_at >= ${monthStartIso}::timestamptz
      AND created_at < ${nextMonthStartIso}::timestamptz
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

// ── Onboarding assessment & daily plan helpers ───────────────────────────────

export interface UserAssessment {
  userId: string;
  fluency: number;
  accuracy: number;
  pronunciation: number;
  interaction: number;
  overallLevel: string;
  completedAtMs: number;
}

export async function getUserAssessment(userId: string): Promise<UserAssessment | null> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT user_id, fluency, accuracy, pronunciation, interaction, overall_level, completed_at_ms
      FROM user_assessments
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    const r = rows[0];
    if (!r) return null;
    return {
      userId: r.user_id as string,
      fluency: Number(r.fluency),
      accuracy: Number(r.accuracy),
      pronunciation: Number(r.pronunciation),
      interaction: Number(r.interaction),
      overallLevel: r.overall_level as string,
      completedAtMs: Number(r.completed_at_ms),
    };
  } catch (e) {
    console.error('[db] getUserAssessment:', String(e));
    return null;
  }
}

export async function upsertUserAssessment(input: UserAssessment): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO user_assessments (
        user_id, fluency, accuracy, pronunciation, interaction, overall_level, completed_at_ms
      ) VALUES (
        ${input.userId},
        ${input.fluency},
        ${input.accuracy},
        ${input.pronunciation},
        ${input.interaction},
        ${input.overallLevel},
        ${input.completedAtMs}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        fluency         = EXCLUDED.fluency,
        accuracy        = EXCLUDED.accuracy,
        pronunciation   = EXCLUDED.pronunciation,
        interaction     = EXCLUDED.interaction,
        overall_level   = EXCLUDED.overall_level,
        completed_at_ms = EXCLUDED.completed_at_ms,
        updated_at      = NOW()
    `;
  } catch (e) {
    console.error('[db] upsertUserAssessment:', String(e));
    throw e;
  }
}

export async function getDailyPlan(userId: string, dateKey: string): Promise<unknown | null> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT plan_json
      FROM user_daily_plans
      WHERE user_id = ${userId} AND date_key = ${dateKey}
      LIMIT 1
    `;
    return (rows[0]?.plan_json as unknown) ?? null;
  } catch (e) {
    console.error('[db] getDailyPlan:', String(e));
    return null;
  }
}

export async function upsertDailyPlan(userId: string, dateKey: string, plan: unknown): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO user_daily_plans (user_id, date_key, plan_json)
      VALUES (${userId}, ${dateKey}, ${JSON.stringify(plan)}::jsonb)
      ON CONFLICT (user_id, date_key) DO UPDATE SET
        plan_json = EXCLUDED.plan_json,
        created_at = NOW()
    `;
  } catch (e) {
    console.error('[db] upsertDailyPlan:', String(e));
    throw e;
  }
}

export async function getRecentDailyMainScenarioIds(userId: string, limit = 3): Promise<string[]> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT plan_json
      FROM user_daily_plans
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return rows
      .map(r => (r.plan_json as { mainScenarioId?: string } | null)?.mainScenarioId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch (e) {
    console.error('[db] getRecentDailyMainScenarioIds:', String(e));
    return [];
  }
}

// ── User progression helpers ────────────────────────────────────────────────

export interface UserProgressRow {
  xp: number;
  streakDays: number;
}

export async function getUserProgress(userId: string): Promise<UserProgressRow> {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO user_progress (user_id, xp, streak_days)
      VALUES (${userId}, 0, 1)
      ON CONFLICT (user_id) DO NOTHING
    `;
    const rows = await sql`
      SELECT xp, streak_days
      FROM user_progress
      WHERE user_id = ${userId}
      LIMIT 1
    `;
    return {
      xp: Number(rows[0]?.xp ?? 0),
      streakDays: Math.max(1, Number(rows[0]?.streak_days ?? 1)),
    };
  } catch (e) {
    console.error('[db] getUserProgress:', String(e));
    return { xp: 0, streakDays: 1 };
  }
}

export async function addUserXp(userId: string, delta: number): Promise<UserProgressRow> {
  const sql = getDb();
  const safeDelta = Math.floor(delta);
  try {
    const rows = await sql`
      INSERT INTO user_progress (user_id, xp, streak_days)
      VALUES (${userId}, ${Math.max(0, safeDelta)}, 1)
      ON CONFLICT (user_id) DO UPDATE SET
        xp = GREATEST(0, user_progress.xp + ${safeDelta}),
        updated_at = NOW()
      RETURNING xp, streak_days
    `;
    return {
      xp: Number(rows[0]?.xp ?? 0),
      streakDays: Math.max(1, Number(rows[0]?.streak_days ?? 1)),
    };
  } catch (e) {
    console.error('[db] addUserXp:', String(e));
    return getUserProgress(userId);
  }
}

export interface UserPracticeMessage {
  timestamp: number;
  content: string;
}

// ── Personalization helpers ────────────────────────────────────────────────

export async function listUserMemoryFacts(userId: string, limit = 20): Promise<UserMemoryFact[]> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT id, user_id, kind, memory_key, memory_value, confidence, updated_at_ms
      FROM user_memory_facts
      WHERE user_id = ${userId}
      ORDER BY updated_at_ms DESC
      LIMIT ${Math.max(1, Math.min(100, Math.floor(limit)))}
    `;
    return rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      kind: String(row.kind) as UserMemoryFact['kind'],
      key: String(row.memory_key),
      value: String(row.memory_value),
      confidence: Number(row.confidence ?? 0.5),
      updatedAtMs: Number(row.updated_at_ms),
    }));
  } catch (e) {
    console.error('[db] listUserMemoryFacts:', String(e));
    return [];
  }
}

export async function upsertUserMemoryFact(userId: string, candidate: MemoryCandidate): Promise<void> {
  const sql = getDb();
  const now = Date.now();
  const id = `${userId}:${candidate.kind}:${candidate.key}:${candidate.value}`.slice(0, 240);
  try {
    await sql`
      INSERT INTO user_memory_facts (
        id, user_id, kind, memory_key, memory_value, confidence, updated_at_ms
      ) VALUES (
        ${id},
        ${userId},
        ${candidate.kind},
        ${candidate.key},
        ${candidate.value},
        ${Math.max(0, Math.min(1, candidate.confidence))},
        ${now}
      )
      ON CONFLICT (id) DO UPDATE SET
        confidence = EXCLUDED.confidence,
        updated_at_ms = EXCLUDED.updated_at_ms
    `;
  } catch (e) {
    console.error('[db] upsertUserMemoryFact:', String(e));
  }
}

export async function saveChatRoundProfile(input: {
  id: string;
  userId: string;
  conversationId?: string;
  variant: PersonalizationVariant;
  difficultyBand: string;
  challengeInterval: number;
  correctionMode: string;
  maxSentenceLen: string;
  reasons: string[];
  createdAtMs: number;
}): Promise<void> {
  const sql = getDb();
  try {
    await sql`
      INSERT INTO chat_round_profiles (
        id, user_id, conversation_id, variant, difficulty_band, challenge_interval,
        correction_mode, max_sentence_len, reason_json, created_at_ms
      ) VALUES (
        ${input.id},
        ${input.userId},
        ${input.conversationId ?? null},
        ${input.variant},
        ${input.difficultyBand},
        ${Math.max(1, Math.floor(input.challengeInterval))},
        ${input.correctionMode},
        ${input.maxSentenceLen},
        ${JSON.stringify(input.reasons)}::jsonb,
        ${input.createdAtMs}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (e) {
    console.error('[db] saveChatRoundProfile:', String(e));
  }
}

export async function hasClaimedMissionReward(userId: string, dateKey: string): Promise<boolean> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT id
      FROM user_mission_rewards
      WHERE user_id = ${userId} AND date_key = ${dateKey}
      LIMIT 1
    `;
    return rows.length > 0;
  } catch (e) {
    console.error('[db] hasClaimedMissionReward:', String(e));
    return false;
  }
}

export async function claimMissionReward(args: {
  userId: string;
  dateKey: string;
  rewardXp: number;
}): Promise<{ claimed: boolean; xp: number; streakDays: number; rewardXp: number }> {
  const sql = getDb();
  const rewardXp = Math.max(0, Math.floor(args.rewardXp));
  const id = `${args.userId}:${args.dateKey}`.slice(0, 240);
  try {
    const rows = await sql`
      INSERT INTO user_mission_rewards (id, user_id, date_key, reward_xp, created_at_ms)
      VALUES (${id}, ${args.userId}, ${args.dateKey}, ${rewardXp}, ${Date.now()})
      ON CONFLICT (user_id, date_key) DO NOTHING
      RETURNING id
    `;
    if (rows.length === 0) {
      const progress = await getUserProgress(args.userId);
      return { claimed: false, xp: progress.xp, streakDays: progress.streakDays, rewardXp };
    }
    const progress = await addUserXp(args.userId, rewardXp);
    return { claimed: true, xp: progress.xp, streakDays: progress.streakDays, rewardXp };
  } catch (e) {
    console.error('[db] claimMissionReward:', String(e));
    const progress = await getUserProgress(args.userId);
    return { claimed: false, xp: progress.xp, streakDays: progress.streakDays, rewardXp };
  }
}

export interface DailyQuestStatus {
  mainCompleted: boolean;
  bonusCompleted: boolean;
}

export async function getDailyQuestStatus(userId: string, dateKey: string): Promise<DailyQuestStatus> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT quest_key, is_completed
      FROM user_daily_quest_status
      WHERE user_id = ${userId} AND date_key = ${dateKey}
    `;
    let mainCompleted = false;
    let bonusCompleted = false;
    for (const row of rows) {
      const key = String(row.quest_key ?? '');
      const completed = Boolean(row.is_completed);
      if (key === 'main' && completed) mainCompleted = true;
      if (key === 'bonus' && completed) bonusCompleted = true;
    }
    return { mainCompleted, bonusCompleted };
  } catch (e) {
    console.error('[db] getDailyQuestStatus:', String(e));
    return { mainCompleted: false, bonusCompleted: false };
  }
}

export async function completeDailyQuest(args: {
  userId: string;
  dateKey: string;
  questKey: 'main' | 'bonus';
}): Promise<void> {
  const sql = getDb();
  const now = Date.now();
  const id = `${args.userId}:${args.dateKey}:${args.questKey}`.slice(0, 240);
  try {
    await sql`
      INSERT INTO user_daily_quest_status (
        id, user_id, date_key, quest_key, is_completed, completed_at_ms
      ) VALUES (
        ${id}, ${args.userId}, ${args.dateKey}, ${args.questKey}, TRUE, ${now}
      )
      ON CONFLICT (user_id, date_key, quest_key) DO UPDATE SET
        is_completed = TRUE,
        completed_at_ms = COALESCE(user_daily_quest_status.completed_at_ms, EXCLUDED.completed_at_ms),
        updated_at = NOW()
    `;
  } catch (e) {
    console.error('[db] completeDailyQuest:', String(e));
  }
}

export async function listUserPracticeMessagesSince(userId: string, sinceMs: number): Promise<UserPracticeMessage[]> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT timestamp, content
      FROM messages
      WHERE user_id = ${userId}
        AND role = 'user'
        AND timestamp >= ${sinceMs}
      ORDER BY timestamp ASC
    `;
    return rows.map((r) => ({
      timestamp: Number(r.timestamp),
      content: String(r.content ?? ''),
    }));
  } catch (e) {
    console.error('[db] listUserPracticeMessagesSince:', String(e));
    return [];
  }
}

export async function listConversationPracticeMessagesSince(
  userId: string,
  conversationId: string,
  sinceMs: number,
): Promise<UserPracticeMessage[]> {
  const sql = getDb();
  try {
    const rows = await sql`
      SELECT timestamp, content
      FROM messages
      WHERE user_id = ${userId}
        AND role = 'user'
        AND conversation_id = ${conversationId}
        AND timestamp >= ${sinceMs}
      ORDER BY timestamp ASC
    `;
    return rows.map((r) => ({
      timestamp: Number(r.timestamp),
      content: String(r.content ?? ''),
    }));
  } catch (e) {
    console.error('[db] listConversationPracticeMessagesSince:', String(e));
    return [];
  }
}

function toMs(value: Date | string | number | null | undefined): number {
  if (value == null) return Date.now();
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function mapVocabCardRow(row: Record<string, unknown>): VocabCard {
  return {
    id: String(row.id),
    phrase: String(row.phrase ?? ''),
    meaning: String(row.meaning ?? ''),
    example: String(row.example ?? ''),
    source: row.source === 'chat' ? 'chat' : 'manual',
    easeFactor: Number(row.ease_factor ?? 2.5),
    intervalDays: Number(row.interval_days ?? 0),
    dueAt: toMs(row.due_at as Date | string | number | null | undefined),
    reviewCount: Number(row.review_count ?? 0),
    correctCount: Number(row.correct_count ?? 0),
    createdAt: toMs(row.created_at as Date | string | number | null | undefined),
    updatedAt: toMs(row.updated_at as Date | string | number | null | undefined),
  };
}

function normalizeVocabText(input: string, maxLen: number): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLen);
}

export async function listVocabCards(userId: string, limit = 80): Promise<VocabCard[]> {
  const sql = getDb();
  const safeLimit = Math.max(1, Math.min(300, Math.floor(limit)));
  try {
    const rows = await sql`
      SELECT
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
      FROM user_vocab_cards
      WHERE user_id = ${userId}
      ORDER BY due_at ASC, updated_at DESC
      LIMIT ${safeLimit}
    `;
    return rows.map((row) => mapVocabCardRow(row as Record<string, unknown>));
  } catch (e) {
    console.error('[db] listVocabCards:', String(e));
    return [];
  }
}

export async function listDueVocabCards(userId: string, limit = 20, nowMs = Date.now()): Promise<VocabCard[]> {
  const sql = getDb();
  const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
  const nowIso = new Date(nowMs).toISOString();
  try {
    const rows = await sql`
      SELECT
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
      FROM user_vocab_cards
      WHERE user_id = ${userId}
        AND due_at <= ${nowIso}::timestamptz
      ORDER BY due_at ASC
      LIMIT ${safeLimit}
    `;
    return rows.map((row) => mapVocabCardRow(row as Record<string, unknown>));
  } catch (e) {
    console.error('[db] listDueVocabCards:', String(e));
    return [];
  }
}

export async function createVocabCard(args: {
  userId: string;
  phrase: string;
  meaning?: string;
  example?: string;
  source?: 'manual' | 'chat';
}): Promise<VocabCard | null> {
  const sql = getDb();
  const phrase = normalizeVocabText(args.phrase, 200);
  const meaning = normalizeVocabText(args.meaning ?? '', 600);
  const example = normalizeVocabText(args.example ?? '', 600);
  if (!phrase) return null;

  const nowIso = new Date().toISOString();
  const id = `${args.userId}:${phrase.toLowerCase()}`.slice(0, 240);

  try {
    const rows = await sql`
      INSERT INTO user_vocab_cards (
        id, user_id, phrase, meaning, example, source,
        ease_factor, interval_days, due_at, review_count, correct_count, updated_at
      ) VALUES (
        ${id}, ${args.userId}, ${phrase}, ${meaning}, ${example}, ${args.source ?? 'manual'},
        2.5, 0, ${nowIso}::timestamptz, 0, 0, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        meaning = CASE
          WHEN LENGTH(TRIM(EXCLUDED.meaning)) > 0 THEN EXCLUDED.meaning
          ELSE user_vocab_cards.meaning
        END,
        example = CASE
          WHEN LENGTH(TRIM(EXCLUDED.example)) > 0 THEN EXCLUDED.example
          ELSE user_vocab_cards.example
        END,
        source = EXCLUDED.source,
        updated_at = NOW()
      RETURNING
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    return row ? mapVocabCardRow(row) : null;
  } catch (e) {
    console.error('[db] createVocabCard:', String(e));
    return null;
  }
}

export async function updateVocabCard(args: {
  userId: string;
  cardId: string;
  phrase?: string;
  meaning?: string;
  example?: string;
}): Promise<VocabCard | null> {
  const sql = getDb();
  const cardId = normalizeVocabText(args.cardId, 240);
  if (!cardId) return null;

  const phrase = typeof args.phrase === 'string'
    ? normalizeVocabText(args.phrase, 200)
    : undefined;
  const meaning = typeof args.meaning === 'string'
    ? normalizeVocabText(args.meaning, 600)
    : undefined;
  const example = typeof args.example === 'string'
    ? normalizeVocabText(args.example, 600)
    : undefined;

  if (phrase === undefined && meaning === undefined && example === undefined) {
    return null;
  }
  if (phrase !== undefined && !phrase) {
    return null;
  }

  try {
    const rows = await sql`
      UPDATE user_vocab_cards
      SET
        phrase = COALESCE(${phrase ?? null}, phrase),
        meaning = COALESCE(${meaning ?? null}, meaning),
        example = COALESCE(${example ?? null}, example),
        updated_at = NOW()
      WHERE id = ${cardId} AND user_id = ${args.userId}
      RETURNING
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
    `;
    const row = rows[0] as Record<string, unknown> | undefined;
    return row ? mapVocabCardRow(row) : null;
  } catch (e) {
    console.error('[db] updateVocabCard:', String(e));
    return null;
  }
}

export async function deleteVocabCard(args: { userId: string; cardId: string }): Promise<boolean> {
  const sql = getDb();
  const cardId = normalizeVocabText(args.cardId, 240);
  if (!cardId) return false;

  try {
    const rows = await sql`
      DELETE FROM user_vocab_cards
      WHERE id = ${cardId} AND user_id = ${args.userId}
      RETURNING id
    `;
    return rows.length > 0;
  } catch (e) {
    console.error('[db] deleteVocabCard:', String(e));
    return false;
  }
}

function nextReviewState(current: {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  correctCount: number;
}, rating: VocabReviewRating): {
  easeFactor: number;
  intervalDays: number;
  reviewCount: number;
  correctCount: number;
} {
  const currentEase = Number.isFinite(current.easeFactor) ? current.easeFactor : 2.5;
  let easeFactor = Math.max(1.3, Math.min(3.0, currentEase));
  const baseInterval = Math.max(0, Math.floor(current.intervalDays));
  let intervalDays = baseInterval;
  let correctCount = Math.max(0, Math.floor(current.correctCount));
  const reviewCount = Math.max(0, Math.floor(current.reviewCount)) + 1;

  if (rating === 'again') {
    intervalDays = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    intervalDays = Math.max(1, Math.round((baseInterval || 1) * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.05);
    correctCount += 1;
  } else if (rating === 'good') {
    intervalDays = Math.max(1, Math.round((baseInterval || 1) * easeFactor));
    correctCount += 1;
  } else {
    intervalDays = Math.max(2, Math.round((baseInterval || 1) * easeFactor * 1.3));
    easeFactor = Math.min(3.0, easeFactor + 0.05);
    correctCount += 1;
  }

  return { easeFactor, intervalDays, reviewCount, correctCount };
}

export async function reviewVocabCard(args: {
  userId: string;
  cardId: string;
  rating: VocabReviewRating;
  nowMs?: number;
}): Promise<VocabCard | null> {
  const sql = getDb();
  const cardId = normalizeVocabText(args.cardId, 240);
  if (!cardId) return null;

  const nowMs = args.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  try {
    const currentRows = await sql`
      SELECT
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
      FROM user_vocab_cards
      WHERE id = ${cardId} AND user_id = ${args.userId}
      LIMIT 1
    `;
    const current = currentRows[0] as Record<string, unknown> | undefined;
    if (!current) return null;

    const next = nextReviewState({
      easeFactor: Number(current.ease_factor ?? 2.5),
      intervalDays: Number(current.interval_days ?? 0),
      reviewCount: Number(current.review_count ?? 0),
      correctCount: Number(current.correct_count ?? 0),
    }, args.rating);
    const nextDueIso = new Date(nowMs + next.intervalDays * 24 * 60 * 60 * 1000).toISOString();

    const updatedRows = await sql`
      UPDATE user_vocab_cards
      SET
        ease_factor = ${next.easeFactor},
        interval_days = ${next.intervalDays},
        due_at = ${nextDueIso}::timestamptz,
        review_count = ${next.reviewCount},
        correct_count = ${next.correctCount},
        updated_at = ${nowIso}::timestamptz
      WHERE id = ${cardId} AND user_id = ${args.userId}
      RETURNING
        id, phrase, meaning, example, source, ease_factor, interval_days,
        due_at, review_count, correct_count, created_at, updated_at
    `;

    const updated = updatedRows[0] as Record<string, unknown> | undefined;
    return updated ? mapVocabCardRow(updated) : null;
  } catch (e) {
    console.error('[db] reviewVocabCard:', String(e));
    return null;
  }
}
