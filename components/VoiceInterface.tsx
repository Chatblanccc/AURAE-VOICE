'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useThemeStore } from '@/store/useThemeStore';
import { useSession, signOut } from 'next-auth/react';
import { AvatarScene } from '@/components/AvatarScene';
import { Mic, MicOff, Square, RotateCcw, Volume2, MessageSquare, Sparkles, Globe, Send, Keyboard, Sun, Moon, LogOut } from 'lucide-react';
import type { Message } from '@/types';

// ─── CSS Keyframes ─────────────────────────────────────────────────────────────
const STYLES = `
  @keyframes waveBar { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
  @keyframes pingRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.6} 100%{transform:translate(-50%,-50%) scale(1.6);opacity:0} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

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

// ─── Sub-components ────────────────────────────────────────────────────────────
const WaveformBars = ({ active, color }: { active: boolean; color: string }) => {
  const heights = [38,62,82,52,72,88,48,68,58,78,44,65];
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {heights.map((h, i) => (
        <div key={i} className={`w-[3px] rounded-full ${color}`}
          style={{ height: active?`${h}%`:'18%', animation: active?`waveBar .9s ease-in-out ${i*.07}s infinite alternate`:'none',
            opacity: active?1:0.2, transition:'height .3s,opacity .3s' }} />
      ))}
    </div>
  );
};

const ChatBubble = ({ role, content, onReplay }: { role:'user'|'assistant'; content:string; onReplay?:()=>void }) => {
  const { theme } = useThemeStore();
  const u = role === 'user';
  return (
    <div className={`flex gap-3 ${u?'flex-row-reverse':'flex-row'}`} style={{ animation:'fadeUp .3s ease-out' }}>
      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
        style={{ background: u?'rgba(254,129,19,.2)':'linear-gradient(135deg,#D96B0B,#FE8113)', color:'#fff' }}>
        {u?'You':'AI'}
      </div>
      <div className={`max-w-[80%] group ${u?'items-end':'items-start'} flex flex-col gap-1`}>
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{
          background: u ? theme.bubbleUserBg : theme.bubbleAIBg,
          border: u ? `1px solid ${theme.bubbleUserBorder}` : `1px solid ${theme.bubbleAIBorder}`,
          backdropFilter:'blur(8px)',
          color: u ? theme.bubbleUserText : theme.bubbleAIText,
        }}>
          {content || <div className="flex gap-1 items-center h-4">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.5)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>}
        </div>
        {!u && content && onReplay && (
          <button onClick={onReplay}
            className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 pl-1"
            style={{ color: theme.textDim }}
            onMouseEnter={e=>(e.currentTarget.style.color=theme.accentText)}
            onMouseLeave={e=>(e.currentTarget.style.color=theme.textDim)}>
            <Volume2 size={10}/> Replay
          </button>
        )}
      </div>
    </div>
  );
};

const TextInputBar = ({ onSend, disabled }: { onSend:(text:string)=>void; disabled:boolean }) => {
  const { theme } = useThemeStore();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };
  return (
    <div className="flex items-center gap-2 w-full px-1">
      <div className="flex-1 flex items-center rounded-2xl px-4 py-2.5 transition-colors"
        style={{ background: theme.bgInput, border: `1px solid ${theme.bgInputBorder}` }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm outline-none disabled:opacity-40"
          style={{ color: theme.textPrimary }}
        />
      </div>
      <button
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-20 cursor-pointer"
        style={{ background:'linear-gradient(135deg,#FE8113,#D96B0B)' }}
      >
        <Send size={16} className="text-white" />
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export const VoiceInterface = () => {
  const { messages, addMessage, isLoading, setLoading, settings, clearMessages, loadMessages } = useChatStore();
  const { isListening, transcript, error: speechError, startListening, setTranscript } = useSpeechToText();
  const { speak, stop, unlock, isSpeaking } = useTextToSpeech();
  const { theme, toggleTheme } = useThemeStore();
  const { data: session } = useSession();

  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string|null>(null);
  const [inputLang, setInputLang] = useState<'en-US'|'zh-CN'>('en-US');
  const [showTextInput, setShowTextInput] = useState(false);
  const handleSendRef = useRef<(c:string)=>void>(()=>{});
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const historyLoadedRef = useRef(false);

  const lastAssistant = [...messages].reverse().find(m=>m.role==='assistant');
  const lastUser = [...messages].reverse().find(m=>m.role==='user');
  const assistantText = lastAssistant?.content ?? '';
  const isActive = isListening || isSpeaking || isLoading;

  // ── Load history from DB on first mount ──────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id || historyLoadedRef.current) return;
    historyLoadedRef.current = true;

    fetch('/api/messages')
      .then(r => r.json())
      .then((rows: Message[]) => {
        if (Array.isArray(rows) && rows.length > 0) {
          loadMessages(rows);
        } else {
          // No history — set the welcome message
          loadMessages([{
            id: 'welcome',
            role: 'assistant',
            content: "Hey! What's up?",
            timestamp: Date.now(),
          }]);
        }
      })
      .catch(() => {
        loadMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hey! What's up?",
          timestamp: Date.now(),
        }]);
      });
  }, [session?.user?.id, loadMessages]);

  // ── Persist new messages to DB (fire-and-forget) ──────────────────────────────
  const persistMessage = useCallback((msg: Message) => {
    if (!session?.user?.id) return;
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    }).catch(console.error);
  }, [session?.user?.id]);

  useEffect(() => {
    if (speechError === 'network' || speechError === 'not-allowed' || speechError === 'service-not-allowed') {
      setShowTextInput(true);
    }
  }, [speechError]);

  const statusLabel = isSpeaking ? 'Speaking'
    : isLoading  ? 'Thinking…'
    : isListening? (inputLang==='zh-CN'?'正在聆听':'Listening…')
    : 'Ready';

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const lastMsg = messages[messages.length-1];
    if (lastMsg?.role==='assistant' && lastMsg.id!==lastProcessedMsgId && !isLoading && lastMsg.content.trim()) {
      speak(lastMsg.content);
      setLastProcessedMsgId(lastMsg.id);
    }
  }, [messages, isLoading, speak, lastProcessedMsgId]);

  useEffect(() => {
    if (transcript && !isListening) handleSendRef.current(transcript);
  }, [transcript, isListening]);

  const handleSend = useCallback(async (content:string) => {
    if (!content.trim()) return;
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    addMessage({ role:'user', content });
    persistMessage(userMsg);
    setTranscript('');
    setLoading(true);
    stop();

    try {
      const res = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[...messages.map(m=>({role:m.role,content:m.content})),{role:'user',content}], settings }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const reader = res.body?.getReader();
      let buf = '';
      const aiMsgId = Math.random().toString(36).substring(7);
      addMessage({ role:'assistant', content:'' });
      while (true) {
        const { done, value } = await reader?.read() || { done:true, value:undefined };
        if (done) break;
        for (const line of new TextDecoder().decode(value).split('\n')) {
          if (line.startsWith('data: ') && line!=='data: [DONE]') {
            try {
              buf += JSON.parse(line.slice(6)).choices[0]?.delta?.content || '';
              useChatStore.setState(s=>{ const m=[...s.messages]; m[m.length-1].content=buf; return{messages:m}; });
            } catch{}
          }
        }
      }
      // Persist the completed AI response
      if (buf.trim()) {
        persistMessage({
          id: aiMsgId,
          role: 'assistant',
          content: buf,
          timestamp: Date.now(),
        });
      }
    } catch(e) { console.error('Chat error:',e); }
    finally { setLoading(false); }
  }, [addMessage, messages, settings, setLoading, setTranscript, stop, persistMessage]);

  useEffect(()=>{ handleSendRef.current=handleSend; },[handleSend]);

  const handleMicClick   = useCallback(()=>{ unlock(); stop(); startListening(inputLang); },[unlock,stop,startListening,inputLang]);
  const handleReplay     = useCallback((t:string)=>{ unlock(); speak(t); },[unlock,speak]);
  const handleClear      = useCallback(async ()=>{
    clearMessages();
    stop();
    if (session?.user?.id) {
      await fetch('/api/messages', { method:'DELETE' }).catch(console.error);
    }
  },[clearMessages, stop, session?.user?.id]);
  const handleTextSend   = useCallback((text:string)=>{ unlock(); handleSendRef.current(text); },[unlock]);

  // ── Status colour ─────────────────────────────────────────────────────────
  const statusColor = isListening ? '#FFA855' : isSpeaking ? '#FF9E45' : isLoading ? '#94a3b8' : theme.textMuted;

  // ── Speech error banner ────────────────────────────────────────────────────
  const speechErrorBanner = speechError === 'network' ? (
    <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl text-xs border text-center"
      style={{ background:'rgba(254,129,19,.06)', borderColor:'rgba(254,129,19,.2)', color:'rgba(255,175,100,.8)' }}>
      <p>语音识别需要 Google 服务，国内网络暂不可用</p>
      <p style={{ color: theme.textMuted }}>请使用下方输入框打字交流</p>
    </div>
  ) : speechError ? (
    <div className="px-4 py-2.5 rounded-xl text-xs text-red-400 border border-red-500/30 text-center"
      style={{ background: theme.mode==='dark'?'rgba(127,29,29,.35)':'rgba(254,226,226,.6)' }}>
      Mic error: {speechError}
    </div>
  ) : null;

  // ── User avatar / sign-out ─────────────────────────────────────────────────
  const UserMenu = () => (
    <div className="flex items-center gap-2">
      {session?.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={session.user.image}
          alt={session.user.name ?? 'User'}
          width={28}
          height={28}
          className="rounded-full"
          style={{ border: `1.5px solid ${theme.bgSidebarBorder}` }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
          style={{ background:'linear-gradient(135deg,#D96B0B,#FE8113)', color:'#fff' }}>
          {session?.user?.name?.[0]?.toUpperCase() ?? 'U'}
        </div>
      )}
      <button
        onClick={() => signOut({ callbackUrl: '/sign-in' })}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        style={{ color: theme.textMuted }}
        onMouseEnter={e=>{e.currentTarget.style.color='#ef4444'; e.currentTarget.style.background='rgba(239,68,68,.08)';}}
        onMouseLeave={e=>{e.currentTarget.style.color=theme.textMuted; e.currentTarget.style.background='transparent';}}
        title="Sign out">
        <LogOut size={13}/>
      </button>
    </div>
  );

  // ── Theme toggle button ────────────────────────────────────────────────────
  const ThemeToggle = () => (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
      style={{
        background: theme.mode==='light' ? 'rgba(254,129,19,.10)' : 'rgba(255,255,255,.06)',
        border: `1px solid ${theme.bgSidebarBorder}`,
        color: theme.mode==='light' ? theme.accent : 'rgba(255,255,255,.45)',
      }}
      onMouseEnter={e=>{ e.currentTarget.style.background = theme.mode==='light'?'rgba(254,129,19,.18)':'rgba(255,255,255,.12)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.background = theme.mode==='light'?'rgba(254,129,19,.10)':'rgba(255,255,255,.06)'; }}
      title={theme.mode==='dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme.mode==='dark' ? <Sun size={14}/> : <Moon size={14}/>}
    </button>
  );

  // ── Shared controls ────────────────────────────────────────────────────────
  const Controls = () => (
    <div className="flex items-center justify-center gap-4">
      {/* Stop */}
      <button onClick={()=>{unlock();stop()}}
        className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{ background:'rgba(239,68,68,.10)', border:'1px solid rgba(239,68,68,.22)' }}
        onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.20)')}
        onMouseLeave={e=>(e.currentTarget.style.background='rgba(239,68,68,.10)')}
        title="Stop">
        <Square size={15} className="text-red-400" fill="currentColor"/>
      </button>

      {/* Mic */}
      <button onClick={handleMicClick} disabled={isLoading}
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 cursor-pointer"
        style={{
          background:isListening?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#FE8113,#D96B0B)',
          boxShadow:isListening?'0 0 32px rgba(239,68,68,.45),0 8px 24px rgba(0,0,0,.3)':'0 0 32px rgba(254,129,19,.40),0 8px 24px rgba(0,0,0,.2)',
          transform:isListening?'scale(1.08)':'scale(1)' }}>
        <div className="absolute inset-0 rounded-full opacity-20" style={{ background:'radial-gradient(circle at 35% 30%,white,transparent 55%)' }}/>
        {isListening?<MicOff size={28} className="text-white relative z-10"/>:<Mic size={28} className="text-white relative z-10"/>}
      </button>

      {/* Language toggle */}
      <button
        onClick={()=>{ unlock(); setInputLang(l=>l==='en-US'?'zh-CN':'en-US'); }}
        disabled={isListening}
        className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center gap-0 cursor-pointer transition-all duration-200 disabled:opacity-40"
        style={{ background: theme.bgInput, border:`1px solid ${theme.bgInputBorder}` }}
        onMouseEnter={e=>(e.currentTarget.style.background=theme.bgCard)}
        onMouseLeave={e=>(e.currentTarget.style.background=theme.bgInput)}
        title="Switch input language">
        <span className="text-[11px] font-bold leading-tight" style={{ color:inputLang==='en-US'?'#FE8113':theme.textMuted }}>EN</span>
        <span className="text-[8px]" style={{ color: theme.textDimmer }}>─</span>
        <span className="text-[11px] font-bold leading-tight" style={{ color:inputLang==='zh-CN'?'#FE8113':theme.textMuted }}>中</span>
      </button>

      {/* Keyboard toggle */}
      <button onClick={()=>setShowTextInput(p=>!p)}
        className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          background: showTextInput?'rgba(254,129,19,.15)':theme.bgInput,
          border: showTextInput?'1px solid rgba(254,129,19,.35)':`1px solid ${theme.bgInputBorder}` }}
        onMouseEnter={e=>(e.currentTarget.style.background=showTextInput?'rgba(254,129,19,.22)':theme.bgCard)}
        onMouseLeave={e=>(e.currentTarget.style.background=showTextInput?'rgba(254,129,19,.15)':theme.bgInput)}
        title="Toggle text input">
        <Keyboard size={15} style={{ color:showTextInput?'#FE8113':theme.textMuted }}/>
      </button>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>

      {/* ═══ DESKTOP ≥ lg ═══ */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden" style={{ background: theme.bgMain }}>

        {/* ── Left sidebar ──────────────────────────────────────────────────── */}
        <aside className="w-[360px] xl:w-[420px] flex flex-col h-full border-r"
          style={{ background: theme.bgSidebar, borderColor: theme.bgSidebarBorder, backdropFilter:'blur(12px)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-6 border-b"
            style={{ borderColor: theme.bgSidebarBorder }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background:'linear-gradient(135deg,#D96B0B,#FE8113)' }}>
                <Sparkles size={16} className="text-white"/>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight" style={{ color: theme.textPrimary }}>SpeakStar</h1>
                <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color: theme.accentPale }}>AI English Tutor</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button onClick={handleClear}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{ color: theme.textMuted, background:'transparent' }}
                onMouseEnter={e=>{e.currentTarget.style.background=theme.bgCard; e.currentTarget.style.color=theme.textSecondary;}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent'; e.currentTarget.style.color=theme.textMuted;}}
                title="Clear">
                <RotateCcw size={14}/>
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 px-6 py-3 border-b" style={{ borderColor: theme.separatorColor }}>
            <div className="flex items-center gap-1.5">
              <MessageSquare size={11} style={{ color: theme.textMuted }}/>
              <span className="text-[11px]" style={{ color: theme.textMuted }}>{messages.length} msgs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe size={11} style={{ color: theme.textMuted }}/>
              <span className="text-[11px]" style={{ color: theme.textMuted }}>{settings.topic}</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: isActive ? theme.statusDotActive : theme.statusDotIdle, boxShadow: isActive?`0 0 6px ${theme.statusDotActive}`:'none' }}/>
              <span className="text-[11px]" style={{ color: statusColor }}>
                {isSpeaking?'Speaking':isLoading?'Thinking':isListening?'Recording':'Ready'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scroll-smooth"
            style={{ scrollbarWidth:'thin', scrollbarColor:`${theme.scrollbarColor} transparent` }}>
            {messages.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-3"
                style={{ opacity:0.35, color: theme.textMuted }}>
                <MessageSquare size={32}/><p className="text-sm">Conversation will appear here</p>
              </div>
            ) : messages.filter(m=>m.role==='user'||m.role==='assistant').map(m => (
              <ChatBubble key={m.id} role={m.role as 'user'|'assistant'} content={m.content}
                onReplay={m.role==='assistant'?()=>handleReplay(m.content):undefined} />
            ))}
            {isListening && transcript && (
              <div className="flex flex-row-reverse gap-3" style={{ animation:'fadeUp .25s ease-out' }}>
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{ background:'rgba(254,129,19,.2)' }}>You</div>
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm italic border border-dashed"
                  style={{ background:'rgba(254,129,19,.06)', borderColor:'rgba(254,129,19,.2)', color:'rgba(255,175,100,.7)' }}>
                  &ldquo;{transcript}&rdquo;</div>
              </div>
            )}
          </div>

          {speechErrorBanner && <div className="mx-5 mb-3">{speechErrorBanner}</div>}

          {/* Input + meta */}
          <div className="px-4 py-4 border-t" style={{ borderColor: theme.separatorColor }}>
            <TextInputBar onSend={handleTextSend} disabled={isLoading}/>
            <div className="flex items-center gap-2 mt-3 px-1">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest border"
                style={{ color: theme.accentPale, borderColor:'rgba(254,129,19,.15)', background:'rgba(254,129,19,.06)' }}>
                {settings.proficiency}
              </span>
              {/* User info */}
              <div className="ml-auto">
                <UserMenu />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right main panel ──────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
              style={{ background:`radial-gradient(circle,${theme.glowStrong} 0%,transparent 65%)` }}/>
            <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full"
              style={{ background:`radial-gradient(circle,${theme.glowSubtle} 0%,transparent 65%)` }}/>
            {isActive && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-opacity duration-700"
              style={{ background:`radial-gradient(circle,${theme.glowMid} 0%,transparent 60%)` }}/>}
          </div>

          {/* ① Status pill */}
          <div className="flex-shrink-0 flex justify-center pt-7 pb-3 relative z-10">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{ background: theme.bgStatusPill, borderColor:'rgba(254,129,19,.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{ background: statusColor, boxShadow: isActive?`0 0 6px ${statusColor}`:'none' }}/>
              <span className="text-[11px] font-medium tracking-wide" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
          </div>

          {/* ② Avatar + Waveform */}
          <div className="flex-shrink-0 flex flex-col items-center gap-4 pt-2 pb-4 relative z-10">
            <AvatarScene isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={200}/>
            <WaveformBars active={isListening||isSpeaking} color={isListening?'bg-[#FE8113]':'bg-[#FF9E45]'}/>
          </div>

          {/* ③ Conversation cards */}
          <div className="flex-1 overflow-y-auto px-8 pb-2 relative z-10"
            style={{ scrollbarWidth:'thin', scrollbarColor:`${theme.scrollbarColor} transparent` }}>
            {(lastUser || assistantText || isLoading) ? (
              <div className="max-w-xl mx-auto space-y-3">
                {lastUser && !isListening && (
                  <div className="rounded-2xl px-5 py-4 text-sm"
                    style={{ background: theme.bubbleUserBg, border:`1px solid ${theme.bubbleUserBorder}`, animation:'fadeUp .35s ease-out' }}>
                    <p className="leading-relaxed" style={{ color: theme.textSecondary }}>{lastUser.content}</p>
                  </div>
                )}
                {isListening && transcript && (
                  <div className="rounded-2xl px-5 py-4 border border-dashed text-sm"
                    style={{ background:'rgba(254,129,19,.04)', borderColor:'rgba(254,129,19,.2)', animation:'fadeUp .2s ease-out' }}>
                    <p className="italic" style={{ color:'rgba(255,175,100,.7)' }}>&ldquo;{transcript}&rdquo;</p>
                  </div>
                )}
                {(assistantText || isLoading) && (
                  <div className="group relative rounded-2xl px-5 py-4 text-sm"
                    style={{ background: theme.bubbleAIBg, border:`1px solid ${theme.bubbleAIBorder}`, backdropFilter:'blur(12px)', animation:'fadeUp .35s ease-out .1s both' }}>
                    {isLoading && !assistantText ? (
                      <div className="flex gap-1.5 h-5 items-center">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.4)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>
                    ) : <p className="leading-relaxed" style={{ color: theme.bubbleAIText }}>{assistantText}</p>}
                    {assistantText && !isLoading && (
                      <button onClick={()=>handleReplay(assistantText)}
                        className="absolute top-3 right-3 flex items-center gap-1 text-[10px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        style={{ color: theme.textDim }}
                        onMouseEnter={e=>(e.currentTarget.style.color=theme.accentText)}
                        onMouseLeave={e=>(e.currentTarget.style.color=theme.textDim)}>
                        <Volume2 size={10}/> Replay
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[12px] tracking-wide" style={{ color: theme.textDimmer }}>— Click mic to start —</p>
              </div>
            )}
          </div>

          {/* ④ Controls */}
          <div className="flex-shrink-0 relative z-10 border-t px-8 pt-5 pb-7"
            style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter:'blur(20px)' }}>
            <div className="flex flex-col items-center gap-3">
              <Controls />
              <p className="text-[11px] tracking-wide" style={{ color: theme.textDimmer }}>
                {inputLang==='zh-CN'?'中文输入 · 英文回复':'EN input · EN reply'}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ MOBILE < lg ═══ */}
      <div className="flex lg:hidden flex-col h-screen w-full overflow-hidden select-none"
        style={{ background: theme.bgMain }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 -left-28 w-72 h-72 rounded-full"
            style={{ background:`radial-gradient(circle,${theme.glowStrong} 0%,transparent 70%)` }}/>
          <div className="absolute -bottom-28 -right-28 w-72 h-72 rounded-full"
            style={{ background:`radial-gradient(circle,${theme.glowSubtle} 0%,transparent 70%)` }}/>
        </div>

        {/* Mobile header */}
        <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[.2em] uppercase mb-0.5"
              style={{ color: theme.accentPale }}>AI English Tutor</p>
            <h1 className="text-xl font-bold tracking-tight" style={{ color: theme.textPrimary }}>SpeakStar</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={handleClear}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
              style={{ color: theme.textMuted }}
              onMouseEnter={e=>{e.currentTarget.style.color=theme.textSecondary;}}
              onMouseLeave={e=>{e.currentTarget.style.color=theme.textMuted;}}>
              <RotateCcw size={15}/>
            </button>
            <UserMenu />
          </div>
        </header>

        {/* Mobile avatar */}
        <div className="flex-shrink-0 relative z-10 flex flex-col items-center gap-2 pt-2 pb-1 px-5">
          <AvatarScene isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={130}/>
          <WaveformBars active={isListening||isSpeaking} color={isListening?'bg-[#FE8113]':'bg-[#FF9E45]'}/>
        </div>

        {/* Mobile conversation cards */}
        <div className="flex-1 relative z-10 overflow-y-auto px-5 pb-2 space-y-2.5"
          style={{ scrollbarWidth:'none' }}>
          {lastUser && !isListening && (
            <div className="rounded-2xl px-4 py-4 text-sm"
              style={{ background: theme.bubbleUserBg, border:`1px solid ${theme.bubbleUserBorder}`, animation:'fadeUp .35s ease-out' }}>
              <p className="leading-relaxed" style={{ color: theme.textSecondary }}>{lastUser.content}</p>
            </div>
          )}
          {isListening && transcript && (
            <div className="rounded-2xl px-4 py-3.5 border border-dashed"
              style={{ background:'rgba(254,129,19,.04)', borderColor:'rgba(254,129,19,.2)', animation:'fadeUp .2s ease-out' }}>
              <p className="text-sm italic text-center" style={{ color:'rgba(255,175,100,.7)' }}>&ldquo;{transcript}&rdquo;</p>
            </div>
          )}
          {(assistantText || isLoading) && (
            <div className="relative group rounded-2xl px-4 py-4"
              style={{ background: theme.bubbleAIBg, border:`1px solid ${theme.bubbleAIBorder}`, backdropFilter:'blur(12px)', animation:'fadeUp .35s ease-out .1s both' }}>
              {isLoading && !assistantText ? (
                <div className="flex gap-1.5 h-4 items-center">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.4)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>
              ) : <p className="text-sm leading-relaxed" style={{ color: theme.bubbleAIText }}>{assistantText}</p>}
              {assistantText && !isLoading && (
                <button onClick={()=>handleReplay(assistantText)}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[10px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  style={{ color: theme.textDim }}
                  onMouseEnter={e=>(e.currentTarget.style.color=theme.accentText)}
                  onMouseLeave={e=>(e.currentTarget.style.color=theme.textDim)}>
                  <Volume2 size={10}/> Replay
                </button>
              )}
            </div>
          )}
        </div>

        {speechErrorBanner && <div className="relative z-20 mx-5 mb-1">{speechErrorBanner}</div>}

        {showTextInput && (
          <div className="relative z-10 px-5 pb-2" style={{ animation:'fadeUp .25s ease-out' }}>
            <TextInputBar onSend={handleTextSend} disabled={isLoading}/>
          </div>
        )}

        {/* Mobile footer */}
        <footer className="relative z-10 flex-shrink-0 px-6 pb-8 pt-4 border-t"
          style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter:'blur(16px)' }}>
          <Controls />
          <p className="text-center text-[10px] mt-4 tracking-wide" style={{ color: theme.textDimmer }}>
            {inputLang==='zh-CN'?'中文输入 · 英文回复':'EN input · EN reply'}
          </p>
        </footer>
      </div>
    </>
  );
};
