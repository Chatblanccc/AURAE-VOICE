import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listConversations, createConversation, ensureSchema } from '@/lib/db';
import type { Conversation } from '@/types';

type S = { user?: { id?: string } | null } | null;

export async function GET() {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    await ensureSchema();
    const convs = await listConversations(userId);
    return NextResponse.json(convs);
  } catch (e) {
    console.error('GET /api/conversations', e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body: Conversation = await req.json();
    await createConversation(userId, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/conversations', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
