export type TabId = 'lifeline' | 'strengths' | 'gakuchika' | 'values' | 'dashboard';

export const METI_STRENGTHS = [
  { category: '前に踏み出す力 (アクション)', items: ['主体性', '働きかけ力', '実行力'] },
  { category: '考え抜く力 (シンキング)', items: ['課題発見力', '計画力', '創造力'] },
  { category: 'チームで働く力 (チームワーク)', items: ['発信力', '傾聴力', '柔軟性', '情況把握力', '規律性', 'ストレスコントロール力'] },
];

export const VALUE_LIST = [
  '安定性', '成長環境', '社会貢献', 'ワークライフバランス',
  '給料・待遇', '人間関係・チーム', '裁量権・自由度', '専門性が身につく',
  'グローバルな活躍', '企業理念への共感', '新しいことへの挑戦', '顧客に寄り添う',
];

export interface LifelineItem {
  id: string;
  period: string;
  score: number;
  event: string;
  reason: string;
}

export interface StrengthsData {
  selectedStrengths: string[];
  episode: string;
  prText: string;
}

export interface GakuchikaData {
  title: string;
  detail: string;
  difficulty: string;
  overcoming: string;
}

export interface ValuesData {
  selectedValues: string[];
  criteria: string;
  future: string;
  coreValue: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
