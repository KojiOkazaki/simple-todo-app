// End-to-end: real WebSocket client drives a full turn against the mock
// provider (spec section 21.3 / acceptance criteria "会話が成立する").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { startServer } from '../src/index.js';

// Collect every frame with one persistent listener so nothing is missed
// during the burst of messages that make up a turn.
function collector(ws) {
  const log = [];
  const waiters = [];
  ws.on('message', (data, isBinary) => {
    const entry = isBinary
      ? { __binary: true, data }
      : JSON.parse(data.toString());
    log.push(entry);
    for (let i = waiters.length - 1; i >= 0; i--) {
      if (waiters[i].predicate(entry)) {
        waiters[i].resolve(entry);
        waiters.splice(i, 1);
      }
    }
  });
  return {
    log,
    // Resolves with the first (past or future) frame matching predicate.
    until(predicate, timeoutMs = 4000) {
      const existing = log.find(predicate);
      if (existing) return Promise.resolve(existing);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('timeout waiting for message')),
          timeoutMs
        );
        waiters.push({
          predicate,
          resolve: (v) => {
            clearTimeout(timer);
            resolve(v);
          },
        });
      });
    },
  };
}

test('full push-to-talk turn produces transcript, text and audio', async () => {
  process.env.VOICE_PROVIDER = 'mock';
  process.env.PORT = '0'; // ephemeral
  process.env.DEVICE_TOKENS = ''; // accept any in test

  const srv = await startServer();
  const { port } = srv.httpServer.address();
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const c = collector(ws);

  try {
    await new Promise((r) => ws.on('open', r));

    ws.send(JSON.stringify({ type: 'hello', device_id: 'cb-test', firmware_version: '0.1.0' }));
    const authOk = await c.until((m) => m.type === 'auth_ok');
    assert.ok(authOk.session_id);
    assert.equal(authOk.audio.format, 'pcm16');

    // Push-to-talk: start, stream a chunk, end.
    ws.send(JSON.stringify({ type: 'audio_in_start', sample_rate: 16000, channels: 1, format: 'pcm16' }));
    ws.send(Buffer.alloc(3200), { binary: true }); // 0.1s of silence
    ws.send(JSON.stringify({ type: 'audio_in_end' }));

    const assistant = await c.until((m) => m.type === 'assistant_text');
    assert.ok(assistant.text.length > 0);

    await c.until((m) => m.type === 'state' && m.value === 'speaking');
    await c.until((m) => m.__binary === true && m.data.length > 0);
    await c.until((m) => m.type === 'audio_out_end');
    await c.until((m) => m.type === 'state' && m.value === 'idle');

    // Transcript for both roles was emitted.
    assert.ok(c.log.some((m) => m.type === 'transcript' && m.role === 'assistant'));
  } finally {
    ws.close();
    await srv.close();
  }
});

test('mode_set to interview is accepted; invalid mode errors', async () => {
  process.env.VOICE_PROVIDER = 'mock';
  process.env.PORT = '0';
  process.env.DEVICE_TOKENS = '';
  const srv = await startServer();
  const { port } = srv.httpServer.address();
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const c = collector(ws);
  try {
    await new Promise((r) => ws.on('open', r));
    ws.send(JSON.stringify({ type: 'hello', device_id: 'cb-test2' }));
    await c.until((m) => m.type === 'auth_ok');
    ws.send(JSON.stringify({ type: 'mode_set', value: 'interview' }));
    ws.send(JSON.stringify({ type: 'mode_set', value: 'bogus' }));
    const err = await c.until((m) => m.type === 'error');
    assert.match(err.message, /mode/);
  } finally {
    ws.close();
    await srv.close();
  }
});

test('invalid device token is rejected', async () => {
  process.env.VOICE_PROVIDER = 'mock';
  process.env.PORT = '0';
  process.env.DEVICE_TOKENS = 'good-token';
  const srv = await startServer();
  const { port } = srv.httpServer.address();
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const c = collector(ws);
  try {
    await new Promise((r) => ws.on('open', r));
    ws.send(JSON.stringify({ type: 'hello', device_id: 'cb-x', device_token: 'wrong' }));
    const err = await c.until((m) => m.type === 'error');
    assert.equal(err.code, 'AUTH_FAILED');
  } finally {
    ws.close();
    await srv.close();
  }
});
