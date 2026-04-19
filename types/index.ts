export type Role = 'user' | 'assistant' | 'system';

export type UserPlan = 'free' | 'plus' | 'pro';

export interface UsageInfo {
  plan: UserPlan;
  used: number;
  limit: number;
  resetAt: number | null;
  window: 'week' | 'month' | 'unlimited';
  /** Card subscription vs legacy prepaid rows (no Stripe subscription id). */
  billing?: 'subscription' | 'prepaid' | 'free';
}

export interface RankStage {
  tier: string;
  division: number | null;
  label: string;
  icon: string;
}

export interface RankProgress {
  xp: number;
  streakDays: number;
  xpPerStage: number;
  current: RankStage;
  next: RankStage | null;
  xpIntoStage: number;
  xpToNextStage: number;
  progressPercent: number;
}

export interface MissionProgressInfo {
  dateKey: string;
  practicedMs: number;
  targetMs: number;
  progressPercent: number;
  messageCount: number;
  rewardClaimed?: boolean;
  rewardXp?: number;
  questStatus?: {
    mainCompleted: boolean;
    bonusCompleted: boolean;
  };
}

export type Persona = 'alex' | 'trump';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  persona?: Persona;
  created_at: number;
  updated_at: number;
}

export interface UserSettings {
  language: 'zh' | 'en';
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

export type DifficultyBand = 'beginner' | 'intermediate' | 'advanced';

export interface DifficultyProfile {
  band: DifficultyBand;
  source: 'settings' | 'assessment' | 'hybrid';
  challengeInterval: number;
  maxSentenceLength: 'short' | 'medium' | 'long';
  correctionIntensity: 'light' | 'balanced' | 'strict';
  followUpDepth: 'shallow' | 'balanced' | 'deep';
  topic: string;
  reasons: string[];
}

export type MemoryKind = 'preference' | 'skill' | 'goal' | 'strategy';

export interface UserMemoryFact {
  id: string;
  userId: string;
  kind: MemoryKind;
  key: string;
  value: string;
  confidence: number;
  updatedAtMs: number;
}

export interface MemoryCandidate {
  kind: MemoryKind;
  key: string;
  value: string;
  confidence: number;
}

export type PersonalizationVariant = 'control' | 'memory_adaptive';

export type VocabReviewRating = 'again' | 'hard' | 'good' | 'easy';

export interface VocabCard {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  source: 'manual' | 'chat';
  easeFactor: number;
  intervalDays: number;
  dueAt: number;
  reviewCount: number;
  correctCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface WeeklyReport {
  dateRange: { from: string; to: string };
  practiceRounds: number;
  messages: number;
  words: number;
  avgWordsPerMessage: number;
  topWords: Array<{ word: string; count: number }>;
  highlights: string[];
  nextActions: string[];
}

export interface ChatState {
  messages: Message[];
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  settings: UserSettings;
  selectedPersona: Persona;
  // message actions
  appendMessage: (message: Message) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  loadMessages: (messages: Message[]) => void;
  // conversation actions
  setConversations: (convs: Conversation[]) => void;
  addConversation: (conv: Conversation) => void;
  removeConversation: (id: string) => void;
  setCurrentConversationId: (id: string | null) => void;
  touchConversation: (id: string) => void;
  setPersona: (persona: Persona) => void;
}
