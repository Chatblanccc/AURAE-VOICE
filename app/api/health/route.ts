import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
// No auth required — only checks server-side env key presence + lightweight API ping.
// No sensitive data is returned to the client.

export async function GET() {
  const kimiKey = process.env.KIMI_API_KEY;
  const fishKey = process.env.FISH_AUDIO_API_KEY;

  // Verify Kimi/Moonshot AI API is reachable with the configured key
  let aiOk = false;
  if (kimiKey) {
    try {
      const res = await fetch('https://api.moonshot.cn/v1/models', {
        method: 'GET',
        headers: { Authorization: `Bearer ${kimiKey}` },
        signal: AbortSignal.timeout(6000),
      });
      aiOk = res.ok;
    } catch {
      aiOk = false;
    }
  }

  // Fish Audio TTS: just verify key is configured (no free lightweight ping endpoint)
  const ttsOk = Boolean(fishKey && fishKey !== 'your_fish_audio_api_key_here');

  const allOk = aiOk && ttsOk;

  return NextResponse.json(
    { ok: allOk, services: { ai: aiOk, tts: ttsOk } },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
