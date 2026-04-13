'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useChatStore } from '@/store/useChatStore';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';
import { useThemeStore } from '@/store/useThemeStore';
import { useSession, signOut } from 'next-auth/react';
import { AvatarScene } from '@/components/AvatarScene';
import { AvatarCharacter } from '@/components/AvatarCharacter';
import { TrumpAvatarCharacter } from '@/components/TrumpAvatarCharacter';
import { AuraeLogo } from '@/components/AuraeLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Mic, MicOff, Square, RotateCcw, Volume2, MessageSquare,
  Send, Keyboard, LogOut, Plus, Trash2, Menu, X, PanelLeftClose, PanelLeftOpen,
  BookOpen, CheckCircle, Zap, Users, ChevronDown,
} from 'lucide-react';

import type { Conversation, Persona, UsageInfo } from '@/types';
import { PAID_PLANS_LIVE } from '@/lib/product-flags';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage, generateId } from 'ai';

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
  @keyframes sceneIdleGlow { 0%,100%{box-shadow:0 0 28px rgba(201,100,66,.18),0 0 60px rgba(201,100,66,.07)} 50%{box-shadow:0 0 36px rgba(201,100,66,.26),0 0 80px rgba(201,100,66,.12)} }
  @keyframes sceneActiveGlow { 0%,100%{box-shadow:0 0 48px rgba(201,100,66,.52),0 0 100px rgba(201,100,66,.22),inset 0 1px 0 rgba(255,255,255,.06)} 50%{box-shadow:0 0 70px rgba(201,100,66,.72),0 0 140px rgba(201,100,66,.32),inset 0 1px 0 rgba(255,255,255,.08)} }
  @keyframes sceneThinkGlow { 0%,100%{box-shadow:0 0 40px rgba(148,163,184,.25),0 0 80px rgba(148,163,184,.10)} 50%{box-shadow:0 0 58px rgba(148,163,184,.38),0 0 110px rgba(148,163,184,.16)} }
  @keyframes sceneIdleGlowLight { 0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.07),0 0 0 1px rgba(201,100,66,.14)} 50%{box-shadow:0 6px 32px rgba(0,0,0,.10),0 0 0 1px rgba(201,100,66,.20)} }
  @keyframes sceneActiveGlowLight { 0%,100%{box-shadow:0 4px 28px rgba(201,100,66,.24),0 0 0 2px rgba(201,100,66,.32)} 50%{box-shadow:0 6px 40px rgba(201,100,66,.32),0 0 0 2px rgba(201,100,66,.42)} }
  @keyframes sceneThinkGlowLight { 0%,100%{box-shadow:0 4px 24px rgba(100,130,180,.18),0 0 0 1px rgba(100,130,180,.20)} 50%{box-shadow:0 6px 32px rgba(100,130,180,.24),0 0 0 1px rgba(100,130,180,.28)} }

  @keyframes sceneTrumpIdleGlow { 0%,100%{box-shadow:0 0 28px rgba(204,26,26,.15),0 0 60px rgba(204,26,26,.06)} 50%{box-shadow:0 0 36px rgba(204,26,26,.22),0 0 80px rgba(204,26,26,.10)} }
  @keyframes sceneTrumpActiveGlow { 0%,100%{box-shadow:0 0 48px rgba(204,26,26,.50),0 0 100px rgba(204,26,26,.20)} 50%{box-shadow:0 0 70px rgba(204,26,26,.70),0 0 140px rgba(204,26,26,.30)} }
  @keyframes sceneTrumpIdleGlowLight { 0%,100%{box-shadow:0 4px 24px rgba(0,0,0,.08),0 0 0 1px rgba(204,26,26,.12)} 50%{box-shadow:0 6px 32px rgba(0,0,0,.11),0 0 0 1px rgba(204,26,26,.18)} }
  @keyframes sceneTrumpActiveGlowLight { 0%,100%{box-shadow:0 4px 28px rgba(204,26,26,.22),0 0 0 2px rgba(204,26,26,.30)} 50%{box-shadow:0 6px 40px rgba(204,26,26,.30),0 0 0 2px rgba(204,26,26,.40)} }

  @keyframes personaCardIn { from{opacity:0;transform:translateY(14px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

  .avatar-strip { transition: all .4s cubic-bezier(.4,0,.2,1); }
  @keyframes stripIn { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

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

function getUserId(session: ReturnType<typeof useSession>['data']) {
  return (session?.user as ({ id?: string } | undefined))?.id;
}

/** Extract plain text from UIMessage parts for TTS */
function extractText(msg: UIMessage): string {
  const rawText = msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('');
  const parsed = stripToolCallArtifacts(rawText);
  const toolParts = msg.parts.filter((p): p is ToolPartLike => p.type.startsWith('tool-'));
  const hasAnyCard = toolParts.length > 0 || !!parsed.correction || !!parsed.challenge || !!parsed.vocabulary;
  const cleanedText = parsed.cleanedText;
  if (cleanedText) {
    if (hasAnyCard && looksLikeThinkingProcess(cleanedText)) {
      return '';
    }
    return cleanedText;
  }
  return getToolFallbackLine(toolParts) || getInlineFallbackLine(parsed);
}

function parseCorrectionPayload(text: string): { original?: string; corrected?: string; explanation?: string } | null {
  const protocolMatch = text.match(/(?:functions\.)?correctGrammar:\d+\|(\{[\s\S]*?\})/im);
  if (protocolMatch?.[1]) {
    try {
      const parsed = JSON.parse(protocolMatch[1]) as {
        original?: string;
        corrected?: string;
        explanation?: string;
      };
      if (parsed.original || parsed.corrected || parsed.explanation) {
        return parsed;
      }
    } catch {
      // Fall through to non-JSON pattern parsing below.
    }
  }

  const sourceMatch = text.match(/function\.correctGrammar\s*\(([\s\S]*?)\)\s*$/im)
    ?? text.match(/correctGrammar\s*\(([\s\S]*?)\)\s*$/im);
  if (!sourceMatch) return null;
  const source = sourceMatch[1];

  const readField = (keys: string[]): string | undefined => {
    for (const key of keys) {
      const quoted = new RegExp(`["']${key}["']\\s*:\\s*["']([\\s\\S]*?)["']`, 'i').exec(source);
      if (quoted?.[1]) return quoted[1].trim();
      const plain = new RegExp(`${key}\\s*[:：]\\s*["“”]?([^\\n\\r,}]+)`, 'i').exec(source);
      if (plain?.[1]) return plain[1].trim();
    }
    return undefined;
  };

  const parsed = {
    original: readField(['original', '原句']),
    corrected: readField(['corrected', '修正', '纠正']),
    explanation: readField(['explanation', '解释']),
  };

  if (!parsed.original && !parsed.corrected && !parsed.explanation) return null;
  return parsed;
}

function parseChallengePayload(text: string): { type?: string; prompt?: string; hint?: string } | null {
  const protocolMatch = text.match(/(?:functions\.)?issueChallenge:\d+\|(\{[\s\S]*?\})/im);
  if (!protocolMatch?.[1]) return null;
  try {
    const parsed = JSON.parse(protocolMatch[1]) as { type?: string; prompt?: string; hint?: string };
    if (parsed.type || parsed.prompt || parsed.hint) return parsed;
  } catch {
    return null;
  }
  return null;
}

function parseVocabularyPayload(text: string): { word?: string; partOfSpeech?: string } | null {
  const protocolMatch = text.match(/(?:functions\.)?explainVocabulary:\d+\|(\{[\s\S]*?\})/im);
  if (!protocolMatch?.[1]) return null;
  try {
    const parsed = JSON.parse(protocolMatch[1]) as { word?: string; partOfSpeech?: string };
    if (parsed.word || parsed.partOfSpeech) return parsed;
  } catch {
    return null;
  }
  return null;
}

function stripToolCallArtifacts(text: string): {
  cleanedText: string;
  correction: { original: string; corrected: string; explanation: string } | null;
  challenge: { type: string; prompt: string; hint?: string } | null;
  vocabulary: { word: string; partOfSpeech?: string } | null;
} {
  const correction = parseCorrectionPayload(text);
  const challenge = parseChallengePayload(text);
  const vocabulary = parseVocabularyPayload(text);
  const cleanedText = text
    .replace(/(?:functions\.)?correctGrammar:\d+\|(\{[\s\S]*?\})/gim, '')
    .replace(/(?:functions\.)?issueChallenge:\d+\|(\{[\s\S]*?\})/gim, '')
    .replace(/(?:functions\.)?explainVocabulary:\d+\|(\{[\s\S]*?\})/gim, '')
    .replace(/(?:functions\.)?[a-zA-Z_]\w*:\d+\|(\{[\s\S]*?\})/gim, '')
    .replace(/functions?\.\w+\s*\([\s\S]*?\)\s*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    cleanedText,
    correction: correction ? {
      original: correction.original ?? '',
      corrected: correction.corrected ?? '',
      explanation: correction.explanation ?? '',
    } : null,
    challenge: challenge ? {
      type: challenge.type ?? 'fill-in-blank',
      prompt: challenge.prompt ?? '',
      hint: challenge.hint,
    } : null,
    vocabulary: vocabulary ? {
      word: vocabulary.word ?? '',
      partOfSpeech: vocabulary.partOfSpeech,
    } : null,
  };
}

type ToolPartLike = {
  type: string;
  state?: string;
  input?: { word?: string; partOfSpeech?: string };
  output?: {
    original?: string;
    corrected?: string;
    explanation?: string;
    type?: string;
    prompt?: string;
    hint?: string;
    word?: string;
    partOfSpeech?: string;
  };
};

function getToolFallbackLine(toolParts: ToolPartLike[]): string {
  for (const p of toolParts) {
    if (p.state !== 'output-available' || !p.output) continue;
    if (p.type === 'tool-issueChallenge' && p.output.prompt) {
      return `Quick challenge: ${p.output.prompt}`;
    }
  }
  for (const p of toolParts) {
    if (p.state !== 'output-available' || !p.output) continue;
    if (p.type === 'tool-correctGrammar' && p.output.corrected) {
      return `A more natural way to say it is: ${p.output.corrected}`;
    }
    if (p.type === 'tool-explainVocabulary') {
      const word = p.input?.word ?? p.output.word;
      if (word) return `Nice word to know: ${word}.`;
    }
  }
  return '';
}

function getInlineFallbackLine(args: {
  correction: { original: string; corrected: string; explanation: string } | null;
  challenge: { type: string; prompt: string; hint?: string } | null;
  vocabulary: { word: string; partOfSpeech?: string } | null;
}): string {
  if (args.challenge?.prompt) return `Quick challenge: ${args.challenge.prompt}`;
  if (args.correction?.corrected) return `A more natural way to say it is: ${args.correction.corrected}`;
  if (args.vocabulary?.word) return `Nice word to know: ${args.vocabulary.word}.`;
  return '';
}

function looksLikeThinkingProcess(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.length <= 24) return true;
  return [
    'sure thing',
    'absolutely',
    'let me',
    'let us',
    "let's",
    "i'll",
    'i will',
    'okay',
    'alright',
    'hmm',
    'thinking',
    '让我想想',
    '我想想',
    '我来',
  ].some(k => normalized.includes(k));
}

/** Convert a stored Message (role + content string) to UIMessage */
function toUIMessage(m: { id: string; role: string; content: string }): UIMessage {
  return {
    id: m.id,
    role: m.role as 'user' | 'assistant',
    parts: [{ type: 'text', text: m.content }],
  };
}

// ─── Tool Card Components ─────────────────────────────────────────────────────

const GrammarCard = ({
  original, corrected, explanation, mode,
}: { original: string; corrected: string; explanation: string; mode: 'dark' | 'light' }) => (
  <div className="mt-2 rounded-xl px-3 py-2.5 text-xs space-y-1.5 border"
    style={{
      background: mode === 'dark' ? 'rgba(34,197,94,.07)' : 'rgba(22,163,74,.06)',
      borderColor: mode === 'dark' ? 'rgba(34,197,94,.2)' : 'rgba(22,163,74,.18)',
    }}>
    <div className="flex items-center gap-1.5 font-semibold" style={{ color: mode === 'dark' ? '#86efac' : '#15803d' }}>
      <CheckCircle size={11} /> Grammar note
    </div>
    <div className="space-y-1">
      <p style={{ color: mode === 'dark' ? 'rgba(255,255,255,.4)' : 'rgba(0,0,0,.4)', textDecoration: 'line-through' }}>{original}</p>
      <p style={{ color: mode === 'dark' ? '#bbf7d0' : '#166534', fontWeight: 500 }}>→ {corrected}</p>
      <p style={{ color: mode === 'dark' ? 'rgba(255,255,255,.5)' : 'rgba(0,0,0,.5)', fontStyle: 'italic' }}>{explanation}</p>
    </div>
  </div>
);

const VocabularyCard = ({
  word, partOfSpeech, mode,
}: { word: string; partOfSpeech?: string; mode: 'dark' | 'light' }) => (
  <div className="mt-2 rounded-xl px-3 py-2.5 text-xs border"
    style={{
      background: mode === 'dark' ? 'rgba(99,102,241,.07)' : 'rgba(79,70,229,.06)',
      borderColor: mode === 'dark' ? 'rgba(99,102,241,.25)' : 'rgba(79,70,229,.18)',
    }}>
    <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: mode === 'dark' ? '#a5b4fc' : '#4338ca' }}>
      <BookOpen size={11} /> Vocabulary
    </div>
    <span className="font-bold" style={{ color: mode === 'dark' ? '#c7d2fe' : '#3730a3' }}>{word}</span>
    {partOfSpeech && (
      <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
        style={{ background: mode === 'dark' ? 'rgba(99,102,241,.15)' : 'rgba(79,70,229,.1)', color: mode === 'dark' ? '#818cf8' : '#4f46e5' }}>
        {partOfSpeech}
      </span>
    )}
  </div>
);

const ChallengeCard = ({
  challengeType, prompt, hint, mode,
}: { challengeType: string; prompt: string; hint?: string; mode: 'dark' | 'light' }) => {
  const labelMap: Record<string, string> = {
    'fill-in-blank': 'Fill in the blank',
    'describe-this': 'Describe this',
    'translate-to-english': 'Translate to English',
    'use-in-sentence': 'Use in a sentence',
    'pronunciation': 'Pronunciation',
  };
  return (
    <div className="mt-2 rounded-xl px-3 py-2.5 text-xs border"
      style={{
        background: mode === 'dark' ? 'rgba(251,191,36,.07)' : 'rgba(245,158,11,.06)',
        borderColor: mode === 'dark' ? 'rgba(251,191,36,.25)' : 'rgba(245,158,11,.22)',
      }}>
      <div className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: mode === 'dark' ? '#fde68a' : '#92400e' }}>
        <Zap size={11} /> {labelMap[challengeType] ?? 'Challenge'}
      </div>
      <p style={{ color: mode === 'dark' ? '#fef3c7' : '#78350f' }}>{prompt}</p>
      {hint && <p className="mt-1 italic" style={{ color: mode === 'dark' ? 'rgba(254,243,199,.55)' : 'rgba(120,53,15,.55)' }}>Hint: {hint}</p>}
    </div>
  );
};

