import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseControl, build, MSG } from '../src/protocol/messages.js';

test('parseControl rejects invalid JSON', () => {
  const r = parseControl('{not json');
  assert.equal(r.ok, false);
});

test('parseControl rejects missing type', () => {
  const r = parseControl(JSON.stringify({ foo: 1 }));
  assert.equal(r.ok, false);
});

test('parseControl accepts a valid hello', () => {
  const r = parseControl(JSON.stringify({ type: 'hello', device_id: 'cb-1' }));
  assert.equal(r.ok, true);
  assert.equal(r.msg.type, 'hello');
});

test('build.authOk shape', () => {
  const m = build.authOk('sess_1', { sampleRate: 16000, channels: 1, format: 'pcm16' });
  assert.equal(m.type, MSG.AUTH_OK);
  assert.equal(m.session_id, 'sess_1');
  assert.equal(m.audio.sampleRate, 16000);
});

test('build.audioOutStart maps audio config', () => {
  const m = build.audioOutStart({ sampleRate: 24000, channels: 1, format: 'pcm16' });
  assert.equal(m.type, MSG.AUDIO_OUT_START);
  assert.equal(m.sample_rate, 24000);
  assert.equal(m.format, 'pcm16');
});
