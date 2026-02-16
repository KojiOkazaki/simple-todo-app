import {
  InterviewConfig,
  InterviewSession,
  InterviewQuestion,
  InterviewerPersona,
  Message,
  InterviewPhase,
  ResponseScore,
} from '../types';
import { getPersonaById, pickRandom } from './personas';
import { selectQuestionsForInterview } from './questions';
import { getScenarioById, SCENARIOS } from './scenarios';
import { evaluateResponse } from './evaluator';

// DialogLab-inspired interview engine with turn-taking management
// Separates "social setup" (who speaks) from "temporal progression" (how conversation flows)

export class InterviewEngine {
  private session: InterviewSession;
  private questions: InterviewQuestion[];
  private currentQuestionIndex: number;
  private currentFollowUpIndex: number;
  private pendingQuestion: InterviewQuestion | null;

  constructor(config: InterviewConfig, scenarioId?: string) {
    const scenario = scenarioId
      ? getScenarioById(scenarioId)
      : SCENARIOS.find(s => s.type === config.type) || SCENARIOS[0];

    if (!scenario) throw new Error('Scenario not found');

    const interviewers = scenario.interviewerIds
      .map(id => getPersonaById(id))
      .filter((p): p is InterviewerPersona => p !== undefined);

    this.questions = selectQuestionsForInterview(
      config.industry,
      config.difficulty,
      config.questionCount,
      scenario.phases.filter(p => p !== 'introduction' && p !== 'closing'),
    );

    this.currentQuestionIndex = 0;
    this.currentFollowUpIndex = 0;
    this.pendingQuestion = null;

    this.session = {
      id: Date.now().toString(),
      config,
      interviewers,
      messages: [],
      turnState: {
        currentSpeaker: interviewers[0]?.id || '',
        phase: 'introduction',
        questionIndex: 0,
        followUpCount: 0,
        isWaitingForCandidate: false,
      },
      startedAt: Date.now(),
      isActive: true,
      responseScores: [],
    };
  }

  getSession(): InterviewSession {
    return { ...this.session };
  }

  getMessages(): Message[] {
    return [...this.session.messages];
  }

  isWaitingForCandidate(): boolean {
    return this.session.turnState.isWaitingForCandidate;
  }

  isActive(): boolean {
    return this.session.isActive;
  }

  getCurrentPhase(): InterviewPhase {
    return this.session.turnState.phase;
  }

  getProgress(): { current: number; total: number } {
    return {
      current: this.currentQuestionIndex,
      total: this.questions.length,
    };
  }

  getScores(): ResponseScore[] {
    return [...this.session.responseScores];
  }

  // Start the interview - generate opening messages
  startInterview(): Message[] {
    const newMessages: Message[] = [];

    // System message
    newMessages.push(this.createSystemMessage(
      `面接を開始します。面接タイプ: ${this.getTypeLabel(this.session.config.type)}`,
    ));

    // Interviewer greetings
    for (const interviewer of this.session.interviewers) {
      const greeting = pickRandom(interviewer.speechPatterns.greeting);
      newMessages.push(this.createInterviewerMessage(interviewer, greeting));
    }

    // Transition to first question
    this.session.turnState.phase = 'self_introduction';

    // Ask first question
    if (this.questions.length > 0) {
      const firstQ = this.questions[0];
      this.pendingQuestion = firstQ;
      const interviewer = this.selectInterviewerForPhase(firstQ.phase);
      const questionMsg = this.createInterviewerMessage(
        interviewer,
        firstQ.text,
      );
      newMessages.push(questionMsg);
      this.session.turnState.isWaitingForCandidate = true;
      this.session.turnState.phase = firstQ.phase;
    }

    this.session.messages.push(...newMessages);
    return newMessages;
  }

  // Process candidate's response and generate next interviewer action
  processResponse(candidateResponse: string): Message[] {
    if (!this.session.isActive) return [];

    const newMessages: Message[] = [];

    // Add candidate message
    const candidateMsg = this.createCandidateMessage(candidateResponse);
    newMessages.push(candidateMsg);
    this.session.turnState.isWaitingForCandidate = false;

    // Evaluate the response
    if (this.pendingQuestion) {
      const score = evaluateResponse(this.pendingQuestion, candidateResponse);
      this.session.responseScores.push(score);
    }

    // Decide next action based on DialogLab-style turn-taking logic
    const nextAction = this.decideNextAction(candidateResponse);

    switch (nextAction.type) {
      case 'follow_up': {
        const interviewer = this.selectInterviewerForPhase(this.getCurrentPhase());
        // Add a positive/acknowledging comment first
        const ack = pickRandom(interviewer.speechPatterns.positive);
        newMessages.push(this.createInterviewerMessage(interviewer, ack));

        // Then ask follow-up
        const followUp = nextAction.content;
        newMessages.push(this.createInterviewerMessage(interviewer, followUp));
        this.session.turnState.isWaitingForCandidate = true;
        // Keep same pending question for follow-up evaluation context
        break;
      }

      case 'next_question': {
        this.currentQuestionIndex++;
        this.currentFollowUpIndex = 0;

        if (this.currentQuestionIndex >= this.questions.length) {
          // Move to closing
          return this.endInterview(newMessages);
        }

        const nextQ = this.questions[this.currentQuestionIndex];
        this.pendingQuestion = nextQ;
        const interviewer = this.selectInterviewerForPhase(nextQ.phase);

        // Transition comment
        const transition = pickRandom(interviewer.speechPatterns.transition);
        newMessages.push(this.createInterviewerMessage(interviewer, transition));

        // Phase change announcement if applicable
        if (nextQ.phase !== this.getCurrentPhase()) {
          this.session.turnState.phase = nextQ.phase;
        }

        // Ask next question
        newMessages.push(this.createInterviewerMessage(interviewer, nextQ.text));
        this.session.turnState.isWaitingForCandidate = true;
        this.session.turnState.questionIndex = this.currentQuestionIndex;
        break;
      }

      case 'probe': {
        const interviewer = this.selectInterviewerForPhase(this.getCurrentPhase());
        const probe = pickRandom(interviewer.speechPatterns.probing);
        newMessages.push(this.createInterviewerMessage(interviewer, probe));
        this.session.turnState.isWaitingForCandidate = true;
        break;
      }

      case 'end': {
        return this.endInterview(newMessages);
      }
    }

    this.session.messages.push(...newMessages);
    return newMessages;
  }

