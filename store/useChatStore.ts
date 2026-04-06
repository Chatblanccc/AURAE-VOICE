import { create } from 'zustand';
import { ChatState, Message, UserSettings } from '@/types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! What's up?",
      timestamp: Date.now(),
    },
  ],
  isLoading: false,
  settings: {
    language: 'en',
    proficiency: 'intermediate',
    topic: 'Daily Conversation',
  },
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...msg,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },
  setLoading: (loading: boolean) => set({ isLoading: loading }),
  clearMessages: () => set({ messages: [] }),
  updateSettings: (newSettings: Partial<UserSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),
  loadMessages: (messages: Message[]) => set({ messages }),
}));
