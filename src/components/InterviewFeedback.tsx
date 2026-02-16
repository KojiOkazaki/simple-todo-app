import { InterviewFeedbackData } from '../types';

interface InterviewFeedbackProps {
  feedback: InterviewFeedbackData;
  onRestart: () => void;
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const percentage = (score / max) * 100;
  const color = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#eab308' : percentage >= 40 ? '#f97316' : '#ef4444';
  return (
    <div className="score-bar-container">
      <div className="score-bar-bg">
        <div
          className="score-bar-fill"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <span className="score-value">{score}/{max}</span>
    </div>
  );
}

function OverallScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#ef4444';
  const grade = score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
  const gradeLabel = score >= 80 ? '素晴らしい' : score >= 60 ? '良好' : score >= 40 ? '改善余地あり' : '要練習';

  return (
    <div className="overall-score">
      <div className="score-circle" style={{ borderColor: color }}>
        <span className="score-grade" style={{ color }}>{grade}</span>
        <span className="score-number">{score}<small>/100</small></span>
      </div>
      <span className="score-label" style={{ color }}>{gradeLabel}</span>
    </div>
  );
}

export default function InterviewFeedback({ feedback, onRestart }: InterviewFeedbackProps) {
  return (
    <div className="feedback-container">
      <div className="feedback-header">
        <h1>面接フィードバック</h1>
        <p>あなたの面接パフォーマンスを分析しました</p>
      </div>

      {/* Overall Score */}
      <div className="feedback-section overall-section">
        <OverallScoreCircle score={feedback.overallScore} />
        <div className="overall-stats">
          <div className="stat">
            <span className="stat-label">回答数</span>
            <span className="stat-value">{feedback.totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Phase Breakdown */}
      {feedback.phaseBreakdown.length > 0 && (
        <div className="feedback-section">
          <h2>フェーズ別スコア</h2>
          <div className="phase-breakdown">
            {feedback.phaseBreakdown.map(pb => (
              <div key={pb.phase} className="phase-item">
                <span className="phase-name">{pb.phaseName}</span>
                <ScoreBar score={pb.score} max={100} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="feedback-section">
        <h2>総合評価</h2>
        <div className="summary-card">
          <div className="summary-group">
            <h3>良かった点</h3>
            <ul className="summary-list strengths-list">
              {feedback.summary.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="summary-group">
            <h3>改善ポイント</h3>
            <ul className="summary-list improvements-list">
              {feedback.summary.improvements.map((imp, i) => (
                <li key={i}>{imp}</li>
              ))}
            </ul>
          </div>
          <div className="advice-box">
            <h3>アドバイス</h3>
            <p>{feedback.summary.advice}</p>
          </div>
        </div>
      </div>

      {/* Individual Question Scores */}
      {feedback.responseScores.length > 0 && (
        <div className="feedback-section">
          <h2>質問別フィードバック</h2>
          <div className="question-scores">
            {feedback.responseScores.map((rs, idx) => (
              <details key={rs.questionId} className="question-detail">
                <summary className="question-summary">
                  <span className="question-number">Q{idx + 1}</span>
                  <span className="question-text-preview">{rs.question}</span>
                  <span className="question-avg-score">
                    {Math.round(
                      (Object.values(rs.scores).reduce((a, b) => a + b, 0) / 5) * 20
                    )}点
                  </span>
                </summary>
                <div className="question-detail-content">
                  <div className="qa-pair">
                    <div className="qa-question">
                      <strong>質問:</strong> {rs.question}
                    </div>
                    <div className="qa-response">
                      <strong>あなたの回答:</strong> {rs.response}
                    </div>
                  </div>

                  <div className="score-breakdown">
                    <div className="score-item">
                      <span>関連性</span>
                      <ScoreBar score={rs.scores.relevance} />
                    </div>
                    <div className="score-item">
                      <span>構成力</span>
                      <ScoreBar score={rs.scores.structure} />
                    </div>
                    <div className="score-item">
                      <span>具体性</span>
                      <ScoreBar score={rs.scores.specificity} />
                    </div>
                    <div className="score-item">
                      <span>熱意</span>
                      <ScoreBar score={rs.scores.enthusiasm} />
                    </div>
                    <div className="score-item">
                      <span>伝達力</span>
                      <ScoreBar score={rs.scores.communication} />
                    </div>
                  </div>

                  <p className="question-feedback">{rs.feedback}</p>

                  {rs.strengths.length > 0 && (
                    <div className="mini-feedback">
                      <strong>良い点:</strong>
                      <ul>
                        {rs.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {rs.improvements.length > 0 && (
                    <div className="mini-feedback">
                      <strong>改善点:</strong>
                      <ul>
                        {rs.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="feedback-actions">
        <button className="restart-btn" onClick={onRestart}>
          もう一度練習する
        </button>
      </div>
    </div>
  );
}
