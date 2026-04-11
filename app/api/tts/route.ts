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
    console.error('[tts] FISH_AUDIO_API_KEY is not configured');
    return new Response('TTS service unavailable', { status: 503 });
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
      },
      body: JSON.stringify({
        text: text.replace(/[*#_`]/g, '').trim(),
        reference_id: finalId,
        model: 'speech-1.6',
        format: 'mp3',
        mp3_bitrate: 128,
        latency: 'balanced',
      }),
    });
  } catch (e) {
    console.error('[tts] Fish Audio fetch error:', e);
    return Response.json({ error: 'tts_unavailable' }, { status: 503 });
  }

  if (!fishRes.ok) {
    const detail = await fishRes.text().catch(() => '');
    console.error('[tts] Fish Audio error', fishRes.status, detail.slice(0, 200));
    return new Response('TTS service unavailable', { status: 502 });
  }

  // Buffer the complete audio — streaming through Next.js can corrupt binary data
  const audioBuffer = await fishRes.arrayBuffer();
  const fishContentType = fishRes.headers.get('content-type') ?? 'audio/mpeg';
  console.log('[tts] Fish Audio OK, content-type:', fishContentType, 'size:', audioBuffer.byteLength);

  if (audioBuffer.byteLength === 0) {
    return new Response('Empty audio response from Fish Audio', { status: 502 });
  }

  return new Response(audioBuffer, {
    headers: {
      'Content-Type': fishContentType,
      'Content-Length': String(audioBuffer.byteLength),
      'Cache-Control': 'no-cache',
    },
  });
}
