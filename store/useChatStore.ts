import { create } from 'zustand';
import { ChatState, Conversation, Message, Persona, UserSettings } from '@/types';

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  selectedPersona: 'alex' as Persona,
  settings: {
    language: 'en',
    proficiency: 'intermediate',
    topic: 'Daily Conversation',
  },

  // Append a fully-formed Message (with pre-set id + timestamp)
  appendMessage: (msg: Message) =>
    set((state) => ({ messages: [...state.messages, msg] })),

  // Legacy: add a message and auto-generate id + timestamp
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) =>
    set((state) => ({
      messages: [
        ...state.messages,
        { ...msg, id: Math.random().toString(36).substring(2, 10), timestamp: Date.now() },
      ],
    })),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),

  updateSettings: (newSettings: Partial<UserSettings>) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  loadMessages: (messages: Message[]) => set({ messages }),

  // Conversation actions
  setConversations: (convs: Conversation[]) => set({ conversations: convs }),

  addConversation: (conv: Conversation) =>
    set((state) => ({ conversations: [conv, ...state.conversations] })),

  removeConversation: (id: string) =>
    set((state) => ({ conversations: state.conversations.filter(c => c.id !== id) })),

  setCurrentConversationId: (id: string | null) => set({ currentConversationId: id }),

  touchConversation: (id: string) =>
    set((state) => ({
      conversations: state.conversations
        .map(c => c.id === id ? { ...c, updated_at: Date.now() } : c)
        .sort((a, b) => b.updated_at - a.updated_at),
    })),

  setPersona: (persona: Persona) => set({ selectedPersona: persona }),
}));
