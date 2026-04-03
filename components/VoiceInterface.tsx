'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/useChatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { Mic, MicOff, Square, RotateCcw, Volume2, MessageSquare, Sparkles, Globe, Send, Keyboard } from 'lucide-react';

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Primary:  #FE8113  (Hermès orange)
// Dark:     #D96B0B  (deep orange)
// Light:    #FF9E45  (warm amber)
// Pale:     #FFC07A  (light amber text)
// Gray:     #363636  (structural dark gray)
// BG:       #0C0A08  (warm near-black)

const STYLES = `
  @keyframes waveBar { from{transform:scaleY(0.3)} to{transform:scaleY(1)} }
  @keyframes pingRing { 0%{transform:translate(-50%,-50%) scale(1);opacity:.6} 100%{transform:translate(-50%,-50%) scale(1.6);opacity:0} }
  @keyframes floatOrb { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes rotateBorder { from{transform:translate(-50%,-50%) rotate(0deg)} to{transform:translate(-50%,-50%) rotate(360deg)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important}}
`;

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

const OrbitRing = ({ delay, size, opacity }: { delay:string; size:number; opacity:number }) => (
  <div className="absolute rounded-full"
    style={{ width:size, height:size, top:'50%', left:'50%',
      border:'1px solid rgba(254,129,19,.25)',
      animation:`pingRing 2.4s ease-out ${delay} infinite`, opacity }} />
);

