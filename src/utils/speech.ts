/**
 * Speech Recognition Utilities for Web Speech API
 * Provides browser detection, transcript merging with text preservation,
 * and actionable error messaging.
 */

export type SpeechRecognitionState = 'ready' | 'listening' | 'processing' | 'error';

export type SpeechErrorCode =
  | 'not-allowed'
  | 'service-not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'not-supported'
  | 'aborted'
  | 'unknown';

/**
 * Checks whether the Web Speech API is supported in current environment
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

/**
 * Returns the SpeechRecognition constructor if available
 */
export function getSpeechRecognitionConstructor(): any {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

/**
 * Maps Web Speech API error events or browser states into user-friendly guidance
 */
export function getSpeechErrorMessage(error: string | null | undefined): string {
  if (!error) return 'An unexpected voice error occurred.';

  switch (error.toLowerCase()) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access was denied. Please allow microphone permission in your browser address bar or system settings to use voice typing.';
    case 'service-not-allowed':
      return 'Speech recognition service is not permitted by your browser or security policy. Please verify permissions or type your response.';
    case 'no-speech':
      return 'No speech was detected. Please ensure your microphone is working and speak clearly into your device.';
    case 'audio-capture':
    case 'notfounderror':
    case 'devicesnotfounderror':
      return 'No microphone was detected. Please plug in or connect a microphone or headset and try again.';
    case 'network':
      return 'Speech recognition network error. The browser speech service requires an active internet connection.';
    case 'not-supported':
      return 'Web Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your answer directly.';
    case 'aborted':
      return 'Voice typing was stopped.';
    default:
      return `Voice recognition error (${error}). You can type your answer directly or retry voice input.`;
  }
}

/**
 * Pure function: cleanly merges newly transcribed speech into existing text.
 * Preserves all previously typed/transcribed text without overwriting.
 * Handles spacing correctly so words do not get squished or duplicate spaces.
 */
export function mergeTranscript(existingText: string, newTranscript: string): string {
  const trimmedNew = newTranscript.trim();
  if (!trimmedNew) {
    return existingText;
  }

  if (!existingText || !existingText.trim()) {
    return trimmedNew;
  }

  // If existing text already ends with punctuation or whitespace, maintain appropriate spacing
  if (/\s$/.test(existingText)) {
    return existingText + trimmedNew;
  }

  return existingText + ' ' + trimmedNew;
}

/**
 * Formats transcript segments for display, capitalizing first letters of sentences
 */
export function formatTranscript(rawText: string): string {
  if (!rawText) return '';
  const trimmed = rawText.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
