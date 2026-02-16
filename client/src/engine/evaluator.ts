import {
  ResponseScore,
  InterviewQuestion,
  InterviewFeedbackData,
  InterviewPhase,
} from '../types';

const PHASE_NAMES: Record<InterviewPhase, string> = {
  introduction: '導入',
  self_introduction: '自己紹介・自己PR',
  motivation: '志望動機',
  experience: 'ガクチカ・経験',
  strength_weakness: '強み・弱み',
  industry_specific: '業界別質問',
  reverse_question: '逆質問',
  closing: '締め',
};

function countKeywordMatches(response: string, keywords: string[]): number {
  return keywords.filter(kw => response.includes(kw)).length;
}

function hasSTARStructure(response: string): boolean {
  const markers = {
    situation: ['状況', '背景', 'とき', '場面', '当時'],
    task: ['課題', '目標', '役割', '任務', '問題'],
    action: ['行動', '取り組', '対応', '実行', '工夫', '努力'],
    result: ['結果', '成果', '達成', '改善', '学び', '成長'],
  };

  let matchedParts = 0;
  for (const keywords of Object.values(markers)) {
    if (keywords.some(kw => response.includes(kw))) {
      matchedParts++;
    }
  }
  return matchedParts >= 3;
}

function assessResponseLength(response: string): 'short' | 'good' | 'long' {
  const len = response.length;
  if (len < 50) return 'short';
  if (len > 500) return 'long';
  return 'good';
}

export function evaluateResponse(
  question: InterviewQuestion,
  response: string,
): ResponseScore {
  const keywordMatches = countKeywordMatches(response, question.idealKeywords);
  const keywordRatio = question.idealKeywords.length > 0
    ? keywordMatches / question.idealKeywords.length
    : 0;
  const lengthAssessment = assessResponseLength(response);
  const hasStructure = hasSTARStructure(response);

  // Relevance: keyword matches + general coherence
  let relevance = Math.min(5, Math.round(keywordRatio * 4 + 1));
  if (response.length < 20) relevance = Math.max(1, relevance - 2);

  // Structure: STAR method presence + logical flow
  let structure = hasStructure ? 4 : 2;
  if (response.includes('。') && response.split('。').length >= 3) structure = Math.min(5, structure + 1);
  if (lengthAssessment === 'short') structure = Math.max(1, structure - 1);

  // Specificity: concrete details, numbers, examples
  let specificity = 2;
  if (/\d+/.test(response)) specificity += 1;
  if (/具体的|例えば|実際に|経験/.test(response)) specificity += 1;
  if (response.length > 100 && keywordMatches >= 2) specificity += 1;
  specificity = Math.min(5, specificity);

  // Enthusiasm: positive language, motivation
  let enthusiasm = 3;
  if (/情熱|挑戦|成長|夢|目標|やりがい|貢献/.test(response)) enthusiasm += 1;
  if (/ぜひ|必ず|強く|非常に/.test(response)) enthusiasm += 1;
  if (response.length < 30) enthusiasm = Math.max(1, enthusiasm - 1);
  enthusiasm = Math.min(5, enthusiasm);

  // Communication: length balance, clarity
  let communication = lengthAssessment === 'good' ? 4 : 3;
  if (response.includes('。') && response.split('。').length >= 2) communication = Math.min(5, communication + 1);
  if (lengthAssessment === 'short') communication = Math.max(1, communication - 1);

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (relevance >= 4) strengths.push('質問に対して的確に回答できています');
  if (structure >= 4) strengths.push('論理的な構成で話が組み立てられています');
  if (specificity >= 4) strengths.push('具体的なエピソードや数字を交えて説明できています');
  if (enthusiasm >= 4) strengths.push('熱意や意欲が伝わる回答です');
  if (communication >= 4) strengths.push('簡潔で分かりやすい表現ができています');

  if (relevance <= 2) improvements.push('質問の意図をもう少し意識して回答しましょう');
  if (structure <= 2) improvements.push('STAR法（状況→課題→行動→結果）を意識して構成しましょう');
  if (specificity <= 2) improvements.push('具体的なエピソードや数字を入れると説得力が増します');
  if (enthusiasm <= 2) improvements.push('もう少し熱意や意欲を言葉にして伝えましょう');
  if (communication <= 2) improvements.push('もう少し内容を充実させ、簡潔にまとめましょう');
  if (lengthAssessment === 'long') improvements.push('回答が長すぎます。要点を絞って簡潔に伝えましょう');

  if (strengths.length === 0) strengths.push('回答を完了できたことは良いことです');
  if (improvements.length === 0) improvements.push('さらに高い評価を目指すなら、独自の視点を加えてみましょう');

  const avgScore = (relevance + structure + specificity + enthusiasm + communication) / 5;
  let feedback: string;
  if (avgScore >= 4) {
    feedback = '素晴らしい回答です。面接官に好印象を与えられるでしょう。';
  } else if (avgScore >= 3) {
    feedback = '良い回答ですが、さらに磨きをかける余地があります。';
  } else if (avgScore >= 2) {
    feedback = '基本的な内容は押さえていますが、具体性や構成に改善が必要です。';
  } else {
    feedback = '回答の内容を充実させる必要があります。準備を重ねて再度挑戦しましょう。';
  }

  return {
    questionId: question.id,
    question: question.text,
    response,
    scores: { relevance, structure, specificity, enthusiasm, communication },
    feedback,
    strengths,
    improvements,
  };
}

