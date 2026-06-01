// OpenAI Realtime API provider (spec Task 8).
//
// Bridges a VoiceSession to OpenAI's Realtime websocket:
//   device PCM16  -> input_audio_buffer.append (base64)
//   commit        -> input_audio_buffer.commit + response.create
//   OpenAI deltas -> 'audio' / 'assistant_text' / 'transcript' events
//
// Audio is assumed PCM16 mono at config.audio.sampleRate in both directions.
// The gateway is responsible for any resampling the device needs.

import { WebSocket } from 'ws';
import { config } from '../config.js';
import { VoiceSession } from './voiceSession.js';

export class OpenAIRealtimeProvider extends VoiceSession {
  constructor() {
    super();
    this.systemPrompt = '';
    this.closed = false;
    this.ws = null;
    this.#connect();
  }

  #connect() {
    if (!config.openai.apiKey) {
      queueMicrotask(() =>
        this.emit('error', new Error('OPENAI_API_KEY is not set'))
      );
      return;
    }
    const url = `${config.openai.url}?model=${encodeURIComponent(config.openai.model)}`;
    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${config.openai.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    this.ws.on('open', () => {
      this.#sendSessionUpdate();
      this.emit('ready');
    });
    this.ws.on('message', (data) => this.#onMessage(data));
    this.ws.on('error', (err) => this.emit('error', err));
    this.ws.on('close', () => {
      if (!this.closed) this.emit('error', new Error('OpenAI connection closed'));
    });
  }

  #sendSessionUpdate() {
    this.#send({
      type: 'session.update',
      session: {
        instructions: this.systemPrompt,
        modalities: ['audio', 'text'],
        voice: config.openai.voice,
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { model: 'whisper-1' },
        // Server-side VAD off: device uses push-to-talk and commits explicitly.
        turn_detection: null,
      },
    });
  }

  setSystemPrompt(prompt) {
    this.systemPrompt = prompt;
    if (this.ws?.readyState === WebSocket.OPEN) this.#sendSessionUpdate();
  }

  appendAudio(chunk) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.#send({
      type: 'input_audio_buffer.append',
      audio: chunk.toString('base64'),
    });
  }

  commitAudio() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.#send({ type: 'input_audio_buffer.commit' });
    this.#send({ type: 'response.create' });
  }

  submitText(text) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.#send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    this.#send({ type: 'response.create' });
  }

  #onMessage(data) {
    let evt;
    try {
      evt = JSON.parse(data.toString());
    } catch {
      return;
    }
    switch (evt.type) {
      case 'response.audio.delta':
        // base64 PCM16 chunk
        this.emit('audio', Buffer.from(evt.delta, 'base64'));
        break;
      case 'response.audio_transcript.delta':
        this.emit('assistant_text', evt.delta);
        break;
      case 'response.audio_transcript.done':
        if (evt.transcript) this.emit('transcript', 'assistant', evt.transcript);
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (evt.transcript) this.emit('transcript', 'user', evt.transcript);
        break;
      case 'response.done':
        this.emit('audio_done');
        break;
      case 'error':
        this.emit('error', new Error(evt.error?.message || 'OpenAI error'));
        break;
      default:
        // Ignore other event types for MVP.
        break;
    }
  }

  #send(obj) {
    this.ws?.send(JSON.stringify(obj));
  }

  close() {
    this.closed = true;
    try {
      this.ws?.close();
    } catch {
      /* ignore */
    }
  }
}
