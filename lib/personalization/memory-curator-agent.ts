import type { MemoryCandidate, UserMemoryFact } from '@/types';
import { memoryConfidenceFromSignal } from '@/lib/personalization/memory';

const MAX_CANDIDATES = 3;

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, ' ').slice(0, 180);
}

function pickTopicPreference(text: string): MemoryCandidate | null {
  const lower = text.toLowerCase();
  const topicLexicon: Array<{ key: string; pattern: RegExp }> = [
    { key: 'basketball', pattern: /\bbasketball|nba\b/i },
    { key: 'travel', pattern: /\btravel|trip|flight|hotel\b/i },
    { key: 'workplace', pattern: /\binterview|office|meeting|work\b/i },
    { key: 'daily_life', pattern: /\bdaily|routine|life\b/i },
  ];
  for (const item of topicLexicon) {
    if (item.pattern.test(lower)) {
      return {
        kind: 'preference',
        key: 'preferred_topic',
        value: item.key,
        confidence: memoryConfidenceFromSignal(0.74),
      };
    }
  }
  return null;
}

function pickGoal(text: string): MemoryCandidate | null {
  const lower = text.toLowerCase();
  if (/\bielts|toefl\b/i.test(lower)) {
    return { kind: 'goal', key: 'exam_goal', value: 'english_exam', confidence: memoryConfidenceFromSignal(0.85) };
  }
  if (/\binterview|job\b/i.test(lower)) {
    return { kind: 'goal', key: 'short_term_goal', value: 'job_interview', confidence: memoryConfidenceFromSignal(0.82) };
  }
  return null;
}

function pickStrategy(text: string): MemoryCandidate | null {
  const lower = text.toLowerCase();
  if (/\bslow|slowly|simpler|easy\b/i.test(lower)) {
    return { kind: 'strategy', key: 'pace', value: 'slow_gentle', confidence: memoryConfidenceFromSignal(0.78) };
  }
  if (/\bchallenge|harder|push me\b/i.test(lower)) {
    return { kind: 'strategy', key: 'challenge_preference', value: 'higher', confidence: memoryConfidenceFromSignal(0.78) };
  }
  return null;
}

export function extractMemoryCandidatesFromTurn(userText: string): MemoryCandidate[] {
  const normalized = normalize(userText);
  if (!normalized) return [];

  const candidates = [
    pickTopicPreference(normalized),
    pickGoal(normalized),
    pickStrategy(normalized),
  ].filter((item): item is MemoryCandidate => Boolean(item));

  return candidates.slice(0, MAX_CANDIDATES);
}

export function mergeMemoryCandidates(
  existingFacts: UserMemoryFact[],
  candidates: MemoryCandidate[],
): MemoryCandidate[] {
  return candidates.filter((candidate) => !existingFacts.some((fact) =>
    fact.kind === candidate.kind &&
    fact.key === candidate.key &&
    fact.value.toLowerCase() === candidate.value.toLowerCase(),
  ));
}
