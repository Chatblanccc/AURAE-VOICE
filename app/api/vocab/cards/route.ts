import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import {
  createVocabCard,
  deleteVocabCard,
  ensureSchema,
  listDueVocabCards,
  listVocabCards,
  updateVocabCard,
} from '@/lib/db';

type S = { user?: { id?: string } | null } | null;

const createSchema = z.object({
  phrase: z.string().min(1).max(200),
  meaning: z.string().max(600).optional(),
  example: z.string().max(600).optional(),
  source: z.enum(['manual', 'chat']).optional(),
});

const updateSchema = z.object({
  cardId: z.string().min(1).max(240),
  phrase: z.string().min(1).max(200).optional(),
  meaning: z.string().max(600).optional(),
  example: z.string().max(600).optional(),
});

const deleteSchema = z.object({
  cardId: z.string().min(1).max(240),
});

export async function GET(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dueOnly = req.nextUrl.searchParams.get('dueOnly') === '1';
  const rawLimit = Number(req.nextUrl.searchParams.get('limit') ?? 40);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(100, Math.floor(rawLimit))) : 40;

  try {
    await ensureSchema();
    const cards = dueOnly
      ? await listDueVocabCards(userId, limit)
      : await listVocabCards(userId, limit);
    return NextResponse.json({ cards, dueOnly, total: cards.length });
  } catch (e) {
    console.error('[GET /api/vocab/cards] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const card = await createVocabCard({
      userId,
      phrase: parsed.data.phrase,
      meaning: parsed.data.meaning,
      example: parsed.data.example,
      source: parsed.data.source ?? 'manual',
    });
    if (!card) {
      return NextResponse.json({ error: 'Could not create card' }, { status: 400 });
    }
    return NextResponse.json({ ok: true, card });
  } catch (e) {
    console.error('[POST /api/vocab/cards] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  if (
    parsed.data.phrase === undefined &&
    parsed.data.meaning === undefined &&
    parsed.data.example === undefined
  ) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const card = await updateVocabCard({
      userId,
      cardId: parsed.data.cardId,
      phrase: parsed.data.phrase,
      meaning: parsed.data.meaning,
      example: parsed.data.example,
    });
    if (!card) {
      return NextResponse.json({ error: 'Card not found or invalid update' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, card });
  } catch (e) {
    console.error('[PATCH /api/vocab/cards] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = deleteSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const deleted = await deleteVocabCard({
      userId,
      cardId: parsed.data.cardId,
    });
    if (!deleted) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DELETE /api/vocab/cards] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
