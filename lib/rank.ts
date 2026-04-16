import type { RankProgress, RankStage } from '@/types';

// One small division requires 100 XP.
export const RANK_STEP_XP = 100;

const TIERS = [
  { name: '黑铁', icon: '🛡️', divisions: 4 },
  { name: '青铜', icon: '🥉', divisions: 4 },
  { name: '白银', icon: '🥈', divisions: 4 },
  { name: '黄金', icon: '🥇', divisions: 4 },
  { name: '铂金', icon: '💠', divisions: 4 },
  { name: '翡翠', icon: '💚', divisions: 4 },
  { name: '钻石', icon: '💎', divisions: 4 },
  { name: '大师', icon: '👑', divisions: 0 },
  { name: '宗师', icon: '🏆', divisions: 0 },
  { name: '最强王者', icon: '🔥', divisions: 0 },
] as const;

export const RANK_STAGES: RankStage[] = TIERS.flatMap((tier): RankStage[] => {
  if (tier.divisions === 0) {
    return [{ tier: tier.name, division: null, label: tier.name, icon: tier.icon }];
  }
  return Array.from({ length: tier.divisions }, (_, idx) => {
    const division = tier.divisions - idx;
    return {
      tier: tier.name,
      division,
      label: `${tier.name} ${division}`,
      icon: tier.icon,
    };
  });
});

export function getRankProgress(xp: number, streakDays: number): RankProgress {
  const safeXp = Math.max(0, Math.floor(xp));
  const safeStreak = Math.max(1, Math.floor(streakDays));
  const index = Math.min(Math.floor(safeXp / RANK_STEP_XP), RANK_STAGES.length - 1);
  const current = RANK_STAGES[index];
  const next = index < RANK_STAGES.length - 1 ? RANK_STAGES[index + 1] : null;
  const reachedTop = !next;
  const xpIntoStage = reachedTop ? RANK_STEP_XP : (safeXp % RANK_STEP_XP);
  const xpToNextStage = reachedTop ? 0 : (RANK_STEP_XP - xpIntoStage);
  const progressPercent = reachedTop ? 100 : Math.round((xpIntoStage / RANK_STEP_XP) * 100);

  return {
    xp: safeXp,
    streakDays: safeStreak,
    xpPerStage: RANK_STEP_XP,
    current,
    next,
    xpIntoStage,
    xpToNextStage,
    progressPercent,
  };
}
