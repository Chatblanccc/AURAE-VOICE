import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  ensureSchema, createConversation,
  saveMessageToConversation, touchConversation,
  getUserAssessment,
  getUserPlan,
  getUserProgress,
  getUsageCount,
  getUsageResetAtMs,
  getMonthlyUsageCount,
  listUserMemoryFacts,
  recordUsage,
  saveChatRoundProfile,
  upsertUserMemoryFact,
} from '@/lib/db';
import { checkChatRateLimit } from '@/lib/rate-limit';
import {
  assignPersonalizationVariant,
  buildMemoryPrompt,
  deriveDifficultyProfile,
} from '@/lib/personalization/memory';
import {
  extractMemoryCandidatesFromTurn,
  mergeMemoryCandidates,
} from '@/lib/personalization/memory-curator-agent';

const FREE_LIMIT = 100;
const FREE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // rolling 7-day window
const PLUS_LIMIT = 1000;

export const runtime = 'nodejs';
export const maxDuration = 60;
let moonshotDirectDispatcher: unknown | null = null;

async function getMoonshotDirectDispatcher(): Promise<unknown> {
  if (moonshotDirectDispatcher) return moonshotDirectDispatcher;
  // Load undici lazily to avoid webpack trying to bundle node:* scheme modules.
  const undici = await (0, eval)('import("undici")');
  moonshotDirectDispatcher = new undici.Agent();
  return moonshotDirectDispatcher;
}

const moonshotDirectFetch: typeof fetch = async (input, init) => {
  const baseInit = init ?? {};
  try {
    const dispatcher = await getMoonshotDirectDispatcher();
    return await fetch(
      input,
      {
        ...baseInit,
        // Prefer direct socket for Moonshot to avoid proxy TLS handshake issues.
        dispatcher,
      } as RequestInit & { dispatcher: unknown },
    );
  } catch (e) {
    console.warn('[chat] moonshot direct fetch failed, fallback to global fetch:', String(e));
    // Fallback to global dispatcher (e.g. when outbound traffic must go through a proxy).
    return fetch(input, baseInit);
  }
};

type S = { user?: { id?: string } | null } | null;
function newId() { return crypto.randomUUID(); }

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return 'unknown';
}

const SAFE_ID_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_CONV_ID_LEN = 128;
const MAX_BODY_SIZE = 200_000; // ~200KB JSON payload

// ── Tools ──────────────────────────────────────────────────────────────────────

const tools = {
  explainVocabulary: tool({
    description:
      'Look up a word or phrase and return its definition and example sentences. ' +
      'Use when the user asks about a word, or when you want to highlight an interesting expression.',
    inputSchema: z.object({
      word: z.string().describe('The English word or phrase to explain'),
      partOfSpeech: z
        .enum(['noun', 'verb', 'adjective', 'adverb', 'phrase', 'idiom', 'other'])
        .optional(),
    }),
    execute: async ({ word, partOfSpeech }) => ({
      word,
      partOfSpeech: partOfSpeech ?? 'word',
      note: `Provide a concise definition of "${word}" and 2 natural example sentences.`,
    }),
  }),

  correctGrammar: tool({
    description:
      'Flag a grammar or usage mistake and provide a natural correction. ' +
      'Use this to gently correct the user without interrupting conversation flow.',
    inputSchema: z.object({
      original: z.string().describe("The user's original (incorrect) sentence or phrase"),
      corrected: z.string().describe('The corrected version in natural English'),
      explanation: z.string().describe('A short friendly explanation (1 sentence)'),
    }),
    execute: async (args) => args,
  }),

  issueChallenge: tool({
    description:
      'Issue a spontaneous language challenge woven naturally into conversation. ' +
      'Do NOT announce it as a "challenge" or "exercise" in your reply — just weave it in. ' +
      'Use every 3–5 exchanges, not every message.',
    inputSchema: z.object({
      type: z
        .enum(['fill-in-blank', 'describe-this', 'translate-to-english', 'use-in-sentence', 'pronunciation'])
        .describe('Type of challenge'),
      prompt: z.string().describe('The challenge prompt shown to the user'),
      hint: z.string().optional().describe('Optional hint if the challenge is hard'),
      targetWord: z.string().optional().describe('The word or phrase being practised'),
    }),
    execute: async (args) => args,
  }),
};

// ── Input constraints ─────────────────────────────────────────────────────────

