import { useState, useRef, useEffect, useCallback } from 'react';
import { InterviewEngine } from '../engine/InterviewEngine';
import { InterviewConfig, Message, InterviewFeedbackData, InterviewerPersona } from '../types';
import { generateOverallFeedback } from '../engine/evaluator';
import MessageBubble from './MessageBubble';
import AvatarView from './AvatarView';

interface InterviewSessionProps {
  config: InterviewConfig;
  scenarioId: string;
  onFinish: (feedback: InterviewFeedbackData) => void;
  onBack: () => void;
}

const PHASE_LABELS: Record<string, string> = {
  introduction: '導入',
  self_introduction: '自己紹介',
  motivation: '志望動機',
  experience: '経験・ガクチカ',
  strength_weakness: '強み・弱み',
  industry_specific: '業界質問',
  reverse_question: '逆質問',
  closing: '終了',
};

export default function InterviewSession({
  config,
  scenarioId,
  onFinish,
  onBack,
}: InterviewSessionProps) {
  const [engine] = useState(() => new InterviewEngine(config, scenarioId));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      setIsTyping(true);
      setTimeout(() => {
        const openingMessages = engine.startInterview();
        setMessages(openingMessages);
        setIsTyping(false);
      }, 1000);
    }
  }, [started, engine]);

  const showInterviewerMessages = useCallback((
    interviewerMsgs: Message[],
    onComplete: () => void,
  ) => {
    let delay = 800;
    interviewerMsgs.forEach((msg, i) => {
      setTimeout(() => {
        setSpeakingId(msg.speakerId);
        setMessages(prev => [...prev, msg]);
        if (i === interviewerMsgs.length - 1) {
          setTimeout(() => {
            setSpeakingId(null);
            onComplete();
          }, 600);
        }
      }, delay);
      delay += 600;
    });

    if (interviewerMsgs.length === 0) {
      onComplete();
    }
  }, []);

  const handleSend = useCallback(async () => {
    if (inputValue.trim() === '' || !engine.isWaitingForCandidate() || isTyping) return;

    const response = inputValue.trim();
    setInputValue('');
    setIsTyping(true);
    setError(null);

    if (engine.isLLMMode()) {
      const candidateMsg: Message = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        speakerId: 'candidate',
        speakerName: config.candidateName || 'あなた',
        speakerAvatar: '',
        content: response,
        timestamp: Date.now(),
        type: 'candidate',
        phase: engine.getCurrentPhase(),
      };
      setMessages(prev => [...prev, candidateMsg]);

      try {
        const responseMessages = await engine.processResponseAsync(response);
        const interviewerMsgs = responseMessages.filter(m => m.type !== 'candidate');

        showInterviewerMessages(interviewerMsgs, () => {
          setIsTyping(false);
          if (!engine.isActive()) {
            setTimeout(() => {
              const feedback = generateOverallFeedback(engine.getScores());
              onFinish(feedback);
            }, 1500);
          }
        });
      } catch (e) {
        console.error('LLM processing error:', e);
        setError('AI応答の生成中にエラーが発生しました。ルールベースで続行します。');
        const fallbackMessages = engine.processResponse(response);
        const interviewerMsgs = fallbackMessages.filter(m => m.type !== 'candidate');

        showInterviewerMessages(interviewerMsgs, () => {
          setIsTyping(false);
          if (!engine.isActive()) {
            setTimeout(() => {
              const feedback = generateOverallFeedback(engine.getScores());
              onFinish(feedback);
            }, 1500);
          }
        });
      }
    } else {
      const responseMessages = engine.processResponse(response);
      const candidateMsg = responseMessages.find(m => m.type === 'candidate');
      if (candidateMsg) {
        setMessages(prev => [...prev, candidateMsg]);
      }
      const interviewerMsgs = responseMessages.filter(m => m.type !== 'candidate');

      showInterviewerMessages(interviewerMsgs, () => {
        setIsTyping(false);
        if (!engine.isActive()) {
          setTimeout(() => {
            const feedback = generateOverallFeedback(engine.getScores());
            onFinish(feedback);
          }, 1500);
        }
      });
    }

    textareaRef.current?.focus();
  }, [inputValue, isTyping, engine, config, onFinish, showInterviewerMessages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const progress = engine.getProgress();
  const currentPhase = engine.getCurrentPhase();
  const interviewers = engine.getSession().interviewers;

  return (
    <div className={`session-container ${config.enableAvatar ? 'with-avatar' : ''}`}>
      {/* Header */}
      <div className="session-header">
        <button className="back-btn" onClick={onBack}>戻る</button>
        <div className="session-info">
          <h2>
            面接シミュレーション
            {engine.isLLMMode() && (
              <span className="ai-badge">{engine.getLLMProvider().toUpperCase()}</span>
            )}
          </h2>
          <div className="session-meta">
            <span className="phase-badge">{PHASE_LABELS[currentPhase] || currentPhase}</span>
            <span className="progress-text">質問 {progress.current + 1} / {progress.total}</span>
          </div>
        </div>
        <div className="interviewer-badges">
          {interviewers.map((p: InterviewerPersona) => (
            <span
              key={p.id}
              className={`interviewer-badge ${speakingId === p.id ? 'speaking' : ''}`}
              title={`${p.name}（${p.role}）`}
            >
              {p.avatar}
            </span>
          ))}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${((progress.current + 1) / progress.total) * 100}%` }}
        />
      </div>

      <div className="session-body">
        {/* 3D Avatar Panel */}
        {config.enableAvatar && (
          <div className="avatar-panel">
            <div className="avatar-scene">
              {interviewers.map((p: InterviewerPersona) => (
                <AvatarView
                  key={p.id}
                  personaId={p.id}
                  personaName={p.name}
                  style={p.style}
                  isSpeaking={speakingId === p.id}
                  isActive={true}
                />
              ))}
            </div>
            <div className="scene-label">面接室</div>
          </div>
        )}

        {/* Messages */}
        <div className="messages-container">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="typing-text">
                {engine.isLLMMode() ? 'AI面接官が考え中...' : '面接官が入力中...'}
              </span>
            </div>
          )}
          {error && <div className="error-message">{error}</div>}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="input-area">
        {engine.isWaitingForCandidate() && !isTyping ? (
          <>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="回答を入力してください... (Enterで送信、Shift+Enterで改行)"
              rows={3}
              className="response-input"
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={inputValue.trim() === ''}
            >
              送信
            </button>
          </>
        ) : (
          <div className="waiting-message">
            {engine.isActive()
              ? (engine.isLLMMode() ? 'AI面接官が応答を生成中...' : '面接官の発言をお待ちください...')
              : '面接が終了しました。フィードバックを準備しています...'}
          </div>
        )}
      </div>
    </div>
  );
}
