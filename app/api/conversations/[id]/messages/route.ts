import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { loadConversationMessages, saveMessageToConversation } from '@/lib/db';
import type { Message } from '@/types';

type S = { user?: { id?: string } | null } | null;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const messages = await loadConversationMessages(id, userId);
    return NextResponse.json(messages);
  } catch (e) {
    console.error('GET /api/conversations/[id]/messages', e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const msg: Message = await req.json();
    await saveMessageToConversation(id, userId, msg);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/conversations/[id]/messages', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
