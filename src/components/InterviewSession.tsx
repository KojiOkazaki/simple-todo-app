import { useState, useRef, useEffect } from 'react';
import { InterviewEngine } from '../engine/InterviewEngine';
import { InterviewConfig, Message, InterviewFeedbackData } from '../types';
import { generateOverallFeedback } from '../engine/evaluator';
import MessageBubble from './MessageBubble';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!started) {
      setStarted(true);
      // Start interview with a typing delay
      setIsTyping(true);
      setTimeout(() => {
        const openingMessages = engine.startInterview();
        setMessages(openingMessages);
        setIsTyping(false);
      }, 1000);
    }
  }, [started, engine]);

  const handleSend = () => {
    if (inputValue.trim() === '' || !engine.isWaitingForCandidate() || isTyping) return;

    const response = inputValue.trim();
    setInputValue('');

    // Simulate typing delay for interviewer response
    setIsTyping(true);

    // Process response with a delay for realism
    const responseMessages = engine.processResponse(response);

    // Show candidate message immediately
    const candidateMsg = responseMessages.find(m => m.type === 'candidate');
    if (candidateMsg) {
      setMessages(prev => [...prev, candidateMsg]);
    }

    // Show interviewer messages with staggered delay
    const interviewerMsgs = responseMessages.filter(m => m.type !== 'candidate');
    let delay = 800;
    interviewerMsgs.forEach((msg, i) => {
      setTimeout(() => {
        setMessages(prev => [...prev, msg]);
        if (i === interviewerMsgs.length - 1) {
          setIsTyping(false);

          // Check if interview ended
          if (!engine.isActive()) {
            setTimeout(() => {
              const feedback = generateOverallFeedback(engine.getScores());
              onFinish(feedback);
            }, 1500);
          }
        }
      }, delay);
      delay += 600;
    });

    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const progress = engine.getProgress();
  const currentPhase = engine.getCurrentPhase();

  return (
    <div className="session-container">
      {/* Header */}
      <div className="session-header">
        <button className="back-btn" onClick={onBack}>
          戻る
        </button>
        <div className="session-info">
          <h2>面接シミュレーション</h2>
          <div className="session-meta">
            <span className="phase-badge">
              {PHASE_LABELS[currentPhase] || currentPhase}
            </span>
            <span className="progress-text">
              質問 {progress.current + 1} / {progress.total}
            </span>
          </div>
        </div>
        <div className="interviewer-badges">
          {engine.getSession().interviewers.map(p => (
            <span key={p.id} className="interviewer-badge" title={`${p.name}（${p.role}）`}>
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
            <span className="typing-text">面接官が入力中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
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
              ? '面接官の発言をお待ちください...'
              : '面接が終了しました。フィードバックを準備しています...'}
          </div>
        )}
      </div>
    </div>
  );
}
