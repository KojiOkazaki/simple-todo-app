import { InterviewQuestion, Industry, InterviewPhase, Difficulty } from '../types';

export const QUESTION_BANK: InterviewQuestion[] = [
  // === 自己紹介 (Self Introduction) ===
  {
    id: 'si-1',
    phase: 'self_introduction',
    text: '自己紹介をお願いします。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      '学生時代に最も力を入れたことは何ですか？',
      '趣味や特技について教えてください。',
    ],
    evaluationCriteria: ['簡潔さ', '論理構成', '印象的なポイント'],
    idealKeywords: ['大学', '専攻', '取り組み', '強み'],
    category: '自己紹介',
  },
  {
    id: 'si-2',
    phase: 'self_introduction',
    text: '1分間で自己PRをお願いします。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'intermediate',
    followUps: [
      'その強みを活かした具体的なエピソードを教えてください。',
      'その強みは仕事にどう活かせると考えますか？',
    ],
    evaluationCriteria: ['具体性', '説得力', '仕事との関連性'],
    idealKeywords: ['強み', '経験', '成果', '貢献', '活かす'],
    category: '自己PR',
  },

  // === 志望動機 (Motivation) ===
  {
    id: 'mo-1',
    phase: 'motivation',
    text: '当社を志望した理由を教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      '同業他社ではなく当社を選んだ理由は？',
      '当社のどのような事業に興味がありますか？',
    ],
    evaluationCriteria: ['企業理解', '一貫性', '熱意'],
    idealKeywords: ['御社', '事業', '理念', '成長', '貢献', 'ビジョン'],
    category: '志望動機',
  },
  {
    id: 'mo-2',
    phase: 'motivation',
    text: 'この業界に興味を持ったきっかけは何ですか？',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      '業界の課題についてどう考えていますか？',
      '将来、この業界はどう変わると思いますか？',
    ],
    evaluationCriteria: ['業界理解', '具体的なきっかけ', '将来ビジョン'],
    idealKeywords: ['きっかけ', '興味', '業界', '将来', '影響'],
    category: '志望動機',
  },
  {
    id: 'mo-3',
    phase: 'motivation',
    text: '入社後にやりたいことを教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'intermediate',
    followUps: [
      '5年後、10年後のキャリアプランは？',
      'そのために今から準備していることはありますか？',
    ],
    evaluationCriteria: ['具体性', '実現可能性', '企業との整合性'],
    idealKeywords: ['目標', 'キャリア', '成長', 'スキル', '貢献'],
    category: '志望動機',
  },

  // === ガクチカ・経験 (Experience) ===
  {
    id: 'ex-1',
    phase: 'experience',
    text: '学生時代に最も力を入れたことを教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      'その活動で困難だったことは何ですか？',
      'その経験を通じて何を学びましたか？',
      '周りからどのような評価を受けましたか？',
    ],
    evaluationCriteria: ['STAR構成', '具体性', '学び', '成長'],
    idealKeywords: ['課題', '行動', '結果', '学び', 'チーム'],
    category: 'ガクチカ',
  },
  {
    id: 'ex-2',
    phase: 'experience',
    text: 'チームで何かを成し遂げた経験を教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'intermediate',
    followUps: [
      'チーム内であなたの役割は何でしたか？',
      '意見が衝突したとき、どう対処しましたか？',
    ],
    evaluationCriteria: ['チームワーク', 'リーダーシップ', '協調性'],
    idealKeywords: ['チーム', '役割', '協力', '目標', '達成', '調整'],
    category: 'チームワーク',
  },
  {
    id: 'ex-3',
    phase: 'experience',
    text: '失敗から学んだ経験を教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'intermediate',
    followUps: [
      'その失敗をどのように乗り越えましたか？',
      '同じ状況になったら、次はどうしますか？',
    ],
    evaluationCriteria: ['誠実さ', '反省力', '改善行動'],
    idealKeywords: ['失敗', '原因', '改善', '学び', '成長'],
    category: '失敗経験',
  },
  {
    id: 'ex-4',
    phase: 'experience',
    text: 'リーダーシップを発揮した経験はありますか？',
    industry: ['general', 'consulting', 'trading'],
    difficulty: 'advanced',
    followUps: [
      'メンバーのモチベーションをどう維持しましたか？',
      '自分のリーダーシップスタイルをどう表現しますか？',
    ],
    evaluationCriteria: ['リーダーシップ', '巻き込み力', '成果'],
    idealKeywords: ['リーダー', '率先', '方向性', 'メンバー', '成果'],
    category: 'リーダーシップ',
  },

  // === 長所・短所 (Strengths & Weaknesses) ===
  {
    id: 'sw-1',
    phase: 'strength_weakness',
    text: 'あなたの強みと弱みを教えてください。',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      'その弱みを克服するために何をしていますか？',
      '強みを発揮した具体的な場面は？',
    ],
    evaluationCriteria: ['自己分析', '具体性', '改善努力'],
    idealKeywords: ['強み', '弱み', '改善', '努力', '経験'],
    category: '強み・弱み',
  },
  {
    id: 'sw-2',
    phase: 'strength_weakness',
    text: '周りの人からどんな人だと言われますか？',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [
      'それについてどう思いますか？',
      '自分ではどう思いますか？',
    ],
    evaluationCriteria: ['客観性', '自己認識', '一貫性'],
    idealKeywords: ['友人', '先輩', '評価', '性格', '特徴'],
    category: '他己分析',
  },
  {
    id: 'sw-3',
    phase: 'strength_weakness',
    text: 'ストレスを感じたとき、どのように対処しますか？',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'intermediate',
    followUps: [
      '最もストレスを感じた経験を教えてください。',
      'プレッシャーの中でパフォーマンスを出すコツは？',
    ],
    evaluationCriteria: ['ストレス耐性', '自己管理', '対処法'],
    idealKeywords: ['対処', '管理', '解消', 'バランス', '対策'],
    category: 'ストレス耐性',
  },

  // === 業界別質問 (Industry Specific) ===
  {
    id: 'is-it-1',
    phase: 'industry_specific',
    text: '最近注目しているIT技術やトレンドは何ですか？',
    industry: ['it'],
    difficulty: 'intermediate',
    followUps: [
      'その技術が社会にどのような影響を与えると思いますか？',
      '自分でその技術を使って何か作ったことはありますか？',
    ],
    evaluationCriteria: ['技術理解', '情報感度', '自主学習'],
    idealKeywords: ['AI', 'クラウド', 'セキュリティ', '開発', 'DX'],
    category: 'IT知識',
  },
  {
    id: 'is-it-2',
    phase: 'industry_specific',
    text: 'プログラミング経験や技術スキルについて教えてください。',
    industry: ['it'],
    difficulty: 'beginner',
    followUps: [
      'どの言語が最も得意ですか？',
      'チーム開発の経験はありますか？',
    ],
    evaluationCriteria: ['スキルレベル', '学習意欲', '実践経験'],
    idealKeywords: ['言語', '開発', 'プロジェクト', 'Git', 'チーム'],
    category: '技術スキル',
  },
  {
    id: 'is-fi-1',
    phase: 'industry_specific',
    text: '最近の金融市場で気になるニュースはありますか？',
    industry: ['finance'],
    difficulty: 'intermediate',
    followUps: [
      'その出来事が経済に与える影響をどう分析しますか？',
      '金融業界の将来についてどう考えますか？',
    ],
    evaluationCriteria: ['市場理解', '分析力', '情報感度'],
    idealKeywords: ['市場', '金利', '投資', 'リスク', '経済'],
    category: '金融知識',
  },
  {
    id: 'is-co-1',
    phase: 'industry_specific',
    text: 'ある企業の売上が減少しています。原因と対策を考えてください。',
    industry: ['consulting'],
    difficulty: 'advanced',
    followUps: [
      'その仮説を検証するにはどのようなデータが必要ですか？',
      '優先順位をつけるとしたら、何から取り組みますか？',
    ],
    evaluationCriteria: ['論理的思考', 'フレームワーク', '仮説構築'],
    idealKeywords: ['仮説', '分析', 'データ', '戦略', '改善'],
    category: 'ケーススタディ',
  },
  {
    id: 'is-mf-1',
    phase: 'industry_specific',
    text: 'ものづくりに興味を持った理由を教えてください。',
    industry: ['manufacturing'],
    difficulty: 'beginner',
    followUps: [
      '品質管理についてどう考えますか？',
      '製造現場で働くことへの覚悟はありますか？',
    ],
    evaluationCriteria: ['製造業理解', '熱意', '適性'],
    idealKeywords: ['ものづくり', '品質', '技術', '製品', '改善'],
    category: '製造業理解',
  },
  {
    id: 'is-tr-1',
    phase: 'industry_specific',
    text: 'グローバルなビジネス環境で働くことについてどう考えますか？',
    industry: ['trading'],
    difficulty: 'intermediate',
    followUps: [
      '海外経験はありますか？',
      '異文化コミュニケーションで大切なことは何だと思いますか？',
    ],
    evaluationCriteria: ['グローバル視点', '語学力', '適応力'],
    idealKeywords: ['グローバル', '海外', '文化', '語学', '多様性'],
    category: 'グローバル',
  },
  {
    id: 'is-me-1',
    phase: 'industry_specific',
    text: 'メディアの役割が変化している中、あなたはどう貢献したいですか？',
    industry: ['media'],
    difficulty: 'intermediate',
    followUps: [
      'SNSとマスメディアの関係をどう見ていますか？',
      '情報の信頼性についてどう考えますか？',
    ],
    evaluationCriteria: ['メディア理解', '情報リテラシー', '創造性'],
    idealKeywords: ['情報', 'コンテンツ', 'デジタル', '発信', '影響力'],
    category: 'メディア理解',
  },

  // === 逆質問 (Reverse Questions) ===
  {
    id: 'rq-1',
    phase: 'reverse_question',
    text: '最後に、何か質問はありますか？',
    industry: ['general', 'it', 'finance', 'consulting', 'manufacturing', 'trading', 'media'],
    difficulty: 'beginner',
    followUps: [],
    evaluationCriteria: ['質問の質', '企業への関心度', '準備の程度'],
    idealKeywords: ['事業', '成長', '研修', 'キャリア', 'チーム'],
    category: '逆質問',
  },
];

