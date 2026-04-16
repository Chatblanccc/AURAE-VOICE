import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  claimMissionReward,
  completeDailyQuest,
  ensureSchema,
  getDailyPlan,
  getDailyQuestStatus,
  hasClaimedMissionReward,
  listConversationPracticeMessagesSince,
  listUserPracticeMessagesSince,
} from '@/lib/db';
import type { MissionProgressInfo } from '@/types';

type S = { user?: { id?: string } | null } | null;

function dateKeyUtc(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function estimateActivePracticeMs(messages: Array<{ timestamp: number; content: string }>): number {
  if (messages.length === 0) return 0;
  let total = 0;

  for (let i = 0; i < messages.length; i += 1) {
    const current = messages[i];
    const text = current.content.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const chars = text.length;
    const speechUnits = Math.max(words, Math.ceil(chars / 4));
    const speechMs = Math.min(30_000, Math.max(4_000, speechUnits * 700));
    total += speechMs;

    if (i < messages.length - 1) {
      const next = messages[i + 1];
      const delta = next.timestamp - current.timestamp;
      // Ignore long idle gaps; only count engaged interaction gaps.
      if (delta > 0 && delta <= 90_000) {
        total += Math.min(delta, 30_000);
      }
    }
  }

  return total;
}

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const DAILY_MISSION_REWARD_XP = 30;

export async function GET(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const key = dateKeyUtc();
    const startOfDayMs = Date.parse(`${key}T00:00:00.000Z`);
    const conversationId = req.nextUrl.searchParams.get('conversationId')?.trim() ?? '';
    const validConversationId = conversationId && SAFE_ID_RE.test(conversationId) ? conversationId : null;

    const plan = await getDailyPlan(userId, key) as null | { suggestedDurationMin?: number };
    const suggestedDurationMin = Number(plan?.suggestedDurationMin ?? 15);
    const targetMs = Math.max(60_000, suggestedDurationMin * 60_000);

    const messages = validConversationId
      ? await listConversationPracticeMessagesSince(userId, validConversationId, startOfDayMs)
      : await listUserPracticeMessagesSince(userId, startOfDayMs);
    const practicedMs = estimateActivePracticeMs(messages);
    const progressPercent = Math.min(100, Math.round((practicedMs / targetMs) * 100));
    const rewardClaimed = await hasClaimedMissionReward(userId, key);
    const questStatus = await getDailyQuestStatus(userId, key);

    const payload: MissionProgressInfo = {
      dateKey: key,
      practicedMs,
      targetMs,
      progressPercent,
      messageCount: messages.length,
      rewardClaimed,
      rewardXp: DAILY_MISSION_REWARD_XP,
      questStatus,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error('[GET /api/mission-progress] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = (await auth()) as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const key = dateKeyUtc();
    const startOfDayMs = Date.parse(`${key}T00:00:00.000Z`);
    const body = await req.json().catch(() => ({})) as {
      action?: 'claim_reward' | 'complete_quest';
      conversationId?: string;
      scenarioId?: string;
    };
    const action = body.action ?? 'claim_reward';
    const conversationId = body.conversationId?.trim() ?? '';
    const validConversationId = conversationId && SAFE_ID_RE.test(conversationId) ? conversationId : null;
    const scenarioId = body.scenarioId?.trim() ?? '';
    const validScenarioId = scenarioId && SAFE_ID_RE.test(scenarioId) ? scenarioId : null;

    if (action === 'complete_quest') {
      const plan = await getDailyPlan(userId, key) as null | { mainScenarioId?: string };
      const mainScenarioId = typeof plan?.mainScenarioId === 'string' ? plan.mainScenarioId : null;
      if (!validScenarioId) {
        return NextResponse.json({ error: 'Invalid scenarioId' }, { status: 400 });
      }
      const questKey = validScenarioId === mainScenarioId ? 'main' : 'bonus';
      await completeDailyQuest({ userId, dateKey: key, questKey });
      const questStatus = await getDailyQuestStatus(userId, key);
      return NextResponse.json({ ok: true, dateKey: key, questStatus, questKey, scenarioId: validScenarioId });
    }

    const plan = await getDailyPlan(userId, key) as null | { suggestedDurationMin?: number };
    const suggestedDurationMin = Number(plan?.suggestedDurationMin ?? 15);
    const targetMs = Math.max(60_000, suggestedDurationMin * 60_000);

    const messages = validConversationId
      ? await listConversationPracticeMessagesSince(userId, validConversationId, startOfDayMs)
      : await listUserPracticeMessagesSince(userId, startOfDayMs);
    const practicedMs = estimateActivePracticeMs(messages);
    const progressPercent = Math.min(100, Math.round((practicedMs / targetMs) * 100));
    if (progressPercent < 100) {
      return NextResponse.json(
        { error: 'mission_not_completed', progressPercent, targetMs, practicedMs },
        { status: 400 },
      );
    }

    const reward = await claimMissionReward({
      userId,
      dateKey: key,
      rewardXp: DAILY_MISSION_REWARD_XP,
    });

    return NextResponse.json({
      ok: true,
      dateKey: key,
      claimed: reward.claimed,
      rewardXp: reward.rewardXp,
      xp: reward.xp,
      streakDays: reward.streakDays,
    });
  } catch (e) {
    console.error('[POST /api/mission-progress] error:', String(e));
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
