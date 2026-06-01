// Centralized configuration, sourced from environment variables.
// See .env.example for documentation of each value.

function parseList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  get port() {
    return Number(process.env.PORT || 8080);
  },

  // Device authentication (MVP: shared static tokens). Read live so the value
  // reflects the current environment (also keeps tests deterministic).
  get deviceTokens() {
    return parseList(process.env.DEVICE_TOKENS);
  },

  // Voice provider selection.
  get voiceProvider() {
    return (process.env.VOICE_PROVIDER || 'mock').toLowerCase();
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_REALTIME_MODEL || 'gpt-4o-realtime-preview',
    url: process.env.OPENAI_REALTIME_URL || 'wss://api.openai.com/v1/realtime',
    voice: process.env.OPENAI_VOICE || 'alloy',
  },

  // Local voice pipeline (VOICE_PROVIDER=local): Whisper STT -> Gemma LLM
  // -> VOICEVOX TTS, all running on the user's machine. All endpoints
  // configurable so faster-whisper-server / Ollama / LM Studio / VOICEVOX
  // can be swapped freely.
  local: {
    // OpenAI-compatible transcription endpoint (faster-whisper-server,
    // whisper.cpp server --convert, etc.). Receives multipart WAV.
    sttUrl:
      process.env.STT_URL || 'http://localhost:8000/v1/audio/transcriptions',
    sttModel: process.env.STT_MODEL || 'whisper-1',
    // OpenAI-compatible chat endpoint. Ollama exposes this at
    // http://localhost:11434/v1/chat/completions.
    llmUrl: process.env.LLM_URL || 'http://localhost:11434/v1/chat/completions',
    llmModel: process.env.LLM_MODEL || 'gemma3',
    llmApiKey: process.env.LLM_API_KEY || 'ollama', // most local servers ignore this
    // VOICEVOX engine base URL + speaker (ずんだもん ノーマル = 3).
    ttsUrl: process.env.VOICEVOX_URL || 'http://localhost:50021',
    ttsSpeaker: Number(process.env.VOICEVOX_SPEAKER || 3),
    // Max conversation history turns kept for LLM context.
    historyTurns: Number(process.env.LOCAL_HISTORY_TURNS || 12),
  },

  audio: {
    sampleRate: Number(process.env.AUDIO_SAMPLE_RATE || 16000),
    channels: 1,
    format: 'pcm16',
  },

  storage: (process.env.STORAGE || 'memory').toLowerCase(),
  sqlitePath: process.env.SQLITE_PATH || './careerbot.db',

  // Session timeout (ms) of inactivity before the server closes a session.
  sessionTimeoutMs: Number(process.env.SESSION_TIMEOUT_MS || 5 * 60 * 1000),

  // Heartbeat ping interval (ms).
  heartbeatIntervalMs: Number(process.env.HEARTBEAT_INTERVAL_MS || 20 * 1000),
};

export function isDeviceTokenValid(token) {
  // Empty allowlist => accept any device (development convenience only).
  if (config.deviceTokens.length === 0) return true;
  return config.deviceTokens.includes(token);
}
