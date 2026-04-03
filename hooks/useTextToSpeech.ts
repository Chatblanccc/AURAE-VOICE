import { useCallback, useState, useRef } from 'react';

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unlockedRef = useRef(false);
  const pendingTextRef = useRef<string | null>(null);

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

  const doSpeak = useCallback(
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

      utterance.onstart = () => {
        setIsSpeaking(true);
        startResumeHeartbeat();
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        if (resumeTimerRef.current) {
          clearInterval(resumeTimerRef.current);
          resumeTimerRef.current = null;
        }
      };
      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn('TTS error:', e.error);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      setTimeout(() => {
        window.speechSynthesis.resume();
        window.speechSynthesis.speak(utterance);
      }, 80);
    },
    [startResumeHeartbeat]
  );

  const unlock = useCallback(() => {
    if (unlockedRef.current) {
      if (pendingTextRef.current) {
        const text = pendingTextRef.current;
        pendingTextRef.current = null;
        doSpeak(text);
      }
      return;
    }

    window.speechSynthesis.cancel();
    const primer = new SpeechSynthesisUtterance(' ');
    primer.volume = 0.01;
    primer.rate = 10;
    primer.onend = () => {
      unlockedRef.current = true;
      if (pendingTextRef.current) {
        const text = pendingTextRef.current;
        pendingTextRef.current = null;
        doSpeak(text);
      }
    };
    primer.onerror = () => {
      unlockedRef.current = true;
    };
    window.speechSynthesis.speak(primer);
  }, [doSpeak]);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;
      if (!text.trim()) return;

      if (unlockedRef.current) {
        doSpeak(text);
      } else {
        pendingTextRef.current = text;
      }
    },
    [doSpeak]
  );

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    }
    pendingTextRef.current = null;
    setIsSpeaking(false);
    if (resumeTimerRef.current) {
      clearInterval(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  return { speak, stop, unlock, isSpeaking };
};
