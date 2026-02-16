import React, { useState, useRef, useEffect, useCallback } from 'react';
import useEditorStore, { ConversationMessage } from '../../store/editorStore';
import API_CONFIG from '../../config';

// Interview phases and questions
const INTERVIEW_PHASES = [
  { phase: 'opening', text: '自己紹介をお願いします。', label: '自己紹介' },
  { phase: 'motivation', text: '当社を志望された理由を教えてください。', label: '志望動機' },
  { phase: 'strength', text: 'あなたの強みを教えてください。具体的なエピソードも含めてお願いします。', label: '強み' },
  { phase: 'experience', text: 'これまでの経験で最も困難だったことと、それをどう乗り越えたか教えてください。', label: '困難の克服' },
  { phase: 'future', text: '入社後にどのようなことに取り組みたいですか？', label: '将来のビジョン' },
  { phase: 'closing', text: '最後に何か質問はありますか？', label: '逆質問' },
];

// Voice profiles: different pitch/rate per speaker for browser TTS
const VOICE_PROFILES: Record<string, { pitch: number; rate: number; voiceIndex: number }> = {
  tanaka: { pitch: 0.8, rate: 0.9, voiceIndex: 0 },
  suzuki: { pitch: 1.2, rate: 1.1, voiceIndex: 1 },
  yamada: { pitch: 0.6, rate: 0.8, voiceIndex: 2 },
  sato: { pitch: 1.0, rate: 1.0, voiceIndex: 3 },
  watanabe: { pitch: 1.1, rate: 1.15, voiceIndex: 0 },
};

