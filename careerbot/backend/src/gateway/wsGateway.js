// WebSocket gateway (spec Task 7, section 12.3 gateway).
//
// Owns one connection's lifecycle: auth -> session -> audio relay -> teardown.
// Translates the device protocol (protocol/messages.js) to/from a VoiceSession,
// persists transcripts via ConversationService, and builds prompts via
// CareerService.

import { WebSocketServer, WebSocket } from 'ws';
import { config, isDeviceTokenValid } from '../config.js';
import {
  MSG,
  STATE,
  MODE,
  ERROR_CODE,
  build,
  parseControl,
} from '../protocol/messages.js';

export class WsGateway {
  constructor({ server, conversationService, careerService, createProvider }) {
    this.conversation = conversationService;
    this.career = careerService;
    this.createProvider = createProvider;

    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.wss.on('connection', (ws) => this.#onConnection(ws));

    // Heartbeat sweep: terminate connections that stopped responding.
    this.heartbeat = setInterval(() => {
      for (const ws of this.wss.clients) {
        if (ws.isAlive === false) {
          ws.terminate();
          continue;
        }
        ws.isAlive = false;
        this.#sendJson(ws, build.ping());
      }
    }, config.heartbeatIntervalMs);
    this.heartbeat.unref?.();
  }

  #onConnection(ws) {
    // Per-connection context.
    const ctx = {
      authed: false,
      deviceId: null,
      session: null,
      provider: null,
      mode: MODE.GENERAL,
      assistantBuffer: '',
      speaking: false,
    };
    ws.isAlive = true;
    ws.ctx = ctx;

    ws.on('message', (data, isBinary) =>
      this.#onMessage(ws, data, isBinary).catch((err) =>
        this.#fail(ws, ERROR_CODE.INTERNAL, err.message)
      )
    );
    ws.on('close', () => this.#teardown(ws));
    ws.on('error', () => this.#teardown(ws));
  }

  async #onMessage(ws, data, isBinary) {
    const ctx = ws.ctx;

    // Binary frames are user audio chunks for the active listening turn.
    if (isBinary) {
      if (ctx.authed && ctx.provider) ctx.provider.appendAudio(data);
      return;
    }

    const parsed = parseControl(data.toString());
    if (!parsed.ok) {
      this.#sendJson(ws, build.error(parsed.code, parsed.message));
      return;
    }
    const msg = parsed.msg;

    // Heartbeat reply is allowed pre-auth.
    if (msg.type === MSG.PONG) {
      ws.isAlive = true;
      return;
    }

    if (!ctx.authed) {
      if (msg.type === MSG.HELLO) return this.#handleHello(ws, msg);
      this.#sendJson(ws, build.error(ERROR_CODE.AUTH_FAILED, 'hello required'));
      return;
    }

    switch (msg.type) {
      case MSG.MODE_SET:
        return this.#handleModeSet(ws, msg);
      case MSG.AUDIO_IN_START:
        return this.#setState(ws, STATE.LISTENING);
      case MSG.AUDIO_IN_END:
        this.#setState(ws, STATE.THINKING);
        ctx.assistantBuffer = '';
        ctx.provider.commitAudio();
        return;
      case MSG.TEXT_IN:
        if (typeof msg.text !== 'string' || !msg.text.trim()) {
          this.#sendJson(ws, build.error(ERROR_CODE.BAD_MESSAGE, 'text required'));
          return;
        }
        this.#setState(ws, STATE.THINKING);
        ctx.assistantBuffer = '';
        ctx.provider.submitText(msg.text.trim());
        return;
      case MSG.BYE:
        ws.close();
        return;
      default:
        this.#sendJson(
          ws,
          build.error(ERROR_CODE.BAD_MESSAGE, `unknown type: ${msg.type}`)
        );
    }
  }

  async #handleHello(ws, msg) {
    const ctx = ws.ctx;
    const token = msg.device_token || msg.token || '';
    if (!isDeviceTokenValid(token)) {
      this.#sendJson(ws, build.error(ERROR_CODE.AUTH_FAILED, 'invalid token'));
      ws.close();
      return;
    }

    ctx.authed = true;
    ctx.deviceId = msg.device_id || 'unknown-device';

    // MVP: device_id doubles as user_id.
    const profile = await this.conversation.getProfile(ctx.deviceId);
    ctx.session = await this.conversation.startSession({
      userId: ctx.deviceId,
      mode: ctx.mode,
    });

    ctx.provider = this.createProvider();
    ctx.provider.setSystemPrompt(
      this.career.buildSystemPrompt({ mode: ctx.mode, profile })
    );
    this.#wireProvider(ws, ctx.provider);

    this.#sendJson(ws, build.authOk(ctx.session.session_id, config.audio));
    this.#setState(ws, STATE.IDLE);
  }

  async #handleModeSet(ws, msg) {
    const ctx = ws.ctx;
    if (!this.career.isValidMode(msg.value)) {
      this.#sendJson(ws, build.error(ERROR_CODE.BAD_MESSAGE, 'invalid mode'));
      return;
    }
    ctx.mode = msg.value;
    const profile = await this.conversation.getProfile(ctx.deviceId);
    ctx.provider.setSystemPrompt(
      this.career.buildSystemPrompt({ mode: ctx.mode, profile })
    );
  }

  #wireProvider(ws, provider) {
    const ctx = ws.ctx;

    provider.on('transcript', (role, text) => {
      this.#sendJson(ws, build.transcript(role, text));
      this.conversation.recordMessage({
        sessionId: ctx.session.session_id,
        role,
        text,
      });
    });

    provider.on('assistant_text', (text) => {
      ctx.assistantBuffer += text;
      this.#sendJson(ws, build.assistantText(text));
    });

    provider.on('audio', (chunk) => {
      if (!ctx.speaking) {
        ctx.speaking = true;
        this.#setState(ws, STATE.SPEAKING);
        this.#sendJson(ws, build.audioOutStart(config.audio));
      }
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk, { binary: true });
    });

    provider.on('audio_done', () => {
      if (ctx.speaking) {
        this.#sendJson(ws, build.audioOutEnd());
        ctx.speaking = false;
      }
      this.#setState(ws, STATE.IDLE);
    });

    provider.on('error', (err) => {
      this.#sendJson(ws, build.error(ERROR_CODE.PROVIDER_ERROR, err.message));
      this.#setState(ws, STATE.ERROR);
    });
  }

  #setState(ws, value) {
    this.#sendJson(ws, build.state(value));
  }

  #sendJson(ws, obj) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  }

  #fail(ws, code, message) {
    this.#sendJson(ws, build.error(code, message));
  }

  async #teardown(ws) {
    const ctx = ws.ctx;
    if (!ctx) return;
    try {
      ctx.provider?.close();
    } catch {
      /* ignore */
    }
    if (ctx.session) {
      await this.conversation.endSession(ctx.session.session_id).catch(() => {});
      ctx.session = null;
    }
  }

  close() {
    clearInterval(this.heartbeat);
    this.wss.close();
  }
}
