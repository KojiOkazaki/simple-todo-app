// Local voice pipeline provider (spec: "自前サーバー経由の音声対話基盤").
//
// Runs entirely against services on the user's machine:
//   user PCM16  --(WAV)-->  Whisper STT        -> transcript
//   transcript  ----------> Gemma LLM (Ollama)  -> assistant text
//   text        ----------> VOICEVOX (ずんだもん) -> WAV -> PCM16 (device rate)
//
// Half-duplex: audio is buffered during the listening turn, then on
// commitAudio() the STT->LLM->TTS pipeline runs and streams results back
// through the same VoiceSession event contract the gateway already uses.

import { config } from '../config.js';
import { VoiceSession } from './voiceSession.js';
import { encodeWav, decodeWav, resamplePcm16, toMono } from './audioUtils.js';

// fetch with a timeout so a hung local service surfaces an error instead of
// leaving the device stuck on "考えています…".
async function fetchT(url, opts, ms) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

export class LocalPipelineProvider extends VoiceSession {
  constructor() {
    super();
    this.cfg = config.local;
    this.systemPrompt = '';
    this.history = []; // [{ role, content }]
    this.chunks = [];
    this.closed = false;
    queueMicrotask(() => {
      if (!this.closed) this.emit('ready');
    });
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    // Reset history; system prompt is prepended at request time.
    this.history = [];
  }

  appendAudio(chunk) {
    if (!this.closed) this.chunks.push(Buffer.from(chunk));
  }

  commitAudio() {
    if (this.closed) return;
    const pcm = Buffer.concat(this.chunks);
    this.chunks = [];
    this.#run({ pcm }).catch((err) => {
      if (!this.closed) this.emit('error', err);
    });
  }

  submitText(text) {
    if (this.closed) return;
    this.#run({ text }).catch((err) => {
      if (!this.closed) this.emit('error', err);
    });
  }

  async #run({ pcm, text }) {
    // 1) STT (Whisper) for voice turns; typed turns skip straight to the LLM.
    let userText = text || '';
    if (!userText && pcm && pcm.length > 0) {
      console.log(`[local] STT: transcribing ${pcm.length} bytes...`);
      userText = await this.#transcribe(pcm);
      console.log(`[local] STT done: "${userText}"`);
    }
    if (this.closed) return;
    if (userText) this.emit('transcript', 'user', userText);

    // 2) LLM (Gemma via OpenAI-compatible chat).
    console.log(`[local] LLM: asking ${this.cfg.llmModel}...`);
    const assistantText = await this.#chat(userText);
    console.log(`[local] LLM done: "${assistantText.slice(0, 60)}..."`);
    if (this.closed) return;
    this.emit('transcript', 'assistant', assistantText);
    this.emit('assistant_text', assistantText);

    // 3) TTS (VOICEVOX) -> stream PCM16 at the device sample rate.
    console.log('[local] TTS: synthesizing...');
    await this.#speak(assistantText);
    console.log('[local] TTS done');
    if (!this.closed) this.emit('audio_done');
  }

  async #transcribe(pcm) {
    const wav = encodeWav(pcm, config.audio.sampleRate, 1);
    const form = new FormData();
    form.append('file', new Blob([wav], { type: 'audio/wav' }), 'speech.wav');
    form.append('model', this.cfg.sttModel);
    form.append('language', 'ja');
    form.append('response_format', 'json');
    // Bias transcription toward job-hunting vocabulary (fixes e.g.
    // 自己分析 misheard as 事故分析).
    form.append(
      'prompt',
      '就職活動・就活の相談です。自己分析、志望動機、ガクチカ、自己PR、エントリーシート、面接、業界研究、インターン、内定、キャリアセンター。'
    );

    const res = await fetchT(this.cfg.sttUrl, { method: 'POST', body: form }, 60000);
    if (!res.ok) throw new Error(`STT ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return (data.text || '').trim();
  }

  async #chat(userText) {
    if (userText) this.history.push({ role: 'user', content: userText });

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.history.slice(-this.cfg.historyTurns * 2),
    ];

    const res = await fetchT(this.cfg.llmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.cfg.llmApiKey}`,
      },
      body: JSON.stringify({
        model: this.cfg.llmModel,
        messages,
        stream: false,
        temperature: 0.7,
      }),
    }, 60000);
    if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text =
      data.choices?.[0]?.message?.content?.trim() ||
      data.message?.content?.trim() || // Ollama native shape, just in case
      '';
    this.history.push({ role: 'assistant', content: text });
    return text;
  }

  async #speak(text) {
    if (!text) return;
    const base = this.cfg.ttsUrl.replace(/\/$/, '');
    const spk = this.cfg.ttsSpeaker;

    // VOICEVOX: audio_query then synthesis.
    const q = await fetchT(
      `${base}/audio_query?speaker=${spk}&text=${encodeURIComponent(text)}`,
      { method: 'POST' },
      30000
    );
    if (!q.ok) throw new Error(`VOICEVOX audio_query ${q.status}`);
    const query = await q.json();

    const s = await fetchT(`${base}/synthesis?speaker=${spk}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
      body: JSON.stringify(query),
    }, 30000);
    if (!s.ok) throw new Error(`VOICEVOX synthesis ${s.status}`);

    const wav = Buffer.from(await s.arrayBuffer());
    const { sampleRate, channels, pcm } = decodeWav(wav);
    const mono = toMono(pcm, channels);
    const out = resamplePcm16(mono, sampleRate, config.audio.sampleRate);

    // Stream ~50ms frames so the device can start playback promptly.
    const frame = config.audio.sampleRate * 0.05 * 2; // bytes per 50ms
    for (let i = 0; i < out.length && !this.closed; i += frame) {
      this.emit('audio', out.subarray(i, Math.min(i + frame, out.length)));
    }
  }

  close() {
    this.closed = true;
    this.chunks = [];
  }
}
