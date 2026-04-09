import { useCallback, useState, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Browser TTS refs ──────────────────────────────────────────────────────
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockedRef = useRef(false);
  const pendingRef = useRef<{ text: string; voiceId?: string | null } | null>(null);

  // ── Fish Audio refs ───────────────────────────────────────────────────────
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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
    (text: string) => {
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return;

      window.speechSynthesis.resume();
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(clean);
      utteranceRef.current = utterance;
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => { setIsSpeaking(true); startResumeHeartbeat(); };
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (resumeTimerRef.current) { clearInterval(resumeTimerRef.current); resumeTimerRef.current = null; }
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') console.warn('TTS error:', e.error);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      setTimeout(() => { window.speechSynthesis.resume(); window.speechSynthesis.speak(utterance); }, 80);
    },
    [startResumeHeartbeat],
  );

  // ── Fish Audio TTS ────────────────────────────────────────────────────────
  const doFishAudioSpeak = useCallback(
    async (text: string, voiceId: string) => {
      const clean = text.replace(/[*#_`]/g, '').trim();
      if (!clean) return;

      // Cancel any in-flight request
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsSpeaking(true);

      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean, voiceId }),
          signal: controller.signal,
        });

        if (!res.ok) {
          if (res.status === 503) {
            setIsSpeaking(false);
            abortControllerRef.current = null;
            doBrowserSpeak(text);
            return;
          }
          throw new Error(`TTS API ${res.status}`);
        }

        const blob = await res.blob();
        if (controller.signal.aborted) return;

        // Revoke previous blob URL if any
        if (audioElementRef.current) {
          audioElementRef.current.pause();
          const prevSrc = audioElementRef.current.src;
          if (prevSrc?.startsWith('blob:')) URL.revokeObjectURL(prevSrc);
        }

        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioElementRef.current = audio;

        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioElementRef.current = null;
          abortControllerRef.current = null;
        };
        audio.onerror = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(url);
          audioElementRef.current = null;
          abortControllerRef.current = null;
          // Fallback to browser TTS on playback error
          doBrowserSpeak(text);
        };

        await audio.play();
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        if (err instanceof TypeError) {
          setIsSpeaking(false);
          abortControllerRef.current = null;
          doBrowserSpeak(text);
          return;
        }
        console.error('[tts] Fish Audio failed, falling back to browser TTS:', err);
        setIsSpeaking(false);
        abortControllerRef.current = null;
        // Graceful fallback to browser TTS
        doBrowserSpeak(text);
      }
    },
    [doBrowserSpeak],
  );

  // ── Public API ────────────────────────────────────────────────────────────

  /** Unlock the browser audio context on first user gesture (needed for iOS/Safari) */
  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      if (pendingRef.current) {
        const { text, voiceId } = pendingRef.current;
        pendingRef.current = null;
        voiceId ? doFishAudioSpeak(text, voiceId) : doBrowserSpeak(text);
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
        voiceId ? doFishAudioSpeak(text, voiceId) : doBrowserSpeak(text);
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
      if (!text.trim()) return;

      if (voiceId) {
        // Fish Audio path — no unlock needed (uses fetch + Audio element)
        doFishAudioSpeak(text, voiceId);
      } else {
        // Browser TTS path — requires unlock first
        if (!window.speechSynthesis) return;
        if (unlockedRef.current) {
          doBrowserSpeak(text);
        } else {
          pendingRef.current = { text, voiceId: null };
        }
      }
    },
    [doBrowserSpeak, doFishAudioSpeak],
  );

  const stop = useCallback(() => {
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
    // Abort in-flight Fish Audio request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    pendingRef.current = null;
    setIsSpeaking(false);
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  return { speak, stop, unlock, isSpeaking };
};
