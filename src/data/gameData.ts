import { EnemyData, PlayerAction, GameEvent, Player } from '../types';

export const INITIAL_STAT_POINTS = 10;
export const BASE_STAT = 1;
export const INITIAL_HP = 100;
export const HP_RECOVERY_BETWEEN_STAGES = 30;

export const PLAYER_ACTIONS: PlayerAction[] = [
  {
    id: 'selfPR',
    name: '自己PRする',
    description: 'コミュ力で勝負！',
    statKey: 'communication',
  },
  {
    id: 'techAppeal',
    name: '技術力をアピール',
    description: '技術力で圧倒！',
    statKey: 'technical',
  },
  {
    id: 'showPassion',
    name: '熱意を見せる',
    description: 'やる気で押し切る！',
    statKey: 'motivation',
  },
  {
    id: 'trustLuck',
    name: '運に頼る',
    description: 'ハイリスク・ハイリターン！',
    statKey: 'luck',
  },
];

export const ENEMIES: EnemyData[] = [
  {
    name: 'ES審査官',
    title: 'エントリーシート審査員',
    hp: 30,
    attack: 8,
    stageName: 'Stage 1: エントリーシート選考',
    actions: [
      { name: '書類不備を指摘', minDamage: 5, maxDamage: 10, message: '「志望動機が薄いですね...」' },
      { name: '誤字脱字チェック', minDamage: 3, maxDamage: 8, message: '「ここ、誤字がありますよ」' },
      { name: '経歴に疑問', minDamage: 6, maxDamage: 12, message: '「この空白期間は何ですか？」' },
    ],
  },
  {
    name: '若手人事',
    title: '人事部 採用担当',
    hp: 50,
    attack: 12,
    stageName: 'Stage 2: 一次面接',
    actions: [
      { name: '定番質問', minDamage: 8, maxDamage: 14, message: '「あなたの強みと弱みを教えてください」' },
      { name: '深掘り質問', minDamage: 10, maxDamage: 16, message: '「それは具体的にどういうことですか？」' },
      { name: '圧迫気味の質問', minDamage: 7, maxDamage: 12, message: '「うちじゃなくてもいいんじゃない？」' },
    ],
  },
  {
    name: 'ベテラン面接官',
    title: '部長クラス面接官',
    hp: 70,
    attack: 16,
    stageName: 'Stage 3: 二次面接',
    actions: [
      { name: '鋭いツッコミ', minDamage: 12, maxDamage: 20, message: '「その経験から何を学びましたか？」' },
      { name: 'ケース問題', minDamage: 14, maxDamage: 22, message: '「この市場規模を推定してください」' },
      { name: '沈黙の圧力', minDamage: 8, maxDamage: 15, message: '「...（じっと見つめている）」' },
    ],
  },
  {
    name: '役員',
    title: '取締役 最終面接官',
    hp: 90,
    attack: 20,
    stageName: 'Stage 4: 役員面接',
    actions: [
      { name: '人生観を問う', minDamage: 15, maxDamage: 25, message: '「10年後どうなっていたい？」' },
      { name: '価値観の揺さぶり', minDamage: 18, maxDamage: 28, message: '「本当にうちでいいの？他社は？」' },
      { name: '覚悟を試す', minDamage: 12, maxDamage: 20, message: '「最も辛かった経験を教えて」' },
    ],
  },
  {
    name: '社長',
    title: '代表取締役社長',
    hp: 120,
    attack: 25,
    stageName: 'Final Stage: 最終面接（社長）',
    actions: [
      { name: '威圧のオーラ', minDamage: 18, maxDamage: 30, message: '「君は何のためにここにいるのかね？」' },
      { name: '本質を見抜く眼', minDamage: 20, maxDamage: 35, message: '「嘘をついているね？本音を聞こう」' },
      { name: '最終試練', minDamage: 15, maxDamage: 25, message: '「我が社に入って何を成し遂げたい？」' },
      { name: '沈黙の帝王', minDamage: 10, maxDamage: 20, message: '「...（腕を組んで黙っている）」' },
    ],
  },
];

