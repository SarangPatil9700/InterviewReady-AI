import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mergeTranscript,
  getSpeechErrorMessage,
  formatTranscript,
  isSpeechRecognitionSupported,
} from './speech';

test('mergeTranscript: preserves existing typed text when adding recognized speech', () => {
  const existing = 'I worked on an e-commerce platform using React.';
  const speech = 'We improved page load times by forty percent.';
  const merged = mergeTranscript(existing, speech);

  assert.equal(
    merged,
    'I worked on an e-commerce platform using React. We improved page load times by forty percent.'
  );
  assert.ok(merged.startsWith(existing), 'Must preserve original existing text at the beginning');
});

test('mergeTranscript: handles existing text that already has a trailing space', () => {
  const existing = 'In Java, encapsulation is achieved via access modifiers. ';
  const speech = 'We use private variables and public getters.';
  const merged = mergeTranscript(existing, speech);

  assert.equal(
    merged,
    'In Java, encapsulation is achieved via access modifiers. We use private variables and public getters.'
  );
});

test('mergeTranscript: returns new speech if existing text is empty or blank', () => {
  assert.equal(mergeTranscript('', 'My core strength is problem solving.'), 'My core strength is problem solving.');
  assert.equal(mergeTranscript('   ', 'My core strength is problem solving.'), 'My core strength is problem solving.');
});

test('mergeTranscript: returns original text if new speech is empty or whitespace', () => {
  const existing = 'Original answer text';
  assert.equal(mergeTranscript(existing, ''), existing);
  assert.equal(mergeTranscript(existing, '   '), existing);
});

test('mergeTranscript: allows consecutive dictations without overwriting previous speech', () => {
  let answer = 'First point.';
  answer = mergeTranscript(answer, 'Second point.');
  answer = mergeTranscript(answer, 'Third point.');

  assert.equal(answer, 'First point. Second point. Third point.');
});

test('getSpeechErrorMessage: returns clear, actionable guidance for all known errors', () => {
  const notAllowed = getSpeechErrorMessage('not-allowed');
  assert.match(notAllowed, /Microphone access was denied/i);
  assert.match(notAllowed, /permission/i);

  const noSpeech = getSpeechErrorMessage('no-speech');
  assert.match(noSpeech, /No speech was detected/i);

  const audioCapture = getSpeechErrorMessage('audio-capture');
  assert.match(audioCapture, /No microphone was detected/i);

  const network = getSpeechErrorMessage('network');
  assert.match(network, /network error/i);

  const unsupported = getSpeechErrorMessage('not-supported');
  assert.match(unsupported, /not supported in this browser/i);
});

test('formatTranscript: capitalizes sentence beginning', () => {
  assert.equal(formatTranscript('hello world'), 'Hello world');
  assert.equal(formatTranscript('   already capitalized'), 'Already capitalized');
  assert.equal(formatTranscript(''), '');
});

test('isSpeechRecognitionSupported: handles node environment gracefully without throwing', () => {
  // In node.js (without window), should return false without error
  const supported = isSpeechRecognitionSupported();
  assert.equal(typeof supported, 'boolean');
});
