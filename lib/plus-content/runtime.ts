import catalog from '@/lib/plus-content/scenario-catalog.json';
import rules from '@/lib/plus-content/daily-plan-agent-rules.json';
import type { UserPlan } from '@/types';

type ScenarioLevel = 'beginner' | 'intermediate' | 'advanced';

type ScenarioItem = {
  scenarioId: string;
  category: string;
  level: ScenarioLevel;
  titleEn: string;
  titleZh: string;
  objective: string;
};

type DailyPlan = {
  date: string;
  goal: string;
  mainScenarioId: string;
  backupScenarioIds: string[];
  focusCorrections: string[];
  suggestedDurationMin: number;
  reflectionQuestion: string;
  allowFreeChat: true;
};

const LEVEL_RANK: Record<ScenarioLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

function mapOverallToScenarioLevel(overallLevel?: string): ScenarioLevel {
  if (!overallLevel) return 'beginner';
  if (overallLevel === 'B2') return 'advanced';
  if (overallLevel === 'B1' || overallLevel === 'A2') return 'intermediate';
  return 'beginner';
}

export function getAccessibleScenarios(plan: UserPlan): ScenarioItem[] {
  const all = catalog.scenarios as ScenarioItem[];
  if (plan === 'free') {
    const allow = new Set(catalog.freeTrialScenarioIds);
    return all.filter(s => allow.has(s.scenarioId));
  }
  return all;
}

export function pickRecommendedScenarios(
  plan: UserPlan,
  overallLevel?: string,
  count = 3,
): ScenarioItem[] {
  const level = mapOverallToScenarioLevel(overallLevel);
  const maxRank = LEVEL_RANK[level];
  const pool = getAccessibleScenarios(plan).filter(s => LEVEL_RANK[s.level] <= maxRank);
  return (pool.length ? pool : getAccessibleScenarios(plan)).slice(0, count);
}

export function buildDailyPlan(args: {
  date: string;
  plan: UserPlan;
  overallLevel?: string;
  weakDimension?: 'fluency' | 'accuracy' | 'pronunciation' | 'interaction';
  recentScenarioIds?: string[];
}): DailyPlan {
  const { date, plan, overallLevel, weakDimension, recentScenarioIds = [] } = args;
  const accessible = getAccessibleScenarios(plan);
  const level = mapOverallToScenarioLevel(overallLevel);
  const maxRank = LEVEL_RANK[level];
  const ranked = accessible.filter(s => LEVEL_RANK[s.level] <= maxRank);
  const candidates = (ranked.length ? ranked : accessible).filter(s => !recentScenarioIds.includes(s.scenarioId));
  const fallback = ranked.length ? ranked : accessible;
  const main = (candidates[0] ?? fallback[0]) as ScenarioItem;
  const backups = (candidates.slice(1, 3).length ? candidates.slice(1, 3) : fallback.slice(1, 3))
    .map(s => s.scenarioId);

  const focusByWeak: Record<string, string[]> = {
    pronunciation: ['Stress key syllables clearly', 'Use shorter speech chunks'],
    accuracy: ['Use complete sentence structure', 'Fix tense and article errors'],
    fluency: ['Reduce long pauses', 'Add one extra detail per response'],
    interaction: ['Ask one follow-up question', 'Confirm key details before ending'],
  };

  return {
    date,
    goal: `Practice "${main.titleEn}" and improve ${weakDimension ?? 'overall speaking confidence'}.`,
    mainScenarioId: main.scenarioId,
    backupScenarioIds: backups,
    focusCorrections: focusByWeak[weakDimension ?? 'fluency'] ?? focusByWeak.fluency,
    suggestedDurationMin: rules.fallbacks.highFatigueSignal ? 15 : 15,
    reflectionQuestion: 'Which sentence felt most natural today, and why?',
    allowFreeChat: true,
  };
}

export function getScenarioById(scenarioId: string): ScenarioItem | null {
  const all = catalog.scenarios as ScenarioItem[];
  return all.find(s => s.scenarioId === scenarioId) ?? null;
}
