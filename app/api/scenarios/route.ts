import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureSchema, getUserPlan, getUserAssessment } from '@/lib/db';
import { getAccessibleScenarios, pickRecommendedScenarios } from '@/lib/plus-content/runtime';

type S = { user?: { id?: string } | null } | null;

export async function GET() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureSchema();
  const plan = await getUserPlan(userId);
  const assessment = await getUserAssessment(userId);
  const scenarios = getAccessibleScenarios(plan);
  const recommended = pickRecommendedScenarios(plan, assessment?.overallLevel, 3);

  return NextResponse.json({
    plan,
    total: scenarios.length,
    scenarios,
    recommended,
  });
}