// ─── ChatBubble ───────────────────────────────────────────────────────────────

const ChatBubble = ({ message, onReplay, speakerName, speakerAccent }: {
  message: UIMessage;
  onReplay?: () => void;
  speakerName?: string;
  speakerAccent?: string;
}) => {
  const { theme } = useThemeStore();
  const u = message.role === 'user';

  // Extract primary text content
  const textParts = message.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text');
  const fullText = textParts.map(p => p.text).join('');
  const {
    cleanedText,
    correction: inlineCorrection,
    challenge: inlineChallenge,
    vocabulary: inlineVocabulary,
  } = stripToolCallArtifacts(fullText);

  // Bilingual split (English / Chinese)
  const hasChinese = /[\u4e00-\u9fff]/.test(cleanedText);
  const engLines: string[] = [];
  const zhLines: string[] = [];
  if (hasChinese) {
    cleanedText.split('\n').map(l => l.trim()).filter(Boolean).forEach(l =>
      (/[\u4e00-\u9fff]/.test(l) ? zhLines : engLines).push(l)
    );
  }
  const mainText = hasChinese ? engLines.join('\n') || cleanedText : cleanedText;
  const subText = hasChinese ? zhLines.join('\n') : '';

  // Extract tool parts
  const toolParts = message.parts.filter((p): p is ToolPartLike => p.type.startsWith('tool-'));
  const hasAnyCard = toolParts.length > 0 || !!inlineCorrection || !!inlineChallenge || !!inlineVocabulary;
  const visibleMainText = hasAnyCard && looksLikeThinkingProcess(mainText) ? '...' : mainText;
  const fallbackLine = getToolFallbackLine(toolParts) || getInlineFallbackLine({
    correction: inlineCorrection,
    challenge: inlineChallenge,
    vocabulary: inlineVocabulary,
  });
  const primaryText = visibleMainText || fallbackLine;

  const isStreaming = textParts.some(p => (p as { state?: string }).state === 'streaming');

  return (
    <div className={`flex flex-col gap-0.5 ${u ? 'items-end' : 'items-start'}`}
      style={{ animation: 'fadeUp .3s ease-out' }}>

      <span className="text-[10px] tracking-wide px-1 select-none"
        style={{ color: theme.textDimmer, fontVariantNumeric: 'tabular-nums' }}>
        {u ? 'You' : (speakerName ?? 'Alex')}
      </span>

      <div className="group max-w-[78%]">
        {/* Main text bubble */}
        <div className="px-4 py-3 rounded-2xl text-sm leading-relaxed" style={{
          background: u
            ? (theme.mode === 'dark' ? `${speakerAccent ?? '#c96442'}1C` : `${speakerAccent ?? '#c96442'}1A`)
            : (theme.mode === 'dark' ? 'rgba(255,255,255,.055)' : 'rgba(0,0,0,.04)'),
          border: u
            ? `1px solid ${speakerAccent ?? '#c96442'}38`
            : `1px solid ${theme.mode === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'}`,
          backdropFilter: 'blur(10px)',
        }}>
          {primaryText ? (
            <>
              <p style={{ color: u ? (theme.bubbleUserText ?? theme.textSecondary) : theme.bubbleAIText, whiteSpace: 'pre-wrap' }}>
                {primaryText}
              </p>
              {subText && (
                <p className="mt-2 pt-2 text-xs leading-relaxed border-t"
                  style={{
                    color: u
                      ? (theme.mode === 'dark' ? 'rgba(217,119,87,.45)' : 'rgba(184,87,58,.50)')
                      : (theme.mode === 'dark' ? 'rgba(255,255,255,.28)' : 'rgba(28,16,6,.35)'),
                    borderColor: u
                      ? 'rgba(201,100,66,.16)'
                      : (theme.mode === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)'),
                    whiteSpace: 'pre-wrap',
                  }}>
                  {subText}
                </p>
              )}
            </>
          ) : isStreaming ? (
            <div className="flex gap-1 items-center h-4">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: 'rgba(201,100,66,.55)', animation: `waveBar .8s ease-in-out ${i * .2}s infinite alternate` }} />
              ))}
            </div>
          ) : null}
        </div>

        {/* Tool cards — rendered outside the bubble, below it */}
        {!u && (toolParts.length > 0 || inlineCorrection || inlineChallenge || inlineVocabulary) && (
          <div className="mt-1 space-y-1">
            {inlineCorrection && (
              <GrammarCard
                original={inlineCorrection.original}
                corrected={inlineCorrection.corrected}
                explanation={inlineCorrection.explanation}
                mode={theme.mode}
              />
            )}
            {inlineVocabulary && inlineVocabulary.word && (
              <VocabularyCard
                word={inlineVocabulary.word}
                partOfSpeech={inlineVocabulary.partOfSpeech}
                mode={theme.mode}
              />
            )}
            {inlineChallenge && (
              <ChallengeCard
                challengeType={inlineChallenge.type}
                prompt={inlineChallenge.prompt}
                hint={inlineChallenge.hint}
                mode={theme.mode}
              />
            )}
            {toolParts.map((part, i) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const p = part as any;
              if (p.state !== 'output-available') return null;
              const output = p.output;
              if (!output) return null;

              if (p.type === 'tool-correctGrammar') {
                return (
                  <GrammarCard key={i}
                    original={output.original ?? ''}
                    corrected={output.corrected ?? ''}
                    explanation={output.explanation ?? ''}
                    mode={theme.mode} />
                );
              }
              if (p.type === 'tool-explainVocabulary') {
                return (
                  <VocabularyCard key={i}
                    word={p.input?.word ?? output.word ?? ''}
                    partOfSpeech={p.input?.partOfSpeech ?? output.partOfSpeech}
                    mode={theme.mode} />
                );
              }
              if (p.type === 'tool-issueChallenge') {
                return (
                  <ChallengeCard key={i}
                    challengeType={output.type ?? 'fill-in-blank'}
                    prompt={output.prompt ?? ''}
                    hint={output.hint}
                    mode={theme.mode} />
                );
              }
              return null;
            })}
          </div>
        )}

        {!u && fullText && onReplay && (
          <button onClick={onReplay}
            className="flex items-center gap-1 text-[10px] transition-colors cursor-pointer opacity-0 group-hover:opacity-100 pl-1 mt-1"
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

// ─── TextInputBar ─────────────────────────────────────────────────────────────
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
        style={{ background: 'linear-gradient(135deg,#c96442,#b8573a)' }}>
        <Send size={15} className="text-white" />
      </button>
    </div>
  );
};

