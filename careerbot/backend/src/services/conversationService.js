// Conversation/session persistence facade (spec section 12.3 conversation service).
// Wraps a repository and provides session lifecycle + a naive summary.

export class ConversationService {
  constructor(repo) {
    this.repo = repo;
  }

  async startSession({ userId, mode }) {
    return this.repo.createSession({ userId, mode });
  }

  async recordMessage({ sessionId, role, text }) {
    if (!text) return null;
    return this.repo.addMessage({ sessionId, role, text });
  }

  async endSession(sessionId) {
    const messages = await this.repo.getMessages(sessionId);
    const summary = this.#summarize(messages);
    return this.repo.endSession(sessionId, { summary });
  }

  async getProfile(userId) {
    return this.repo.getProfile(userId);
  }

  async saveProfile(profile) {
    return this.repo.upsertProfile(profile);
  }

  // Naive extractive summary for MVP: first user utterance + message count.
  // Phase 2 replaces this with an LLM-generated summary.
  #summarize(messages) {
    if (!messages.length) return null;
    const firstUser = messages.find((m) => m.role === 'user');
    const head = firstUser ? firstUser.text.slice(0, 60) : '(発話なし)';
    return `${messages.length}メッセージ。最初の相談: ${head}`;
  }
}
