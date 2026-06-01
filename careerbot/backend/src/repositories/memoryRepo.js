// In-memory implementation of the persistence interface (default, zero-deps).
// Suitable for MVP/dev. Swap for sqliteRepo for durability.

import { randomUUID } from 'node:crypto';

export class MemoryRepo {
  constructor() {
    this.profiles = new Map(); // user_id -> UserProfile
    this.sessions = new Map(); // session_id -> ConversationSession
    this.messages = new Map(); // session_id -> Message[]
  }

  async init() {
    /* no-op */
  }

  // ---- UserProfile ----
  async getProfile(userId) {
    return this.profiles.get(userId) || null;
  }

  async upsertProfile(profile) {
    const existing = this.profiles.get(profile.user_id) || {};
    const merged = { ...existing, ...profile };
    this.profiles.set(profile.user_id, merged);
    return merged;
  }

  // ---- ConversationSession ----
  async createSession({ userId, mode }) {
    const session = {
      session_id: `sess_${randomUUID()}`,
      user_id: userId,
      mode,
      started_at: new Date().toISOString(),
      ended_at: null,
      summary: null,
    };
    this.sessions.set(session.session_id, session);
    this.messages.set(session.session_id, []);
    return session;
  }

  async endSession(sessionId, { summary } = {}) {
    const s = this.sessions.get(sessionId);
    if (!s) return null;
    s.ended_at = new Date().toISOString();
    if (summary != null) s.summary = summary;
    return s;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId) || null;
  }

  // ---- Message ----
  async addMessage({ sessionId, role, text }) {
    const msg = {
      message_id: `msg_${randomUUID()}`,
      session_id: sessionId,
      role,
      text,
      created_at: new Date().toISOString(),
    };
    const list = this.messages.get(sessionId) || [];
    list.push(msg);
    this.messages.set(sessionId, list);
    return msg;
  }

  async getMessages(sessionId) {
    return [...(this.messages.get(sessionId) || [])];
  }
}
