'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useThemeStore } from '@/store/useThemeStore';
import { useSession, signOut } from 'next-auth/react';
import { AvatarScene } from '@/components/AvatarScene';
import {
  Mic, MicOff, Square, RotateCcw, Volume2, MessageSquare, Sparkles,
  Send, Keyboard, Sun, Moon, LogOut, Plus, Trash2, Menu, X,
} from 'lucide-react';
import type { Message, Conversation } from '@/types';

// ─── CSS ───────────────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes waveBar { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
  @keyframes pingRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.6} 100%{transform:translate(-50%,-50%) scale(1.6);opacity:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideInLeft { from{transform:translateX(-100%)} to{transform:translateX(0)} }

  @keyframes avatarFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-7px)} }
  @keyframes avatarHeadTilt { 0%,100%{transform:rotate(0deg)} 50%{transform:rotate(-5deg)} }
  @keyframes avatarBreath { 0%,100%{transform:scale(1)} 50%{transform:scale(1.015)} }
  @keyframes avatarBrowLift { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-3px)} }
  @keyframes avatarPupilThink { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-2px,-1px)} 75%{transform:translate(2px,1px)} }
  @keyframes avatarThinkDot { 0%,80%,100%{transform:scale(0.4);opacity:0.3} 40%{transform:scale(1);opacity:1} }
  @keyframes monkeyMouthOpen { 0%,100%{transform:scaleY(0.15)} 40%,60%{transform:scaleY(1)} }

  @keyframes sceneHaloPulse { 0%,100%{opacity:0.5;transform:translate(-50%,-50%) scale(1)} 50%{opacity:0.85;transform:translate(-50%,-50%) scale(1.04)} }
  @keyframes sceneBadgeFade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sceneIdleGlow { 0%,100%{box-shadow:0 0 28px rgba(254,129,19,.15),0 0 60px rgba(254,129,19,.06)} 50%{box-shadow:0 0 36px rgba(254,129,19,.22),0 0 80px rgba(254,129,19,.10)} }
  @keyframes sceneActiveGlow { 0%,100%{box-shadow:0 0 48px rgba(254,129,19,.50),0 0 100px rgba(254,129,19,.20),inset 0 1px 0 rgba(255,255,255,.06)} 50%{box-shadow:0 0 70px rgba(254,129,19,.70),0 0 140px rgba(254,129,19,.30),inset 0 1px 0 rgba(255,255,255,.08)} }
  @keyframes sceneThinkGlow { 0%,100%{box-shadow:0 0 40px rgba(148,163,184,.25),0 0 80px rgba(148,163,184,.10)} 50%{box-shadow:0 0 58px rgba(148,163,184,.38),0 0 110px rgba(148,163,184,.16)} }
  @keyframes sceneIdleGlowLight { 0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.08),0 0 0 1px rgba(254,129,19,.12)} 50%{box-shadow:0 6px 32px rgba(0,0,0,.11),0 0 0 1px rgba(254,129,19,.18)} }
  @keyframes sceneActiveGlowLight { 0%,100%{box-shadow:0 4px 28px rgba(254,129,19,.22),0 0 0 2px rgba(254,129,19,.30)} 50%{box-shadow:0 6px 40px rgba(254,129,19,.30),0 0 0 2px rgba(254,129,19,.40)} }
  @keyframes sceneThinkGlowLight { 0%,100%{box-shadow:0 4px 24px rgba(100,130,180,.18),0 0 0 1px rgba(100,130,180,.20)} 50%{box-shadow:0 6px 32px rgba(100,130,180,.24),0 0 0 1px rgba(100,130,180,.28)} }

  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important}}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatRelativeDate(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

function newId() { return Math.random().toString(36).substring(2, 11); }

function getUserId(session: ReturnType<typeof useSession>['data']) {
  return (session?.user as ({ id?: string } | undefined))?.id;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const WaveformBars = ({ active, color }: { active: boolean; color: string }) => {
  const heights = [38, 62, 82, 52, 72, 88, 48, 68, 58, 78, 44, 65];
  return (
    <div className="flex items-center justify-center gap-[3px] h-8">
      {heights.map((h, i) => (
        <div key={i} className={`w-[3px] rounded-full ${color}`}
          style={{ height: active ? `${h}%` : '18%', animation: active ? `waveBar .9s ease-in-out ${i * .07}s infinite alternate` : 'none', opacity: active ? 1 : 0.2, transition: 'height .3s,opacity .3s' }} />
      ))}
    </div>
  );
};

const ChatBubble = ({ role, content, onReplay }: { role: 'user' | 'assistant'; content: string; onReplay?: () => void }) => {
  const { theme } = useThemeStore();
  const u = role === 'user';
  return (
    <div className={`flex gap-2.5 ${u ? 'flex-row-reverse' : 'flex-row'}`} style={{ animation: 'fadeUp .3s ease-out' }}>
      <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
        style={{ background: u ? 'rgba(254,129,19,.2)' : 'linear-gradient(135deg,#D96B0B,#FE8113)', color: '#fff' }}>
        {u ? 'You' : 'AI'}
      </div>
      <div className={`max-w-[80%] group ${u ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed" style={{
          background: u ? theme.bubbleUserBg : theme.bubbleAIBg,
          border: u ? `1px solid ${theme.bubbleUserBorder}` : `1px solid ${theme.bubbleAIBorder}`,
          backdropFilter: 'blur(8px)',
          color: u ? theme.bubbleUserText ?? theme.textSecondary : theme.bubbleAIText,
        }}>
          {content || <div className="flex gap-1 items-center h-4">{[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(254,129,19,.5)', animation: `waveBar .8s ease-in-out ${i * .2}s infinite alternate` }} />)}</div>}
        </div>
        {!u && content && onReplay && (
          <button onClick={onReplay} className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 pl-1"
            style={{ color: theme.textDim }}
            onMouseEnter={e => (e.currentTarget.style.color = theme.accentText)}
            onMouseLeave={e => (e.currentTarget.style.color = theme.textDim)}>
            <Volume2 size={10} /> Replay
          </button>
        )}
      </div>
    </div>
  );
};

const TextInputBar = ({ onSend, disabled }: { onSend: (text: string) => void; disabled: boolean }) => {
  const { theme } = useThemeStore();
  const [value, setValue] = useState('');
  const submit = () => { if (!value.trim() || disabled) return; onSend(value.trim()); setValue(''); };
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 flex items-center rounded-2xl px-4 py-2.5 transition-colors"
        style={{ background: theme.bgInput, border: `1px solid ${theme.bgInputBorder}` }}>
        <input type="text" value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Type a message…" disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-40"
          style={{ color: theme.textPrimary }} />
      </div>
      <button onClick={submit} disabled={disabled || !value.trim()}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-20 cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#FE8113,#D96B0B)' }}>
        <Send size={15} className="text-white" />
      </button>
    </div>
  );
};

// ─── ConversationList ─────────────────────────────────────────────────────────
const ConversationList = ({
  onClose,
}: { onClose?: () => void }) => {
  const { theme } = useThemeStore();
  const { conversations, currentConversationId, setCurrentConversationId, loadMessages, removeConversation, addConversation, clearMessages } = useChatStore();
  const { data: session } = useSession();
  const userId = getUserId(session);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (conv: Conversation) => {
    if (conv.id === currentConversationId) { onClose?.(); return; }
    setLoadingId(conv.id);
    setCurrentConversationId(conv.id);
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`);
      const msgs: Message[] = await res.json();
      loadMessages(Array.isArray(msgs) ? msgs : []);
    } catch { loadMessages([]); }
    setLoadingId(null);
    onClose?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeConversation(id);
    if (userId) fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(console.error);
    if (id === currentConversationId) {
      setCurrentConversationId(null);
      clearMessages();
    }
  };

  const handleNewChat = () => {
    setCurrentConversationId(null);
    clearMessages();
    onClose?.();
  };

  return (
    <div className="flex flex-col h-full">
      {/* New chat button */}
      <button onClick={handleNewChat}
        className="mx-3 mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
        style={{ background: 'linear-gradient(135deg,#FE8113,#D96B0B)', color: '#fff' }}>
        <Plus size={15} /> New Chat
      </button>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.scrollbarColor} transparent` }}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40"
            style={{ color: theme.textMuted }}>
            <MessageSquare size={24} />
            <p className="text-xs text-center">No conversations yet.<br />Start chatting!</p>
          </div>
        ) : conversations.map(conv => {
          const isActive = conv.id === currentConversationId;
          const isLoading = loadingId === conv.id;
          return (
            <div key={conv.id}
              onClick={() => handleSelect(conv)}
              className="group relative px-3 py-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5"
              style={{
                background: isActive ? `${theme.accentText}18` : 'transparent',
                border: isActive ? `1px solid ${theme.accentText}30` : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.bgCard; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <MessageSquare size={13} className="mt-0.5 flex-shrink-0"
                style={{ color: isActive ? theme.accentText : theme.textMuted }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate leading-snug"
                  style={{ color: isActive ? theme.accentText : theme.textPrimary }}>
                  {isLoading ? <span style={{ color: theme.textMuted }}>Loading…</span> : conv.title}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: theme.textMuted }}>
                  {formatRelativeDate(conv.updated_at)}
                </p>
              </div>
              <button
                onClick={e => handleDelete(e, conv.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all cursor-pointer"
                style={{ color: theme.textMuted }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}>
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── UserMenu ─────────────────────────────────────────────────────────────────
const UserMenu = () => {
  const { data: session } = useSession();
  const { theme } = useThemeStore();
  if (!session?.user) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: theme.bgCard }}>
      <img src={session.user.image ?? ''} alt="" referrerPolicy="no-referrer"
        className="w-7 h-7 rounded-full object-cover flex-shrink-0 border"
        style={{ borderColor: theme.bgCardBorder ?? 'transparent' }}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: theme.textPrimary }}>{session.user.name}</p>
        <p className="text-[10px] truncate" style={{ color: theme.textMuted }}>{session.user.email}</p>
      </div>
      <button onClick={() => signOut({ callbackUrl: '/sign-in' })}
        className="p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0"
        style={{ color: theme.textMuted }}
        onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}
        title="Sign out">
        <LogOut size={13} />
      </button>
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, toggleTheme, mode } = useThemeStore();
  return (
    <button onClick={toggleTheme}
      className="w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer"
      style={{ color: theme.textMuted, background: theme.bgInput }}
      onMouseEnter={e => { e.currentTarget.style.color = theme.accentText; }}
      onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; }}
      title={mode === 'dark' ? 'Switch to light' : 'Switch to dark'}>
      {mode === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export const VoiceInterface = () => {
  const {
    messages, appendMessage, isLoading, setLoading, settings, clearMessages,
    loadMessages, setConversations, conversations, currentConversationId,
    setCurrentConversationId, addConversation, touchConversation: touchConvStore,
  } = useChatStore();
  const { isListening, transcript, error: speechError, startListening, setTranscript } = useSpeechToText();
  const { speak, stop, unlock, isSpeaking } = useTextToSpeech();
  const { theme, toggleTheme, mode } = useThemeStore();
  const { data: session } = useSession();
  // userId is only needed for loading conversations on mount (handled in useEffect below)
  const userId = getUserId(session);

  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string | null>(null);
  const [inputLang, setInputLang] = useState<'en-US' | 'zh-CN'>('en-US');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);

  const handleSendRef = useRef<(c: string) => void>(() => { });
  const desktopMsgRef = useRef<HTMLDivElement>(null);
  const mobileMsgRef = useRef<HTMLDivElement>(null);
  const currentConvIdRef = useRef<string | null>(currentConversationId);
  // Use a ref (not state) so toggling it never causes an extra re-render
  const convsLoadedRef = useRef(false);

  // keep ref in sync so handleSend closure always has the latest id
  useEffect(() => { currentConvIdRef.current = currentConversationId; }, [currentConversationId]);

  const isActive = isListening || isSpeaking || isLoading;
  const statusLabel = isSpeaking ? 'Speaking' : isLoading ? 'Thinking…' : isListening ? (inputLang === 'zh-CN' ? '正在聆听' : 'Listening…') : 'Ready';
  const statusColor = isListening ? '#FFA855' : isSpeaking ? '#FF9E45' : isLoading ? '#94a3b8' : theme.textMuted;

  // ── Load conversations on login ──────────────────────────────────────────────
  useEffect(() => {
    if (!userId || convsLoadedRef.current) return;
    convsLoadedRef.current = true;

    fetch('/api/conversations')
      .then(r => r.json())
      .then(async (list: Conversation[]) => {
        if (!Array.isArray(list) || list.length === 0) return;
        // Populate the store with the conversation list
        setConversations(list);
        // Auto-load the most recently updated conversation
        const latest = list[0];
        setCurrentConversationId(latest.id);
        const res = await fetch(`/api/conversations/${latest.id}/messages`);
        const msgs: Message[] = await res.json();
        loadMessages(Array.isArray(msgs) && msgs.length > 0 ? msgs : []);
      })
      .catch(e => {
        console.error('Failed to load conversations:', e);
        convsLoadedRef.current = false; // allow retry on next userId change
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (desktopMsgRef.current) desktopMsgRef.current.scrollTop = desktopMsgRef.current.scrollHeight;
    if (mobileMsgRef.current) mobileMsgRef.current.scrollTop = mobileMsgRef.current.scrollHeight;
  }, [messages]);

  // ── Auto-speak new AI messages ───────────────────────────────────────────────
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.id !== lastProcessedMsgId && !isLoading && last.content.trim()) {
      speak(last.content);
      setLastProcessedMsgId(last.id);
    }
  }, [messages, isLoading, speak, lastProcessedMsgId]);

  // ── Voice → send ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (transcript && !isListening) handleSendRef.current(transcript);
  }, [transcript, isListening]);

  // ── Speech error → show text input ───────────────────────────────────────────
  useEffect(() => {
    if (speechError === 'network' || speechError === 'not-allowed' || speechError === 'service-not-allowed') {
      setShowTextInput(true);
    }
  }, [speechError]);

  // ── handleSend ───────────────────────────────────────────────────────────────
  const handleSend = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Get or lazily create a conversation (UI state only — server handles DB)
    let convId = currentConvIdRef.current;
    let convTitle = '';
    if (!convId) {
      convId = newId();
      convTitle = content.length > 45 ? content.slice(0, 45) + '…' : content;
      const newConv: Conversation = { id: convId, title: convTitle, created_at: Date.now(), updated_at: Date.now() };
      addConversation(newConv);
      setCurrentConversationId(convId);
      currentConvIdRef.current = convId;
    } else {
      // Use the existing conversation's title from the store
      const existing = useChatStore.getState().conversations.find(c => c.id === convId);
      convTitle = existing?.title ?? '';
    }

    const userMsgId = newId();
    const userMsg: Message = { id: userMsgId, role: 'user', content, timestamp: Date.now() };
    appendMessage(userMsg);
    setTranscript('');
    setLoading(true);
    stop();

    try {
      const currentMessages = useChatStore.getState().messages;
      // Pass conversationId + userMsgId so the server can persist everything
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...currentMessages.map(m => ({ role: m.role, content: m.content }))],
          settings,
          conversationId: convId,
          conversationTitle: convTitle,
          userMsgId,
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);

      const aiMsgId = newId();
      const aiMsg: Message = { id: aiMsgId, role: 'assistant', content: '', timestamp: Date.now() };
      appendMessage(aiMsg);

      const reader = res.body?.getReader();
      let buf = '';
      while (true) {
        const { done, value } = await reader?.read() || { done: true, value: undefined };
        if (done) break;
        for (const line of new TextDecoder().decode(value).split('\n')) {
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              buf += JSON.parse(line.slice(6)).choices[0]?.delta?.content || '';
              useChatStore.setState(s => {
                const m = [...s.messages];
                const idx = m.findIndex(x => x.id === aiMsgId);
                if (idx !== -1) m[idx] = { ...m[idx], content: buf };
                return { messages: m };
              });
            } catch { /* ignore malformed SSE */ }
          }
        }
      }

      // Bubble conversation to top of list (UI only — server already updated DB)
      if (convId) touchConvStore(convId);
    } catch (e) { console.error('Chat error:', e); }
    finally { setLoading(false); }
  }, [appendMessage, settings, setLoading, setTranscript, stop, addConversation, setCurrentConversationId, touchConvStore]);

  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  const handleMicClick = useCallback(() => { unlock(); stop(); startListening(inputLang); }, [unlock, stop, startListening, inputLang]);
  const handleReplay = useCallback((t: string) => { unlock(); speak(t); }, [unlock, speak]);
  const handleClear = useCallback(async () => {
    const convId = currentConvIdRef.current;
    clearMessages();
    stop();
    if (convId) {
      // Remove from UI immediately
      useChatStore.getState().removeConversation(convId);
      setCurrentConversationId(null);
      // Delete from DB (no auth check needed — server verifies session)
      fetch(`/api/conversations/${convId}`, { method: 'DELETE' }).catch(console.error);
    }
  }, [clearMessages, stop, setCurrentConversationId]);
  const handleTextSend = useCallback((text: string) => { unlock(); handleSendRef.current(text); }, [unlock]);

  // ── Speech error banner ───────────────────────────────────────────────────────
  const speechErrorBanner = speechError === 'network' ? (
    <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl text-xs border text-center mx-4 mb-2"
      style={{ background: 'rgba(254,129,19,.06)', borderColor: 'rgba(254,129,19,.2)', color: 'rgba(255,175,100,.8)' }}>
      <p>语音识别需要 Google 服务，国内网络暂不可用</p>
      <p style={{ color: theme.textMuted }}>请使用下方输入框打字交流</p>
    </div>
  ) : speechError ? (
    <div className="px-4 py-2.5 rounded-xl text-xs text-red-400 border border-red-500/30 text-center mx-4 mb-2"
      style={{ background: mode === 'dark' ? 'rgba(127,29,29,.35)' : 'rgba(254,226,226,.6)' }}>
      Mic error: {speechError}
    </div>
  ) : null;

  // ── Controls strip ────────────────────────────────────────────────────────────
  const Controls = () => (
    <div className="flex items-center justify-center gap-3">
      {/* Language toggle */}
      <button onClick={() => setInputLang(l => l === 'en-US' ? 'zh-CN' : 'en-US')}
        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer"
        style={{ borderColor: 'rgba(254,129,19,.2)', background: 'rgba(254,129,19,.06)', color: theme.accentPale }}>
        {inputLang === 'en-US' ? 'EN' : '中文'}
      </button>

      {/* Mic / Stop button */}
      <button
        onClick={isListening ? () => setTranscript('') : handleMicClick}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer relative"
        style={{
          background: isListening ? 'rgba(254,129,19,.15)' : 'linear-gradient(135deg,#FE8113,#D96B0B)',
          border: isListening ? '2px solid rgba(254,129,19,.5)' : '2px solid transparent',
          boxShadow: isListening ? '0 0 20px rgba(254,129,19,.3)' : '0 4px 16px rgba(254,129,19,.25)',
        }}>
        {isListening
          ? <MicOff size={22} style={{ color: '#FE8113' }} />
          : <Mic size={22} className="text-white" />}
        {isListening && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400" style={{ animation: 'pingRing 1s ease-out infinite' }} />}
      </button>

      {/* Stop TTS */}
      <button onClick={() => stop()}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{ background: isSpeaking ? 'rgba(254,129,19,.15)' : theme.bgInput, border: `1px solid ${isSpeaking ? 'rgba(254,129,19,.3)' : theme.bgInputBorder}`, color: isSpeaking ? '#FE8113' : theme.textMuted }}>
        <Square size={14} />
      </button>

      {/* Text input toggle */}
      <button onClick={() => setShowTextInput(s => !s)}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{ background: showTextInput ? 'rgba(254,129,19,.15)' : theme.bgInput, border: `1px solid ${showTextInput ? 'rgba(254,129,19,.35)' : theme.bgInputBorder}`, color: showTextInput ? '#FE8113' : theme.textMuted }}>
        <Keyboard size={15} />
      </button>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      {/* ═══ DESKTOP ≥ lg ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden" style={{ background: theme.bgMain }}>

        {/* ── Conversation sidebar ──────────────────────────────────────────── */}
        <aside className="w-[260px] xl:w-[280px] flex flex-col h-full border-r flex-shrink-0"
          style={{ background: theme.bgSidebar, borderColor: theme.bgSidebarBorder, backdropFilter: 'blur(12px)' }}>

          {/* Brand header */}
          <div className="flex items-center gap-3 px-4 pt-5 pb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#D96B0B,#FE8113)' }}>
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-bold tracking-tight leading-none" style={{ color: theme.textPrimary }}>SpeakStar</h1>
              <p className="text-[9px] font-medium tracking-widest uppercase mt-0.5" style={{ color: theme.accentPale }}>AI English Tutor</p>
            </div>
            <ThemeToggle />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-1 pb-2">
            <ConversationList />
          </div>

          {/* User info footer */}
          <div className="px-3 py-3 border-t" style={{ borderColor: theme.bgSidebarBorder }}>
            <UserMenu />
          </div>
        </aside>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ background: theme.bgMain }}>

          {/* Avatar strip */}
          <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-5 pb-2 relative z-10"
            style={{ borderBottom: `1px solid ${theme.separatorColor}` }}>
            {/* Status pill */}
            <div className="flex items-center gap-2 px-3.5 py-1 rounded-full border mb-1"
              style={{ background: theme.bgStatusPill, borderColor: 'rgba(254,129,19,.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: statusColor, boxShadow: isActive ? `0 0 6px ${statusColor}` : 'none' }} />
              <span className="text-[11px] font-medium tracking-wide" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <AvatarScene isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={140} />
            <WaveformBars active={isListening || isSpeaking} color={isListening ? 'bg-[#FE8113]' : 'bg-[#FF9E45]'} />
          </div>

          {/* Message history */}
          <div ref={desktopMsgRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.scrollbarColor} transparent` }}>
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3"
                style={{ opacity: 0.35, color: theme.textMuted }}>
                <MessageSquare size={32} />
                <p className="text-sm">Start a conversation…</p>
                <p className="text-xs">Click the mic or type a message below.</p>
              </div>
            ) : messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => (
              <ChatBubble key={m.id} role={m.role as 'user' | 'assistant'} content={m.content}
                onReplay={m.role === 'assistant' ? () => handleReplay(m.content) : undefined} />
            ))}
            {isListening && transcript && (
              <div className="flex flex-row-reverse gap-2.5" style={{ animation: 'fadeUp .25s ease-out' }}>
                <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'rgba(254,129,19,.2)' }}>You</div>
                <div className="max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm italic border border-dashed"
                  style={{ background: 'rgba(254,129,19,.06)', borderColor: 'rgba(254,129,19,.2)', color: 'rgba(255,175,100,.7)' }}>
                  &ldquo;{transcript}&rdquo;
                </div>
              </div>
            )}
          </div>

          {speechErrorBanner}

          {/* Controls footer */}
          <div className="flex-shrink-0 px-6 pt-3 pb-5 border-t"
            style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter: 'blur(20px)' }}>
            {showTextInput && (
              <div className="mb-3" style={{ animation: 'fadeUp .25s ease-out' }}>
                <TextInputBar onSend={handleTextSend} disabled={isLoading} />
              </div>
            )}
            <div className="flex flex-col items-center gap-2">
              <Controls />
              <div className="flex items-center gap-4">
                <button onClick={handleClear}
                  className="flex items-center gap-1.5 text-[11px] cursor-pointer transition-colors"
                  style={{ color: theme.textMuted }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={e => (e.currentTarget.style.color = theme.textMuted)}>
                  <RotateCcw size={11} /> Clear chat
                </button>
                <span className="text-[10px]" style={{ color: theme.textDimmer }}>
                  {inputLang === 'zh-CN' ? '中文输入 · 英文回复' : 'EN input · EN reply'}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ MOBILE < lg ════════════════════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col h-screen w-full overflow-hidden select-none"
        style={{ background: theme.bgMain }}>

        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 -left-28 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle,${theme.glowStrong} 0%,transparent 70%)` }} />
          <div className="absolute -bottom-28 -right-28 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle,${theme.glowSubtle} 0%,transparent 70%)` }} />
        </div>

        {/* Mobile header */}
        <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileDrawer(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ color: theme.textMuted, background: theme.bgInput }}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: theme.textPrimary }}>SpeakStar</h1>
              <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: theme.accentPale }}>AI English Tutor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleClear}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ color: theme.textMuted, background: theme.bgInput }}>
              <RotateCcw size={15} />
            </button>
            {session?.user && (
              <img src={session.user.image ?? ''} alt="" referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover border cursor-pointer"
                style={{ borderColor: 'rgba(254,129,19,.3)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                onClick={() => signOut({ callbackUrl: '/sign-in' })} />
            )}
          </div>
        </header>

        {/* Avatar */}
        <div className="flex-shrink-0 relative z-10 flex flex-col items-center gap-1 pt-1 pb-1">
          {/* Status */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
            style={{ background: theme.bgStatusPill, borderColor: 'rgba(254,129,19,.12)' }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            <span className="text-[10px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
          </div>
          <AvatarScene isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={110} />
          <WaveformBars active={isListening || isSpeaking} color={isListening ? 'bg-[#FE8113]' : 'bg-[#FF9E45]'} />
        </div>

        {/* Messages */}
        <div ref={mobileMsgRef} className="flex-1 relative z-10 overflow-y-auto px-4 pb-2 space-y-2"
          style={{ scrollbarWidth: 'none' }}>
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-2"
              style={{ opacity: 0.35, color: theme.textMuted }}>
              <MessageSquare size={28} />
              <p className="text-xs">Start chatting…</p>
            </div>
          ) : messages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => (
            <ChatBubble key={m.id} role={m.role as 'user' | 'assistant'} content={m.content}
              onReplay={m.role === 'assistant' ? () => handleReplay(m.content) : undefined} />
          ))}
          {isListening && transcript && (
            <div className="flex flex-row-reverse gap-2" style={{ animation: 'fadeUp .2s ease-out' }}>
              <div className="w-6 h-6 rounded-lg flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ background: 'rgba(254,129,19,.2)' }}>You</div>
              <div className="flex-1 px-3.5 py-2.5 rounded-2xl text-sm italic border border-dashed"
                style={{ background: 'rgba(254,129,19,.04)', borderColor: 'rgba(254,129,19,.2)', color: 'rgba(255,175,100,.7)' }}>
                &ldquo;{transcript}&rdquo;
              </div>
            </div>
          )}
        </div>

        {speechErrorBanner}

        {/* Text input */}
        {showTextInput && (
          <div className="relative z-10 px-4 pb-2" style={{ animation: 'fadeUp .25s ease-out' }}>
            <TextInputBar onSend={handleTextSend} disabled={isLoading} />
          </div>
        )}

        {/* Footer controls */}
        <footer className="relative z-10 flex-shrink-0 px-5 pb-8 pt-3 border-t"
          style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter: 'blur(16px)' }}>
          <Controls />
          <p className="text-center text-[10px] mt-3 tracking-wide" style={{ color: theme.textDimmer }}>
            {inputLang === 'zh-CN' ? '中文输入 · 英文回复' : 'EN input · EN reply'}
          </p>
        </footer>

        {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
        {showMobileDrawer && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={() => setShowMobileDrawer(false)} />
            {/* Drawer panel */}
            <div className="fixed top-0 left-0 h-full w-[280px] z-50 flex flex-col"
              style={{ background: theme.bgSidebar, borderRight: `1px solid ${theme.bgSidebarBorder}`, animation: 'slideInLeft .25s ease-out' }}>
              {/* Drawer header */}
              <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b"
                style={{ borderColor: theme.bgSidebarBorder }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#D96B0B,#FE8113)' }}>
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>SpeakStar</h2>
                    <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: theme.accentPale }}>Chats</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileDrawer(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ color: theme.textMuted, background: theme.bgInput }}>
                  <X size={16} />
                </button>
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-1 py-2">
                <ConversationList onClose={() => setShowMobileDrawer(false)} />
              </div>

              {/* User info */}
              <div className="px-3 py-3 border-t" style={{ borderColor: theme.bgSidebarBorder }}>
                <UserMenu />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