  private endInterview(newMessages: Message[]): Message[] {
    this.session.turnState.phase = 'closing';

    // Reverse question phase
    const reverseQ = this.questions.find(q => q.phase === 'reverse_question');
    if (reverseQ && !this.session.responseScores.some(s => s.questionId === reverseQ.id)) {
      this.pendingQuestion = reverseQ;
      const interviewer = this.session.interviewers[0];
      newMessages.push(this.createInterviewerMessage(interviewer, reverseQ.text));
      this.session.turnState.isWaitingForCandidate = true;
      this.session.messages.push(...newMessages);
      return newMessages;
    }

    // Closing messages
    for (const interviewer of this.session.interviewers) {
      const closing = pickRandom(interviewer.speechPatterns.closing);
      newMessages.push(this.createInterviewerMessage(interviewer, closing));
    }

    newMessages.push(this.createSystemMessage(
      '面接が終了しました。お疲れ様でした。フィードバックを確認してください。',
    ));

    this.session.isActive = false;
    this.session.turnState.isWaitingForCandidate = false;
    this.session.messages.push(...newMessages);
    return newMessages;
  }

  private decideNextAction(response: string): {
    type: 'follow_up' | 'next_question' | 'probe' | 'end';
    content: string;
  } {
    if (!this.pendingQuestion) {
      return { type: 'next_question', content: '' };
    }

    const q = this.pendingQuestion;

    // Short response -> probe for more
    if (response.length < 30 && this.currentFollowUpIndex === 0) {
      this.currentFollowUpIndex++;
      const interviewer = this.selectInterviewerForPhase(this.getCurrentPhase());
      return {
        type: 'probe',
        content: pickRandom(interviewer.speechPatterns.probing),
      };
    }

    // Has follow-ups and hasn't asked one yet for this question
    if (q.followUps.length > 0 && this.currentFollowUpIndex < 1) {
      this.currentFollowUpIndex++;
      // 60% chance to ask a follow-up (simulates natural conversation flow)
      if (Math.random() < 0.6) {
        const followUp = q.followUps[Math.floor(Math.random() * q.followUps.length)];
        return { type: 'follow_up', content: followUp };
      }
    }

    // Move to next question
    return { type: 'next_question', content: '' };
  }

  private selectInterviewerForPhase(phase: InterviewPhase): InterviewerPersona {
    const interviewers = this.session.interviewers;
    if (interviewers.length === 1) return interviewers[0];

    // DialogLab-style: Different interviewers for different phases
    switch (phase) {
      case 'self_introduction':
      case 'motivation':
        return interviewers[0]; // HR lead
      case 'experience':
      case 'strength_weakness':
        return interviewers.length > 1 ? interviewers[1] : interviewers[0];
      case 'industry_specific':
        return interviewers[interviewers.length - 1]; // Technical/specialist
      case 'reverse_question':
        return interviewers[0]; // Back to lead
      default:
        return interviewers[Math.floor(Math.random() * interviewers.length)];
    }
  }

  private createInterviewerMessage(persona: InterviewerPersona, content: string): Message {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speakerId: persona.id,
      speakerName: `${persona.name}（${persona.role}）`,
      speakerAvatar: persona.avatar,
      content,
      timestamp: Date.now(),
      type: 'interviewer',
      phase: this.session.turnState.phase,
    };
  }

  private createCandidateMessage(content: string): Message {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speakerId: 'candidate',
      speakerName: this.session.config.candidateName || 'あなた',
      speakerAvatar: '🧑‍💼',
      content,
      timestamp: Date.now(),
      type: 'candidate',
      phase: this.session.turnState.phase,
    };
  }

  private createSystemMessage(content: string): Message {
    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      speakerId: 'system',
      speakerName: 'システム',
      speakerAvatar: '🔔',
      content,
      timestamp: Date.now(),
      type: 'system',
      phase: this.session.turnState.phase,
    };
  }

  private getTypeLabel(type: string): string {
    switch (type) {
      case 'individual': return '個人面接';
      case 'panel': return 'パネル面接';
      case 'group': return '集団面接';
      default: return type;
    }
  }
}
