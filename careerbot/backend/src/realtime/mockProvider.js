// Offline mock voice provider. No network or API key required.
//
// Lets the whole device<->server pipeline be developed and tested without
// OpenAI: on each committed user turn it emits a canned CareerBot-style
// transcript + assistant text + synthetic PCM16 audio (a short tone).
// This satisfies the E2E "conversation works" acceptance test offline.

import { config } from '../config.js';
import { VoiceSession } from './voiceSession.js';

// Rotating canned replies that follow the persona's 共感→整理→提案→次の質問 shape.
const CANNED_REPLIES = [
  'なるほど、不安に感じているのですね。まずは落ち着いて整理しましょう。今いちばん気になっていることは何ですか。',
  'よく話してくれました。あなたの強みは十分に伝わります。次は具体的なエピソードを一つ用意してみましょう。最近がんばった経験はありますか。',
  'いいですね、方向性は見えてきました。今日できる小さな一歩として、志望企業を一社調べてみませんか。',
];

export class MockProvider extends VoiceSession {
  constructor() {
    super();
    this.systemPrompt = '';
    this.turn = 0;
    this.audioBytes = 0;
    this.closed = false;
    // Signal readiness asynchronously to mimic a real connection handshake.
    queueMicrotask(() => {
      if (!this.closed) this.emit('ready');
    });
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
  }

  appendAudio(chunk) {
    this.audioBytes += chunk?.length || 0;
  }

  commitAudio() {
    if (this.closed) return;
    const reply = CANNED_REPLIES[this.turn % CANNED_REPLIES.length];
    this.turn += 1;
    this.audioBytes = 0;

    // Emit a (placeholder) user transcript, then assistant text + audio.
    queueMicrotask(() => {
      if (this.closed) return;
      this.emit('transcript', 'user', '(音声入力)');
      this.emit('transcript', 'assistant', reply);
      this.emit('assistant_text', reply);

      // Synthetic audio: ~0.5s of a 440Hz tone as PCM16 mono.
      const tone = this.#tone(0.5, 440);
      for (let i = 0; i < tone.length; i += 1600) {
        this.emit('audio', tone.subarray(i, i + 1600));
      }
      this.emit('audio_done');
    });
  }

  #tone(seconds, freq) {
    const sr = config.audio.sampleRate;
    const n = Math.floor(seconds * sr);
    const buf = Buffer.alloc(n * 2);
    for (let i = 0; i < n; i++) {
      const sample = Math.round(Math.sin((2 * Math.PI * freq * i) / sr) * 8000);
      buf.writeInt16LE(sample, i * 2);
    }
    return buf;
  }

  close() {
    this.closed = true;
  }
}
