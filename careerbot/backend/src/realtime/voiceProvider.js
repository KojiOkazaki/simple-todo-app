// Voice provider factory. The base class lives in voiceSession.js; concrete
// providers in mockProvider.js / openaiRealtime.js. Selection via config.
//
// Adding a self-hosted provider later: implement VoiceSession and add a case.

import { config } from '../config.js';
import { MockProvider } from './mockProvider.js';
import { OpenAIRealtimeProvider } from './openaiRealtime.js';

export { VoiceSession } from './voiceSession.js';

export function createVoiceProvider() {
  switch (config.voiceProvider) {
    case 'openai':
      return new OpenAIRealtimeProvider();
    case 'mock':
    default:
      return new MockProvider();
  }
}
