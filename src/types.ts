// ===== Interview Simulation Service Types =====
// Inspired by DialogLab's multi-agent conversation architecture

// --- Interview Configuration ---

export type InterviewType = 'individual' | 'panel' | 'group';

export type Industry =
  | 'it'
  | 'finance'
  | 'consulting'
  | 'manufacturing'
  | 'trading'
  | 'media'
  | 'general';

export type InterviewPhase =
  | 'introduction'
  | 'self_introduction'
  | 'motivation'
  | 'experience'
  | 'strength_weakness'
  | 'industry_specific'
  | 'reverse_question'
  | 'closing';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// --- Persona & Agent ---

export interface InterviewerPersona {
  id: string;
  name: string;
  role: string;
  style: 'friendly' | 'strict' | 'neutral' | 'pressure';
  avatar: string; // emoji avatar
  description: string;
  speechPatterns: {
    greeting: string[];
    transition: string[];
    followUp: string[];
    positive: string[];
    probing: string[];
    closing: string[];
  };
}

// --- Question ---

export interface InterviewQuestion {
  id: string;
  phase: InterviewPhase;
  text: string;
  industry: Industry[];
  difficulty: Difficulty;
  followUps: string[];
  evaluationCriteria: string[];
  idealKeywords: string[];
  category: string;
}

// --- Conversation ---

export interface Message {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  content: string;
  timestamp: number;
  type: 'interviewer' | 'candidate' | 'system';
  phase: InterviewPhase;
}

export interface TurnState {
  currentSpeaker: string;
  phase: InterviewPhase;
  questionIndex: number;
  followUpCount: number;
  isWaitingForCandidate: boolean;
}

// --- Interview Session ---

export interface InterviewConfig {
  type: InterviewType;
  industry: Industry;
  difficulty: Difficulty;
  candidateName: string;
  targetCompany: string;
  targetPosition: string;
  questionCount: number;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  interviewers: InterviewerPersona[];
  messages: Message[];
  turnState: TurnState;
  startedAt: number;
  isActive: boolean;
  responseScores: ResponseScore[];
}

// --- Evaluation ---

export interface ResponseScore {
  questionId: string;
  question: string;
  response: string;
  scores: {
    relevance: number;      // 0-5: How relevant the answer is
    structure: number;       // 0-5: STAR method, logical structure
    specificity: number;     // 0-5: Concrete examples vs vague
    enthusiasm: number;      // 0-5: Passion and motivation
    communication: number;   // 0-5: Clarity and conciseness
  };
  feedback: string;
  strengths: string[];
  improvements: string[];
}

export interface InterviewFeedbackData {
  overallScore: number;
  totalQuestions: number;
  responseScores: ResponseScore[];
  summary: {
    strengths: string[];
    improvements: string[];
    advice: string;
  };
  phaseBreakdown: {
    phase: InterviewPhase;
    phaseName: string;
    score: number;
  }[];
}

// --- Scenario ---

export interface InterviewScenario {
  id: string;
  name: string;
  description: string;
  type: InterviewType;
  phases: InterviewPhase[];
  interviewerIds: string[];
  questionCountRange: [number, number];
}

// --- App State ---

export type AppScreen = 'setup' | 'session' | 'feedback';
