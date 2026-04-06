import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { loadMessages, saveMessage, clearMessages } from '@/lib/db';
import type { Message } from '@/types';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/** GET /api/messages — return all messages for the signed-in user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  try {
    const messages = await loadMessages(session.user.id);
    return NextResponse.json(messages);
  } catch (e) {
    console.error('[GET /api/messages]', e);
    // Return empty array so the client falls back to the welcome message
    return NextResponse.json([]);
  }
}

/** POST /api/messages — persist a single message */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const msg: Message = await req.json();
  if (!msg.id || !msg.role || !msg.content) {
    return NextResponse.json({ error: 'Invalid message' }, { status: 400 });
  }

  try {
    await saveMessage(session.user.id, msg);
  } catch (e) {
    console.error('[POST /api/messages]', e);
    // Non-fatal — the UI still works even if persistence fails
  }
  return NextResponse.json({ ok: true });
}

/** DELETE /api/messages — wipe all messages for the signed-in user */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  try {
    await clearMessages(session.user.id);
  } catch (e) {
    console.error('[DELETE /api/messages]', e);
  }
  return NextResponse.json({ ok: true });
}
