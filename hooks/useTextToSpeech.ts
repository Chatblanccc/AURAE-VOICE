import { useCallback, useState, useRef } from 'react';

type QueuedSegment = {
  utteranceId: string;
  segmentId: string;
  text: string;
  voiceId?: string | null;
};

type PrefetchedAudio = {
  url: string;
  text: string;
};

const REPLAY_CACHE_LIMIT = 20;

function buildReplayCacheKey(text: string, voiceId?: string | null): string {
  return `${voiceId ?? '__browser__'}::${text}`;
}

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Browser TTS refs ──────────────────────────────────────────────────────
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockedRef = useRef(false);
  const pendingRef = useRef<{ text: string; voiceId?: string | null } | null>(null);

  // ── Fish Audio refs ───────────────────────────────────────────────────────
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fetchControllersRef = useRef<Set<AbortController>>(new Set());
  const queueRef = useRef<QueuedSegment[]>([]);
  const processingRef = useRef(false);
  const activeUtteranceRef = useRef<string | null>(null);
  const generationRef = useRef(0);
  const prefetchedAudioRef = useRef<Map<string, PrefetchedAudio>>(new Map());
  const inflightPrefetchRef = useRef<Map<string, Promise<PrefetchedAudio | null>>>(new Map());
  const replayCacheRef = useRef<Map<string, PrefetchedAudio>>(new Map());
  const replayInflightRef = useRef<Map<string, Promise<PrefetchedAudio | null>>>(new Map());

  // ── Browser TTS helpers ───────────────────────────────────────────────────
  const startResumeHeartbeat = useCallback(() => {
    if (resumeTimerRef.current) return;
    resumeTimerRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else if (resumeTimerRef.current) {
        clearInterval(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    }, 10000);
  }, []);

  const doBrowserSpeak = useCallback(
    (text: string): Promise<void> => {
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return Promise.resolve();

      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      return new Promise((resolve) => {
        utterance.onstart = () => { setIsSpeaking(true); startResumeHeartbeat(); };
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
          resolve();
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') console.warn('TTS error:', e.error);
        setIsSpeaking(false);
        utteranceRef.current = null;
          resolve();
      };

        setTimeout(() => { window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); }, 80);
      });
    },
    [startResumeHeartbeat],
  );

  const clearPrefetchedAudio = useCallback(() => {
    for (const item of prefetchedAudioRef.current.values()) {
      URL.revokeObjectURL(item.url);
    }
    prefetchedAudioRef.current.clear();
    inflightPrefetchRef.current.clear();
  }, []);

  const setReplayCacheItem = useCallback((cacheKey: string, audioData: PrefetchedAudio) => {
    const existing = replayCacheRef.current.get(cacheKey);
    if (existing) {
      URL.revokeObjectURL(existing.url);
      replayCacheRef.current.delete(cacheKey);
    }
    replayCacheRef.current.set(cacheKey, audioData);
    while (replayCacheRef.current.size > REPLAY_CACHE_LIMIT) {
      const oldestKey = replayCacheRef.current.keys().next().value as string | undefined;
      if (!oldestKey) break;
      const oldest = replayCacheRef.current.get(oldestKey);
      if (oldest) URL.revokeObjectURL(oldest.url);
      replayCacheRef.current.delete(oldestKey);
    }
  }, []);

  const fetchFishAudioSegment = useCallback(
    async (text: string, voiceId: string): Promise<PrefetchedAudio | null> => {
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return null;

      const controller = new AbortController();
      fetchControllersRef.current.add(controller);

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, voiceId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 503) {
            return null;
          }
          throw new Error(`TTS API ${res.status}`);
        }

        const arrayBuffer = await res.arrayBuffer();
        if (controller.signal.aborted) return null;

        const contentType = res.headers.get('content-type') ?? 'audio/mpeg';
        console.log('[tts-client] prefetched audio, size:', arrayBuffer.byteLength, 'content-type:', contentType);
        if (arrayBuffer.byteLength === 0) return null;

        const audioBlob = new Blob([arrayBuffer], { type: contentType });
        const url = URL.createObjectURL(audioBlob);
        return { url, text: clean };
      } catch (err) {
        if ((err as Error).name === 'AbortError') return null;
        if (err instanceof TypeError) {
          return null;
        }
        console.error('[tts] Fish Audio prefetch failed:', err);
        return null;
      } finally {
        fetchControllersRef.current.delete(controller);
      }
    },
    [],
  );

  const playPrefetchedAudio = useCallback(async (audioData: PrefetchedAudio): Promise<boolean> => {
    setIsSpeaking(true);
    const audio = new Audio(audioData.url);
    audio.preload = 'auto';
    audioElementRef.current = audio;

    return new Promise<boolean>((resolve) => {
      audio.onended = () => {
        setIsSpeaking(false);
        audioElementRef.current = null;
        URL.revokeObjectURL(audioData.url);
        resolve(true);
      };
      audio.onerror = (e) => {
        console.warn('[tts-client] Audio element error:', (e as ErrorEvent)?.message ?? audio.error?.message ?? 'unknown');
        setIsSpeaking(false);
        audioElementRef.current = null;
        URL.revokeObjectURL(audioData.url);
        resolve(false);
      };
      audio.play().catch((playErr) => {
        console.warn('[tts-client] play() rejected:', (playErr as Error).message);
        setIsSpeaking(false);
        audioElementRef.current = null;
        URL.revokeObjectURL(audioData.url);
        resolve(false);
      });
    });
  }, []);

  const getOrPrefetchSegment = useCallback((segment: QueuedSegment) => {
    const cached = prefetchedAudioRef.current.get(segment.segmentId);
    if (cached) return Promise.resolve(cached);
    const inflight = inflightPrefetchRef.current.get(segment.segmentId);
    if (inflight) return inflight;
    if (!segment.voiceId) return Promise.resolve(null);

    const task = fetchFishAudioSegment(segment.text, segment.voiceId)
      .then((audioData) => {
        if (audioData) prefetchedAudioRef.current.set(segment.segmentId, audioData);
        return audioData;
      })
      .finally(() => {
        inflightPrefetchRef.current.delete(segment.segmentId);
      });
    inflightPrefetchRef.current.set(segment.segmentId, task);
    return task;
  }, [fetchFishAudioSegment]);

  const prefetchReplayAudio = useCallback((text: string, voiceId?: string | null) => {
    const clean = text.replace(/[*#_`]/g, '').trim();
    if (!clean || !voiceId) return;
    const cacheKey = buildReplayCacheKey(clean, voiceId);
    if (replayCacheRef.current.has(cacheKey)) return;
    if (replayInflightRef.current.has(cacheKey)) return;

    const task = fetchFishAudioSegment(clean, voiceId)
      .then((audioData) => {
        if (audioData) setReplayCacheItem(cacheKey, audioData);
        return audioData;
      })
      .finally(() => {
        replayInflightRef.current.delete(cacheKey);
      });
    replayInflightRef.current.set(cacheKey, task);
  }, [fetchFishAudioSegment, setReplayCacheItem]);

  // ── Fish Audio TTS ────────────────────────────────────────────────────────
  const doFishAudioSpeak = useCallback(
    async (text: string, voiceId: string): Promise<void> => {
      const audioData = await fetchFishAudioSegment(text, voiceId);
      if (!audioData) {
        await doBrowserSpeak(text);
        return;
      }
      const ok = await playPrefetchedAudio(audioData);
      if (!ok) {
        await doBrowserSpeak(text);
      }
    },
    [doBrowserSpeak, fetchFishAudioSegment, playPrefetchedAudio],
  );

  // ── Public API ────────────────────────────────────────────────────────────

  /** Unlock the browser audio context on first user gesture (needed for iOS/Safari) */
  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      if (pendingRef.current) {
        const { text, voiceId } = pendingRef.current;
        pendingRef.current = null;
        if (voiceId) {
          void doFishAudioSpeak(text, voiceId);
        } else {
          void doBrowserSpeak(text);
        }
      }
      return;
    }

    window.speechSynthesis.cancel();
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0.01;
    primer.rate = 10;
    primer.onend = () => {
      unlockedRef.current = true;
      if (pendingRef.current) {
        const { text, voiceId } = pendingRef.current;
        pendingRef.current = null;
        if (voiceId) {
          void doFishAudioSpeak(text, voiceId);
        } else {
          void doBrowserSpeak(text);
        }
      }
    };
    primer.onerror = () => { unlockedRef.current = true; };
    window.speechSynthesis.speak(primer);
  }, [doBrowserSpeak, doFishAudioSpeak]);

  /**
   * Speak text aloud.
   * @param text    The text to speak
   * @param voiceId Optional Fish Audio voice reference_id or alias (e.g. "trump").
   *                If omitted, the browser's built-in Web Speech API is used.
   */
  const speak = useCallback(
    (text: string, voiceId?: string | null) => {
      if (typeof window === 'undefined') return;
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return;

      if (voiceId) {
        const cacheKey = buildReplayCacheKey(clean, voiceId);
        const cachedReplayAudio = replayCacheRef.current.get(cacheKey);
        if (cachedReplayAudio) {
          replayCacheRef.current.delete(cacheKey);
          void playPrefetchedAudio(cachedReplayAudio);
          return;
        }
        // Fish Audio path — no unlock needed (uses fetch + Audio element)
        doFishAudioSpeak(clean, voiceId);
      } else {
        // Browser TTS path — requires unlock first
        if (!window.speechSynthesis) return;
        if (unlockedRef.current) {
          doBrowserSpeak(clean);
        } else {
          pendingRef.current = { text: clean, voiceId: null };
        }
      }
    },
    [doBrowserSpeak, doFishAudioSpeak, playPrefetchedAudio],
  );

  const stop = useCallback((options?: { preserveReplayCache?: boolean }) => {
    const preserveReplayCache = options?.preserveReplayCache === true;
    generationRef.current += 1;
    queueRef.current = [];
    activeUtteranceRef.current = null;
    processingRef.current = false;
    // Stop browser TTS
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }
    // Stop Fish Audio playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      const src = audioElementRef.current.src;
      if (src?.startsWith('blob:')) URL.revokeObjectURL(src);
      audioElementRef.current = null;
    }
    // Abort in-flight Fish Audio requests
    for (const controller of fetchControllersRef.current) {
      controller.abort();
    }
    fetchControllersRef.current.clear();
    clearPrefetchedAudio();
    if (!preserveReplayCache) {
      for (const item of replayCacheRef.current.values()) {
        URL.revokeObjectURL(item.url);
      }
      replayCacheRef.current.clear();
      replayInflightRef.current.clear();
    }
    pendingRef.current = null;
    setIsSpeaking(false);
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, [clearPrefetchedAudio]);

  const processQueue = useCallback(async (localGeneration: number) => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (queueRef.current.length > 0) {
        if (localGeneration !== generationRef.current) break;
        const next = queueRef.current.shift();
        if (!next) break;
        if (next.voiceId) {
          const currentAudio = await getOrPrefetchSegment(next);
          const upcoming = queueRef.current[0];
          if (upcoming?.voiceId) {
            void getOrPrefetchSegment(upcoming);
          }
          if (currentAudio) {
            prefetchedAudioRef.current.delete(next.segmentId);
            const ok = await playPrefetchedAudio(currentAudio);
            if (!ok) await doBrowserSpeak(next.text);
          } else {
            await doBrowserSpeak(next.text);
          }
        } else {
          await doBrowserSpeak(next.text);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [doBrowserSpeak, getOrPrefetchSegment, playPrefetchedAudio]);

  const beginUtterance = useCallback((utteranceId: string) => {
    if (!utteranceId) return;
    if (activeUtteranceRef.current !== utteranceId) {
      generationRef.current += 1;
      queueRef.current = [];
      activeUtteranceRef.current = utteranceId;
      processingRef.current = false;
      clearPrefetchedAudio();
    }
  }, [clearPrefetchedAudio]);

  const enqueueSegment = useCallback((segment: {
    utteranceId: string;
    text: string;
    voiceId?: string | null;
    segmentId: string;
  }) => {
    const clean = segment.text.replace(/[*#_`]/g, '').trim();
    if (!clean || !segment.utteranceId) return;
    if (activeUtteranceRef.current !== segment.utteranceId) {
      beginUtterance(segment.utteranceId);
    }
    queueRef.current.push({
      utteranceId: segment.utteranceId,
      text: clean,
      voiceId: segment.voiceId,
      segmentId: segment.segmentId,
    });
    void processQueue(generationRef.current);
  }, [beginUtterance, processQueue]);

  const endUtterance = useCallback((utteranceId: string) => {
    if (activeUtteranceRef.current === utteranceId) {
      activeUtteranceRef.current = null;
    }
  }, []);

  return { speak, stop, unlock, isSpeaking, beginUtterance, enqueueSegment, endUtterance, prefetchReplayAudio };
};
