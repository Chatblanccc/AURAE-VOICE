import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import {
  ensureSchema, createConversation,
  saveMessageToConversation, touchConversation,
} from '@/lib/db';

export const runtime = 'nodejs';

type S = { user?: { id?: string } | null } | null;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
function newId() { return Math.random().toString(36).substring(2, 11); }

function buildFallbackStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      for (const word of text.split(' ')) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: word + ' ' } }] })}\n\n`)
        );
        await new Promise(r => setTimeout(r, 70));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    messages,
    settings,
    conversationId,
    conversationTitle,
    userMsgId,
  } = body as {
    messages: { role: string; content: string }[];
    settings: { proficiency: string; topic: string };
    conversationId?: string;
    conversationTitle?: string;
    userMsgId?: string;
  };

  const apiKey = process.env.KIMI_API_KEY ?? '';

  // ── Server-side: persist user message before calling AI ──────────────────
  const session = await auth() as S;
  const userId = session?.user?.id;

  console.log('[chat] userId:', userId ?? 'NONE', '| convId:', conversationId ?? 'NONE');

  if (userId && conversationId) {
    // Run schema migration separately — don't let it block message saves
    try {
      await ensureSchema();
    } catch (e) {
      console.error('[chat] ensureSchema error (non-fatal):', String(e));
    }

    const now = Date.now();
    try {
      await createConversation(userId, {
        id: conversationId,
        title: conversationTitle ?? 'New Chat',
        created_at: now,
        updated_at: now,
      });
      console.log('[chat] conversation upserted:', conversationId);
    } catch (e) {
      console.error('[chat] createConversation error:', String(e));
    }

    try {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        await saveMessageToConversation(conversationId, userId, {
          id: userMsgId ?? newId(),
          role: 'user',
          content: lastUserMsg.content,
          timestamp: now,
        });
        console.log('[chat] user message saved');
      }
    } catch (e) {
      console.error('[chat] save user msg error:', String(e));
    }
  }

  // ── No API key → friendly fallback ───────────────────────────────────────
  if (!apiKey) {
    return new Response(
      buildFallbackStream('Please configure your KIMI_API_KEY in environment variables.'),
      { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' } }
    );
  }

  // ── Call Moonshot AI ──────────────────────────────────────────────────────
  let moonshotRes: Response;
  try {
    moonshotRes = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
        stream: true,
        messages: [
          {
            role: 'system',
            content: `You are Alex, a 25-year-old guy from California, living in Shanghai for work. You're voice chatting with a Chinese friend who wants to get better at English — but this is NOT a class. It's just two friends hanging out and talking.

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
- Never use bullet points, lists, or structured explanations.

## The fun part — spontaneous challenges
Every few messages, when it feels natural, throw out a random real-world English challenge. Don't announce it as a "challenge" or "exercise" — just drop it into the conversation like it occurred to you.

## After they answer the challenge
- If correct or close: react naturally ("yeah exactly", "haha yes that's the word")
- If off: don't say "wrong". Casually model the right way — "oh yeah, I think we'd usually say it more like '...' — sounds a bit more natural ya know?" Then move on.

## Pacing
- Have a real conversation first, then drop a challenge when it feels right.
- Don't challenge every single message — maybe every 3–5 exchanges.

User's English level: ${settings.proficiency}. Match vocabulary to that.
Current topic: ${settings.topic}. Weave it in when it fits, don't force it.`,
          },
          ...messages,
        ],
      }),
    });
  } catch (error) {
    const err = error as Error & { cause?: { code?: string } };
    console.error('[chat] fetch error:', err.message, err.cause?.code ?? '');
    const msg =
      err.cause?.code === 'ECONNRESET' || err.cause?.code === 'UND_ERR_SOCKET'
        ? "Hmm, looks like I dropped the connection. Try again?"
        : "Oops, something went wrong on my end. Mind trying that again?";
    return new Response(buildFallbackStream(msg), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  if (!moonshotRes.ok) {
    const detail = await moonshotRes.text();
    console.error('[chat] Moonshot error:', moonshotRes.status, detail.slice(0, 300));
    const msg =
      moonshotRes.status === 401 ? "My API key seems off — tell the host to check the KIMI_API_KEY setting."
        : moonshotRes.status === 429 ? "Whoa, too many messages at once — give me a second and try again!"
          : "The AI service hiccupped. Try sending that again?";
    return new Response(buildFallbackStream(msg), {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  // ── Stream to client while buffering for DB save ──────────────────────────
  const decoder = new TextDecoder();
  let aiContent = '';
  const aiMsgId = newId();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = moonshotRes.body!.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Extract text content for buffering
          const text = decoder.decode(value, { stream: true });
          for (const line of text.split('\n')) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const delta = JSON.parse(line.slice(6)).choices[0]?.delta?.content;
                if (delta) aiContent += delta;
              } catch { /* ignore malformed SSE lines */ }
            }
          }
          // Pass through to client unchanged
          controller.enqueue(value);
        }
      } finally {
        // Save AI response BEFORE closing — Vercel keeps lambda alive until close()
        if (userId && conversationId && aiContent.trim()) {
          try {
            await saveMessageToConversation(conversationId, userId, {
              id: aiMsgId,
              role: 'assistant',
              content: aiContent,
              timestamp: Date.now(),
            });
            await touchConversation(conversationId, userId);
            console.log('[chat] AI message saved, len:', aiContent.length);
          } catch (e) {
            console.error('[chat] save AI msg error:', String(e));
          }
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