const MAX_MESSAGES = 100;
const MAX_TITLE_LEN = 200;
const VALID_PROFICIENCIES = new Set(['beginner', 'intermediate', 'advanced']);
const VALID_PERSONAS = new Set(['alex', 'trump']);
const MAX_MEMORY_FACTS = 12;

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth gate ─────────────────────────────────────────────────────────────
  const session = await auth() as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Usage / rate-limit gate ───────────────────────────────────────────────
  let userPlan: 'free' | 'plus' | 'pro' = 'free';
  try {
    await ensureSchema();
    userPlan = await getUserPlan(userId);

    if (userPlan === 'free') {
      const windowStart = Date.now() - FREE_WINDOW_MS;
      const used = await getUsageCount(userId, windowStart);
      if (used >= FREE_LIMIT) {
        const resetAt = await getUsageResetAtMs(userId, {
          windowMs: FREE_WINDOW_MS,
          limit: FREE_LIMIT,
        });
        return NextResponse.json(
          {
            error: 'limit_reached',
            plan: 'free',
            limit: FREE_LIMIT,
            resetAt: resetAt ?? Date.now() + FREE_WINDOW_MS,
          },
          { status: 429 },
        );
      }
    } else if (userPlan === 'plus') {
      const used = await getMonthlyUsageCount(userId);
      if (used >= PLUS_LIMIT) {
        const now = new Date();
        const resetAt = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
        return NextResponse.json(
          { error: 'limit_reached', plan: 'plus', limit: PLUS_LIMIT, resetAt },
          { status: 429 },
        );
      }
    }
    // pro: no limit
  } catch (e) {
    console.error('[chat] rate-limit check failed:', String(e));
    return NextResponse.json(
      { error: 'usage_unavailable', message: 'Usage system is temporarily unavailable.' },
      { status: 503 },
    );
  }

  const contentLengthHeader = req.headers.get('content-length');
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    messages: rawMessages,
    settings,
    conversationId,
    conversationTitle,
    userMsgId,
    persona: rawPersona,
  } = body as {
    messages: UIMessage[];
    settings?: { proficiency?: string; topic?: string };
    conversationId?: string;
    conversationTitle?: string;
    userMsgId?: string;
    persona?: string;
  };

  // ── Rate limit gate ───────────────────────────────────────────────────────
  const clientIp = getClientIp(req);
  const rateLimit = checkChatRateLimit(userId, clientIp);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', retryAfterMs: rateLimit.retryAfterMs, reason: rateLimit.reason },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.retryAfterMs / 1000)) } },
    );
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 });
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Too many messages (max ${MAX_MESSAGES})` }, { status: 400 });
  }
  if (JSON.stringify(rawMessages).length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }
  if (
    conversationId &&
    (conversationId.length > MAX_CONV_ID_LEN || !SAFE_ID_RE.test(conversationId))
  ) {
    return NextResponse.json({ error: 'Invalid conversationId' }, { status: 400 });
  }

  const persona = VALID_PERSONAS.has(rawPersona ?? '') ? (rawPersona as 'alex' | 'trump') : 'alex';
  const messages = rawMessages as UIMessage[];

  // ── Persist user message ──────────────────────────────────────────────────
  const safeTitle = typeof conversationTitle === 'string'
    ? conversationTitle.slice(0, MAX_TITLE_LEN)
    : 'New Chat';

  console.log('[chat] userId:', userId.slice(0, 12), '| convId:', conversationId ?? 'NONE');

  if (userId && conversationId) {
    try { await ensureSchema(); } catch (e) {
      console.error('[chat] ensureSchema (non-fatal):', String(e));
    }
    const now = Date.now();
    try {
      await createConversation(userId, {
        id: conversationId,
        title: safeTitle,
        persona,
        created_at: now,
        updated_at: now,
      });
    } catch (e) { console.error('[chat] createConversation:', String(e)); }

    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      const userText = lastUserMsg?.parts?.find((p: { type: string }) => p.type === 'text')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? (lastUserMsg.parts.find((p: any) => p.type === 'text') as any).text as string
        : '';
      if (userText) {
        await saveMessageToConversation(conversationId, userId, {
          id: userMsgId ?? newId(),
          role: 'user',
          content: userText,
          timestamp: now,
        });
      }
    } catch (e) { console.error('[chat] save user msg:', String(e)); }
  }

  // ── No API key fallback ───────────────────────────────────────────────────
  if (!process.env.KIMI_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(ctrl) {
        const msg = 'Please configure KIMI_API_KEY in your environment variables.';
        ctrl.enqueue(encoder.encode(`0:${JSON.stringify(msg + ' ')}\n`));
        ctrl.enqueue(encoder.encode('d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n'));
        ctrl.close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'x-vercel-ai-data-stream': 'v1',
      },
    });
  }

  // ── Build provider + system prompt ───────────────────────────────────────
  const kimi = createOpenAI({
    baseURL: 'https://api.moonshot.cn/v1',
    apiKey: process.env.KIMI_API_KEY,
    fetch: moonshotDirectFetch,
  });

  // Sanitize free-text fields before embedding in the system prompt to prevent
  // prompt-injection attacks (e.g. topic: "ignore previous instructions").
  const rawTopic = typeof settings?.topic === 'string' ? settings.topic : 'Daily Conversation';
  const variant = assignPersonalizationVariant(userId);
  const [assessment, progress, memoryFacts] = await Promise.all([
    getUserAssessment(userId),
    getUserProgress(userId),
    listUserMemoryFacts(userId, MAX_MEMORY_FACTS),
  ]);
  const difficultyProfile = deriveDifficultyProfile({
    settingsProficiency: VALID_PROFICIENCIES.has(settings?.proficiency ?? '')
      ? settings?.proficiency
      : 'intermediate',
    topic: rawTopic,
    assessmentOverallLevel: assessment?.overallLevel,
    xp: progress.xp,
    memoryFacts,
    variant,
  });
  const proficiency = difficultyProfile.band;
  const topic = difficultyProfile.topic;
  const memoryPrompt = buildMemoryPrompt(memoryFacts);
  const vocabularyGuardrail = difficultyProfile.band === 'beginner'
    ? `Vocabulary guardrail for beginner users (strict):
