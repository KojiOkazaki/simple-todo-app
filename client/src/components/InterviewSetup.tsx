import { useState, useEffect } from 'react';
import { InterviewConfig, InterviewType, Industry, Difficulty, LLMProvider } from '../types';
import { SCENARIOS } from '../engine/scenarios';
import { getPersonaById } from '../engine/personas';
import { api } from '../api/client';

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
  const [llmProvider, setLlmProvider] = useState<LLMProvider | 'none'>('none');
  const [apiKey, setApiKey] = useState('');
  const [enableAvatar, setEnableAvatar] = useState(true);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [serverProviders, setServerProviders] = useState<{ gemini: boolean; openai: boolean }>({
    gemini: false,
    openai: false,
  });

  useEffect(() => {
    api.health()
      .then(health => {
        setServerStatus('online');
        setServerProviders(health.providers);
        if (health.providers.gemini || health.providers.openai) {
          setLlmProvider(health.providers.gemini ? 'gemini' : 'openai');
        }
      })
      .catch(() => setServerStatus('offline'));
  }, []);

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
      enableAvatar,
      llm: llmProvider !== 'none'
        ? { provider: llmProvider, apiKey: apiKey.trim() || undefined }
        : undefined,
    };
    onStart(config, selectedScenarioId);
  };

  const hasServerKey = (provider: LLMProvider) => serverProviders[provider];
  const needsClientKey = llmProvider !== 'none' && !hasServerKey(llmProvider);

  return (
    <div className="setup-container">
      <div className="setup-header">
        <h1>面接シミュレーション</h1>
        <p className="setup-subtitle">
          DialogLab の研究に基づくマルチエージェント会話シミュレーション。
          3Dアバター面接官がリアルな面接体験を提供します。
        </p>
      </div>

      <div className="setup-form">
        {/* Server Status */}
        <div className="form-section">
          <h2>サーバー接続</h2>
          <div className={`server-status status-${serverStatus}`}>
            <span className="status-dot"></span>
            <span>
              {serverStatus === 'checking' && 'サーバー確認中...'}
              {serverStatus === 'online' && 'サーバー接続済み (localhost:3010)'}
              {serverStatus === 'offline' && 'サーバー未接続 - ルールベースモードで動作'}
            </span>
          </div>
        </div>

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
          <h2>シナリオ（シーン管理）</h2>
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

        {/* 3D Avatar Toggle */}
        <div className="form-section">
          <h2>3Dアバター表示</h2>
          <label className="toggle-option">
            <input
              type="checkbox"
              checked={enableAvatar}
              onChange={e => setEnableAvatar(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {enableAvatar
                ? 'アバター有効 - 面接官が3Dアバターで表示されます'
                : 'アバター無効 - テキストチャットのみ'}
            </span>
          </label>
        </div>

        {/* LLM Provider Selection */}
        <div className="form-section">
          <h2>AI面接官モード</h2>
          <p className="api-key-desc">
            LLMプロバイダーを選択して、面接官がAIで動的に応答するモードを有効にできます。
            {serverStatus === 'online' && ' サーバー経由で安全にAPI呼び出しを行います。'}
          </p>
          <div className="provider-selector">
            <label className={`provider-option ${llmProvider === 'none' ? 'active' : ''}`}>
              <input type="radio" name="provider" value="none" checked={llmProvider === 'none'} onChange={() => setLlmProvider('none')} />
              <span>ルールベース（APIキー不要）</span>
            </label>
            <label className={`provider-option ${llmProvider === 'gemini' ? 'active' : ''}`}>
              <input type="radio" name="provider" value="gemini" checked={llmProvider === 'gemini'} onChange={() => setLlmProvider('gemini')} />
              <span>Google Gemini{hasServerKey('gemini') && <span className="key-badge">サーバーキー設定済</span>}</span>
            </label>
            <label className={`provider-option ${llmProvider === 'openai' ? 'active' : ''}`}>
              <input type="radio" name="provider" value="openai" checked={llmProvider === 'openai'} onChange={() => setLlmProvider('openai')} />
              <span>OpenAI GPT{hasServerKey('openai') && <span className="key-badge">サーバーキー設定済</span>}</span>
            </label>
          </div>

          {needsClientKey && (
            <div className="form-field" style={{ marginTop: 12 }}>
              <label>{llmProvider === 'gemini' ? 'Gemini API Key' : 'OpenAI API Key'}</label>
              <input
                type="password"
                placeholder={llmProvider === 'gemini' ? 'AIza...' : 'sk-...'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>
          )}

          <div className={`api-key-status ${llmProvider !== 'none' ? 'active' : ''}`}>
            {llmProvider === 'none' && 'ルールベースモード（APIキー不要）'}
            {llmProvider !== 'none' && hasServerKey(llmProvider) && `${llmProvider.toUpperCase()} AI面接官モード（サーバーキー使用）`}
            {llmProvider !== 'none' && !hasServerKey(llmProvider) && apiKey.trim() && `${llmProvider.toUpperCase()} AI面接官モード（クライアントキー使用）`}
            {llmProvider !== 'none' && !hasServerKey(llmProvider) && !apiKey.trim() && 'APIキーを入力してください'}
          </div>
        </div>

        {/* Start Button */}
        <button
          className="start-btn"
          onClick={handleStart}
          disabled={llmProvider !== 'none' && !hasServerKey(llmProvider) && !apiKey.trim()}
        >
          {llmProvider !== 'none' ? `${llmProvider.toUpperCase()} AI面接を開始する` : '面接を開始する'}
        </button>
      </div>

      <footer className="setup-footer">
        <p>DialogLab (UIST 2025) の研究に基づくマルチエージェント対話シミュレーション</p>
      </footer>
    </div>
  );
}
