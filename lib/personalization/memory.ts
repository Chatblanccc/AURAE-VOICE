import type {
  DifficultyBand,
  DifficultyProfile,
  MemoryKind,
  PersonalizationVariant,
  UserMemoryFact,
} from '@/types';

const MAX_MEMORY_ITEMS = 6;
const MAX_MEMORY_TEXT_LEN = 1200;

const ASSESSMENT_TO_BAND: Record<string, DifficultyBand> = {
  A0: 'beginner',
  A1: 'beginner',
  A2: 'intermediate',
  B1: 'intermediate',
  B2: 'advanced',
};

function normalizeTopic(rawTopic: string | undefined): string {
  const topic = typeof rawTopic === 'string' ? rawTopic : 'Daily Conversation';
  return topic.slice(0, 100).replace(/[<>{}\[\]]/g, '');
}

function rankBandFromXp(xp: number): DifficultyBand {
  if (xp >= 2400) return 'advanced';
  if (xp >= 600) return 'intermediate';
  return 'beginner';
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function dedupeMemoryFacts(memoryFacts: UserMemoryFact[]): UserMemoryFact[] {
  const seen = new Set<string>();
  const sorted = [...memoryFacts].sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  const kept: UserMemoryFact[] = [];
  for (const item of sorted) {
    const dedupeKey = `${item.kind}:${item.key}:${item.value}`.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    kept.push(item);
    if (kept.length >= MAX_MEMORY_ITEMS) break;
  }
  return kept;
}

export function assignPersonalizationVariant(userId: string): PersonalizationVariant {
  let hash = 0;
  for (let i = 0; i < userId.length; i += 1) {
    hash = (hash * 31 + userId.charCodeAt(i)) >>> 0;
  }
  return hash % 2 === 0 ? 'memory_adaptive' : 'control';
}

export function deriveDifficultyProfile(args: {
  settingsProficiency?: string;
  topic?: string;
  assessmentOverallLevel?: string;
  xp: number;
  memoryFacts: UserMemoryFact[];
  variant: PersonalizationVariant;
}): DifficultyProfile {
  const fromSettings = args.settingsProficiency === 'advanced'
    ? 'advanced'
    : args.settingsProficiency === 'beginner'
      ? 'beginner'
      : 'intermediate';
  const fromAssessment = ASSESSMENT_TO_BAND[args.assessmentOverallLevel ?? ''] ?? fromSettings;
  const fromRank = rankBandFromXp(args.xp);
  const topic = normalizeTopic(args.topic);

  // Rank is treated as the hard guardrail for live difficulty so low-rank users
  // do not get suddenly difficult vocabulary because of stale assessment signals.
  let band: DifficultyBand = fromAssessment;
  if (fromRank === 'beginner') {
    band = 'beginner';
  } else if (fromRank === 'intermediate' && fromAssessment === 'advanced') {
    band = 'intermediate';
  } else if (fromRank === 'advanced' && fromAssessment !== 'beginner') {
    band = 'advanced';
  }

  const reasons: string[] = [
    `assessment=${args.assessmentOverallLevel ?? 'none'}`,
    `rankBand=${fromRank}`,
    `settings=${fromSettings}`,
  ];

  const adaptiveEnabled = args.variant === 'memory_adaptive';
  const prefersChallenge = args.memoryFacts.some(
    (f) => f.kind === 'strategy' && f.key === 'challenge_preference' && /higher|more/i.test(f.value),
  );
  const needsSlowerPace = args.memoryFacts.some(
    (f) => f.kind === 'strategy' && f.key === 'pace' && /slow|gentle/i.test(f.value),
  );

  let challengeInterval = band === 'beginner' ? 5 : band === 'intermediate' ? 4 : 3;
  if (adaptiveEnabled && prefersChallenge) challengeInterval = Math.max(3, challengeInterval - 1);
  if (adaptiveEnabled && needsSlowerPace) challengeInterval = Math.min(6, challengeInterval + 1);

  const correctionIntensity = band === 'advanced' ? 'strict' : band === 'intermediate' ? 'balanced' : 'light';
  const maxSentenceLength = band === 'advanced' ? 'long' : band === 'intermediate' ? 'medium' : 'short';
  const followUpDepth = band === 'advanced' ? 'deep' : band === 'intermediate' ? 'balanced' : 'shallow';

  if (adaptiveEnabled) {
    reasons.push('adaptive=enabled');
  } else {
    reasons.push('adaptive=disabled(control)');
  }

  return {
    band,
    source: 'hybrid',
    challengeInterval,
    correctionIntensity,
    maxSentenceLength,
    followUpDepth,
    topic,
    reasons,
  };
}

function summarizeByKind(memoryFacts: UserMemoryFact[], kind: MemoryKind): string[] {
  return dedupeMemoryFacts(memoryFacts)
    .filter((fact) => fact.kind === kind)
    .map((fact) => `${fact.key}: ${fact.value}`);
}

export function buildMemoryPrompt(memoryFacts: UserMemoryFact[]): string {
  const facts = dedupeMemoryFacts(memoryFacts);
  if (facts.length === 0) return 'No durable memory yet. Learn user preferences gradually.';

  const preferences = summarizeByKind(facts, 'preference');
  const skills = summarizeByKind(facts, 'skill');
  const goals = summarizeByKind(facts, 'goal');
  const strategy = summarizeByKind(facts, 'strategy');

  const sections = [
    `Preference memory: ${preferences.length > 0 ? preferences.join(' | ') : 'none'}`,
    `Skill memory: ${skills.length > 0 ? skills.join(' | ') : 'none'}`,
    `Goal memory: ${goals.length > 0 ? goals.join(' | ') : 'none'}`,
    `Strategy memory: ${strategy.length > 0 ? strategy.join(' | ') : 'none'}`,
  ];

  return sections.join('\n').slice(0, MAX_MEMORY_TEXT_LEN);
}

export function memoryConfidenceFromSignal(signalScore: number): number {
  return Math.round(clamp01(signalScore) * 100) / 100;
}