const VoiceOrb = ({ isActive, isListening, isSpeaking, isLoading, size=144 }: {
  isActive:boolean; isListening:boolean; isSpeaking:boolean; isLoading:boolean; size?:number;
}) => {
  const rs = size * 1.4;
  return (
    <div className="relative flex items-center justify-center" style={{ width:size, height:size }}>
      {isActive && <><OrbitRing size={rs} delay="0s" opacity={.5}/><OrbitRing size={rs} delay=".8s" opacity={.35}/><OrbitRing size={rs} delay="1.6s" opacity={.2}/></>}
      {isListening && <div className="absolute rounded-full" style={{ width:size, height:size, top:'50%', left:'50%',
        animation:'rotateBorder 3s linear infinite',
        background:'conic-gradient(from 0deg,transparent 0%,#FE8113 40%,#FF9E45 60%,transparent 100%)',
        mask:'radial-gradient(farthest-side,transparent calc(100% - 2px),black calc(100% - 2px))',
        WebkitMask:'radial-gradient(farthest-side,transparent calc(100% - 2px),black calc(100% - 2px))' }} />}
      <div className="relative rounded-full flex items-center justify-center" style={{
        width:size, height:size,
        background: isLoading
          ? 'linear-gradient(135deg,#2A2A2A,#3A3A3A)'
          : 'linear-gradient(135deg,#D96B0B 0%,#FE8113 60%,#FF9E45 100%)',
        boxShadow: isActive
          ? '0 0 60px rgba(254,129,19,.55),0 0 120px rgba(254,129,19,.2),inset 0 1px 0 rgba(255,255,255,.15)'
          : '0 0 30px rgba(254,129,19,.2),inset 0 1px 0 rgba(255,255,255,.1)',
        animation: !isActive?'floatOrb 4s ease-in-out infinite':'none',
        transform: isSpeaking?'scale(1.07)':'scale(1)',
        transition:'transform .4s ease-out,box-shadow .4s ease-out,background .4s ease-out' }}>
        <div className="absolute rounded-full opacity-20" style={{ inset:size*.1, background:'radial-gradient(circle at 35% 30%,white,transparent 60%)' }} />
        {isSpeaking
          ? <Volume2 className="text-white/90 drop-shadow-lg relative z-10" size={size*.32} style={{ animation:'waveBar .6s ease-in-out infinite alternate' }} />
          : isLoading
            ? <div className="flex gap-1.5 relative z-10">{[0,1,2].map(i=><div key={i} className="w-2 h-2 rounded-full bg-white/60" style={{ animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>
            : <Sparkles className="text-white/85 relative z-10" size={size*.3} />}
      </div>
    </div>
  );
};

const ChatBubble = ({ role, content, onReplay }: { role:'user'|'assistant'; content:string; onReplay?:()=>void }) => {
  const u = role === 'user';
  return (
    <div className={`flex gap-3 ${u?'flex-row-reverse':'flex-row'}`} style={{ animation:'fadeUp .3s ease-out' }}>
      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold mt-0.5"
        style={{ background: u?'rgba(254,129,19,.2)':'linear-gradient(135deg,#D96B0B,#FE8113)' }}>
        {u?'You':'AI'}
      </div>
      <div className={`max-w-[80%] group ${u?'items-end':'items-start'} flex flex-col gap-1`}>
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{
          background: u?'rgba(254,129,19,.10)':'rgba(255,255,255,.05)',
          border: u?'1px solid rgba(254,129,19,.28)':'1px solid rgba(255,255,255,.07)',
          backdropFilter:'blur(8px)', color: u?'rgba(255,255,255,.85)':'rgba(255,255,255,.8)' }}>
          {content || <div className="flex gap-1 items-center h-4">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.5)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>}
        </div>
        {!u && content && onReplay && (
          <button onClick={onReplay} className="flex items-center gap-1 text-[10px] text-white/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100 pl-1"
            style={{ '--hover-color':'#FFA855' } as React.CSSProperties}
            onMouseEnter={e=>(e.currentTarget.style.color='#FFA855')}
            onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.2)')}>
            <Volume2 size={10}/> Replay
          </button>
        )}
      </div>
    </div>
  );
};

// ─── Text Input Bar ──────────────────────────────────────────────────────────
const TextInputBar = ({ onSend, disabled }: { onSend:(text:string)=>void; disabled:boolean }) => {
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
        style={{ background:'rgba(54,54,54,.4)', border:'1px solid rgba(254,129,19,.12)' }}>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/25 outline-none disabled:opacity-40"
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
  const { messages, addMessage, isLoading, setLoading, settings, clearMessages } = useChatStore();
  const { isListening, transcript, error: speechError, startListening, setTranscript } = useSpeechToText();
  const { speak, stop, unlock, isSpeaking } = useTextToSpeech();

  const [lastProcessedMsgId, setLastProcessedMsgId] = useState<string|null>(null);
  const [inputLang, setInputLang] = useState<'en-US'|'zh-CN'>('en-US');
  const [showTextInput, setShowTextInput] = useState(false);
  const handleSendRef = useRef<(c:string)=>void>(()=>{});
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const lastAssistant = [...messages].reverse().find(m=>m.role==='assistant');
  const lastUser = [...messages].reverse().find(m=>m.role==='user');
  const assistantText = lastAssistant?.content ?? '';
  const isActive = isListening || isSpeaking || isLoading;

  useEffect(() => {
    if (speechError === 'network' || speechError === 'not-allowed' || speechError === 'service-not-allowed') {
      setShowTextInput(true);
    }
  }, [speechError]);

  const statusLabel = isSpeaking ? 'Speaking'
    : isLoading  ? 'Thinking…'
    : isListening? (inputLang==='zh-CN'?'正在聆听':'Listening…')
    : messages.length <= 1 ? 'Ready' : 'Ready';

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
    addMessage({ role:'user', content });
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
      addMessage({ role:'assistant', content:'' });
      while (true) {
        const { done, value } = await reader?.read() || { done:true, value:undefined };
        if (done) break;
        for (const line of new TextDecoder().decode(value).split('\n')) {
          if (line.startsWith('data: ') && line!=='data: [DONE]') {
            try {
              buf += JSON.parse(line.slice(6)).choices[0]?.delta?.content || '';
              useChatStore.setState(s=>{
                const m=[...s.messages]; m[m.length-1].content=buf; return{messages:m};
              });
            } catch{}
          }
        }
      }
    } catch(e) { console.error('Chat error:',e); }
    finally { setLoading(false); }
  }, [addMessage, messages, settings, setLoading, setTranscript, stop]);

  useEffect(()=>{ handleSendRef.current=handleSend; },[handleSend]);

  const handleMicClick = useCallback(()=>{ unlock(); stop(); startListening(inputLang); },[unlock,stop,startListening,inputLang]);
  const handleReplay = useCallback((t:string)=>{ unlock(); speak(t); },[unlock,speak]);
  const handleClear = useCallback(()=>{ clearMessages(); stop(); },[clearMessages,stop]);
  const handleTextSend = useCallback((text:string)=>{ unlock(); handleSendRef.current(text); },[unlock]);

  // ── Speech error banner ──────────────────────────────────────────────────
  const speechErrorBanner = speechError === 'network' ? (
    <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl text-xs border text-center"
      style={{ background:'rgba(254,129,19,.06)', borderColor:'rgba(254,129,19,.2)' }}>
      <p style={{ color:'rgba(255,175,100,.8)' }}>语音识别需要 Google 服务，国内网络暂不可用</p>
      <p className="text-white/30">请使用下方输入框打字交流</p>
    </div>
  ) : speechError ? (
    <div className="px-4 py-2.5 rounded-xl text-xs text-red-300 bg-red-950/50 border border-red-800/30 text-center">
      Mic error: {speechError}
    </div>
  ) : null;

  // ── Controls (shared) ─────────────────────────────────────────────────────
  const Controls = ({ compact: _compact }: { compact?:boolean }) => (
    <div className="flex items-center justify-center gap-4">
      {/* Stop */}
      <button onClick={()=>{unlock();stop()}}
        className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)' }}
        onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,.2)')}
        onMouseLeave={e=>(e.currentTarget.style.background='rgba(239,68,68,.1)')}
        title="Stop">
        <Square size={15} className="text-red-400" fill="currentColor"/>
      </button>

      {/* Mic */}
      <button onClick={handleMicClick} disabled={isLoading}
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40 cursor-pointer"
        style={{
          background:isListening?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#FE8113,#D96B0B)',
          boxShadow:isListening?'0 0 32px rgba(239,68,68,.45),0 8px 24px rgba(0,0,0,.4)':'0 0 32px rgba(254,129,19,.45),0 8px 24px rgba(0,0,0,.4)',
          transform:isListening?'scale(1.08)':'scale(1)' }}>
        <div className="absolute inset-0 rounded-full opacity-20" style={{ background:'radial-gradient(circle at 35% 30%,white,transparent 55%)' }}/>
        {isListening?<MicOff size={28} className="text-white relative z-10"/>:<Mic size={28} className="text-white relative z-10"/>}
      </button>

      {/* Language toggle EN/中 */}
      <button
        onClick={()=>{ unlock(); setInputLang(l=>l==='en-US'?'zh-CN':'en-US'); }}
        disabled={isListening}
        className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center gap-0 cursor-pointer transition-all duration-200 disabled:opacity-40"
        style={{ background:'rgba(54,54,54,.35)', border:'1px solid rgba(254,129,19,.1)' }}
        onMouseEnter={e=>(e.currentTarget.style.background='rgba(54,54,54,.6)')}
        onMouseLeave={e=>(e.currentTarget.style.background='rgba(54,54,54,.35)')}
        title="Switch input language">
        <span className="text-[11px] font-bold leading-tight" style={{ color:inputLang==='en-US'?'#FE8113':'rgba(255,255,255,.25)' }}>EN</span>
        <span className="text-[8px] text-white/10">─</span>
        <span className="text-[11px] font-bold leading-tight" style={{ color:inputLang==='zh-CN'?'#FE8113':'rgba(255,255,255,.25)' }}>中</span>
      </button>

      {/* Keyboard / text toggle */}
      <button onClick={()=>setShowTextInput(p=>!p)}
        className="w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-200"
        style={{
          background:showTextInput?'rgba(254,129,19,.15)':'rgba(54,54,54,.35)',
          border:showTextInput?'1px solid rgba(254,129,19,.35)':'1px solid rgba(254,129,19,.1)' }}
        onMouseEnter={e=>(e.currentTarget.style.background=showTextInput?'rgba(254,129,19,.22)':'rgba(54,54,54,.6)')}
        onMouseLeave={e=>(e.currentTarget.style.background=showTextInput?'rgba(254,129,19,.15)':'rgba(54,54,54,.35)')}
        title="Toggle text input">
        <Keyboard size={15} style={{ color:showTextInput?'#FE8113':'rgba(255,255,255,.4)' }}/>
      </button>
    </div>
  );

  return (
    <>
      <style>{STYLES}</style>

      {/* ═══ DESKTOP ≥ lg ═══ */}
      <div className="hidden lg:flex h-screen w-full text-white overflow-hidden" style={{ background:'#0C0A08' }}>

        {/* Left sidebar */}
        <aside className="w-[360px] xl:w-[420px] flex flex-col h-full border-r"
          style={{ background:'rgba(54,54,54,.18)', borderColor:'rgba(254,129,19,.08)' }}>

          <div className="flex items-center justify-between px-6 py-6 border-b" style={{ borderColor:'rgba(254,129,19,.07)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,#D96B0B,#FE8113)' }}>
                <Sparkles size={16} className="text-white"/>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white">SpeakStar</h1>
                <p className="text-[10px] font-medium tracking-widest uppercase" style={{ color:'rgba(254,160,80,.6)' }}>AI English Tutor</p>
              </div>
            </div>
            <button onClick={handleClear}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer" title="Clear">
              <RotateCcw size={14}/>
            </button>
          </div>

          <div className="flex items-center gap-4 px-6 py-3 border-b" style={{ borderColor:'rgba(255,255,255,.04)' }}>
            <div className="flex items-center gap-1.5"><MessageSquare size={11} className="text-white/20"/><span className="text-[11px] text-white/30">{messages.length} msgs</span></div>
            <div className="flex items-center gap-1.5"><Globe size={11} className="text-white/20"/><span className="text-[11px] text-white/30">{settings.topic}</span></div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background:isActive?'#22c55e':'#2A2A2A', boxShadow:isActive?'0 0 6px #22c55e':'none' }}/>
              <span className="text-[11px] text-white/30">{isSpeaking?'Speaking':isLoading?'Thinking':isListening?'Recording':'Ready'}</span>
            </div>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-5 py-5 space-y-4 scroll-smooth"
            style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(254,129,19,.1) transparent' }}>
            {messages.length===0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-25 gap-3">
                <MessageSquare size={32}/><p className="text-sm">Conversation will appear here</p>
              </div>
            ) : messages.filter(m=>m.role==='user'||m.role==='assistant').map(m => (
              <ChatBubble key={m.id} role={m.role as 'user'|'assistant'} content={m.content}
                onReplay={m.role==='assistant'?()=>handleReplay(m.content):undefined} />
            ))}
            {isListening && transcript && (
              <div className="flex flex-row-reverse gap-3" style={{ animation:'fadeUp .25s ease-out' }}>
                <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background:'rgba(254,129,19,.2)' }}>You</div>
                <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm italic border border-dashed"
                  style={{ background:'rgba(254,129,19,.06)', borderColor:'rgba(254,129,19,.2)', color:'rgba(255,175,100,.7)' }}>&ldquo;{transcript}&rdquo;</div>
              </div>
            )}
          </div>

          {speechErrorBanner && <div className="mx-5 mb-3">{speechErrorBanner}</div>}

          <div className="px-4 py-4 border-t" style={{ borderColor:'rgba(255,255,255,.05)' }}>
            <TextInputBar onSend={handleTextSend} disabled={isLoading}/>
            <div className="flex items-center gap-2 mt-3 px-1">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-widest border"
                style={{ color:'rgba(254,160,80,.6)', borderColor:'rgba(254,129,19,.15)', background:'rgba(254,129,19,.06)' }}>{settings.proficiency}</span>
              <span className="text-[11px] text-white/15 ml-auto">
                {inputLang==='zh-CN'?'中文输入 · 英文回复':'EN input · EN reply'}
              </span>
            </div>
          </div>
        </aside>

        {/* Right panel — 4-row: status · orb · cards · controls */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Ambient glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full" style={{ background:'radial-gradient(circle,rgba(254,129,19,.10) 0%,transparent 65%)' }}/>
            <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full" style={{ background:'radial-gradient(circle,rgba(217,107,11,.08) 0%,transparent 65%)' }}/>
            {isActive && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full transition-opacity duration-700" style={{ background:'radial-gradient(circle,rgba(254,129,19,.06) 0%,transparent 60%)' }}/>}
          </div>

          {/* ① Status pill */}
          <div className="flex-shrink-0 flex justify-center pt-7 pb-3 relative z-10">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border"
              style={{ background:'rgba(54,54,54,.25)', borderColor:'rgba(254,129,19,.12)' }}>
              <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                style={{
                  background: isListening?'#FFA855':isSpeaking?'#FF9E45':isLoading?'#94a3b8':'#2A2A2A',
                  boxShadow: isActive?'0 0 6px currentColor':'none' }}/>
              <span className="text-[11px] font-medium tracking-wide"
                style={{ color:isListening?'#FFA855':isSpeaking?'#FF9E45':isLoading?'#94a3b8':'#555' }}>{statusLabel}</span>
            </div>
          </div>

          {/* ② Orb + Waveform */}
          <div className="flex-shrink-0 flex flex-col items-center gap-5 pt-4 pb-5 relative z-10">
            <VoiceOrb isActive={isActive} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={160}/>
            <WaveformBars active={isListening||isSpeaking} color={isListening?'bg-[#FE8113]':'bg-[#FF9E45]'}/>
          </div>

          {/* ③ Conversation cards — scrollable */}
          <div className="flex-1 overflow-y-auto px-8 pb-2 relative z-10"
            style={{ scrollbarWidth:'thin', scrollbarColor:'rgba(254,129,19,.08) transparent' }}>
            {(lastUser || assistantText || isLoading) ? (
              <div className="max-w-xl mx-auto space-y-3">
                {lastUser && !isListening && (
                  <div className="rounded-2xl px-5 py-4 text-sm"
                    style={{ background:'rgba(254,129,19,.07)', border:'1px solid rgba(254,129,19,.18)', animation:'fadeUp .35s ease-out' }}>
                    <p className="text-white/70 leading-relaxed">{lastUser.content}</p>
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
                    style={{ background:'rgba(54,54,54,.3)', border:'1px solid rgba(255,255,255,.07)', backdropFilter:'blur(12px)', animation:'fadeUp .35s ease-out .1s both' }}>
                    {isLoading && !assistantText ? (
                      <div className="flex gap-1.5 h-5 items-center">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.4)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>
                    ) : <p className="text-white/75 leading-relaxed">{assistantText}</p>}
                    {assistantText && !isLoading && (
                      <button onClick={()=>handleReplay(assistantText)}
                        className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-white/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        onMouseEnter={e=>(e.currentTarget.style.color='#FFA855')}
                        onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.2)')}>
                        <Volume2 size={10}/> Replay
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-[12px] text-white/15 tracking-wide">— Click mic to start —</p>
              </div>
            )}
          </div>

          {/* ④ Controls — fixed bottom */}
          <div className="flex-shrink-0 relative z-10 border-t px-8 pt-5 pb-7"
            style={{ borderColor:'rgba(254,129,19,.08)', background:'rgba(12,10,8,.92)', backdropFilter:'blur(20px)' }}>
            <div className="flex flex-col items-center gap-3">
              <Controls />
              <p className="text-[11px] text-white/15 tracking-wide">
                {inputLang==='zh-CN'?'中文输入 · 英文回复':'EN input · EN reply'}
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ MOBILE < lg ═══ */}
      <div className="flex lg:hidden flex-col h-screen w-full text-white overflow-hidden select-none" style={{ background:'#0C0A08' }}>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 -left-28 w-72 h-72 rounded-full" style={{ background:'radial-gradient(circle,rgba(254,129,19,.12) 0%,transparent 70%)' }}/>
          <div className="absolute -bottom-28 -right-28 w-72 h-72 rounded-full" style={{ background:'radial-gradient(circle,rgba(217,107,11,.09) 0%,transparent 70%)' }}/>
        </div>

        <header className="relative z-10 flex items-center justify-between px-5 pt-12 pb-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[.2em] uppercase mb-0.5" style={{ color:'rgba(254,160,80,.65)' }}>AI English Tutor</p>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">SpeakStar</h1>
          </div>
          <button onClick={handleClear} className="w-9 h-9 rounded-xl flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer">
            <RotateCcw size={15}/>
          </button>
        </header>

        {/* Orb + status */}
        <div className="flex-shrink-0 relative z-10 flex flex-col items-center gap-3 pt-3 pb-2 px-5">
          <VoiceOrb isActive={isActive} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={108}/>
          <WaveformBars active={isListening||isSpeaking} color={isListening?'bg-[#FE8113]':'bg-[#FF9E45]'}/>
          <p className="text-sm font-medium tracking-wide transition-all duration-300"
            style={{ color:isListening?'#FFA855':isSpeaking?'#FF9E45':isLoading?'#94a3b8':'#444' }}>{statusLabel}</p>
        </div>

        {/* Conversation cards — scrollable */}
        <div className="flex-1 relative z-10 overflow-y-auto px-5 pb-2 space-y-2.5"
          style={{ scrollbarWidth:'none' }}>
          {lastUser && !isListening && (
            <div className="rounded-2xl px-4 py-4 text-sm"
              style={{ background:'rgba(254,129,19,.07)', border:'1px solid rgba(254,129,19,.18)', animation:'fadeUp .35s ease-out' }}>
              <p className="text-white/75 leading-relaxed">{lastUser.content}</p>
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
              style={{ background:'rgba(54,54,54,.3)', border:'1px solid rgba(255,255,255,.07)', backdropFilter:'blur(12px)', animation:'fadeUp .35s ease-out .1s both' }}>
              {isLoading && !assistantText ? (
                <div className="flex gap-1.5 h-4 items-center">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background:'rgba(254,129,19,.4)', animation:`waveBar .8s ease-in-out ${i*.2}s infinite alternate` }}/>)}</div>
              ) : <p className="text-sm text-white/75 leading-relaxed">{assistantText}</p>}
              {assistantText && !isLoading && (
                <button onClick={()=>handleReplay(assistantText)}
                  className="absolute top-3 right-3 flex items-center gap-1 text-[10px] text-white/20 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  onMouseEnter={e=>(e.currentTarget.style.color='#FFA855')}
                  onMouseLeave={e=>(e.currentTarget.style.color='rgba(255,255,255,.2)')}>
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

        <footer className="relative z-10 flex-shrink-0 px-6 pb-8 pt-4 border-t"
          style={{ borderColor:'rgba(254,129,19,.08)', background:'rgba(12,10,8,.92)', backdropFilter:'blur(16px)' }}>
          <Controls />
          <p className="text-center text-[10px] text-white/12 mt-4 tracking-wide">
            {inputLang==='zh-CN'?'中文输入 · 英文回复':'EN input · EN reply'}
          </p>
        </footer>
      </div>
    </>
  );
};
