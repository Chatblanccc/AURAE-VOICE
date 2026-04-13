import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureSchema, getUserAssessment, upsertUserAssessment } from '@/lib/db';

type S = { user?: { id?: string } | null } | null;

const VALID_LEVELS = new Set(['A0', 'A1', 'A2', 'B1', 'B2']);

export async function GET() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureSchema();
  const assessment = await getUserAssessment(userId);
  return NextResponse.json({ assessment });
}

export async function POST(req: Request) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    fluency: number;
    accuracy: number;
    pronunciation: number;
    interaction: number;
    overallLevel: string;
    completedAtMs?: number;
  };

  const scores = [body.fluency, body.accuracy, body.pronunciation, body.interaction];
  if (scores.some(s => !Number.isFinite(s) || s < 1 || s > 5) || !VALID_LEVELS.has(body.overallLevel)) {
    return NextResponse.json({ error: 'Invalid assessment payload' }, { status: 400 });
  }

  await ensureSchema();
  await upsertUserAssessment({
    userId,
    fluency: body.fluency,
    accuracy: body.accuracy,
    pronunciation: body.pronunciation,
    interaction: body.interaction,
    overallLevel: body.overallLevel,
    completedAtMs: body.completedAtMs ?? Date.now(),
  });

  return NextResponse.json({ ok: true });
}
