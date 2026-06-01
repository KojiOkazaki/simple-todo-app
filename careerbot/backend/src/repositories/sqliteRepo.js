// SQLite implementation using Node's built-in `node:sqlite` (Node 22+).
// Same interface as MemoryRepo. node:sqlite is experimental; if unavailable,
// the factory in index.js falls back to MemoryRepo.

import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export class SqliteRepo {
  constructor(path) {
    this.path = path;
    this.db = null;
  }

  async init() {
    this.db = new DatabaseSync(this.path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        mode TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        summary TEXT
      );
      CREATE TABLE IF NOT EXISTS messages (
        message_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
    `);
  }

  async getProfile(userId) {
    const row = this.db
      .prepare('SELECT data FROM profiles WHERE user_id = ?')
      .get(userId);
    return row ? JSON.parse(row.data) : null;
  }

  async upsertProfile(profile) {
    const existing = (await this.getProfile(profile.user_id)) || {};
    const merged = { ...existing, ...profile };
    this.db
      .prepare(
        'INSERT INTO profiles(user_id, data) VALUES(?, ?) ' +
          'ON CONFLICT(user_id) DO UPDATE SET data = excluded.data'
      )
      .run(profile.user_id, JSON.stringify(merged));
    return merged;
  }

  async createSession({ userId, mode }) {
    const session = {
      session_id: `sess_${randomUUID()}`,
      user_id: userId,
      mode,
      started_at: new Date().toISOString(),
      ended_at: null,
      summary: null,
    };
    this.db
      .prepare(
        'INSERT INTO sessions(session_id, user_id, mode, started_at, ended_at, summary) VALUES(?,?,?,?,?,?)'
      )
      .run(
        session.session_id,
        session.user_id,
        session.mode,
        session.started_at,
        null,
        null
      );
    return session;
  }

  async endSession(sessionId, { summary } = {}) {
    const endedAt = new Date().toISOString();
    this.db
      .prepare('UPDATE sessions SET ended_at = ?, summary = ? WHERE session_id = ?')
      .run(endedAt, summary ?? null, sessionId);
    return this.getSession(sessionId);
  }

  async getSession(sessionId) {
    return (
      this.db
        .prepare('SELECT * FROM sessions WHERE session_id = ?')
        .get(sessionId) || null
    );
  }

  async addMessage({ sessionId, role, text }) {
    const msg = {
      message_id: `msg_${randomUUID()}`,
      session_id: sessionId,
      role,
      text,
      created_at: new Date().toISOString(),
    };
    this.db
      .prepare(
        'INSERT INTO messages(message_id, session_id, role, text, created_at) VALUES(?,?,?,?,?)'
      )
      .run(msg.message_id, msg.session_id, msg.role, msg.text, msg.created_at);
    return msg;
  }

  async getMessages(sessionId) {
    return this.db
      .prepare(
        'SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC'
      )
      .all(sessionId);
  }
}