export function getQuestionsForPhase(
  phase: InterviewPhase,
  industry: Industry,
  difficulty: Difficulty,
): InterviewQuestion[] {
  return QUESTION_BANK.filter(q => {
    const phaseMatch = q.phase === phase;
    const industryMatch = q.industry.includes(industry) || q.industry.includes('general');
    const difficultyMatch =
      difficulty === 'advanced' ||
      (difficulty === 'intermediate' && q.difficulty !== 'advanced') ||
      q.difficulty === 'beginner';
    return phaseMatch && industryMatch && difficultyMatch;
  });
}

export function selectQuestionsForInterview(
  industry: Industry,
  difficulty: Difficulty,
  count: number,
  phases: InterviewPhase[],
): InterviewQuestion[] {
  const selected: InterviewQuestion[] = [];

  for (const phase of phases) {
    const available = getQuestionsForPhase(phase, industry, difficulty);
    if (available.length === 0) continue;

    // Pick 1-2 questions per phase, respecting total count
    const pickCount = Math.min(
      phase === 'reverse_question' ? 1 : Math.ceil(count / phases.length),
      available.length,
    );

    const shuffled = [...available].sort(() => Math.random() - 0.5);
    selected.push(...shuffled.slice(0, pickCount));

    if (selected.length >= count) break;
  }

  return selected.slice(0, count);
}
