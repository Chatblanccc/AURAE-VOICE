import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listConversations, createConversation, ensureSchema, migrateAllUuidUsers } from '@/lib/db';
import type { Conversation } from '@/types';

const MAX_TITLE_LEN = 200;

type S = { user?: { id?: string } | null } | null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
let migrationDone = false;

export async function GET() {
  const session = await auth() as S;
  const userId = session?.user?.id;

  if (!userId) {
    console.log('[GET /api/conversations] no userId in session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try { await ensureSchema(); } catch (e) {
    console.error('[GET /api/conversations] ensureSchema (non-fatal):', String(e));
  }

  // Dangerous in multi-tenant deployments: assigns ALL legacy UUID rows to one user.
  // Only run when explicitly enabled (e.g. single-user maintenance window).
  if (
    process.env.LEGACY_UUID_MIGRATION_ENABLED === 'true' &&
    !migrationDone &&
    !UUID_RE.test(userId)
  ) {
    migrationDone = true;
    try {
      await migrateAllUuidUsers(userId);
    } catch (e) {
      console.error('[GET /api/conversations] migration error (non-fatal):', String(e));
      migrationDone = false;
    }
  }

  try {
    const convs = await listConversations(userId);
    console.log('[GET /api/conversations]', userId.slice(0, 12), '→', convs.length, 'conversations');
    return NextResponse.json(convs);
  } catch (e) {
    console.error('[GET /api/conversations] listConversations error:', String(e));
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth() as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try { await ensureSchema(); } catch (e) {
    console.error('[POST /api/conversations] ensureSchema (non-fatal):', String(e));
  }

  try {
    const raw = await req.json();
    if (
      typeof raw?.id !== 'string' || !raw.id.trim() ||
      typeof raw?.title !== 'string' ||
      typeof raw?.created_at !== 'number' ||
      typeof raw?.updated_at !== 'number'
    ) {
      return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 });
    }
    const body: Conversation = {
      id: raw.id.trim().slice(0, 100),
      title: raw.title.slice(0, MAX_TITLE_LEN),
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    };
    await createConversation(userId, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/conversations] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
