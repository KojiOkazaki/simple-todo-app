// Soundboard provider: plays fixed local WAV clips only — no STT, no LLM, no
// synthesis. Each user action (button tap/hold) plays the next clip. Use for
// character voice kits (e.g. fracterkit) where only recorded clips exist.
//
// VOICE_PROVIDER=soundboard, clips from SOUNDBOARD_DIR. The AI is not involved
// and no transcript/text is emitted (the device just plays the clip).
// Keep clip files local — never commit third-party voice assets.

import fs from 'node:fs';
import path from 'node:path';
import { config } from '../config.js';
import { VoiceSession } from './voiceSession.js';
import { decodeWav, resamplePcm16, toMono, applyGain } from './audioUtils.js';

export class SoundboardProvider extends VoiceSession {
  constructor() {
    super();
    this.dir = config.local.soundboardDir;
    this.closed = false;
    this.idx = 0;
    this.clips = this.#load();
    if (!this.clips.length) {
      console.warn(`[soundboard] no .wav clips in ${this.dir}`);
    } else {
      console.log(`[soundboard] ${this.clips.length} clips from ${this.dir}`);
    }
    queueMicrotask(() => {
      if (!this.closed) this.emit('ready');
    });
  }

  #load() {
    try {
      return fs
        .readdirSync(this.dir)
        .filter((f) => /\.wav$/i.test(f))
        .map((f) => path.join(this.dir, f))
        .sort();
    } catch {
      return [];
    }
  }

  setSystemPrompt() {}
  appendAudio() {}
  commitAudio() {
    this.#play();
  }
  submitText() {
    this.#play();
  }

  #play() {
    if (this.closed || !this.clips.length) return;
    const file = this.clips[this.idx++ % this.clips.length];
    queueMicrotask(() => {
      if (this.closed) return;
      try {
        const wav = fs.readFileSync(file);
        const { sampleRate, channels, pcm } = decodeWav(wav);
        const out = resamplePcm16(toMono(pcm, channels), sampleRate, config.audio.sampleRate);
        applyGain(out, config.local.gain);
        const frame = config.audio.sampleRate * 0.05 * 2;
        for (let i = 0; i < out.length && !this.closed; i += frame) {
          this.emit('audio', out.subarray(i, Math.min(i + frame, out.length)));
        }
        this.emit('audio_done');
      } catch (err) {
        this.emit('error', err);
      }
    });
  }

  close() {
    this.closed = true;
  }
}
