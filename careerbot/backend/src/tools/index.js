// Tool extension point (spec section 12.3 tools). MVP stubs that the career
// layer / future function-calling can invoke. Kept pure + testable.

// Mock interview: returns a question for the given round.
const INTERVIEW_QUESTIONS = [
  '自己紹介を1分でお願いします。',
  'あなたの強みと、それが活きた経験を教えてください。',
  '学生時代（または前職）で最も力を入れたことは何ですか。',
  'なぜこの業界・職種を志望するのですか。',
  '入社後にどんなことに挑戦したいですか。',
];

export function mockInterviewQuestion(round = 0) {
  return INTERVIEW_QUESTIONS[round % INTERVIEW_QUESTIONS.length];
}

// Answer review: lightweight heuristic feedback on 3 axes (spec 16.2).
export function answerReview(text) {
  const t = (text || '').trim();
  const hasExample = /(例えば|たとえば|具体的に|ときに|経験|数字|\d+)/.test(t);
  const concise = t.length > 0 && t.length <= 300;
  const onTopic = t.length >= 10;
  return {
    content: onTopic ? '質問に答えられています' : '回答が短く、内容が不足しています',
    specificity: hasExample ? '具体例があり説得力があります' : '具体的なエピソードを足しましょう',
    clarity: concise ? '簡潔で伝わりやすいです' : '結論を先に、短くまとめましょう',
  };
}

// Summary export: shape conversation messages into a portable record.
export function summaryExport(session, messages) {
  return {
    session_id: session.session_id,
    mode: session.mode,
    started_at: session.started_at,
    ended_at: session.ended_at,
    turns: messages.length,
    transcript: messages.map((m) => ({ role: m.role, text: m.text })),
  };
}
