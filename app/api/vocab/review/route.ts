import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { ensureSchema, reviewVocabCard } from '@/lib/db';
import type { VocabReviewRating } from '@/types';

type S = { user?: { id?: string } | null } | null;

const reviewSchema = z.object({
  cardId: z.string().min(1).max(240),
  rating: z.enum(['again', 'hard', 'good', 'easy']),
});

export async function POST(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const card = await reviewVocabCard({
      userId,
      cardId: parsed.data.cardId,
      rating: parsed.data.rating as VocabReviewRating,
    });
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, card });
  } catch (e) {
    console.error('[POST /api/vocab/review] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