export const EVENTS: GameEvent[] = [
  {
    title: 'OB訪問成功！',
    description: '先輩社員から有益なアドバイスをもらった！',
    effect: (player: Player): Player => ({
      ...player,
      stats: {
        ...player.stats,
        communication: player.stats.communication + 1,
        technical: player.stats.technical + 1,
      },
    }),
    effectText: 'コミュ力+1、技術力+1',
  },
  {
    title: '企業研究の成果！',
    description: '徹底的に企業を研究した。知識が深まった！',
    effect: (player: Player): Player => ({
      ...player,
      stats: { ...player.stats, technical: player.stats.technical + 2 },
    }),
    effectText: '技術力+2',
  },
  {
    title: '友達と面接練習！',
    description: '友達と模擬面接をして自信がついた！',
    effect: (player: Player): Player => ({
      ...player,
      stats: { ...player.stats, communication: player.stats.communication + 2 },
    }),
    effectText: 'コミュ力+2',
  },
  {
    title: 'エナジードリンク！',
    description: '気合いを入れるためにエナジードリンクを飲んだ！',
    effect: (player: Player): Player => ({
      ...player,
      hp: Math.min(player.maxHp, player.hp + 25),
    }),
    effectText: 'HP+25回復',
  },
  {
    title: '不採用通知が届いた...',
    description: '別の企業からお祈りメールが届いた。少し凹む...',
    effect: (player: Player): Player => ({
      ...player,
      hp: Math.max(1, player.hp - 10),
    }),
    effectText: 'HP-10',
  },
  {
    title: '面接対策セミナーに参加！',
    description: '就活のプロから面接のコツを学んだ！',
    effect: (player: Player): Player => ({
      ...player,
      stats: { ...player.stats, motivation: player.stats.motivation + 2 },
    }),
    effectText: 'やる気+2',
  },
  {
    title: 'お守りを購入！',
    description: '合格祈願のお守りを買った。ご利益があるかも？',
    effect: (player: Player): Player => ({
      ...player,
      stats: { ...player.stats, luck: player.stats.luck + 2 },
    }),
    effectText: '運+2',
  },
  {
    title: 'ぐっすり眠れた！',
    description: '久しぶりにぐっすり眠れた。体力全回復！',
    effect: (player: Player): Player => ({
      ...player,
      hp: player.maxHp,
    }),
    effectText: 'HP全回復！',
  },
  {
    title: '就活仲間と情報交換！',
    description: '就活仲間から有益な情報をゲットした！',
    effect: (player: Player): Player => ({
      ...player,
      stats: {
        ...player.stats,
        motivation: player.stats.motivation + 1,
        luck: player.stats.luck + 1,
      },
    }),
    effectText: 'やる気+1、運+1',
  },
  {
    title: 'スーツのボタンが取れた！',
    description: '面接直前にスーツのボタンが取れた...',
    effect: (player: Player): Player => ({
      ...player,
      hp: Math.max(1, player.hp - 5),
      stats: { ...player.stats, luck: Math.max(1, player.stats.luck - 1) },
    }),
    effectText: 'HP-5、運-1',
  },
];

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculatePlayerDamage(
  statValue: number,
  statKey: string,
): { damage: number; isCritical: boolean } {
  if (statKey === 'luck') {
    const roll = Math.random();
    if (roll < 0.2) {
      return { damage: 0, isCritical: false };
    }
    if (roll > 0.85) {
      return { damage: statValue * 8, isCritical: true };
    }
    return { damage: statValue * randomInt(1, 5), isCritical: false };
  }
  const base = statValue * 3 + randomInt(1, 5);
  const isCritical = Math.random() > 0.9;
  return { damage: isCritical ? base * 2 : base, isCritical };
}

export function getRandomEvent(): GameEvent {
  return EVENTS[randomInt(0, EVENTS.length - 1)];
}