interface InterviewState {
  isActive: boolean;
  currentPhaseIndex: number;
  candidateName: string;
  targetCompany: string;
  targetPosition: string;
  isProcessing: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

interface ServerStatus {
  elevenlabs: boolean;
  gemini: boolean;
  checked: boolean;
}

// Helper: wait ms
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

const InterviewPanel: React.FC<{
  avatarInstancesRef: React.MutableRefObject<Record<string, any>>;
}> = ({ avatarInstancesRef }) => {
  const {
    messages, addMessage, clearMessages,
    speakers, currentProvider, currentModel,
  } = useEditorStore();

  const [interview, setInterview] = useState<InterviewState>({
    isActive: false,
    currentPhaseIndex: 0,
    candidateName: '',
    targetCompany: '',
    targetPosition: '',
    isProcessing: false,
    isSpeaking: false,
    isListening: false,
  });

  const [inputText, setInputText] = useState('');
  const [showSetup, setShowSetup] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [serverStatus, setServerStatus] = useState<ServerStatus>({ elevenlabs: false, gemini: false, checked: false });
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const speakingRef = useRef(false); // non-React ref for immediate check

  // Check server health on mount
  useEffect(() => {
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HEALTH}`)
      .then(r => r.json())
      .then(data => {
        console.log('[Health] Server status:', data);
        setServerStatus({
          elevenlabs: !!data.providers?.elevenlabs,
          gemini: !!data.providers?.gemini,
          checked: true,
        });
      })
      .catch(err => {
        console.warn('[Health] Server not reachable:', err);
        setServerStatus({ elevenlabs: false, gemini: false, checked: true });
      });
  }, []);

  // Preload browser voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        const voices = window.speechSynthesis.getVoices();
        console.log('[Voices] Loaded', voices.length, 'voices,', voices.filter(v => v.lang.startsWith('ja')).length, 'Japanese');
      };
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // ==================== TTS FUNCTIONS ====================

  // Play audio blob (ElevenLabs MP3)
  const playAudioBlob = useCallback((blob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!blob || blob.size < 100) {
        console.warn('[Audio] Blob too small:', blob?.size);
        resolve(false);
        return;
      }
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(true); };
      audio.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      audio.play().catch((err) => {
        console.warn('[Audio] Play failed:', err);
        URL.revokeObjectURL(url);
        resolve(false);
      });
    });
  }, []);

  // ElevenLabs TTS
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string): Promise<boolean> => {
    try {
      console.log('[ElevenLabs] POST /api/tts/elevenlabs voiceId=' + voiceId);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TTS_ELEVENLABS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errBody = await response.text().catch(() => '');
        console.warn('[ElevenLabs] HTTP', response.status, errBody);
        return false;
      }

      const ct = response.headers.get('content-type') || '';
      if (!ct.includes('audio')) {
        console.warn('[ElevenLabs] Not audio response:', ct);
        return false;
      }

      const audioBlob = await response.blob();
      console.log('[ElevenLabs] Audio blob:', audioBlob.size, 'bytes');
      return await playAudioBlob(audioBlob);
    } catch (err) {
      console.warn('[ElevenLabs] Error:', err);
      return false;
    }
  }, [playAudioBlob]);

  // Browser Speech Synthesis - completely rewritten for reliability
  const speakWithBrowser = useCallback((text: string, speakerId?: string): Promise<void> => {
    return new Promise(async (resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('[BrowserTTS] Not available');
        resolve();
        return;
      }

      // Fully stop any previous speech
      window.speechSynthesis.cancel();
      // CRITICAL: wait for cancel to take effect (Chrome bug)
      await delay(200);

      const profile = (speakerId && VOICE_PROFILES[speakerId]) || { pitch: 1.0, rate: 1.0, voiceIndex: 0 };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = 1.0;

      // Select Japanese voice
      const voices = window.speechSynthesis.getVoices();
      const jaVoices = voices.filter(v => v.lang.startsWith('ja'));
      if (jaVoices.length > 0) {
        const idx = profile.voiceIndex % jaVoices.length;
        utterance.voice = jaVoices[idx];
        console.log('[BrowserTTS]', speakerId, '→ voice:', jaVoices[idx].name, 'pitch:', profile.pitch, 'rate:', profile.rate);
      } else {
        console.warn('[BrowserTTS] No Japanese voices found');
      }

      let resolved = false;
      const finish = () => {
        if (resolved) return;
        resolved = true;
        clearTimeout(safetyTimeout);
        clearInterval(chromeKeepAlive);
        resolve();
      };

      // Safety timeout
      const safetyTimeout = setTimeout(() => {
        console.warn('[BrowserTTS] Safety timeout, cancelling');
        window.speechSynthesis.cancel();
        finish();
      }, Math.max(text.length * 300, 8000));

      // Chrome bug: long utterances pause silently. Keep alive every 10s.
      const chromeKeepAlive = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 10000);

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('[BrowserTTS] Error:', e.error);
        finish();
      };

      window.speechSynthesis.speak(utterance);

      // Chrome bug: sometimes speak() silently fails. Check after 500ms.
      setTimeout(() => {
        if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending && !resolved) {
          console.warn('[BrowserTTS] Speech not started, retrying...');
          window.speechSynthesis.speak(utterance);
        }
      }, 500);
    });
  }, []);

  // Default ElevenLabs voices for speakers without explicit voiceId
  const DEFAULT_ELEVENLABS_VOICES = [
    'pNInz6obpgDQGcFmaJgB', // Adam
    'ErXwobaYiN019PkySvjV', // Antoni
    'VR6AewLTigWG4xSOukaG', // Arnold
  ];

  // Main speak function: ElevenLabs → Browser (no TalkingHead)
  const speak = useCallback(async (text: string, speakerId: string) => {
    if (!voiceEnabled) return;

    speakingRef.current = true;
    setInterview(prev => ({ ...prev, isSpeaking: true }));

    try {
      // Find speaker to get elevenlabsVoiceId
      const speaker = speakers.find(s => s.id === speakerId);
      const speakerIndex = speakers.findIndex(s => s.id === speakerId);

      // Resolve ElevenLabs voiceId: explicit > default by index
      const elevenlabsVoiceId = speaker?.elevenlabsVoiceId
        || DEFAULT_ELEVENLABS_VOICES[Math.max(0, speakerIndex) % DEFAULT_ELEVENLABS_VOICES.length];

      // 1. Try ElevenLabs
      if (serverStatus.elevenlabs && elevenlabsVoiceId) {
        console.log('[Speak]', speakerId, '→ trying ElevenLabs voiceId=' + elevenlabsVoiceId);
        const ok = await speakWithElevenLabs(text, elevenlabsVoiceId);
        if (ok) {
          console.log('[Speak]', speakerId, '→ ElevenLabs OK');
          return;
        }
      }

      // 2. Fallback: browser speech
      console.log('[Speak]', speakerId, '→ browser speech');
      await speakWithBrowser(text, speakerId);
    } finally {
      speakingRef.current = false;
      setInterview(prev => ({ ...prev, isSpeaking: false }));
      // Small gap between consecutive speeches
      await delay(300);
    }
  }, [voiceEnabled, speakWithElevenLabs, speakWithBrowser, speakers, serverStatus.elevenlabs]);

  // ==================== INTERVIEW FLOW ====================

  // Web Speech API for voice input
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert('お使いのブラウザは音声認識に対応していません。Chrome をお使いください。');
      return;
    }

    const recognition = new SR();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setInterview(prev => ({ ...prev, isListening: true }));
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };
    recognition.onend = () => setInterview(prev => ({ ...prev, isListening: false }));
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setInterview(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Start interview
  const startInterview = async () => {
    clearMessages();
    setShowSetup(false);
    setInterview(prev => ({ ...prev, isActive: true, currentPhaseIndex: 0 }));

    const leadSpeaker = speakers[0];
    if (!leadSpeaker) return;

    // Opening message
    const openingText = `${interview.candidateName || '候補者'}さん、本日はお越しいただきありがとうございます。これから面接を始めさせていただきます。`;
    const openingMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      speaker: leadSpeaker.id,
      speakerName: leadSpeaker.name,
      content: openingText,
      timestamp: Date.now(),
      type: 'agent',
      avatarId: leadSpeaker.id,
    };
    addMessage(openingMsg);
    await speak(openingText, leadSpeaker.id);

    // First question
    await askQuestion(0);
  };

  // Ask question
  const askQuestion = async (phaseIndex: number) => {
    const phase = INTERVIEW_PHASES[phaseIndex];
    if (!phase) return;

    const speakerIndex = phaseIndex % speakers.length;
    const speaker = speakers[speakerIndex];
    if (!speaker) return;

    const questionMsg: ConversationMessage = {
      id: `msg-${Date.now()}-q`,
      speaker: speaker.id,
      speakerName: speaker.name,
      content: phase.text,
      timestamp: Date.now(),
      type: 'agent',
      avatarId: speaker.id,
    };
    addMessage(questionMsg);
    await speak(phase.text, speaker.id);
  };

  // Submit candidate response
  const submitResponse = async () => {
    if (!inputText.trim() || interview.isProcessing) return;

    const candidateText = inputText.trim();
    setInputText('');

    const candidateMsg: ConversationMessage = {
      id: `msg-${Date.now()}-c`,
      speaker: 'candidate',
      speakerName: interview.candidateName || '候補者',
      content: candidateText,
      timestamp: Date.now(),
      type: 'human',
    };
    addMessage(candidateMsg);

    setInterview(prev => ({ ...prev, isProcessing: true }));

    try {
      const currentPhase = INTERVIEW_PHASES[interview.currentPhaseIndex];
      const responderIndex = interview.currentPhaseIndex % speakers.length;
      const responder = speakers[responderIndex];
      if (!responder) return;

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INTERVIEW_RESPOND}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: currentProvider,
          model: currentModel,
          persona: {
            name: responder.name,
            role: responder.roleDescription || '面接官',
            style: responder.personality || 'neutral',
            description: responder.roleDescription || '',
          },
          question: {
            text: currentPhase?.text || '',
            phase: currentPhase?.phase || 'general',
          },
          candidateResponse: candidateText,
          conversationHistory: messages.slice(-10),
          config: {
            candidateName: interview.candidateName || '候補者',
            targetCompany: interview.targetCompany || '株式会社テスト',
            targetPosition: interview.targetPosition || 'エンジニア',
          },
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();

      // Interviewer reaction
      if (data.reaction) {
        const reactionMsg: ConversationMessage = {
          id: `msg-${Date.now()}-r`,
          speaker: responder.id,
          speakerName: responder.name,
          content: data.reaction,
          timestamp: Date.now(),
          type: 'agent',
          avatarId: responder.id,
        };
        addMessage(reactionMsg);
        await speak(data.reaction, responder.id);
      }

      // Follow-up or next phase
      if (data.followUp) {
        const followUpMsg: ConversationMessage = {
          id: `msg-${Date.now()}-f`,
          speaker: responder.id,
          speakerName: responder.name,
          content: data.followUp,
          timestamp: Date.now(),
          type: 'agent',
          avatarId: responder.id,
        };
        addMessage(followUpMsg);
        await speak(data.followUp, responder.id);
      } else {
        const nextPhaseIndex = interview.currentPhaseIndex + 1;
        if (nextPhaseIndex < INTERVIEW_PHASES.length) {
          setInterview(prev => ({ ...prev, currentPhaseIndex: nextPhaseIndex }));
          await delay(1500);
          await askQuestion(nextPhaseIndex);
        } else {
          // Interview complete
          const closingText = `${interview.candidateName || '候補者'}さん、本日はお時間をいただきありがとうございました。結果は後日ご連絡いたします。`;
          const closingMsg: ConversationMessage = {
            id: `msg-${Date.now()}-end`,
            speaker: speakers[0]?.id || 'system',
            speakerName: speakers[0]?.name || 'System',
            content: closingText,
            timestamp: Date.now(),
            type: 'agent',
            avatarId: speakers[0]?.id,
          };
          addMessage(closingMsg);
          await speak(closingText, speakers[0]?.id || '');
          setInterview(prev => ({ ...prev, isActive: false }));
        }
      }
    } catch (err) {
      console.error('Interview respond error:', err);
      const errMsg: ConversationMessage = {
        id: `msg-${Date.now()}-err`,
        speaker: 'system',
        speakerName: 'System',
        content: 'サーバーとの通信に失敗しました。APIキーが設定されているか確認してください。',
        timestamp: Date.now(),
        type: 'system',
      };
      addMessage(errMsg);
    } finally {
      setInterview(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // ==================== RENDER ====================

  // Setup screen
  if (showSetup) {
    return (
      <div className="interview-panel">
        <div className="interview-setup">
          <h3>面接シミュレーション</h3>
          <p className="interview-setup-desc">AIアバター面接官との模擬面接を開始します</p>

          {/* Server status */}
          {serverStatus.checked && (
            <div style={{ padding: '8px 12px', marginBottom: '12px', borderRadius: '8px', fontSize: '12px', background: '#f0f0f0' }}>
              <div>Gemini: {serverStatus.gemini ? '✅ 接続済み' : '❌ 未設定'}</div>
              <div>ElevenLabs: {serverStatus.elevenlabs ? '✅ 高品質音声' : '⚡ ブラウザ音声'}</div>
              {!serverStatus.gemini && (
                <div style={{ color: '#c00', marginTop: '4px' }}>
                  server/.env にGEMINI_API_KEYを設定してください
                </div>
              )}
            </div>
          )}

          <div className="interview-form">
            <label>あなたの名前</label>
            <input
              type="text"
              value={interview.candidateName}
              onChange={e => setInterview(prev => ({ ...prev, candidateName: e.target.value }))}
              placeholder="山田 太郎"
            />

            <label>志望企業</label>
            <input
              type="text"
              value={interview.targetCompany}
              onChange={e => setInterview(prev => ({ ...prev, targetCompany: e.target.value }))}
              placeholder="株式会社サンプル"
            />

            <label>志望職種</label>
            <input
              type="text"
              value={interview.targetPosition}
              onChange={e => setInterview(prev => ({ ...prev, targetPosition: e.target.value }))}
              placeholder="ソフトウェアエンジニア"
            />

            <div className="interview-voice-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={voiceEnabled}
                  onChange={e => setVoiceEnabled(e.target.checked)}
                />
                音声会話を有効にする
              </label>
            </div>

            <button className="interview-start-btn" onClick={startInterview}>
              面接を開始する
            </button>
          </div>

          <div className="interview-speakers-preview">
            <span className="interview-speakers-label">面接官:</span>
            {speakers.map(s => (
              <span key={s.id} className="interview-speaker-chip">{s.name}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Active interview screen
  return (
    <div className="interview-panel">
      {/* Phase indicator */}
      <div className="interview-phase-bar">
        {INTERVIEW_PHASES.map((phase, i) => (
          <div
            key={phase.phase}
            className={`phase-step ${i < interview.currentPhaseIndex ? 'completed' : i === interview.currentPhaseIndex ? 'active' : ''}`}
          >
            <div className="phase-dot" />
            <span className="phase-label">{phase.label}</span>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="interview-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`interview-msg ${msg.type}`}>
            <div className="interview-msg-header">
              <span className={`interview-msg-name ${msg.type}`}>
                {msg.type === 'human' ? '🙋 ' : '👔 '}{msg.speakerName}
              </span>
              <span className="interview-msg-time">
                {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className={`interview-msg-content ${msg.type}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {interview.isProcessing && (
          <div className="interview-msg agent">
            <div className="interview-msg-content agent typing">
              <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      {interview.isActive && (
        <div className="interview-input-area">
          <div className="interview-input-row">
            <textarea
              ref={inputRef}
              className="interview-textarea"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitResponse();
                }
              }}
              placeholder={interview.isListening ? '🎤 聞いています...' : '回答を入力してください (Enter で送信)'}
              disabled={interview.isProcessing || interview.isSpeaking}
              rows={2}
            />
            <div className="interview-input-buttons">
              {voiceEnabled && (
                <button
                  className={`interview-mic-btn ${interview.isListening ? 'listening' : ''}`}
                  onClick={interview.isListening ? stopListening : startListening}
                  disabled={interview.isProcessing || interview.isSpeaking}
                  title={interview.isListening ? '音声入力を停止' : '音声入力を開始'}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              )}
              <button
                className="interview-send-btn"
                onClick={submitResponse}
                disabled={!inputText.trim() || interview.isProcessing || interview.isSpeaking}
              >
                送信
              </button>
            </div>
          </div>
          {interview.isSpeaking && (
            <div className="interview-status">面接官が話しています...</div>
          )}
        </div>
      )}

      {/* Interview ended */}
      {!interview.isActive && messages.length > 0 && (
        <div className="interview-ended">
          <p>面接が終了しました</p>
          <button className="interview-restart-btn" onClick={() => { clearMessages(); setShowSetup(true); }}>
            もう一度面接する
          </button>
        </div>
      )}
    </div>
  );
};

export default InterviewPanel;
