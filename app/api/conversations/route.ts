import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listConversations, createConversation, ensureSchema } from '@/lib/db';
import type { Conversation } from '@/types';

type S = { user?: { id?: string } | null } | null;

export async function GET() {
  const session = await auth() as S;
  const userId = session?.user?.id;

  console.log('[GET /api/conversations] userId:', userId ?? 'MISSING');
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Run migration — don't let failures block the query (tables may already exist)
  try {
    await ensureSchema();
    console.log('[GET /api/conversations] ensureSchema OK');
  } catch (e) {
    console.error('[GET /api/conversations] ensureSchema error (non-fatal):', String(e));
  }

  try {
    const convs = await listConversations(userId);
    console.log('[GET /api/conversations] found', convs.length, 'conversations');
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

  try {
    await ensureSchema();
  } catch (e) {
    console.error('[POST /api/conversations] ensureSchema error (non-fatal):', String(e));
  }

  try {
    const body: Conversation = await req.json();
    await createConversation(userId, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/conversations] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
