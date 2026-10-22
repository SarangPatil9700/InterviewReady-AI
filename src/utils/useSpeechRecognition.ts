import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SpeechRecognitionState,
  isSpeechRecognitionSupported,
  getSpeechRecognitionConstructor,
  getSpeechErrorMessage,
} from './speech';

interface UseSpeechRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  lang?: string;
  continuous?: boolean;
}

export interface UseSpeechRecognitionReturn {
  state: SpeechRecognitionState;
  isListening: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  interimTranscript: string;
  errorMessage: string | null;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetError: () => void;
}

export function useSpeechRecognition({
  onTranscript,
  lang = 'en-IN',
  continuous = true,
}: UseSpeechRecognitionOptions = {}): UseSpeechRecognitionReturn {
  const [state, setState] = useState<SpeechRecognitionState>('ready');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);
  const isExplicitlyStoppingRef = useRef<boolean>(false);

  // Keep latest onTranscript ref to avoid stale closures
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Check support on mount
  useEffect(() => {
    const supported = isSpeechRecognitionSupported();
    setIsSupported(supported);
    if (!supported) {
      setErrorMessage(getSpeechErrorMessage('not-supported'));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  const resetError = useCallback(() => {
    setErrorMessage(null);
    if (state === 'error') {
      setState('ready');
    }
  }, [state]);

  const stopListening = useCallback(() => {
    isExplicitlyStoppingRef.current = true;
    if (recognitionRef.current) {
      try {
        setState('processing');
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error while stopping speech recognition:', err);
        setState('ready');
      }
    } else {
      setState('ready');
    }
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(async () => {
    const SpeechRecognition = getSpeechRecognitionConstructor();

    if (!SpeechRecognition) {
      setIsSupported(false);
      setErrorMessage(getSpeechErrorMessage('not-supported'));
      setState('error');
      return;
    }

    // Prevent duplicate active sessions
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }

    resetError();
    setInterimTranscript('');
    isExplicitlyStoppingRef.current = false;

    // Explicitly request microphone permission & verify hardware availability
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Immediately stop the temporary probe stream so Web Speech API has exclusive access
        stream.getTracks().forEach((track) => track.stop());
      } catch (micErr: any) {
        console.warn('Microphone access verification notice:', micErr?.name, micErr?.message);
        if (micErr?.name === 'NotAllowedError' || micErr?.name === 'PermissionDeniedError') {
          setErrorMessage(getSpeechErrorMessage('not-allowed'));
          setState('error');
          return;
        }
        if (micErr?.name === 'NotFoundError' || micErr?.name === 'DevicesNotFoundError') {
          setErrorMessage(getSpeechErrorMessage('audio-capture'));
          setState('error');
          return;
        }
        // For other device or constraint errors, allow SpeechRecognition to attempt its own capture
      }
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = lang;
      recognition.maxAlternatives = 1;

      // Set state to listening immediately on start invocation
      setState('listening');

      recognition.onstart = () => {
        setState('listening');
        setErrorMessage(null);
      };

      recognition.onaudiostart = () => {
        setState('listening');
      };

      recognition.onspeechend = () => {
        // Speech ended, transcribing final segment
        setState('processing');
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (finalChunk.trim()) {
          onTranscriptRef.current?.(finalChunk);
        }

        setInterimTranscript(currentInterim);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error, event.message);

        // 'aborted' is expected when user manually cancels/stops
        if (event.error === 'aborted' && isExplicitlyStoppingRef.current) {
          setState('ready');
          setInterimTranscript('');
          return;
        }

        const msg = getSpeechErrorMessage(event.error);
        setErrorMessage(msg);
        setState('error');
        setInterimTranscript('');
      };

      recognition.onend = () => {
        recognitionRef.current = null;
        setInterimTranscript('');
        // If not in an error state, revert back to ready
        setState((current) => (current === 'error' ? 'error' : 'ready'));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      const msg = err?.name === 'NotAllowedError'
        ? getSpeechErrorMessage('not-allowed')
        : (err?.message || getSpeechErrorMessage('unknown'));
      setErrorMessage(msg);
      setState('error');
    }
  }, [continuous, lang, resetError]);

  return {
    state,
    isListening: state === 'listening',
    isProcessing: state === 'processing',
    isSupported,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetError,
  };
}
