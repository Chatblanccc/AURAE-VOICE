export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
}

export interface UserSettings {
  language: 'zh' | 'en';
  proficiency: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  settings: UserSettings;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
}
