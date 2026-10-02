import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Deterministic lifecycle tests; these do not measure real Android speech accuracy.
const instances = [];
class Recognition {
  constructor() { instances.push(this); }
  start() { this.started = true; }
  abort() { this.aborted = true; this.onend?.(); }
  stop() { this.onend?.(); }
}
globalThis.window = { isSecureContext: true, webkitSpeechRecognition: Recognition };
globalThis.navigator = { permissions: { query() { throw new Error('Must not defer start to query permissions'); } } };
async function load(path) {
  const result = await build({ entryPoints: [path], bundle: true, write: false, platform: 'node', format: 'esm' });
  return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
}
const { speechService: speech } = await load('src/services/speechService.ts');
let ends = 0, results = 0;
const opts = { lang: 'hi', onEnd: () => ends++, onResult: () => results++ };
assert.equal(speech.startListening(opts), true);
const first = instances.at(-1);
assert.equal(first.started, true, 'start must execute synchronously');
assert.equal(first.lang, 'hi-IN');
assert.equal(first.continuous, false);
speech.startListening({ ...opts, lang: 'mr' });
const second = instances.at(-1);
assert.equal(second.lang, 'mr-IN');
first.onend();
first.onresult({ results: [[{ transcript: 'stale' }]] });
assert.equal(speech.getCurrentRecognition(), second);
assert.equal(ends, 0);
assert.equal(results, 0);
second.onresult({ results: [Object.assign([{ transcript: 'नमस्कार' }], { isFinal: true })] });
assert.equal(results, 1);
second.onend(); second.onend();
assert.equal(ends, 1, 'natural end fires only once');
for (const error of ['not-allowed', 'network', 'service-not-allowed', 'audio-capture', 'no-speech']) {
  let message = '';
  speech.startListening({ lang: 'en', onError: text => message = text });
  instances.at(-1).onerror({ error });
  assert.ok(message.length > 10);
  assert.equal(speech.getCurrentRecognition(), null);
}
window.isSecureContext = false;
assert.equal(speech.startListening(opts), false);
window.isSecureContext = true;
delete window.webkitSpeechRecognition;
assert.equal(speech.startListening(opts), false);
window.webkitSpeechRecognition = class extends Recognition { start() { throw new Error('Blocked'); } };
const warn = console.warn;
console.warn = () => {};
assert.equal(speech.startListening(opts), false);
console.warn = warn;
assert.equal(speech.getCurrentRecognition(), null);

const { AudioRecorderService } = await load('src/services/audioRecorderService.ts');
globalThis.MediaRecorder = class {};
let grant;
navigator.mediaDevices = { getUserMedia: () => new Promise(resolve => { grant = resolve; }) };
const recorder = new AudioRecorderService();
const pending = recorder.startRecording();
recorder.stopRecordingSilent();
let stopped = false;
grant({ getTracks: () => [{ stop() { stopped = true; } }] });
assert.equal(await pending, false);
assert.equal(stopped, true, 'late permission grant must release the microphone');
assert.equal(recorder.isRecording(), false);
console.log('PASS: synchronous start, language locales, stale sessions, cancellation, permission/network/service errors, insecure origin, unsupported browser, startup failure, late microphone permission cleanup. No external requests.');
