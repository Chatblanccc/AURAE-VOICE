import { useState, useCallback, useRef } from 'react';

// Web Speech API types not included in TypeScript's default lib
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback((lang: string = 'en-US') => {
    // If already listening, stop it (toggle off)
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    const w = window as typeof window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognition: SpeechRecognitionConstructor | undefined =
      w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Your browser does not support speech recognition. Please use Chrome.');
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += text;
        } else {
          interim += text;
        }
      }
      // Show interim results while recording, commit final on end
      setTranscript(final || interim);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      recognitionRef.current = null;
      setIsListening(false);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  return { isListening, transcript, error, startListening, stopListening, setTranscript };
};