// ─── ConversationList ─────────────────────────────────────────────────────────
const ConversationList = ({
  onClose,
  collapsed = false,
  onSelectConversation,
  onNewChat,
}: {
  onClose?: () => void;
  collapsed?: boolean;
  onSelectConversation: (conv: Conversation) => void;
  onNewChat: () => void;
}) => {
  const { theme } = useThemeStore();
  const { conversations, currentConversationId, removeConversation } = useChatStore();
  const { data: session } = useSession();
  const userId = getUserId(session);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleSelect = async (conv: Conversation) => {
    if (conv.id === currentConversationId) { onClose?.(); return; }
    setLoadingId(conv.id);
    await onSelectConversation(conv);
    setLoadingId(null);
    onClose?.();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeConversation(id);
    if (userId) fetch(`/api/conversations/${id}`, { method: 'DELETE' }).catch(console.error);
    if (id === currentConversationId) onNewChat();
  };

  return (
    <div className="flex flex-col h-full">
      {collapsed ? (
        <button onClick={onNewChat} title="New Chat"
          className="mx-auto mb-3 w-9 h-9 flex items-center justify-center rounded-xl transition-all cursor-pointer flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#c96442,#b8573a)', color: '#fff' }}>
          <Plus size={15} />
        </button>
      ) : (
        <button onClick={onNewChat}
          className="mx-3 mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#c96442,#b8573a)', color: '#fff' }}>
          <Plus size={15} /> <span>New Chat 新聊天</span>
        </button>
      )}

      <div className="flex-1 overflow-y-auto space-y-0.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.scrollbarColor} transparent`, padding: '0 8px' }}>
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 opacity-40"
            style={{ color: theme.textMuted }}>
            <MessageSquare size={collapsed ? 18 : 24} />
            {!collapsed && <p className="text-xs text-center">No conversations yet.<br />Start chatting!</p>}
          </div>
        ) : conversations.map(conv => {
          const isActive = conv.id === currentConversationId;
          const isLoading = loadingId === conv.id;
          return collapsed ? (
            <div key={conv.id} title={conv.title}
              onClick={() => handleSelect(conv)}
              className="relative flex items-center justify-center p-2.5 rounded-xl cursor-pointer transition-all"
              style={{
                background: isActive ? `${theme.accentText}18` : 'transparent',
                border: isActive ? `1px solid ${theme.accentText}30` : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = theme.bgCard; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
              <MessageSquare size={14} style={{ color: isActive ? theme.accentText : theme.textMuted }} />
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                  style={{ background: theme.accentText }} />
              )}
            </div>
          ) : (
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
const PLAN_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  free:  { label: 'Free', bg: 'rgba(120,120,120,.15)', text: '#888' },
  plus:  { label: 'Plus', bg: 'rgba(201,100,66,.15)',  text: '#c96442' },
  pro:   { label: 'Pro',  bg: 'rgba(139,92,246,.18)',  text: '#8b5cf6' },
};

const UserMenu = ({ collapsed = false }: { collapsed?: boolean }) => {
  const { data: session } = useSession();
  const { theme } = useThemeStore();
  const [plan, setPlan] = React.useState<string>('free');
  const [portalLoading, setPortalLoading] = React.useState(false);

  React.useEffect(() => {
    if (!session?.user) return;
    fetch('/api/usage')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.plan) setPlan(data.plan); })
      .catch(() => {});
  }, [session]);

  const openPortal = React.useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? 'Could not open billing portal.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setPortalLoading(false);
    }
  }, []);

  if (!session?.user) return null;

  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.free;
  const isPaid = plan === 'plus' || plan === 'pro';

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="relative">
          <img src={session.user.image ?? ''} alt={session.user.name ?? ''} referrerPolicy="no-referrer"
            title={`${session.user.name} · ${badge.label}`}
            className="w-7 h-7 rounded-full object-cover border cursor-pointer"
            style={{ borderColor: 'rgba(201,100,66,.25)' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} title="Sign out"
          className="p-1.5 rounded-lg transition-all cursor-pointer"
          style={{ color: theme.textMuted }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}>
          <LogOut size={13} />
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: theme.bgCard }}>
        <img src={session.user.image ?? ''} alt="" referrerPolicy="no-referrer"
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 border"
          style={{ borderColor: theme.bgCardBorder ?? 'transparent' }}
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate" style={{ color: theme.textPrimary }}>{session.user.name}</p>
          <span
            className="inline-block text-[9px] font-semibold px-1.5 py-px rounded-full leading-tight mt-0.5"
            style={{ background: badge.bg, color: badge.text }}>
            {badge.label}
          </span>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })}
          className="p-1.5 rounded-lg transition-all cursor-pointer flex-shrink-0"
          style={{ color: theme.textMuted }}
          onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,.1)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}
          title="Sign out">
          <LogOut size={13} />
        </button>
      </div>
      {PAID_PLANS_LIVE ? (
        isPaid ? (
          <button
            onClick={openPortal}
            disabled={portalLoading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: theme.bgInput, color: theme.textMuted, border: `1px solid ${theme.bgCardBorder ?? 'transparent'}` }}
            onMouseEnter={e => { if (!portalLoading) e.currentTarget.style.color = theme.accentText; }}
            onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; }}
            title="Manage subscription">
            {portalLoading ? (
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="40 20" />
              </svg>
            ) : (
              <Zap size={11} />
            )}
            {portalLoading ? 'Opening…' : 'Manage subscription'}
          </button>
        ) : (
          <a
            href="/#pricing"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
            style={{ background: 'rgba(201,100,66,.10)', color: '#c96442', border: '1px solid rgba(201,100,66,.20)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(201,100,66,.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(201,100,66,.10)'; }}>
            <Zap size={11} />
            Upgrade to Plus
          </a>
        )
      ) : null}
    </div>
  );
};

// ─── Persona config ───────────────────────────────────────────────────────────
const PERSONA_META: Record<Persona, {
  name: string; tagline: string; accent: string; accentBg: string; voiceId: string | null;
}> = {
  alex:  { name: 'Alex',   tagline: 'Chill friend · Cali vibes',  accent: '#c96442', accentBg: 'rgba(201,100,66,.10)', voiceId: null },
  trump: { name: 'Donald', tagline: '45th President · Tremendous!', accent: '#CC1A1A', accentBg: 'rgba(204,26,26,.10)',   voiceId: 'trump' },
};

// ─── PersonaCard ──────────────────────────────────────────────────────────────
const PersonaCard = ({
  persona, selected, onSelect,
}: { persona: Persona; selected: boolean; onSelect: () => void }) => {
  const { theme } = useThemeStore();
  const meta = PERSONA_META[persona];
  const [hovered, setHovered] = useState(false);
  const highlighted = selected || hovered;
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all cursor-pointer"
      style={{
        borderColor: highlighted ? meta.accent : (theme.mode === 'dark' ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'),
        background: highlighted ? meta.accentBg : (theme.mode === 'dark' ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)'),
        boxShadow: selected ? `0 0 20px ${meta.accent}30` : 'none',
        animation: 'personaCardIn .35s ease-out both',
        minWidth: 120,
      }}>
      <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center flex-shrink-0"
        style={{
          background: highlighted ? meta.accentBg : (theme.mode === 'dark' ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'),
          border: `1px solid ${highlighted ? meta.accent + '40' : 'transparent'}`,
        }}>
        {persona === 'trump'
          ? <TrumpAvatarCharacter size={54} />
          : <AvatarCharacter size={54} />}
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-sm font-bold" style={{ color: highlighted ? meta.accent : theme.textPrimary }}>
          {meta.name}
        </span>
        <span className="text-[10px] text-center leading-snug" style={{ color: theme.textMuted, maxWidth: 110 }}>
          {meta.tagline}
        </span>
      </div>
      {selected && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: meta.accent + '20', color: meta.accent }}>
          Selected
        </span>
      )}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
