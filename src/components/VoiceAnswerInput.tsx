import React, { useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Square,
  AlertCircle,
  RotateCcw,
  Sparkles,
  Volume2,
  Trash2,
  Info,
  Loader2,
} from 'lucide-react';
import { useSpeechRecognition } from '../utils/useSpeechRecognition';
import { mergeTranscript } from '../utils/speech';

interface VoiceAnswerInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  minWordsTarget?: number;
  disabled?: boolean;
}

export const VoiceAnswerInput: React.FC<VoiceAnswerInputProps> = ({
  id = 'answer-textarea',
  value,
  onChange,
  placeholder = 'Type your response here or click the microphone to speak your answer aloud...',
  rows = 6,
  label = 'Your Answer:',
  minWordsTarget = 10,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Maintain speech recognition hook
  const {
    state,
    isListening,
    isProcessing,
    isSupported,
    interimTranscript,
    errorMessage,
    startListening,
    stopListening,
    resetError,
  } = useSpeechRecognition({
    lang: 'en-IN',
    continuous: true,
    onTranscript: (finalChunk) => {
      // Cleanly append to existing text without overwriting typed text
      onChange(mergeTranscript(value, finalChunk));
    },
  });

  // Calculate word count
  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;

  const handleToggleVoice = async () => {
    if (disabled) return;
    if (isListening || isProcessing) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const handleClear = () => {
    if (isListening) {
      stopListening();
    }
    onChange('');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="space-y-2">
      {/* Label and Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="font-bold text-slate-700 flex items-center space-x-1.5">
          <span>{label}</span>
          {isListening && (
            <span className="inline-flex items-center space-x-1 text-red-600 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-600 inline-block animate-ping" />
              <span>Listening Live</span>
            </span>
          )}
        </label>

        <div className="flex items-center space-x-2">
          {/* Word count */}
          <span
            className={`font-semibold tabular-nums text-xs ${
              wordCount < minWordsTarget ? 'text-amber-600' : 'text-slate-500'
            }`}
          >
            {wordCount} words {minWordsTarget > 0 && wordCount < minWordsTarget && `(Aim for ${minWordsTarget}+)`}
          </span>

          {/* Microphone Action Button */}
          {isSupported ? (
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={handleToggleVoice}
                disabled={disabled}
                aria-label={isListening ? 'Stop voice recording' : 'Start voice typing'}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  isListening
                    ? 'bg-red-600 text-white shadow-xs hover:bg-red-700'
                    : isProcessing
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isListening ? 'Click to stop listening' : 'Speak your answer using voice dictation'}
              >
                {isListening ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                    <span>Stop Voice</span>
                  </>
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-blue-600" />
                    <span>Voice Type</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <span
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200/80"
              title="Browser does not support Web Speech API"
            >
              <MicOff className="w-3 h-3 text-slate-400" />
              <span>Voice Typing Unsupported</span>
            </span>
          )}

          {/* Clear button */}
          {value && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="inline-flex items-center space-x-1 px-2 py-1 text-slate-400 hover:text-slate-600 text-xs font-medium rounded hover:bg-slate-100 transition-colors"
              title="Clear answer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Active State / Listening Banner */}
      {isListening && (
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-red-50/90 border border-red-200 text-xs text-red-900 transition-all animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping absolute" />
              <Volume2 className="w-3.5 h-3.5 text-red-600 relative z-10" />
            </div>
            <div>
              <span className="font-bold text-red-800">Microphone Active</span>
              <p className="text-[11px] text-red-600">
                Speak clearly. Your words are transcribed and appended to your answer.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={stopListening}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Finish Recording</span>
          </button>
        </div>
      )}

      {/* Interim Live Speech Transcript Bubble */}
      {isListening && interimTranscript && (
        <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start space-x-2 animate-fadeIn">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0 animate-spin" />
          <div className="leading-snug">
            <span className="font-semibold text-blue-700">Hearing: </span>
            <span className="italic text-slate-800">"{interimTranscript}"</span>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && state === 'error' && (
        <div className="flex items-start justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-x-2">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-amber-800">Voice Input Issue</span>
              <p className="text-amber-700 leading-relaxed">{errorMessage}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {isSupported && (
              <button
                type="button"
                onClick={startListening}
                className="inline-flex items-center space-x-1 px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold text-[11px] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
            <button
              type="button"
              onClick={resetError}
              className="text-amber-500 hover:text-amber-700 text-xs font-semibold px-1 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Unsupported Browser Notice */}
      {!isSupported && (
        <div className="flex items-center space-x-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Voice dictation relies on Web Speech API (supported in Google Chrome &amp; Microsoft Edge). You can type your answer directly in the box below.
          </span>
        </div>
      )}

      {/* Textarea for editable answer */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-900 text-sm leading-relaxed resize-y placeholder:text-slate-400 font-sans transition-all disabled:opacity-50 disabled:bg-slate-50"
        />

        {/* Floating Quick Microphone Icon inside bottom-right corner of textarea for easy reach */}
        {isSupported && !disabled && (
          <div className="absolute right-3 bottom-3">
            <button
              type="button"
              onClick={handleToggleVoice}
              aria-label={isListening ? 'Stop voice recording' : 'Start voice typing'}
              className={`p-2 rounded-lg transition-all shadow-2xs flex items-center justify-center ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-700 border border-slate-200'
              }`}
              title={isListening ? 'Stop voice typing' : 'Speak into microphone'}
            >
              {isListening ? (
                <Square className="w-4 h-4 fill-current" />
              ) : (
                <Mic className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint under textarea */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
        <span>
          {isListening
            ? 'Speaking... Audio is being converted to text.'
            : 'You can freely edit or expand your answer anytime before submitting.'}
        </span>
        <span className="text-slate-400">English (India/US)</span>
      </div>
    </div>
  );
};
