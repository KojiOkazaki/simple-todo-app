// Device <-> Server protocol (see docs/api.md).
//
// Transport: WebSocket.
//   - Control messages: JSON text frames matching the shapes below.
//   - Audio payloads: binary frames (raw PCM16 chunks). The preceding
//     audio_*_start control message declares the format for the stream.

// Message type constants (single source of truth, shared by gateway + tests).
export const MSG = Object.freeze({
  // device -> server
  HELLO: 'hello',
  AUDIO_IN_START: 'audio_in_start',
  AUDIO_IN_END: 'audio_in_end',
  TEXT_IN: 'text_in', // typed user turn (skips STT)
  MODE_SET: 'mode_set',
  BYE: 'bye',
  PONG: 'pong',

  // server -> device
  AUTH_OK: 'auth_ok',
  STATE: 'state',
  TRANSCRIPT: 'transcript',
  ASSISTANT_TEXT: 'assistant_text',
  AUDIO_OUT_START: 'audio_out_start',
  AUDIO_OUT_END: 'audio_out_end',
  ERROR: 'error',
  PING: 'ping',
});

// Device-facing state machine values (mirrors firmware UI states).
export const STATE = Object.freeze({
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  ERROR: 'error',
});

// Conversation modes (see careerService).
export const MODE = Object.freeze({
  GENERAL: 'general',
  INTERVIEW: 'interview',
  MOTIVATION: 'motivation',
});

// Error codes returned in `error` messages.
export const ERROR_CODE = Object.freeze({
  AUTH_FAILED: 'AUTH_FAILED',
  BAD_MESSAGE: 'BAD_MESSAGE',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INTERNAL: 'INTERNAL',
});

// ---- Builders (server -> device) ----

export const build = {
  authOk: (sessionId, audio) => ({
    type: MSG.AUTH_OK,
    session_id: sessionId,
    audio,
  }),
  state: (value) => ({ type: MSG.STATE, value }),
  transcript: (role, text) => ({ type: MSG.TRANSCRIPT, role, text }),
  assistantText: (text) => ({ type: MSG.ASSISTANT_TEXT, text }),
  audioOutStart: (audio) => ({
    type: MSG.AUDIO_OUT_START,
    sample_rate: audio.sampleRate,
    channels: audio.channels,
    format: audio.format,
  }),
  audioOutEnd: () => ({ type: MSG.AUDIO_OUT_END }),
  error: (code, message) => ({ type: MSG.ERROR, code, message }),
  ping: () => ({ type: MSG.PING }),
};

// Parse and lightly validate an inbound control message.
// Returns { ok: true, msg } or { ok: false, code, message }.
export function parseControl(raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch {
    return { ok: false, code: ERROR_CODE.BAD_MESSAGE, message: 'invalid JSON' };
  }
  if (!msg || typeof msg !== 'object' || typeof msg.type !== 'string') {
    return { ok: false, code: ERROR_CODE.BAD_MESSAGE, message: 'missing type' };
  }
  return { ok: true, msg };
}
