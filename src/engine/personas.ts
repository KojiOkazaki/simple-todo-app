import { InterviewerPersona } from '../types';

export const INTERVIEWER_PERSONAS: InterviewerPersona[] = [
  {
    id: 'tanaka',
    name: '田中 部長',
    role: '人事部長',
    style: 'neutral',
    avatar: '👔',
    description: '経験豊富な人事部長。落ち着いた雰囲気で、候補者の本質を見抜く。',
    speechPatterns: {
      greeting: [
        'よろしくお願いします。本日は面接にお越しいただきありがとうございます。',
        'お忙しい中、ありがとうございます。リラックスして臨んでくださいね。',
      ],
      transition: [
        'ありがとうございます。では次の質問に移りましょう。',
        'なるほど、よく分かりました。続けてお聞きしたいのですが、',
        '承知しました。それでは、',
      ],
      followUp: [
        'もう少し具体的に教えていただけますか？',
        'その点について、もう少し詳しくお聞かせください。',
        '例えば、どのような場面がありましたか？',
      ],
      positive: [
        'なるほど、興味深いお話ですね。',
        'しっかりとしたお考えをお持ちですね。',
        'よく考えられていますね。',
      ],
      probing: [
        'それは具体的にどういうことでしょうか？',
        'もう少し掘り下げてお聞きしたいのですが、',
        'その経験から何を学びましたか？',
      ],
      closing: [
        '本日は貴重なお時間をいただきありがとうございました。',
        '以上で面接は終了です。お疲れ様でした。',
      ],
    },
  },
  {
    id: 'suzuki',
    name: '鈴木 課長',
    role: '現場マネージャー',
    style: 'friendly',
    avatar: '😊',
    description: '親しみやすい現場のマネージャー。実務経験を重視し、チーム適性を見る。',
    speechPatterns: {
      greeting: [
        'こんにちは！リラックスしてお話しましょう。',
        'ようこそ！堅くならずに、ありのままのお話を聞かせてくださいね。',
      ],
      transition: [
        'いいお話ですね！では次に、',
        'ありがとうございます。ところで、',
        'そうなんですね。じゃあ、こちらも聞いていいですか？',
      ],
      followUp: [
        'へえ、面白いですね！もっと聞かせてください。',
        'そこをもう少し教えてもらえますか？',
        'いい経験ですね。具体的にはどんな感じでしたか？',
      ],
      positive: [
        'すごいですね！',
        'なるほど、それは素晴らしい経験ですね。',
        'いいですね、とても共感できます。',
      ],
      probing: [
        'そのとき、周りの反応はどうでしたか？',
        'チームではどんな役割を果たしましたか？',
        'うまくいかなかったこともありましたか？',
      ],
      closing: [
        '今日はお話できてよかったです。ありがとうございました！',
        'とても楽しいお話でした。お疲れ様です！',
      ],
    },
  },
  {
    id: 'yamada',
    name: '山田 取締役',
    role: '役員',
    style: 'strict',
    avatar: '🏢',
    description: '厳格な役員。論理性と志の高さを厳しくチェックする。',
    speechPatterns: {
      greeting: [
        '面接を始めます。簡潔に、的確にお答えください。',
        'お時間をいただきます。本質的なお話をお聞かせください。',
      ],
      transition: [
        '結構です。次の質問です。',
        '分かりました。では、',
        '次に進みます。',
      ],
      followUp: [
        'それだけですか？もっと深い理由があるのでは？',
        '具体的な数字や成果を教えてください。',
        '根拠を示してください。',
      ],
      positive: [
        '的確な回答ですね。',
        'よく考えられています。',
      ],
      probing: [
        'なぜそう考えるのですか？',
        '他の選択肢は検討しなかったのですか？',
        'その判断の根拠は何ですか？',
        '失敗した場合のプランBは考えていましたか？',
      ],
      closing: [
        '以上です。お疲れ様でした。',
        '面接は以上となります。結果は追ってご連絡します。',
      ],
    },
  },
  {
    id: 'sato',
    name: '佐藤 主任',
    role: '技術リーダー',
    style: 'neutral',
    avatar: '💻',
    description: '技術部門のリーダー。論理的思考と問題解決能力を見極める。',
    speechPatterns: {
      greeting: [
        'よろしくお願いします。技術面を中心にお話を伺います。',
        'こんにちは。スキルや経験について詳しくお聞きしたいと思います。',
      ],
      transition: [
        'ありがとうございます。では技術的な質問をさせてください。',
        '分かりました。次のテーマに移りますね。',
      ],
      followUp: [
        'その技術を選んだ理由は何ですか？',
        'どのような技術的課題がありましたか？',
        '実装のアプローチをもう少し教えてください。',
      ],
      positive: [
        '技術的な理解が深いですね。',
        'しっかりとした経験をお持ちですね。',
      ],
      probing: [
        'スケーラビリティについてはどう考えますか？',
        'その設計の trade-off は何でしたか？',
        '最新の技術トレンドについてどうお考えですか？',
      ],
      closing: [
        '技術面のお話、大変参考になりました。ありがとうございます。',
        '以上です。お疲れ様でした。',
      ],
    },
  },
  {
    id: 'watanabe',
    name: '渡辺 人事',
    role: '採用担当',
    style: 'pressure',
    avatar: '📋',
    description: '圧迫面接スタイルの採用担当。ストレス耐性を見る。',
    speechPatterns: {
      greeting: [
        '時間がないので、早速始めましょう。',
        '面接を始めます。要点を絞って答えてください。',
      ],
      transition: [
        'では次。',
        '分かりました。次の質問です。',
      ],
      followUp: [
        'それは本当ですか？少し曖昧に聞こえますが。',
        'もっと明確に答えてください。',
        'その程度の経験で大丈夫だと思いますか？',
      ],
      positive: [
        'まあ、悪くないですね。',
        'それなりに考えているようですね。',
      ],
      probing: [
        '他の候補者と比べて、あなたの強みは何ですか？',
        '当社でなければならない理由が弱いように感じますが？',
        'その経験が当社でどう活きるのか、具体的に説明してください。',
        '正直に言って、あなたを採用するメリットは何ですか？',
      ],
      closing: [
        '以上です。結果は後日通知します。',
        'これで面接は終了です。',
      ],
    },
  },
];

export function getPersonaById(id: string): InterviewerPersona | undefined {
  return INTERVIEWER_PERSONAS.find(p => p.id === id);
}

export function getPersonasForType(type: 'individual' | 'panel' | 'group'): InterviewerPersona[] {
  switch (type) {
    case 'individual':
      return [INTERVIEWER_PERSONAS[0]];
    case 'panel':
      return [INTERVIEWER_PERSONAS[0], INTERVIEWER_PERSONAS[1], INTERVIEWER_PERSONAS[3]];
    case 'group':
      return [INTERVIEWER_PERSONAS[0], INTERVIEWER_PERSONAS[2]];
  }
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
