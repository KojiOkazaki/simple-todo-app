import { useState } from 'react';
import { InterviewConfig, InterviewType, Industry, Difficulty } from '../types';
import { SCENARIOS } from '../engine/scenarios';
import { getPersonaById } from '../engine/personas';

interface InterviewSetupProps {
  onStart: (config: InterviewConfig, scenarioId: string) => void;
}

const INDUSTRY_LABELS: Record<Industry, string> = {
  it: 'IT・テクノロジー',
  finance: '金融・銀行',
  consulting: 'コンサルティング',
  manufacturing: 'メーカー・製造業',
  trading: '商社',
  media: 'マスコミ・メディア',
  general: '業界共通',
};

const TYPE_LABELS: Record<InterviewType, string> = {
  individual: '個人面接',
  panel: 'パネル面接',
  group: '集団面接',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '初級（基本的な質問中心）',
  intermediate: '中級（深掘り質問あり）',
  advanced: '上級（圧迫・ケース質問あり）',
};

export default function InterviewSetup({ onStart }: InterviewSetupProps) {
  const [selectedType, setSelectedType] = useState<InterviewType>('individual');
  const [selectedScenarioId, setSelectedScenarioId] = useState(SCENARIOS[0].id);
  const [industry, setIndustry] = useState<Industry>('general');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [candidateName, setCandidateName] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [targetPosition, setTargetPosition] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  const filteredScenarios = SCENARIOS.filter(s => s.type === selectedType);
  const selectedScenario = SCENARIOS.find(s => s.id === selectedScenarioId) || filteredScenarios[0];

  const handleTypeChange = (type: InterviewType) => {
    setSelectedType(type);
    const firstScenario = SCENARIOS.find(s => s.type === type);
    if (firstScenario) {
      setSelectedScenarioId(firstScenario.id);
      setQuestionCount(firstScenario.questionCountRange[0]);
    }
  };

  const handleStart = () => {
    const config: InterviewConfig = {
      type: selectedType,
      industry,
      difficulty,
      candidateName: candidateName || '候補者',
      targetCompany: targetCompany || '株式会社サンプル',
      targetPosition: targetPosition || '総合職',
      questionCount,
      geminiApiKey: geminiApiKey.trim() || undefined,
    };
    onStart(config, selectedScenarioId);
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>面接シミュレーション</h1>
        <p className="setup-subtitle">
          就活面接の練習ができるシミュレーションサービスです。
          AIが面接官の役割を担い、リアルな面接体験を提供します。
        </p>
      </div>

      <div className="setup-form">
        {/* Interview Type */}
        <div className="form-section">
          <h2>面接タイプ</h2>
          <div className="type-selector">
            {(Object.keys(TYPE_LABELS) as InterviewType[]).map(type => (
              <button
                key={type}
                className={`type-btn ${selectedType === type ? 'active' : ''}`}
                onClick={() => handleTypeChange(type)}
              >
                <span className="type-icon">
                  {type === 'individual' ? '👤' : type === 'panel' ? '👥' : '👫'}
                </span>
                <span className="type-label">{TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scenario */}
        <div className="form-section">
          <h2>シナリオ</h2>
          <div className="scenario-list">
            {filteredScenarios.map(scenario => (
              <label
                key={scenario.id}
                className={`scenario-card ${selectedScenarioId === scenario.id ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="scenario"
                  value={scenario.id}
                  checked={selectedScenarioId === scenario.id}
                  onChange={() => {
                    setSelectedScenarioId(scenario.id);
                    setQuestionCount(scenario.questionCountRange[0]);
                  }}
                />
                <div className="scenario-content">
                  <strong>{scenario.name}</strong>
                  <p>{scenario.description}</p>
                  <div className="scenario-interviewers">
                    {scenario.interviewerIds.map(id => {
                      const persona = getPersonaById(id);
                      return persona ? (
                        <span key={id} className="interviewer-tag">
                          {persona.avatar} {persona.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Interviewer Profiles */}
        {selectedScenario && (
          <div className="form-section">
            <h2>面接官プロフィール</h2>
            <div className="interviewer-profiles">
              {selectedScenario.interviewerIds.map(id => {
                const persona = getPersonaById(id);
                if (!persona) return null;
                return (
                  <div key={id} className="profile-card">
                    <div className="profile-avatar">{persona.avatar}</div>
                    <div className="profile-info">
                      <strong>{persona.name}</strong>
                      <span className="profile-role">{persona.role}</span>
                      <p className="profile-desc">{persona.description}</p>
                      <span className={`style-badge style-${persona.style}`}>
                        {persona.style === 'friendly' ? '温和' :
                         persona.style === 'strict' ? '厳格' :
                         persona.style === 'pressure' ? '圧迫' : '中立'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Industry */}
        <div className="form-section">
          <h2>志望業界</h2>
          <select
            value={industry}
            onChange={e => setIndustry(e.target.value as Industry)}
            className="form-select"
          >
            {(Object.entries(INDUSTRY_LABELS) as [Industry, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="form-section">
          <h2>難易度</h2>
          <div className="difficulty-selector">
            {(Object.entries(DIFFICULTY_LABELS) as [Difficulty, string][]).map(([key, label]) => (
              <label
                key={key}
                className={`difficulty-option ${difficulty === key ? 'active' : ''}`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={key}
                  checked={difficulty === key}
                  onChange={() => setDifficulty(key)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div className="form-section">
          <h2>質問数</h2>
          <div className="question-count">
            <input
              type="range"
              min={selectedScenario?.questionCountRange[0] || 3}
              max={selectedScenario?.questionCountRange[1] || 10}
              value={questionCount}
              onChange={e => setQuestionCount(Number(e.target.value))}
            />
            <span className="count-display">{questionCount} 問</span>
          </div>
        </div>

        {/* Candidate Info */}
        <div className="form-section">
          <h2>あなたの情報</h2>
          <div className="form-grid">
            <div className="form-field">
              <label>お名前</label>
              <input
                type="text"
                placeholder="山田 太郎"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>志望企業名</label>
              <input
                type="text"
                placeholder="株式会社サンプル"
                value={targetCompany}
                onChange={e => setTargetCompany(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label>志望職種</label>
              <input
                type="text"
                placeholder="総合職"
                value={targetPosition}
                onChange={e => setTargetPosition(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Gemini API Key */}
        <div className="form-section">
          <h2>AI面接官モード（任意）</h2>
          <p className="api-key-desc">
            Google Gemini APIキーを入力すると、面接官がAIで動的に応答します。
            キーなしでも定型パターンで面接を体験できます。
          </p>
          <div className="form-field">
            <label>Gemini API Key</label>
            <input
              type="password"
              placeholder="AIza..."
              value={geminiApiKey}
              onChange={e => setGeminiApiKey(e.target.value)}
            />
          </div>
          {geminiApiKey.trim() && (
            <div className="api-key-status active">
              AI面接官モードが有効になります
            </div>
          )}
          {!geminiApiKey.trim() && (
            <div className="api-key-status">
              ルールベースモード（APIキー不要）
            </div>
          )}
        </div>

        {/* Start Button */}
        <button className="start-btn" onClick={handleStart}>
          {geminiApiKey.trim() ? 'AI面接を開始する' : '面接を開始する'}
        </button>
      </div>

      <footer className="setup-footer">
        <p>
          DialogLab の研究に基づくマルチエージェント会話シミュレーション
        </p>
      </footer>
    </div>
  );
}
