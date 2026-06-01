// Career-domain logic: turns persona + mode + user profile into a system prompt,
// and applies CareerBot response rules. Voice-provider agnostic.

import { BASE_PERSONA } from '../prompts/persona.js';
import { modePrompt } from '../prompts/modes.js';
import { MODE } from '../protocol/messages.js';

export class CareerService {
  // Build the full system prompt for a session.
  buildSystemPrompt({ mode = MODE.GENERAL, profile = null } = {}) {
    const parts = [BASE_PERSONA, modePrompt(mode)];

    if (profile) {
      parts.push(this.#profileBlock(profile));
    }
    return parts.join('\n\n');
  }

  #profileBlock(profile) {
    const lines = ['【ユーザープロフィール】(参考情報。決めつけずに活用すること)'];
    if (profile.name) lines.push(`- 名前: ${profile.name}`);
    if (profile.target_type) {
      const label =
        profile.target_type === 'new_grad' ? '新卒就活' : '転職活動';
      lines.push(`- 活動区分: ${label}`);
    }
    if (profile.target_industries?.length)
      lines.push(`- 志望業界: ${profile.target_industries.join('、')}`);
    if (profile.target_roles?.length)
      lines.push(`- 志望職種: ${profile.target_roles.join('、')}`);
    if (profile.strengths?.length)
      lines.push(`- 強み: ${profile.strengths.join('、')}`);
    if (profile.notes) lines.push(`- メモ: ${profile.notes}`);
    return lines.join('\n');
  }

  isValidMode(mode) {
    return Object.values(MODE).includes(mode);
  }
}
