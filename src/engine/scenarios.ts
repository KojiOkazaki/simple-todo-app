import { InterviewScenario, InterviewPhase } from '../types';

const STANDARD_PHASES: InterviewPhase[] = [
  'introduction',
  'self_introduction',
  'motivation',
  'experience',
  'strength_weakness',
  'industry_specific',
  'reverse_question',
  'closing',
];

export const SCENARIOS: InterviewScenario[] = [
  {
    id: 'individual-standard',
    name: '個人面接（標準）',
    description: '一般的な1対1の面接です。人事担当者と面接を行います。基本的な質問からじっくり話を聞いてもらえます。',
    type: 'individual',
    phases: STANDARD_PHASES,
    interviewerIds: ['tanaka'],
    questionCountRange: [5, 8],
  },
  {
    id: 'individual-pressure',
    name: '個人面接（圧迫）',
    description: '厳しい質問が飛ぶ圧迫面接のシミュレーションです。ストレス耐性を鍛えたい方向け。',
    type: 'individual',
    phases: STANDARD_PHASES,
    interviewerIds: ['watanabe'],
    questionCountRange: [4, 6],
  },
  {
    id: 'panel-standard',
    name: 'パネル面接（複数面接官）',
    description: '人事・現場・技術の3名による面接です。複数の視点から質問されます。',
    type: 'panel',
    phases: STANDARD_PHASES,
    interviewerIds: ['tanaka', 'suzuki', 'sato'],
    questionCountRange: [6, 10],
  },
  {
    id: 'panel-executive',
    name: '役員面接',
    description: '最終面接を想定した役員面接です。志の高さと企業理解が問われます。',
    type: 'panel',
    phases: [
      'introduction',
      'self_introduction',
      'motivation',
      'experience',
      'reverse_question',
      'closing',
    ],
    interviewerIds: ['yamada', 'tanaka'],
    questionCountRange: [4, 6],
  },
  {
    id: 'group-standard',
    name: '集団面接',
    description: '他の候補者もいる集団面接のシミュレーションです。簡潔で印象的な回答が求められます。',
    type: 'group',
    phases: [
      'introduction',
      'self_introduction',
      'motivation',
      'strength_weakness',
      'reverse_question',
      'closing',
    ],
    interviewerIds: ['tanaka', 'yamada'],
    questionCountRange: [4, 6],
  },
];

export function getScenarioById(id: string): InterviewScenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}

export function getScenariosForType(type: 'individual' | 'panel' | 'group'): InterviewScenario[] {
  return SCENARIOS.filter(s => s.type === type);
}
