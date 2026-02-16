const isProduction = window.location.hostname !== 'localhost' &&
                    window.location.hostname !== '127.0.0.1';

export const API_CONFIG = {
  BASE_URL: isProduction ? '' : 'http://localhost:3010',
  ENDPOINTS: {
    START_CONVERSATION: '/api/start-conversation',
    HUMAN_INPUT: '/api/human-input',
    CONVERSATION_MODE: '/api/conversation/mode',
    BATCH_SYNTHESIZE: '/api/batch-synthesize',
    TTS: '/api/tts',
    GENERATE_AUDIO: '/api/generate-audio',
    LLM_MODELS: '/api/llm-models',
    UPDATE_MODEL: '/api/update-model',
    SET_LLM_PROVIDER: '/api/llm-provider',
    SET_LLM_KEYS: '/api/llm-keys',
    LLM_STATUS: '/api/llm-status',
    HEALTH: '/api/health',
    PROVIDERS: '/api/providers',
    INTERVIEW_RESPOND: '/api/interview/respond',
    INTERVIEW_EVALUATE: '/api/interview/evaluate',
    INTERVIEW_CLOSING: '/api/interview/closing',
  }
};

export default API_CONFIG;
