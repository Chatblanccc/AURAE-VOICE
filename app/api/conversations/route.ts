import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listConversations, createConversation, ensureSchema } from '@/lib/db';
import type { Conversation } from '@/types';

const MAX_TITLE_LEN = 200;

type S = { user?: { id?: string } | null } | null;

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
      typeof raw?.updated_at !== 'number' ||
      !Number.isFinite(raw.created_at) ||
      !Number.isFinite(raw.updated_at)
    ) {
      return NextResponse.json({ error: 'Invalid conversation payload' }, { status: 400 });
    }
    const body: Conversation = {
      id: raw.id.trim().slice(0, 100),
      title: raw.title.slice(0, MAX_TITLE_LEN),
      persona: raw.persona === 'trump' ? 'trump' : 'alex',
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
