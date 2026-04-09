import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export const runtime = 'nodejs';

const FISH_AUDIO_VOICES: Record<string, string> = {
  trump: '5196af35f6ff4a0dbf541793fc9f2157',       // Donald J. Trump (Noise Reduction) — 32万+ calls
  trump_potus47: 'e58b0d7efca34eb38d5c4985e378abcb', // POTUS 47 — Trump, most liked
};

/** Max characters sent to Fish Audio per request — prevents credit exhaustion attacks. */
const MAX_TTS_CHARS = 2000;
/** Fish Audio model IDs are 32-character hex strings. */
const VOICE_ID_RE = /^[0-9a-f]{32}$/i;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = await req.json() as { text?: unknown; voiceId?: unknown };
  const text = typeof body.text === 'string' ? body.text : '';
  const voiceId = typeof body.voiceId === 'string' ? body.voiceId : '';

  if (!text.trim()) {
    return new Response('text is required', { status: 400 });
  }
  if (text.length > MAX_TTS_CHARS) {
    return new Response(`text must be ${MAX_TTS_CHARS} characters or fewer`, { status: 400 });
  }

  // voiceId must be either a known alias or a valid 32-char hex model ID
  const resolvedId = FISH_AUDIO_VOICES[voiceId];
  if (!resolvedId && !VOICE_ID_RE.test(voiceId)) {
    return new Response('Invalid voiceId', { status: 400 });
  }

  const apiKey = process.env.FISH_AUDIO_API_KEY;
  if (!apiKey) {
    return new Response('FISH_AUDIO_API_KEY not configured', { status: 500 });
  }

  // resolvedId already computed above (alias or validated raw ID)
  const finalId = resolvedId ?? voiceId;

  let fishRes: Response;
  try {
    fishRes = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        model: 's2-pro',
      },
      body: JSON.stringify({
        text: text.replace(/[*#_`]/g, '').trim(),
        reference_id: finalId,
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'balanced',
        temperature: 0.7,
        top_p: 0.7,
        prosody: { speed: 1.0, volume: 0, normalize_loudness: true },
      }),
    });
  } catch (e) {
    console.error('[tts] Fish Audio fetch error:', e);
    return Response.json({ error: 'tts_unavailable' }, { status: 503 });
  }

  if (!fishRes.ok) {
    const detail = await fishRes.text().catch(() => '');
    console.error('[tts] Fish Audio error', fishRes.status, detail.slice(0, 200));
    const msg =
      fishRes.status === 401 ? 'Invalid Fish Audio API key'
        : fishRes.status === 402 ? 'Fish Audio credits exhausted'
          : `Fish Audio error: ${fishRes.status}`;
    return new Response(msg, { status: fishRes.status });
  }

  // Stream the MP3 audio directly back to the client
  return new Response(fishRes.body, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    },
  });
}