export const VoiceInterface = () => {
  const {
    settings,
    updateSettings,
    selectedPersona, setPersona,
    setConversations, conversations, currentConversationId,
    setCurrentConversationId, addConversation, touchConversation: touchConvStore,
    removeConversation,
  } = useChatStore();
  const { isListening, transcript, error: speechError, startListening, setTranscript } = useSpeechToText();
  const { speak, stop, unlock, isSpeaking } = useTextToSpeech();
  const { theme, toggleTheme, mode } = useThemeStore();
  const { data: session } = useSession();
  const userId = getUserId(session);

  // Derive voice from persona — no separate voice state needed
  const activeVoiceId = PERSONA_META[selectedPersona].voiceId;

  const [inputLang, setInputLang] = useState<'en-US' | 'zh-CN'>('en-US');
  const [showPersonaSwitcher, setShowPersonaSwitcher] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [brandIconHovered, setBrandIconHovered] = useState(false);

  // ── Checkout success toast ────────────────────────────────────────────────
  const searchParams = useSearchParams();
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [hasLoadedConversations, setHasLoadedConversations] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentSubmitting, setAssessmentSubmitting] = useState(false);
  const [hasAssessment, setHasAssessment] = useState(false);
  const [scenarios, setScenarios] = useState<Array<{
    scenarioId: string;
    titleEn: string;
    titleZh: string;
    objective: string;
  }>>([]);
  const [recommendedScenarios, setRecommendedScenarios] = useState<Array<{
    scenarioId: string;
    titleEn: string;
    titleZh: string;
    objective: string;
  }>>([]);
  const [todayPlan, setTodayPlan] = useState<null | {
    goal: string;
    mainScenarioId: string;
    focusCorrections: string[];
    suggestedDurationMin: number;
    mainScenario?: { titleEn: string; titleZh: string; objective: string } | null;
  }>(null);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [scenarioLaunchingId, setScenarioLaunchingId] = useState<string | null>(null);
  const [assessmentScores, setAssessmentScores] = useState({
    fluency: 3,
    accuracy: 3,
    pronunciation: 3,
    interaction: 3,
  });
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      setShowCheckoutSuccess(true);
      // Remove the query param from the URL without a full navigation
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
      const t = setTimeout(() => setShowCheckoutSuccess(false), 6000);
      return () => clearTimeout(t);
    }
  }, [searchParams]);

  // ── Usage quota ───────────────────────────────────────────────────────────
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // ── API health status ─────────────────────────────────────────────────────
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        if (!cancelled) setApiReady(res.ok && (await res.json()).ok === true);
      } catch {
        if (!cancelled) setApiReady(false);
      }
    };
    check();
    const id = setInterval(check, 60_000);
    // Re-check immediately when the tab becomes visible again after being
    // in the background (browsers throttle/freeze timers for inactive tabs).
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, []);

  // Refs for passing dynamic values into the transport body function
  const currentConvIdRef = useRef<string | null>(currentConversationId);
  const currentConvTitleRef = useRef<string>('');
  const settingsRef = useRef(settings);
  const selectedPersonaRef = useRef<Persona>(selectedPersona);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => { currentConvIdRef.current = currentConversationId; }, [currentConversationId]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { selectedPersonaRef.current = selectedPersona; }, [selectedPersona]);

  // ── useChat with AI SDK ────────────────────────────────────────────────────
  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/chat',
    body: () => ({
      settings: settingsRef.current,
      conversationId: currentConvIdRef.current,
      conversationTitle: currentConvTitleRef.current,
      persona: selectedPersonaRef.current,
    }),
  }), []);

  const {
    messages: chatMessages,
    sendMessage,
    setMessages,
    status,
    stop: stopChat,
    error: chatError,
  } = useChat({ transport });

  const isLoading = status === 'streaming' || status === 'submitted';

  // ── Fetch usage from /api/usage ────────────────────────────────────────────
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage', { cache: 'no-store' });
      if (!res.ok) return;
      const data: UsageInfo = await res.json();
      setUsage(data);
      setLimitReached(data.window !== 'unlimited' && data.used >= data.limit);
    } catch {
      // non-fatal
    }
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  const desktopMsgRef = useRef<HTMLDivElement>(null);
  const mobileMsgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (desktopMsgRef.current) desktopMsgRef.current.scrollTop = desktopMsgRef.current.scrollHeight;
    if (mobileMsgRef.current) mobileMsgRef.current.scrollTop = mobileMsgRef.current.scrollHeight;
  }, [chatMessages]);

  // ── Auto-speak when streaming finishes ────────────────────────────────────
  const prevStatus = useRef(status);
  useEffect(() => {
    if (prevStatus.current !== 'ready' && status === 'ready') {
      const last = chatMessages[chatMessages.length - 1];
      if (last?.role === 'assistant') {
        const text = extractText(last);
        if (text.trim()) speak(text, activeVoiceId);
      }
      // Update conversation sort order in UI
      if (currentConvIdRef.current) touchConvStore(currentConvIdRef.current);
      // Refresh usage counter after each completed round
      fetchUsage();
    }
    prevStatus.current = status;
  }, [status, chatMessages, speak, activeVoiceId, touchConvStore, fetchUsage]);

  // ── Handle chatError — detect 429 limit_reached ───────────────────────────
  useEffect(() => {
    if (chatError) {
      const msg = chatError.message ?? '';
      if (msg.includes('429') || msg.toLowerCase().includes('limit')) {
        setLimitReached(true);
        fetchUsage();
      }
    }
  }, [chatError, fetchUsage]);

  // ── Voice → send ──────────────────────────────────────────────────────────
  const handleSendRef = useRef<(c: string) => void>(() => {});

  const handleSend = useCallback((content: string) => {
    if (!content.trim()) return;

    // Client-side pre-check: block if quota is already exhausted
    if (usage && usage.window !== 'unlimited' && usage.used >= usage.limit) {
      setLimitReached(true);
      return;
    }

    let convId = currentConvIdRef.current;
    let convTitle = '';

    if (!convId) {
      convId = generateId();
      convTitle = content.length > 45 ? content.slice(0, 45) + '…' : content;
      const newConv: Conversation = { id: convId, title: convTitle, created_at: Date.now(), updated_at: Date.now() };
      addConversation(newConv);
      setCurrentConversationId(convId);
      currentConvIdRef.current = convId;
      currentConvTitleRef.current = convTitle;
    } else {
      const existing = conversations.find(c => c.id === convId);
      currentConvTitleRef.current = existing?.title ?? '';
    }

    setTranscript('');
    stop();
    sendMessage({ text: content });
  }, [addConversation, conversations, sendMessage, setCurrentConversationId, setTranscript, stop, usage]);

  useEffect(() => { handleSendRef.current = handleSend; }, [handleSend]);

  useEffect(() => {
    if (transcript && !isListening) handleSendRef.current(transcript);
  }, [transcript, isListening]);

  // ── Speech error → show text input ────────────────────────────────────────
  useEffect(() => {
    if (speechError === 'network' || speechError === 'not-allowed' || speechError === 'service-not-allowed') {
      setShowTextInput(true);
    }
  }, [speechError]);

  // ── Load conversations on login ────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (prevUserIdRef.current === userId) return;
    prevUserIdRef.current = userId;
    let cancelled = false;

    // Fetch usage quota alongside conversations
    fetchUsage();

    (async () => {
      try {
        const res = await fetch('/api/conversations');
        if (!res.ok) { setHasLoadedConversations(true); return; }
        const list: Conversation[] = await res.json();
        if (cancelled) return;
        if (!Array.isArray(list) || list.length === 0) { setConversations([]); setHasLoadedConversations(true); return; }
        setConversations(list);
        const latest = list[0];
        setCurrentConversationId(latest.id);
        currentConvIdRef.current = latest.id;
        currentConvTitleRef.current = latest.title;
        if (latest.persona) setPersona(latest.persona);
        // Load messages for the latest conversation
        const msgRes = await fetch(`/api/conversations/${latest.id}/messages`);
        if (cancelled) return;
        const msgs = await msgRes.json();
        if (Array.isArray(msgs)) setMessages(msgs.map(toUIMessage));
        setHasLoadedConversations(true);
      } catch (e) {
        console.error('[load] conversations:', e);
        prevUserIdRef.current = undefined;
        setHasLoadedConversations(true);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, fetchUsage]);

  // ── Load assessment/scenarios/daily plan from real APIs ───────────────────
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [assRes, scRes, planRes] = await Promise.all([
          fetch('/api/assessment', { cache: 'no-store' }),
          fetch('/api/scenarios', { cache: 'no-store' }),
          fetch('/api/daily-plan', { cache: 'no-store' }),
        ]);
        if (cancelled) return;

        if (assRes.ok) {
          const a = await assRes.json() as { assessment: null | { fluency: number; accuracy: number; pronunciation: number; interaction: number } };
          if (a.assessment) {
            setHasAssessment(true);
            setAssessmentScores({
              fluency: a.assessment.fluency,
              accuracy: a.assessment.accuracy,
              pronunciation: a.assessment.pronunciation,
              interaction: a.assessment.interaction,
            });
          } else {
            setHasAssessment(false);
          }
        }

        if (scRes.ok) {
          const s = await scRes.json() as {
            scenarios: Array<{ scenarioId: string; titleEn: string; titleZh: string; objective: string }>;
            recommended: Array<{ scenarioId: string; titleEn: string; titleZh: string; objective: string }>;
          };
          setScenarios(s.scenarios ?? []);
          setRecommendedScenarios(s.recommended ?? []);
        }

        if (planRes.ok) {
          const p = await planRes.json() as {
            plan?: {
              goal: string;
              mainScenarioId: string;
              focusCorrections: string[];
              suggestedDurationMin: number;
              mainScenario?: { titleEn: string; titleZh: string; objective: string } | null;
            };
          };
          if (p.plan) setTodayPlan(p.plan);
        }
      } catch {
        // non-fatal
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  // ── Show onboarding assessment for first-time users ───────────────────────
  useEffect(() => {
    if (!userId || !hasLoadedConversations) return;
    if (!hasAssessment && conversations.length === 0) {
      setShowAssessment(true);
    }
  }, [conversations.length, hasAssessment, hasLoadedConversations, userId]);

  const completeAssessment = useCallback(async () => {
    setAssessmentSubmitting(true);
    const values = Object.values(assessmentScores);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const level =
      avg < 2.0 ? 'A0' :
      avg < 2.8 ? 'A1' :
      avg < 3.6 ? 'A2' :
      avg < 4.4 ? 'B1' : 'B2';
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fluency: assessmentScores.fluency,
          accuracy: assessmentScores.accuracy,
          pronunciation: assessmentScores.pronunciation,
          interaction: assessmentScores.interaction,
          overallLevel: level,
          completedAtMs: Date.now(),
        }),
      });
      if (!res.ok) throw new Error('assessment save failed');
      setHasAssessment(true);
      setShowAssessment(false);
      const planRes = await fetch('/api/daily-plan', { cache: 'no-store' });
      if (planRes.ok) {
        const p = await planRes.json() as { plan?: {
          goal: string;
          mainScenarioId: string;
          focusCorrections: string[];
          suggestedDurationMin: number;
          mainScenario?: { titleEn: string; titleZh: string; objective: string } | null;
        } };
        if (p.plan) setTodayPlan(p.plan);
      }
    } finally {
      setAssessmentSubmitting(false);
    }
  }, [assessmentScores]);

  // ── Select a conversation ──────────────────────────────────────────────────
  const handleSelectConversation = useCallback(async (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    currentConvIdRef.current = conv.id;
    currentConvTitleRef.current = conv.title;
    if (conv.persona && conv.persona !== selectedPersona) {
      setPersona(conv.persona);
    }
    try {
      const res = await fetch(`/api/conversations/${conv.id}/messages`);
      const msgs = await res.json();
      setMessages(Array.isArray(msgs) ? msgs.map(toUIMessage) : []);
    } catch { setMessages([]); }
  }, [selectedPersona, setCurrentConversationId, setMessages, setPersona]);

  // ── New chat ──────────────────────────────────────────────────────────────
  const handleNewChat = useCallback(() => {
    setCurrentConversationId(null);
    currentConvIdRef.current = null;
    currentConvTitleRef.current = '';
    setMessages([]);
    stop();
  }, [setCurrentConversationId, setMessages, stop]);

  // ── Clear / delete current conversation ──────────────────────────────────
  const handleClear = useCallback(async () => {
    const convId = currentConvIdRef.current;
    setMessages([]);
    stop();
    if (convId) {
      removeConversation(convId);
      setCurrentConversationId(null);
      currentConvIdRef.current = null;
      fetch(`/api/conversations/${convId}`, { method: 'DELETE' }).catch(console.error);
    }
  }, [removeConversation, setCurrentConversationId, setMessages, stop]);

  const handleMicClick = useCallback(() => { unlock(); stop(); startListening(inputLang); }, [unlock, stop, startListening, inputLang]);
  const handleReplay = useCallback((text: string) => { unlock(); speak(text, activeVoiceId); }, [unlock, speak, activeVoiceId]);
  const handleTextSend = useCallback((text: string) => { unlock(); handleSendRef.current(text); }, [unlock]);
  const applyScenario = useCallback((scenarioId: string) => {
    if (isLoading || limitReached || scenarioLaunchingId) return;
    const source = [
      ...(todayPlan?.mainScenario ? [{
        scenarioId: todayPlan.mainScenarioId,
        titleEn: todayPlan.mainScenario.titleEn,
        titleZh: todayPlan.mainScenario.titleZh,
        objective: todayPlan.mainScenario.objective,
      }] : []),
      ...recommendedScenarios,
      ...scenarios,
    ];
    const picked = source.find(s => s.scenarioId === scenarioId);
    if (!picked) return;
    setScenarioLaunchingId(scenarioId);
    setSelectedScenarioId(scenarioId);
    updateSettings({
      topic: `${picked.titleEn}: ${picked.objective}`,
    });
    const starter = `Let's practice this scenario: ${picked.titleEn}. Goal: ${picked.objective}. Please start the role-play naturally and guide me with short feedback.`;
    handleSendRef.current(starter);
    setTimeout(() => setScenarioLaunchingId(null), 450);
  }, [isLoading, limitReached, recommendedScenarios, scenarioLaunchingId, scenarios, todayPlan, updateSettings]);

  // ── Persona switch ─────────────────────────────────────────────────────────
  const handlePersonaSwitch = useCallback((p: Persona) => {
    if (p === selectedPersona) { setShowPersonaSwitcher(false); return; }
    setPersona(p);
    setShowPersonaSwitcher(false);
    // Start a fresh conversation with the new persona
    setCurrentConversationId(null);
    currentConvIdRef.current = null;
    currentConvTitleRef.current = '';
    setMessages([]);
    stop();
  }, [selectedPersona, setPersona, setCurrentConversationId, setMessages, stop]);

  useEffect(() => {
    if (!showPersonaSwitcher) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-persona-switcher="true"]')) return;
      setShowPersonaSwitcher(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [showPersonaSwitcher]);

  // ── Status derived values ─────────────────────────────────────────────────
  const isActive = isListening || isSpeaking || isLoading;
  const API_GREEN = '#22c55e';
  const idleLabel = apiReady === true ? 'Ready' : 'False';
  const statusLabel = isSpeaking ? 'Speaking' : isLoading ? 'Thinking…' : isListening ? (inputLang === 'zh-CN' ? '正在聆听' : 'Listening…') : idleLabel;
  const personaAccent = PERSONA_META[selectedPersona].accent;
  const idleColor = apiReady === true ? API_GREEN : theme.textMuted;
  const statusColor = isListening ? personaAccent : isSpeaking ? personaAccent : isLoading ? '#94a3b8' : idleColor;

  // ── Speech error banner ───────────────────────────────────────────────────
  const speechErrorBanner = speechError === 'network' ? (
    <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl text-xs border text-center mx-4 mb-2"
      style={{ background: 'rgba(201,100,66,.06)', borderColor: 'rgba(201,100,66,.20)', color: 'rgba(217,119,87,.9)' }}>
      <p>语音识别需要 Google 服务，国内网络暂不可用</p>
      <p style={{ color: theme.textMuted }}>请使用下方输入框打字交流</p>
    </div>
  ) : speechError ? (
    <div className="px-4 py-2.5 rounded-xl text-xs text-red-400 border border-red-500/30 text-center mx-4 mb-2"
      style={{ background: mode === 'dark' ? 'rgba(127,29,29,.35)' : 'rgba(254,226,226,.6)' }}>
      Mic error: {speechError}
    </div>
  ) : null;

  // ── Usage pill & limit banner ──────────────────────────────────────────────
  const usagePill = usage && usage.window !== 'unlimited' ? (() => {
    const remaining = Math.max(0, usage.limit - usage.used);
    const isLow = remaining <= Math.ceil(usage.limit * 0.2);
    const color = limitReached ? '#ef4444' : isLow ? '#f59e0b' : theme.textMuted;
    const label =
      usage.window === 'week'
        ? `${remaining}/${usage.limit} free rounds this week`
        : usage.window === 'month'
          ? `${remaining}/${usage.limit} rounds this month`
          : `${remaining}/${usage.limit} rounds`;
    return (
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
        style={{ color, borderColor: `${color}30`, background: `${color}0f` }}>
        {label}
      </span>
    );
  })() : null;

  const todayMain = todayPlan?.mainScenarioId
    ? scenarios.find(s => s.scenarioId === todayPlan.mainScenarioId) ?? todayPlan.mainScenario
    : null;

  const limitBanner = limitReached && usage ? (() => {
    const resetMs = usage.resetAt;
    let resetLabel = '';
    if (resetMs) {
      const diffMs = resetMs - Date.now();
      const diffH = Math.ceil(diffMs / 3600000);
      const diffM = Math.ceil(diffMs / 60000);
      resetLabel = diffH >= 1 ? ` in ${diffH}h` : ` in ${diffM}m`;
    }
    const isPlusCap = usage.plan === 'plus';
    return (
      <div className="flex flex-col gap-1.5 px-4 py-3 rounded-xl text-xs border text-center mx-4 mb-2"
        style={{ background: 'rgba(239,68,68,.06)', borderColor: 'rgba(239,68,68,.20)', color: 'rgba(248,113,113,.9)' }}>
        {isPlusCap ? (
          <>
            <p className="font-semibold">Monthly limit reached</p>
            <p style={{ color: theme.textMuted }}>You&apos;ve used all {usage.limit} rounds this month. Resets{resetLabel}.</p>
          </>
        ) : (
          <>
            <p className="font-semibold">Free limit reached</p>
            <p style={{ color: theme.textMuted }}>
              You&apos;ve used all {usage.limit} free rounds this week.
              {resetLabel ? ` Resets${resetLabel}.` : ''}{' '}
              <a href="/#pricing" style={{ color: '#d97757', textDecoration: 'underline' }}>Pricing</a>
              {' '}— paid upgrades are temporarily unavailable.
            </p>
          </>
        )}
      </div>
    );
  })() : null;

  // ── Controls strip ────────────────────────────────────────────────────────
  const Controls = () => {
    const pa = PERSONA_META[selectedPersona].accent;
      const paRgb = selectedPersona === 'trump' ? '204,26,26' : '201,100,66';
    return (
    <div className="flex items-center justify-center gap-3">
      <button onClick={() => setInputLang(l => l === 'en-US' ? 'zh-CN' : 'en-US')}
        className="px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer"
        style={{ borderColor: `rgba(${paRgb},.2)`, background: `rgba(${paRgb},.06)`, color: theme.accentPale }}>
        {inputLang === 'en-US' ? 'EN' : '中文'}
      </button>

      <button
        onClick={isListening ? () => setTranscript('') : handleMicClick}
        disabled={limitReached}
        className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer relative disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isListening ? `rgba(${paRgb},.15)` : `linear-gradient(135deg,${pa},${selectedPersona === 'trump' ? '#991010' : '#b8573a'})`,
          border: isListening ? `2px solid rgba(${paRgb},.5)` : '2px solid transparent',
          boxShadow: isListening ? `0 0 20px rgba(${paRgb},.3)` : `0 4px 16px rgba(${paRgb},.25)`,
        }}>
        {isListening
          ? <MicOff size={22} style={{ color: pa }} />
          : <Mic size={22} className="text-white" />}
        {isListening && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: pa, animation: 'pingRing 1s ease-out infinite' }} />}
      </button>

      <button onClick={() => { stop(); stopChat(); }}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{ background: isSpeaking ? `rgba(${paRgb},.15)` : theme.bgInput, border: `1px solid ${isSpeaking ? `rgba(${paRgb},.3)` : theme.bgInputBorder}`, color: isSpeaking ? pa : theme.textMuted }}>
        <Square size={14} />
      </button>

      <button onClick={() => setShowTextInput(s => !s)}
        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer"
        style={{ background: showTextInput ? `rgba(${paRgb},.15)` : theme.bgInput, border: `1px solid ${showTextInput ? `rgba(${paRgb},.35)` : theme.bgInputBorder}`, color: showTextInput ? pa : theme.textMuted }}>
        <Keyboard size={15} />
      </button>
    </div>
    );
  };

  // ── Filtered messages for display ─────────────────────────────────────────
  const displayMessages = chatMessages.filter(m => m.role === 'user' || m.role === 'assistant');

  // ─────────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>

      {/* ── Checkout success toast ─────────────────────────────────────────── */}
      {showCheckoutSuccess && (
        <div
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium"
          style={{ background: '#1a2e1a', border: '1px solid rgba(34,197,94,.35)', color: '#86efac', animation: 'fadeUp .4s ease-out both', maxWidth: 400, width: 'calc(100vw - 32px)' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" className="flex-shrink-0">
            <circle cx="9" cy="9" r="8" fill="rgba(34,197,94,.2)" stroke="rgba(34,197,94,.6)" strokeWidth="1.5"/>
            <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="flex-1">
            <span className="font-semibold" style={{ color: '#4ade80' }}>Payment successful!</span>
            {' '}Your plan has been upgraded. Enjoy unlimited conversations.
          </div>
          <button onClick={() => setShowCheckoutSuccess(false)} className="flex-shrink-0 opacity-60 hover:opacity-100 cursor-pointer" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {showAssessment && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,.62)' }}>
          <div
            className="w-full max-w-xl rounded-2xl border p-6"
            style={{ background: theme.bgSidebar, borderColor: theme.bgSidebarBorder, boxShadow: '0 20px 80px rgba(0,0,0,.35)' }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                Welcome! Quick speaking assessment
              </h3>
              <p className="text-sm mt-1" style={{ color: theme.textMuted }}>
                This 60-second self-check helps us create your daily speaking plan. You can still free-chat anytime.
              </p>
            </div>

            <div className="space-y-3">
              {([
                ['fluency', 'How fluent are you when speaking continuously?'],
                ['accuracy', 'How accurate is your grammar in conversation?'],
                ['pronunciation', 'How clear is your pronunciation to listeners?'],
                ['interaction', 'How well do you handle follow-up questions?'],
              ] as const).map(([k, label]) => (
                <div key={k} className="rounded-xl p-3" style={{ background: theme.bgInput, border: `1px solid ${theme.bgInputBorder}` }}>
                  <p className="text-xs mb-2" style={{ color: theme.textPrimary }}>{label}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        onClick={() => setAssessmentScores(prev => ({ ...prev, [k]: v }))}
                        className="w-8 h-8 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                        style={{
                          background: assessmentScores[k] === v ? '#c96442' : theme.bgMain,
                          color: assessmentScores[k] === v ? '#fff' : theme.textMuted,
                          border: `1px solid ${assessmentScores[k] === v ? '#c96442' : theme.bgInputBorder}`,
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowAssessment(false)}
                className="px-3 py-2 rounded-xl text-sm cursor-pointer"
                style={{ background: theme.bgInput, color: theme.textMuted, border: `1px solid ${theme.bgInputBorder}` }}
              >
                Skip for now
              </button>
              <button
                onClick={completeAssessment}
                disabled={assessmentSubmitting}
                className="px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer disabled:opacity-60"
                style={{ background: '#c96442', color: '#fff' }}
              >
                {assessmentSubmitting ? 'Saving…' : 'Complete assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP ≥ lg ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex h-screen w-full overflow-hidden" style={{ background: theme.bgMain }}>

        {/* ── Conversation sidebar ──────────────────────────────────────────── */}
        <aside
          className="flex flex-col h-full border-r flex-shrink-0 overflow-hidden"
          style={{
            width: sidebarCollapsed ? 60 : 260,
            minWidth: sidebarCollapsed ? 60 : 260,
            transition: 'width .3s cubic-bezier(.4,0,.2,1), min-width .3s cubic-bezier(.4,0,.2,1)',
            background: theme.bgSidebar,
            borderColor: theme.bgSidebarBorder,
            backdropFilter: 'blur(12px)',
          }}>

          <div className="flex items-center gap-2.5 px-3 pt-4 pb-3 flex-shrink-0">
            {sidebarCollapsed ? (
              <button
                onClick={() => setSidebarCollapsed(false)}
                onMouseEnter={() => setBrandIconHovered(true)}
                onMouseLeave={() => setBrandIconHovered(false)}
                title="Expand sidebar"
                className="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 mx-auto rounded-xl"
                style={{
                  background: brandIconHovered ? theme.bgInput : 'transparent',
                  border: brandIconHovered ? `1px solid rgba(201,100,66,.35)` : '1px solid transparent',
                }}>
                {brandIconHovered
                  ? <PanelLeftOpen size={16} style={{ color: theme.accentText }} />
                  : <AuraeLogo size={28} />}
              </button>
            ) : (
              <>
                <AuraeLogo size={28} />
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-bold tracking-tight leading-none" style={{ color: theme.textPrimary }}>AURAE VOICE</h1>
                  <p className="text-[9px] font-medium tracking-widest uppercase mt-0.5" style={{ color: theme.accentPale }}>AI English Tutor</p>
                </div>
                <ThemeToggle />
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
                  style={{ color: theme.textMuted, background: 'transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = theme.accentText; e.currentTarget.style.background = theme.bgInput; }}
                  onMouseLeave={e => { e.currentTarget.style.color = theme.textMuted; e.currentTarget.style.background = 'transparent'; }}
                  title="Collapse sidebar">
                  <PanelLeftClose size={16} />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col min-h-0 pb-2 px-1">
            <ConversationList
              collapsed={sidebarCollapsed}
              onSelectConversation={handleSelectConversation}
              onNewChat={handleNewChat}
            />
          </div>

          <div className="border-t flex-shrink-0"
            style={{
              borderColor: theme.bgSidebarBorder,
              padding: sidebarCollapsed ? '10px 8px' : '10px 12px',
            }}>
            {sidebarCollapsed
              ? (
                <div className="flex flex-col items-center gap-2">
                  <ThemeToggle />
                  <UserMenu collapsed />
                </div>
              )
              : (
                <div className="flex flex-col gap-2">
                  <UserMenu />
                </div>
              )}
          </div>
        </aside>

        {/* ── Main chat area ────────────────────────────────────────────────── */}
        <main className="relative flex-1 flex flex-col overflow-hidden" style={{ background: theme.bgMain }}>

          {displayMessages.length === 0 ? (
            <div className="avatar-strip flex-shrink-0 flex flex-col items-center gap-1 pt-5 pb-4 relative z-10"
              style={{ borderBottom: `1px solid ${theme.separatorColor}` }}>
              <div className="flex items-center gap-2 px-3.5 py-1 rounded-full border mb-1"
                style={{ background: theme.bgStatusPill, borderColor: `${personaAccent}20` }}>
                <span className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: statusColor, boxShadow: isActive ? `0 0 6px ${statusColor}` : apiReady ? `0 0 5px ${API_GREEN}99` : 'none' }} />
                <span className="text-[11px] font-medium tracking-wide" style={{ color: statusColor }}>{statusLabel}</span>
              </div>
              <AvatarScene persona={selectedPersona} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} apiReady={apiReady === true} size={140} />
              <WaveformBars active={isListening || isSpeaking} color={selectedPersona === 'trump' ? 'bg-[#CC1A1A]' : 'bg-[#c96442]'} />
            </div>
          ) : (
            <div className="avatar-strip flex-shrink-0 flex items-center gap-3 px-5 py-2.5 border-b relative z-10"
              style={{ borderColor: theme.separatorColor, animation: 'stripIn .35s ease-out' }}>
              <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: theme.bgAvatarCard,
                  border: `1px solid ${isActive ? personaAccent + '58' : (theme.mode === 'dark' ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.09)')}`,
                  boxShadow: isActive ? `0 0 16px ${personaAccent}40` : 'none',
                  transition: 'box-shadow .4s, border-color .4s',
                  overflow: 'hidden',
                }}>
                {selectedPersona === 'trump'
                  ? <TrumpAvatarCharacter isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={34} />
                  : <AvatarCharacter isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={34} />}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold leading-none" style={{ color: theme.textPrimary }}>
                  {PERSONA_META[selectedPersona].name}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
                    style={{ background: statusColor, boxShadow: isActive ? `0 0 5px ${statusColor}` : 'none' }} />
                  <span className="text-[10px] tracking-wide" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
              </div>
              {/* Persona switcher */}
              <div className="ml-auto flex items-center gap-2 relative" data-persona-switcher="true">
                <button
                  onClick={() => setShowPersonaSwitcher(s => !s)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium border transition-all cursor-pointer"
                  style={{
                    borderColor: showPersonaSwitcher ? personaAccent + '50' : (theme.mode === 'dark' ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.1)'),
                    background: showPersonaSwitcher ? PERSONA_META[selectedPersona].accentBg : theme.bgInput,
                    color: showPersonaSwitcher ? personaAccent : theme.textMuted,
                  }}
                  title="Switch character">
                  <Users size={11} />
                  <span>Switch</span>
                  <ChevronDown
                    size={11}
                    style={{ transform: showPersonaSwitcher ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}
                  />
                </button>
                {showPersonaSwitcher && (
                  <div data-persona-switcher="true" className="absolute right-0 top-full mt-1.5 z-50 flex gap-2 p-2 rounded-2xl border shadow-xl"
                    style={{ background: theme.bgSidebar, borderColor: theme.bgSidebarBorder, animation: 'fadeUp .2s ease-out' }}>
                    {(['alex', 'trump'] as Persona[]).map(p => (
                      <button key={p} onClick={() => handlePersonaSwitch(p)}
                        className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer"
                        style={{
                          borderColor: selectedPersona === p ? PERSONA_META[p].accent + '60' : 'transparent',
                          background: selectedPersona === p ? PERSONA_META[p].accentBg : 'transparent',
                          color: selectedPersona === p ? PERSONA_META[p].accent : theme.textMuted,
                        }}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden"
                          style={{ background: theme.bgAvatarCard }}>
                          {p === 'trump'
                            ? <TrumpAvatarCharacter size={40} />
                            : <AvatarCharacter size={40} />}
                        </div>
                        <span className="text-[10px] font-semibold">{PERSONA_META[p].name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <WaveformBars active={isListening || isSpeaking} color={selectedPersona === 'trump' ? 'bg-[#CC1A1A]' : 'bg-[#c96442]'} />
              </div>
            </div>
          )}

          {displayMessages.length === 0 && (
            <div className="absolute left-6 top-5 z-20 flex flex-col items-start gap-2">
              <div className="relative" data-persona-switcher="true">
                <button
                  onClick={() => setShowPersonaSwitcher(s => !s)}
                  className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-medium border transition-all cursor-pointer"
                  style={{
                    borderColor: showPersonaSwitcher ? personaAccent + '60' : `${personaAccent}2e`,
                    background: showPersonaSwitcher
                      ? `linear-gradient(135deg, ${PERSONA_META[selectedPersona].accentBg}, ${theme.bgInput})`
                      : `linear-gradient(135deg, ${theme.bgInput}, ${theme.bgCard})`,
                    color: showPersonaSwitcher ? personaAccent : theme.textPrimary,
                    boxShadow: showPersonaSwitcher
                      ? `0 10px 26px ${personaAccent}22`
                      : (theme.mode === 'dark' ? '0 8px 18px rgba(0,0,0,.28)' : '0 8px 18px rgba(0,0,0,.08)'),
                    backdropFilter: 'blur(8px)',
                  }}
                  title="Choose partner"
                >
                  <Users size={13} />
                  <span className="tracking-wide">Partner: {PERSONA_META[selectedPersona].name}</span>
                  <div className="w-5 h-5 rounded-lg overflow-hidden border"
                    style={{ background: theme.bgAvatarCard, borderColor: `${personaAccent}35` }}>
                    {selectedPersona === 'trump'
                      ? <TrumpAvatarCharacter size={20} />
                      : <AvatarCharacter size={20} />}
                  </div>
                  <ChevronDown
                    size={13}
                    style={{ transform: showPersonaSwitcher ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}
                  />
                </button>
                {showPersonaSwitcher && (
                  <div data-persona-switcher="true" className="absolute left-0 top-full mt-2 z-50 flex gap-2 p-2 rounded-2xl border shadow-xl"
                    style={{
                      background: theme.mode === 'dark'
                        ? 'linear-gradient(160deg, rgba(31,31,35,.96), rgba(21,21,24,.94))'
                        : 'linear-gradient(160deg, rgba(255,255,255,.97), rgba(250,249,245,.95))',
                      borderColor: theme.bgSidebarBorder,
                      animation: 'fadeUp .2s ease-out',
                      backdropFilter: 'blur(12px)',
                    }}>
                    {(['alex', 'trump'] as Persona[]).map(p => (
                      <button key={p} onClick={() => handlePersonaSwitch(p)}
                        className="flex flex-col items-center gap-1.5 px-3 py-2 rounded-xl border transition-all cursor-pointer"
                        style={{
                          borderColor: selectedPersona === p ? PERSONA_META[p].accent + '66' : theme.bgInputBorder,
                          background: selectedPersona === p
                            ? `linear-gradient(145deg, ${PERSONA_META[p].accentBg}, ${theme.bgCard})`
                            : theme.bgMain,
                          color: selectedPersona === p ? PERSONA_META[p].accent : theme.textMuted,
                          boxShadow: selectedPersona === p ? `0 8px 20px ${PERSONA_META[p].accent}22` : 'none',
                        }}>
                        <div className="w-10 h-10 rounded-xl overflow-hidden"
                          style={{ background: theme.bgAvatarCard }}>
                          {p === 'trump'
                            ? <TrumpAvatarCharacter size={40} />
                            : <AvatarCharacter size={40} />}
                        </div>
                        <span className="text-[10px] font-semibold">{PERSONA_META[p].name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!hasAssessment && (
                <button
                  onClick={() => setShowAssessment(true)}
                  className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${theme.bgInput}, ${theme.bgCard})`,
                    color: theme.textMuted,
                    border: `1px solid ${theme.bgInputBorder}`,
                    boxShadow: theme.mode === 'dark' ? '0 6px 14px rgba(0,0,0,.24)' : '0 6px 14px rgba(0,0,0,.06)',
                  }}
                >
                  Start initial assessment
                </button>
              )}
            </div>
          )}

          <div ref={desktopMsgRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            style={{ scrollbarWidth: 'thin', scrollbarColor: `${theme.scrollbarColor} transparent` }}>
            {displayMessages.length === 0 ? (
              <div className="min-h-full flex items-center justify-center py-6">
                <section className="w-full max-w-3xl flex flex-col gap-3">
                  {todayPlan && (
                    <div className="rounded-2xl p-4 border text-left"
                      style={{ background: theme.bgCard, borderColor: theme.bgCardBorder }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: theme.accentText }}>Today&apos;s plan</p>
                      <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{todayPlan.goal}</p>
                      {todayMain && (
                        <p className="text-xs mt-1.5" style={{ color: theme.textMuted }}>
                          Main scenario: {todayMain.titleEn} ({todayMain.titleZh})
                        </p>
                      )}
                      <p className="text-xs mt-1" style={{ color: theme.textDimmer }}>
                        Suggested duration: {todayPlan.suggestedDurationMin} min
                      </p>
                      {todayPlan.focusCorrections?.length ? (
                        <p className="text-xs mt-1" style={{ color: theme.textDimmer }}>
                          Focus: {todayPlan.focusCorrections.join(' · ')}
                        </p>
                      ) : null}
                      {todayPlan.mainScenarioId && (
                        <button
                          onClick={() => applyScenario(todayPlan.mainScenarioId)}
                        disabled={!!scenarioLaunchingId || isLoading || limitReached}
                        className="mt-3 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                          style={{ background: '#c96442', color: '#fff' }}
                        >
                        {scenarioLaunchingId === todayPlan.mainScenarioId ? 'Launching…' : 'Start this scenario'}
                        </button>
                      )}
                    </div>
                  )}

                  {recommendedScenarios.length > 0 && (
                    <div className="rounded-2xl p-4 border"
                      style={{ background: theme.bgCard, borderColor: theme.bgCardBorder }}>
                      <p className="text-xs font-semibold mb-2 text-left" style={{ color: theme.textMuted }}>Recommended scenarios</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {recommendedScenarios.slice(0, 4).map(s => (
                          <button
                            key={s.scenarioId}
                            onClick={() => applyScenario(s.scenarioId)}
                            disabled={!!scenarioLaunchingId || isLoading || limitReached}
                            className="p-2.5 rounded-xl border text-left cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            style={{
                              background: selectedScenarioId === s.scenarioId ? theme.bgCard : theme.bgInput,
                              borderColor: selectedScenarioId === s.scenarioId ? '#c96442' : theme.bgInputBorder,
                            }}>
                            <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{s.titleEn}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: theme.textDimmer }}>{s.titleZh}</p>
                            {selectedScenarioId === s.scenarioId && (
                              <p className="text-[10px] mt-1" style={{ color: '#c96442' }}>Selected</p>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              </div>
            ) : displayMessages.map(m => (
              <ChatBubble key={m.id} message={m}
                speakerName={PERSONA_META[selectedPersona].name}
                speakerAccent={personaAccent}
                onReplay={m.role === 'assistant' ? () => handleReplay(extractText(m)) : undefined} />
            ))}
            {isListening && transcript && (
              <div className="flex flex-col items-end gap-0.5" style={{ animation: 'fadeUp .25s ease-out' }}>
                <span className="text-[10px] tracking-wide px-1 select-none" style={{ color: theme.textDimmer }}>You</span>
                <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm italic border border-dashed"
                  style={{ background: 'rgba(201,100,66,.05)', borderColor: 'rgba(201,100,66,.20)', color: 'rgba(217,119,87,.70)' }}>
                  &ldquo;{transcript}&rdquo;
                </div>
              </div>
            )}
          </div>

          {speechErrorBanner}
          {limitBanner}

          <div className="flex-shrink-0 px-6 pt-3 pb-5 border-t"
            style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter: 'blur(20px)' }}>
            {showTextInput && (
              <div className="mb-3" style={{ animation: 'fadeUp .25s ease-out' }}>
                <TextInputBar onSend={handleTextSend} disabled={isLoading || limitReached} />
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
                  {selectedPersona === 'trump' && ' · 🇺🇸 Trump voice'}
                </span>
                {usagePill}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ═══ MOBILE < lg ════════════════════════════════════════════════════════ */}
      <div className="flex lg:hidden flex-col h-screen w-full overflow-hidden select-none"
        style={{ background: theme.bgMain }}>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-28 -left-28 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle,${theme.glowStrong} 0%,transparent 70%)` }} />
          <div className="absolute -bottom-28 -right-28 w-72 h-72 rounded-full"
            style={{ background: `radial-gradient(circle,${theme.glowSubtle} 0%,transparent 70%)` }} />
        </div>

        <header className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMobileDrawer(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ color: theme.textMuted, background: theme.bgInput }}>
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none" style={{ color: theme.textPrimary }}>AURAE VOICE</h1>
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
                style={{ borderColor: 'rgba(201,100,66,.30)' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                onClick={() => signOut({ callbackUrl: '/' })} />
            )}
          </div>
        </header>

        {displayMessages.length === 0 ? (
          <div className="avatar-strip flex-shrink-0 relative z-10 flex flex-col items-center gap-1 pt-2 pb-1">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border"
              style={{ background: theme.bgStatusPill, borderColor: `${personaAccent}20` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
              <span className="text-[10px] font-medium" style={{ color: statusColor }}>{statusLabel}</span>
            </div>
            <AvatarScene persona={selectedPersona} isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={110} />
            <WaveformBars active={isListening || isSpeaking} color={selectedPersona === 'trump' ? 'bg-[#CC1A1A]' : 'bg-[#c96442]'} />
          </div>
        ) : (
          <div className="avatar-strip flex-shrink-0 relative z-10 flex items-center gap-3 px-4 py-2 border-b"
            style={{ borderColor: theme.separatorColor, animation: 'stripIn .35s ease-out' }}>
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: theme.bgAvatarCard,
                border: `1px solid ${isActive ? personaAccent + '58' : (theme.mode === 'dark' ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.09)')}`,
                boxShadow: isActive ? `0 0 16px ${personaAccent}40` : 'none',
                transition: 'box-shadow .4s, border-color .4s',
                overflow: 'hidden',
              }}>
              {selectedPersona === 'trump'
                ? <TrumpAvatarCharacter isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={34} />
                : <AvatarCharacter isListening={isListening} isSpeaking={isSpeaking} isLoading={isLoading} size={34} />}
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-xs font-semibold leading-none truncate" style={{ color: theme.textPrimary }}>
                {PERSONA_META[selectedPersona].name}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-300"
                  style={{ background: statusColor, boxShadow: isActive ? `0 0 5px ${statusColor}` : 'none' }} />
                <span className="text-[10px] tracking-wide" style={{ color: statusColor }}>{statusLabel}</span>
              </div>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <button
                onClick={() => setShowPersonaSwitcher(s => !s)}
                className="w-8 h-8 rounded-xl flex items-center justify-center border cursor-pointer transition-all"
                style={{
                  borderColor: showPersonaSwitcher ? personaAccent + '50' : theme.bgInputBorder,
                  background: showPersonaSwitcher ? PERSONA_META[selectedPersona].accentBg : theme.bgInput,
                  color: showPersonaSwitcher ? personaAccent : theme.textMuted,
                }}
                title="Switch character">
                <div className="relative">
                  <Users size={13} />
                  <ChevronDown
                    size={8}
                    className="absolute -bottom-1 -right-1"
                    style={{ transform: showPersonaSwitcher ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s ease' }}
                  />
                </div>
              </button>
              <WaveformBars active={isListening || isSpeaking} color={selectedPersona === 'trump' ? 'bg-[#CC1A1A]' : 'bg-[#c96442]'} />
            </div>
          </div>
        )}

        {/* Mobile persona switcher overlay */}
        {showPersonaSwitcher && (
          <div data-persona-switcher="true" className="relative z-20 flex justify-center gap-3 px-4 pt-2 pb-1"
            style={{ animation: 'fadeUp .2s ease-out' }}>
            {(['alex', 'trump'] as Persona[]).map(p => (
              <button key={p} onClick={() => handlePersonaSwitch(p)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer"
                style={{
                  borderColor: selectedPersona === p ? PERSONA_META[p].accent + '60' : theme.bgInputBorder,
                  background: selectedPersona === p ? PERSONA_META[p].accentBg : theme.bgInput,
                  color: selectedPersona === p ? PERSONA_META[p].accent : theme.textMuted,
                }}>
                <div className="w-8 h-8 rounded-lg overflow-hidden" style={{ background: theme.bgAvatarCard }}>
                  {p === 'trump' ? <TrumpAvatarCharacter size={32} /> : <AvatarCharacter size={32} />}
                </div>
                <span className="text-xs font-semibold">{PERSONA_META[p].name}</span>
              </button>
            ))}
          </div>
        )}

        <div ref={mobileMsgRef} className="flex-1 relative z-10 overflow-y-auto px-4 pb-2 space-y-3.5"
          style={{ scrollbarWidth: 'none' }}>
          {displayMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-start text-center gap-4 pt-2 pb-5">
              {todayPlan && (
                <div className="w-full rounded-2xl p-3 border text-left"
                  style={{ background: theme.bgCard, borderColor: theme.bgCardBorder }}>
                  <p className="text-[11px] font-semibold" style={{ color: theme.accentText }}>Today&apos;s plan</p>
                  <p className="text-xs mt-1" style={{ color: theme.textPrimary }}>{todayPlan.goal}</p>
                  {todayMain && (
                    <p className="text-[10px] mt-1" style={{ color: theme.textMuted }}>
                      {todayMain.titleEn} ({todayMain.titleZh})
                    </p>
                  )}
                  {todayPlan.mainScenarioId && (
                    <button
                      onClick={() => applyScenario(todayPlan.mainScenarioId)}
                      disabled={!!scenarioLaunchingId || isLoading || limitReached}
                      className="mt-2 px-3 py-1.5 rounded-lg text-[11px] font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ background: '#c96442', color: '#fff' }}
                    >
                      {scenarioLaunchingId === todayPlan.mainScenarioId ? 'Launching…' : 'Start this scenario'}
                    </button>
                  )}
                </div>
              )}
              <div className="pt-1">
                <p className="text-sm font-semibold mb-1" style={{ color: theme.textPrimary }}>Choose your partner</p>
                <p className="text-[11px]" style={{ color: theme.textMuted }}>Tap a character to select</p>
              </div>
              <div className="flex gap-3 w-full justify-center">
                {(['alex', 'trump'] as Persona[]).map(p => (
                  <PersonaCard key={p} persona={p} selected={selectedPersona === p} onSelect={() => setPersona(p)} />
                ))}
              </div>
              {recommendedScenarios.length > 0 && (
                <div className="w-full flex flex-col gap-2">
                  <p className="text-[11px] text-left font-semibold" style={{ color: theme.textMuted }}>Recommended scenarios</p>
                  {recommendedScenarios.slice(0, 2).map(s => (
                    <button
                      key={s.scenarioId}
                      onClick={() => applyScenario(s.scenarioId)}
                      disabled={!!scenarioLaunchingId || isLoading || limitReached}
                      className="p-2.5 rounded-xl border text-left cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        background: selectedScenarioId === s.scenarioId ? theme.bgCard : theme.bgInput,
                        borderColor: selectedScenarioId === s.scenarioId ? '#c96442' : theme.bgInputBorder,
                      }}>
                      <p className="text-xs font-semibold" style={{ color: theme.textPrimary }}>{s.titleEn}</p>
                      <p className="text-[10px]" style={{ color: theme.textDimmer }}>{s.titleZh}</p>
                      {selectedScenarioId === s.scenarioId && (
                        <p className="text-[10px] mt-1" style={{ color: '#c96442' }}>Selected</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {!hasAssessment && (
                <button
                  onClick={() => setShowAssessment(true)}
                  className="px-4 py-2 rounded-xl text-xs font-medium cursor-pointer"
                  style={{ background: theme.bgInput, color: theme.textMuted, border: `1px solid ${theme.bgInputBorder}` }}
                >
                  Start initial assessment
                </button>
              )}
            </div>
          ) : displayMessages.map(m => (
            <ChatBubble key={m.id} message={m}
              speakerName={PERSONA_META[selectedPersona].name}
              speakerAccent={personaAccent}
              onReplay={m.role === 'assistant' ? () => handleReplay(extractText(m)) : undefined} />
          ))}
          {isListening && transcript && (
            <div className="flex flex-col items-end gap-0.5" style={{ animation: 'fadeUp .2s ease-out' }}>
              <span className="text-[10px] tracking-wide px-1 select-none" style={{ color: theme.textDimmer }}>You</span>
              <div className="max-w-[78%] px-4 py-3 rounded-2xl text-sm italic border border-dashed"
                style={{ background: 'rgba(201,100,66,.05)', borderColor: 'rgba(201,100,66,.20)', color: 'rgba(217,119,87,.70)' }}>
                &ldquo;{transcript}&rdquo;
              </div>
            </div>
          )}
        </div>

        {speechErrorBanner}
        {limitBanner}

        {showTextInput && (
          <div className="relative z-10 px-4 pb-2" style={{ animation: 'fadeUp .25s ease-out' }}>
            <TextInputBar onSend={handleTextSend} disabled={isLoading || limitReached} />
          </div>
        )}

        <footer className="relative z-10 flex-shrink-0 px-5 pb-8 pt-3 border-t"
          style={{ borderColor: theme.bgFooterBorder, background: theme.bgFooter, backdropFilter: 'blur(16px)' }}>
          <Controls />
          <div className="flex items-center justify-center gap-3 mt-3">
            <p className="text-center text-[10px] tracking-wide" style={{ color: theme.textDimmer }}>
              {inputLang === 'zh-CN' ? '中文输入 · 英文回复' : 'EN input · EN reply'}
            </p>
            {usagePill}
          </div>
        </footer>

        {showMobileDrawer && (
          <>
            <div className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
              onClick={() => setShowMobileDrawer(false)} />
            <div className="fixed top-0 left-0 h-full w-[280px] z-50 flex flex-col"
              style={{ background: theme.bgSidebar, borderRight: `1px solid ${theme.bgSidebarBorder}`, animation: 'slideInLeft .25s ease-out' }}>
              <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b"
                style={{ borderColor: theme.bgSidebarBorder }}>
                <div className="flex items-center gap-2.5">
                  <AuraeLogo size={28} />
                  <div>
                    <h2 className="text-sm font-bold" style={{ color: theme.textPrimary }}>AURAE VOICE</h2>
                    <p className="text-[9px] font-medium tracking-widest uppercase" style={{ color: theme.accentPale }}>Chats</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileDrawer(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
                  style={{ color: theme.textMuted, background: theme.bgInput }}>
                  <X size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 px-1 py-2">
                <ConversationList
                  onClose={() => setShowMobileDrawer(false)}
                  onSelectConversation={handleSelectConversation}
                  onNewChat={() => { handleNewChat(); setShowMobileDrawer(false); }}
                />
              </div>
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

// ─── WaveformBars (defined after VoiceInterface to avoid hoisting issues) ──────
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