export function generateOverallFeedback(
  scores: ResponseScore[],
): InterviewFeedbackData {
  if (scores.length === 0) {
    return {
      overallScore: 0,
      totalQuestions: 0,
      responseScores: [],
      summary: {
        strengths: ['面接に参加しました'],
        improvements: ['質問に回答してフィードバックを受けましょう'],
        advice: '面接の練習を続けましょう。',
      },
      phaseBreakdown: [],
    };
  }

  const totalScore = scores.reduce((sum, s) => {
    const avg = Object.values(s.scores).reduce((a, b) => a + b, 0) / 5;
    return sum + avg;
  }, 0);
  const overallScore = Math.round((totalScore / scores.length) * 20); // 0-100

  // Collect all strengths and improvements
  const allStrengths = new Set<string>();
  const allImprovements = new Set<string>();
  scores.forEach(s => {
    s.strengths.forEach(str => allStrengths.add(str));
    s.improvements.forEach(imp => allImprovements.add(imp));
  });

  // Phase breakdown
  const phaseScoresMap = new Map<string, number[]>();
  scores.forEach(s => {
    // Determine phase from question ID
    let phase: InterviewPhase = 'experience';
    if (s.questionId.startsWith('si')) phase = 'self_introduction';
    else if (s.questionId.startsWith('mo')) phase = 'motivation';
    else if (s.questionId.startsWith('ex')) phase = 'experience';
    else if (s.questionId.startsWith('sw')) phase = 'strength_weakness';
    else if (s.questionId.startsWith('is')) phase = 'industry_specific';
    else if (s.questionId.startsWith('rq')) phase = 'reverse_question';

    const avg = Object.values(s.scores).reduce((a, b) => a + b, 0) / 5;
    const existing = phaseScoresMap.get(phase) || [];
    existing.push(avg);
    phaseScoresMap.set(phase, existing);
  });

  const phaseBreakdown = Array.from(phaseScoresMap.entries()).map(([phase, pScores]) => ({
    phase: phase as InterviewPhase,
    phaseName: PHASE_NAMES[phase as InterviewPhase],
    score: Math.round((pScores.reduce((a, b) => a + b, 0) / pScores.length) * 20),
  }));

  let advice: string;
  if (overallScore >= 80) {
    advice = '全体的に非常に良い面接パフォーマンスです。自信を持って本番に臨みましょう。細かい表現をさらに磨くことで、一層印象的な面接ができるでしょう。';
  } else if (overallScore >= 60) {
    advice = '基本的な面接スキルは身についています。具体的なエピソードの準備と、STAR法を使った回答の構成を意識して練習を続けましょう。';
  } else if (overallScore >= 40) {
    advice = '面接の基本を押さえる練習が必要です。よく聞かれる質問への回答を事前に準備し、声に出して練習することをお勧めします。';
  } else {
    advice = '面接の準備をしっかり行いましょう。自己分析、企業研究、志望動機の整理から始めて、模擬面接で実践的な練習を重ねてください。';
  }

  return {
    overallScore,
    totalQuestions: scores.length,
    responseScores: scores,
    summary: {
      strengths: Array.from(allStrengths).slice(0, 5),
      improvements: Array.from(allImprovements).slice(0, 5),
      advice,
    },
    phaseBreakdown,
  };
}
