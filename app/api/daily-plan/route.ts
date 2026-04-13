import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  ensureSchema,
  getUserPlan,
  getUserAssessment,
  getDailyPlan,
  upsertDailyPlan,
  getRecentDailyMainScenarioIds,
} from '@/lib/db';
import { buildDailyPlan, getScenarioById, getAccessibleScenarios } from '@/lib/plus-content/runtime';

type S = { user?: { id?: string } | null } | null;

function dateKeyUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export async function GET() {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await ensureSchema();
  const key = dateKeyUtc();
  const cached = await getDailyPlan(userId, key);
  if (cached) return NextResponse.json({ dateKey: key, plan: cached, cached: true });

  const planTier = await getUserPlan(userId);
  const assessment = await getUserAssessment(userId);
  const weakScores = assessment
    ? [
        ['fluency', assessment.fluency],
        ['accuracy', assessment.accuracy],
        ['pronunciation', assessment.pronunciation],
        ['interaction', assessment.interaction],
      ] as const
    : null;
  const weakDimension = weakScores
    ? [...weakScores].sort((a, b) => a[1] - b[1])[0][0]
    : 'fluency';
  const recentScenarioIds = await getRecentDailyMainScenarioIds(userId, 3);

  const generated = buildDailyPlan({
    date: key,
    plan: planTier,
    overallLevel: assessment?.overallLevel,
    weakDimension,
    recentScenarioIds,
  });

  const main = getScenarioById(generated.mainScenarioId);
  const backups = generated.backupScenarioIds
    .map(id => getScenarioById(id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  const accessibleMap = new Set(getAccessibleScenarios(planTier).map(s => s.scenarioId));
  if (!accessibleMap.has(generated.mainScenarioId)) {
    return NextResponse.json({ error: 'No accessible scenario for plan' }, { status: 400 });
  }

  const payload = {
    ...generated,
    mainScenario: main,
    backupScenarios: backups,
  };
  await upsertDailyPlan(userId, key, payload);

  return NextResponse.json({ dateKey: key, plan: payload, cached: false });
}
