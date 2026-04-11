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
