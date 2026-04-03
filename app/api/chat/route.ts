import { NextRequest } from 'next/server';

/** Node.js runtime avoids Edge sandbox fetch issues on Windows dev environments. */
export const runtime = 'nodejs';

const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

export async function POST(req: NextRequest) {
  const { messages, settings } = await req.json();
  const apiKey = process.env.KIMI_API_KEY || '';

  if (!apiKey) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const text = 'Please configure your KIMI_API_KEY in .env.local to use the real AI tutor.';
        for (const word of text.split(' ')) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: word + ' ' } }] })}\n\n`)
          );
          await new Promise(r => setTimeout(r, 80));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  }

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'moonshot-v1-8k',
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
Every few messages, when it feels natural, throw out a random real-world English challenge. Don't announce it as a "challenge" or "exercise" — just drop it into the conversation like it occurred to you. For example:
- You just thought of something random: "oh wait — how would you describe what someone looks like when they're trying not to laugh? like in English?"
- You're pretending you saw something: "dude I just walked past this guy on the street doing the weirdest thing... how would you even describe that in English, like what verb would you use?"
- You make them translate a feeling: "you know that feeling when you wake up and for a second you forget what day it is? what's that called in English?"
- You describe a scene and ask them to fill in: "okay so imagine you're at a restaurant and the food is taking forever — what do you actually say to the waiter?"
- Anything goes — objects, actions, feelings, situations, idioms, sounds, smells. Be creative and random.

## After they answer the challenge
- If their answer is correct or close: react naturally ("yeah exactly", "haha yes that's the word", "oh nice I wouldn't have thought of that")
- If their answer is off or incomplete: don't say "wrong" or "incorrect". Just casually model the right way — "oh yeah, I think we'd usually say it more like '...' — sounds a bit more natural ya know?" Then move on. Don't dwell on it.
- Then continue the conversation like normal. Don't make it feel like a test.

## Pacing
- Have a real conversation first, build some vibe, then drop a challenge when it feels right.
- Don't challenge them every single message — maybe every 3–5 exchanges.
- Mix it up: sometimes pure chat, sometimes a challenge, sometimes just reacting to what they said.

User's English level: ${settings.proficiency}. Match your vocabulary to that — simple and slow for beginners, natural and fast for advanced.
Current topic they want to practice: ${settings.topic}. Weave it in when it fits, don't force it.`,
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error('Moonshot API error:', response.status, detail.slice(0, 500));
      return new Response(
        JSON.stringify({ error: 'AI API returned an error', status: response.status }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (error) {
    const err = error as Error & { cause?: { code?: string; message?: string } };
    console.error('API fetch error:', err.message, err.cause?.code ?? '');
    return new Response(
      JSON.stringify({ error: 'Failed to reach AI API', message: err.message, cause: err.cause?.code }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
