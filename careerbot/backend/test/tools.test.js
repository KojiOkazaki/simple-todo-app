import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mockInterviewQuestion,
  answerReview,
  summaryExport,
} from '../src/tools/index.js';
import { CareerService } from '../src/services/careerService.js';
import { MODE } from '../src/protocol/messages.js';

test('mockInterviewQuestion rotates and wraps', () => {
  const q0 = mockInterviewQuestion(0);
  const q5 = mockInterviewQuestion(5); // wraps (5 questions)
  assert.equal(typeof q0, 'string');
  assert.equal(q0, q5);
});

test('answerReview flags missing specifics', () => {
  const r = answerReview('はい。');
  assert.match(r.content, /不足/);
  assert.match(r.specificity, /具体/);
});

test('answerReview praises concrete concise answers', () => {
  const r = answerReview('例えば前職で売上を20%改善しました。結論から言うと継続力が強みです。');
  assert.match(r.specificity, /説得力/);
});

test('careerService builds prompt with mode + profile', () => {
  const svc = new CareerService();
  const prompt = svc.buildSystemPrompt({
    mode: MODE.INTERVIEW,
    profile: { user_id: 'u1', strengths: ['継続力'], target_industries: ['IT'] },
  });
  assert.match(prompt, /キャリアボット/);
  assert.match(prompt, /面接練習/);
  assert.match(prompt, /継続力/);
});

test('summaryExport shapes a record', () => {
  const out = summaryExport(
    { session_id: 's1', mode: 'general', started_at: 'a', ended_at: 'b' },
    [{ role: 'user', text: 'hi' }]
  );
  assert.equal(out.turns, 1);
  assert.equal(out.transcript[0].text, 'hi');
});