- Use CEFR A1-A2 words by default and very common daily phrases.
- Avoid uncommon slang, idioms, and culture-heavy references unless user asks.
- Keep one sentence around 6-12 words, max two short sentences.
- If you must use a harder word, immediately explain it with simple words in the same reply.`
    : difficultyProfile.band === 'intermediate'
      ? `Vocabulary guardrail for intermediate users:
- Use mostly CEFR A2-B1 words; occasional B2 is okay with context.
- Keep replies concise and clear; avoid stacking many advanced expressions.`
      : `Vocabulary guardrail for advanced users:
- Natural fluent vocabulary is allowed, but keep wording conversational and not academic.`;
  const pronunciationCoachingRule = userPlan === 'free'
    ? `Membership coaching mode: FREE.
- You can correct grammar and wording mistakes.
- Do NOT provide pronunciation coaching.
- Do NOT ask the user to repeat or re-read after you.
- Keep the conversation natural and supportive.`
    : `Membership coaching mode: ${userPlan.toUpperCase()}.
- Correct grammar and wording mistakes.
- Also coach pronunciation when needed (stress, rhythm, difficult sounds).
- After pronunciation feedback, encourage the user to say the corrected sentence one more time and listen again.
- Keep coaching light, natural, and encouraging (not classroom-heavy).`;

  const alexPrompt = `You are Alex, a 25-year-old guy from California, living in Shanghai for work. You're voice chatting with a Chinese friend who wants to get better at English — but this is NOT a class. It's just two friends hanging out and talking.

## Who you are
- Chill, funny, genuinely curious about people. A little sarcastic sometimes but always warm.
- You love basketball, street food, random YouTube rabbit holes, bad movies, and people-watching.
- You've lived in Shanghai long enough to get Chinese culture references, but you still find things surprising.
- You talk like a real person: "gonna", "wanna", "kinda", "tbh", "nah", "wait what", "that's actually wild", "dude", "haha", "oh man".

## How you talk
- Keep it SHORT. 1–3 sentences per reply. Voice chat pace, not essay pace.
- Never open with "Great!", "Excellent!", "Of course!", "Certainly!", "That's a great question!" — ever.
- Don't repeat back what they just said.
- Don't always end with a question — sometimes just react, like a real person would.
- If they speak Chinese, understand it and reply in English naturally.
- Never use bullet points, lists, or structured explanations in your spoken reply.

## Using your tools (silently — never announce you're calling them)
Your tool calls happen silently in the background. Your TEXT reply must always be pure natural sentences — NEVER output JSON, curly braces {}, or structured data in your text.
- Call correctGrammar when you spot a grammar mistake. Don't mention the correction in your text; just keep talking naturally.
- Call explainVocabulary when you drop an interesting new word or phrase.
- Call issueChallenge naturally every 3–5 exchanges when the moment feels right.

## Membership feature gating (strict)
${pronunciationCoachingRule}

## Personalized coaching profile (must follow)
- Difficulty band: ${difficultyProfile.band}
- Challenge frequency: every ${difficultyProfile.challengeInterval} exchanges
- Correction intensity: ${difficultyProfile.correctionIntensity}
- Follow-up depth: ${difficultyProfile.followUpDepth}
- Sentence length target: ${difficultyProfile.maxSentenceLength}
- Use this profile consistently and do not jump more than one difficulty level within a short span.

## Vocabulary safety guardrail (strict)
${vocabularyGuardrail}

## Durable memory summary
${memoryPrompt}

