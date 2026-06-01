import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  encodeWav,
  decodeWav,
  resamplePcm16,
  toMono,
} from '../src/realtime/audioUtils.js';

test('encodeWav/decodeWav round-trip preserves PCM + format', () => {
  const pcm = Buffer.alloc(8);
  pcm.writeInt16LE(100, 0);
  pcm.writeInt16LE(-200, 2);
  pcm.writeInt16LE(3000, 4);
  pcm.writeInt16LE(-4000, 6);

  const wav = encodeWav(pcm, 16000, 1);
  assert.equal(wav.toString('ascii', 0, 4), 'RIFF');
  assert.equal(wav.toString('ascii', 8, 12), 'WAVE');

  const { sampleRate, channels, bitsPerSample, pcm: out } = decodeWav(wav);
  assert.equal(sampleRate, 16000);
  assert.equal(channels, 1);
  assert.equal(bitsPerSample, 16);
  assert.deepEqual(out, pcm);
});

test('resamplePcm16 24k->16k scales length by ratio', () => {
  const inSamples = 240; // 10ms @24k
  const pcm = Buffer.alloc(inSamples * 2);
  for (let i = 0; i < inSamples; i++) pcm.writeInt16LE((i % 50) * 100, i * 2);
  const out = resamplePcm16(pcm, 24000, 16000);
  assert.equal(out.length / 2, Math.floor(inSamples * (16000 / 24000)));
});

test('resamplePcm16 is identity when rates match', () => {
  const pcm = Buffer.from([1, 0, 2, 0]);
  assert.equal(resamplePcm16(pcm, 16000, 16000), pcm);
});

test('toMono averages stereo frames', () => {
  const stereo = Buffer.alloc(8); // 2 frames, 2ch
  stereo.writeInt16LE(100, 0);
  stereo.writeInt16LE(300, 2); // frame0: avg 200
  stereo.writeInt16LE(-50, 4);
  stereo.writeInt16LE(50, 6); // frame1: avg 0
  const mono = toMono(stereo, 2);
  assert.equal(mono.length, 4);
  assert.equal(mono.readInt16LE(0), 200);
  assert.equal(mono.readInt16LE(2), 0);
});
