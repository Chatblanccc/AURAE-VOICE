import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { deleteConversation, touchConversation } from '@/lib/db';

type S = { user?: { id?: string } | null } | null;

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await deleteConversation(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/conversations/[id]', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth() as S;
    const userId = session?.user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await touchConversation(id, userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('PATCH /api/conversations/[id]', e);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
