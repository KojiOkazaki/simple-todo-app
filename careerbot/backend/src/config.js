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
