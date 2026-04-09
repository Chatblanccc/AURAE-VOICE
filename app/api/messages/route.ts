import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { loadMessages, saveMessage, clearMessages } from '@/lib/db';
import type { Message } from '@/types';

export const runtime = 'nodejs';

const VALID_ROLES = new Set(['user', 'assistant', 'system']);
const MAX_CONTENT_LEN = 32_000;

function getSessionUserId(session: { user?: { id?: string } | null } | null | undefined) {
  return session?.user?.id;
}

export async function GET() {
  const session = await auth() as { user?: { id?: string } | null } | null;
  const userId = getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const messages = await loadMessages(userId);
    return NextResponse.json(messages);
  } catch (e) {
    console.error('[GET /api/messages]', e);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth() as { user?: { id?: string } | null } | null;
  const userId = getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const raw = await req.json();
  if (
    typeof raw?.id !== 'string' || !raw.id.trim() ||
    typeof raw?.role !== 'string' || !VALID_ROLES.has(raw.role) ||
    typeof raw?.content !== 'string' || !raw.content.trim() ||
    typeof raw?.timestamp !== 'number'
  ) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }
  const msg: Message = {
    id: raw.id.trim().slice(0, 100),
    role: raw.role as Message['role'],
    content: raw.content.slice(0, MAX_CONTENT_LEN),
    timestamp: raw.timestamp,
  };
  try {
    await saveMessage(userId, msg);
  } catch (e) { console.error('[POST /api/messages]', e); }
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth() as { user?: { id?: string } | null } | null;
  const userId = getSessionUserId(session);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    await clearMessages(userId);
  } catch (e) { console.error('[DELETE /api/messages]', e); }
  return NextResponse.json({ ok: true });
}
