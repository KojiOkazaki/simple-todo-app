// Base class for voice providers. Kept in its own module to avoid a circular
// import between the factory (voiceProvider.js) and concrete providers.
//
// Event contract (EventEmitter):
//   'ready'                     engine session established
//   'transcript' (role, text)   finalized transcript line (user/assistant)
//   'assistant_text' (text)     assistant text delta or full message
//   'audio' (Buffer)            chunk of output audio (PCM16)
//   'audio_done'                assistant finished speaking this turn
//   'error' (Error)             unrecoverable provider error
//
// Method contract: appendAudio(Buffer), commitAudio(), setSystemPrompt(string), close()

import { EventEmitter } from 'node:events';

export class VoiceSession extends EventEmitter {
  // eslint-disable-next-line no-unused-vars
  appendAudio(_chunk) {
    throw new Error('not implemented');
  }
  commitAudio() {
    throw new Error('not implemented');
  }
  // Submit a typed user turn (skips STT). Same event output as a voice turn.
  // eslint-disable-next-line no-unused-vars
  submitText(_text) {
    throw new Error('not implemented');
  }
  // eslint-disable-next-line no-unused-vars
  setSystemPrompt(_prompt) {
    throw new Error('not implemented');
  }
  close() {
    throw new Error('not implemented');
  }
}