User's English level: ${proficiency}. Match vocabulary to that.
Current topic: ${topic}. Weave it in when it fits, don't force it.`;

  const trumpPrompt = `You are Donald Trump — 45th and 47th President of the United States — in a private voice call with a user from China who is practicing spoken English.

## Voice identity (high Trump flavor, still human)
- Sound unmistakably like Trump in rhythm and attitude, but like real spontaneous speech, not a parody script.
- Confident, assertive, blunt, persuasive, and conversational.
- Natural cadence: short punchy claims, quick pivots, occasional repetition for emphasis.
- Use Trump-like phrases regularly but not mechanically: "believe me", "frankly", "very strong", "tremendous", "a lot of people are saying", "not good", "it's true".
- In most replies, include 1 signature phrase. In longer replies, at most 2. Never stack many catchphrases.

## Conversation behavior
- Keep replies short: mostly 1-3 sentences, sometimes 4 if needed.
- React first, then answer, then optionally challenge or follow up.
- Stay on the user's topic, but add your opinions and framing with confidence.
- No bullet points, labels, JSON, or meta talk.
- Avoid robotic politeness. Avoid generic assistant tone.
- If the user speaks Chinese, understand it and reply in natural English; briefly steer them back to English practice.

## Realism rules (critical)
- Vary sentence openings and length so responses do not feel templated.
- Do not repeat the same slogan/catchphrase in consecutive turns.
- Mix strong takes with casual spoken fillers occasionally (e.g. "look", "honestly", "listen").
- Keep it human: sometimes agree, sometimes push back, sometimes tease lightly.

## English correction style
- If there is a clear mistake, correct it directly in a Trump-like but helpful way.
- Default pattern: brief judgment + corrected sentence + continue the conversation.
- Example tone: "Almost right. Better way: '...'. That's much stronger."
- Do not over-correct minor issues. If meaning is clear, prioritize flow.

## Membership feature gating (strict)
${pronunciationCoachingRule}

## Personalized coaching profile (must follow)
- Difficulty band: ${difficultyProfile.band}
- Challenge frequency: every ${difficultyProfile.challengeInterval} exchanges
- Correction intensity: ${difficultyProfile.correctionIntensity}
- Follow-up depth: ${difficultyProfile.followUpDepth}
- Sentence length target: ${difficultyProfile.maxSentenceLength}
- Use this profile consistently and do not jump more than one difficulty level within a short span.

## Vocabulary safety guardrail (strict)
${vocabularyGuardrail}

## Durable memory summary
${memoryPrompt}

User's English level: ${proficiency}.
Current topic: ${topic}. Keep it relevant, opinionated, and natural.`;

  const systemPrompt = persona === 'trump' ? trumpPrompt : alexPrompt;

  // ── Stream ────────────────────────────────────────────────────────────────
  // Trump speaks naturally — no tool cards. Alex uses structured tool cards.
  const isTrump = persona === 'trump';
  const activeTools = isTrump ? undefined : tools;

  const result = streamText({
    model: kimi.chat('moonshot-v1-8k'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages, activeTools ? { tools: activeTools } : {}),
    ...(activeTools ? { tools: activeTools, stopWhen: stepCountIs(6) } : {}),
    onFinish: async ({ text }) => {
      const finishedAt = Date.now();
      // Record one usage unit per completed round
      try { await recordUsage(userId); } catch (e) {
        console.error('[chat] recordUsage:', String(e));
      }
      try {
        await saveChatRoundProfile({
          id: newId(),
          userId,
          conversationId,
          variant,
          difficultyBand: difficultyProfile.band,
          challengeInterval: difficultyProfile.challengeInterval,
          correctionMode: difficultyProfile.correctionIntensity,
          maxSentenceLen: difficultyProfile.maxSentenceLength,
          reasons: difficultyProfile.reasons,
          createdAtMs: finishedAt,
        });
      } catch (e) {
        console.error('[chat] saveChatRoundProfile:', String(e));
      }

      try {
        const latestUserMsg = [...messages].reverse().find((m) => m.role === 'user');
        const userTextPart = latestUserMsg?.parts?.find((p: { type: string }) => p.type === 'text') as
          | { text?: string }
          | undefined;
        const userText = typeof userTextPart?.text === 'string' ? userTextPart.text : '';
        if (variant === 'memory_adaptive' && userText.trim().length > 0) {
          const candidates = extractMemoryCandidatesFromTurn(userText);
          const newCandidates = mergeMemoryCandidates(memoryFacts, candidates);
          await Promise.all(newCandidates.map((candidate) => upsertUserMemoryFact(userId, candidate)));
        }
      } catch (e) {
        console.error('[chat] memory curator:', String(e));
      }

      if (userId && conversationId && text.trim()) {
        try {
          await saveMessageToConversation(conversationId, userId, {
            id: newId(),
            role: 'assistant',
            content: text,
            timestamp: finishedAt,
          });
          await touchConversation(conversationId, userId);
          console.log('[chat] AI message saved, len:', text.length);
        } catch (e) { console.error('[chat] save AI msg:', String(e)); }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
