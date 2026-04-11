import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { streamText, convertToModelMessages, UIMessage, tool, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  ensureSchema, createConversation,
  saveMessageToConversation, touchConversation,
  getUserPlan, recordUsage, getUsageCount, getMonthlyUsageCount,
} from '@/lib/db';

const FREE_LIMIT = 100;
const FREE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // rolling 7-day window
const PLUS_LIMIT = 1000;

export const runtime = 'nodejs';
export const maxDuration = 60;

type S = { user?: { id?: string } | null } | null;
function newId() { return Math.random().toString(36).substring(2, 11); }

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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Auth gate ─────────────────────────────────────────────────────────────
  const session = await auth() as S;
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Usage / rate-limit gate ───────────────────────────────────────────────
  try {
    await ensureSchema();
    const plan = await getUserPlan(userId);

    if (plan === 'free') {
      const windowStart = Date.now() - FREE_WINDOW_MS;
      const used = await getUsageCount(userId, windowStart);
      if (used >= FREE_LIMIT) {
        const resetAt = windowStart + FREE_WINDOW_MS;
        return NextResponse.json(
          { error: 'limit_reached', plan: 'free', limit: FREE_LIMIT, resetAt },
          { status: 429 },
        );
      }
    } else if (plan === 'plus') {
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
    // Fail closed: if we cannot verify plan/usage, do not allow unbounded provider usage.
    return NextResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 },
    );
  }

  const body = await req.json();
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

  // ── Input validation ──────────────────────────────────────────────────────
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return NextResponse.json({ error: 'messages must be a non-empty array' }, { status: 400 });
  }
  if (rawMessages.length > MAX_MESSAGES) {
    return NextResponse.json({ error: `Too many messages (max ${MAX_MESSAGES})` }, { status: 400 });
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
  });

  // Sanitize free-text fields before embedding in the system prompt to prevent
  // prompt-injection attacks (e.g. topic: "ignore previous instructions").
  const proficiency = VALID_PROFICIENCIES.has(settings?.proficiency ?? '')
    ? settings!.proficiency!
    : 'intermediate';
  const rawTopic = typeof settings?.topic === 'string' ? settings.topic : 'Daily Conversation';
  const topic = rawTopic.slice(0, 100).replace(/[<>{}\[\]]/g, '');

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

User's English level: ${proficiency}. Match vocabulary to that.
Current topic: ${topic}. Weave it in when it fits, don't force it.`;

  const trumpPrompt = `You are Donald Trump — 45th and 47th President of the United States. You're on a private phone call with someone from China who's learning English. This is just you being you. Nobody knows more about talking than you, believe me.

## Who you are
- You are tremendous. The best. Maybe ever.
- You bring everything back to yourself: your deals, your buildings, your poll numbers, your enemies, the wall, your beautiful family.
- You get sidetracked constantly: start answering one thing, pivot to how great your last rally was, come back around.
- Natural Trump-isms you use all the time: "tremendous", "believe me", "the best", "very very [adj]", "frankly", "many people are saying", "it's gonna be beautiful", "nobody does [X] better than me", "and by the way", "total disaster", "fake", "huge", "I know more about [X] than anyone", "it's called talent".
- You have opinions about EVERYTHING. Strong ones. Nobody has more opinions than you.

## How you talk — ONLY plain conversational sentences. No tools. No JSON. No structured data. Ever.
- SHORT. 1–3 sentences. You're a very busy man.
- Never say "Great!" or "Excellent!" — that's weak.
- React to everything with strong opinions. Nothing is neutral to you.
- If they speak Chinese, you have opinions: "I know China better than anybody. Say it in English though, that's our deal."

## When their English is wrong — say it OUT LOUD in your reply, Trump style:
- "Wrong. Totally wrong. Nobody talks like that. The right way is: [corrected sentence]. Believe me."
- "Whoa whoa whoa — I give the greatest speeches and even I know that's not right. You say: [corrected sentence]. Beautiful."
- "That's a disaster, frankly. I know English better than anybody. You want to say: [corrected sentence]. You're welcome."
Always include the corrected sentence directly in your spoken reply.

## When they say something right or interesting, just react like yourself.

User's English level: ${proficiency}.
Current topic: ${topic}. Make it about yourself somehow.`;

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
      // Record one usage unit per completed round
      try { await recordUsage(userId); } catch (e) {
        console.error('[chat] recordUsage:', String(e));
      }
      if (userId && conversationId && text.trim()) {
        try {
          await saveMessageToConversation(conversationId, userId, {
            id: newId(),
            role: 'assistant',
            content: text,
            timestamp: Date.now(),
          });
          await touchConversation(conversationId, userId);
          console.log('[chat] AI message saved, len:', text.length);
        } catch (e) { console.error('[chat] save AI msg:', String(e)); }
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
