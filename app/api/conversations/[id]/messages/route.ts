import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { loadConversationMessages, saveMessageToConversation, ensureSchema } from '@/lib/db';
import type { Message } from '@/types';

const VALID_ROLES = new Set(['user', 'assistant', 'system']);
const MAX_CONTENT_LEN = 32_000;

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

    try { await ensureSchema(); } catch {}

    const messages = await loadConversationMessages(id, userId);
    console.log('[GET /api/conversations/[id]/messages]', id.slice(0, 8), '→', messages.length, 'msgs');
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

    try { await ensureSchema(); } catch {}

    const raw = await req.json();
    if (
      typeof raw?.id !== 'string' || !raw.id.trim() ||
      typeof raw?.role !== 'string' || !VALID_ROLES.has(raw.role) ||
      typeof raw?.content !== 'string' || !raw.content.trim() ||
      typeof raw?.timestamp !== 'number' || !Number.isFinite(raw.timestamp)
    ) {
      return NextResponse.json({ error: 'Invalid message payload' }, { status: 400 });
    }
    const msg: Message = {
      id: raw.id.trim().slice(0, 100),
      role: raw.role as Message['role'],
      content: raw.content.slice(0, MAX_CONTENT_LEN),
      timestamp: raw.timestamp,
    };
    await saveMessageToConversation(id, userId, msg);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('POST /api/conversations/[id]/messages', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
