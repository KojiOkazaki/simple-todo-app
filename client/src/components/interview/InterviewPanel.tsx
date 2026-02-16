import React, { useState, useRef, useEffect, useCallback } from 'react';
import useEditorStore, { ConversationMessage } from '../../store/editorStore';
import API_CONFIG from '../../config';

// Interview phases and questions
const INTERVIEW_PHASES = [
  {
    phase: 'opening',
    text: '自己紹介をお願いします。',
    label: '自己紹介',
  },
  {
    phase: 'motivation',
    text: '当社を志望された理由を教えてください。',
    label: '志望動機',
  },
  {
    phase: 'strength',
    text: 'あなたの強みを教えてください。具体的なエピソードも含めてお願いします。',
    label: '強み',
  },
  {
    phase: 'experience',
    text: 'これまでの経験で最も困難だったことと、それをどう乗り越えたか教えてください。',
    label: '困難の克服',
  },
  {
    phase: 'future',
    text: '入社後にどのようなことに取り組みたいですか？',
    label: '将来のビジョン',
  },
  {
    phase: 'closing',
    text: '最後に何か質問はありますか？',
    label: '逆質問',
  },
];

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Preload browser voices
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Voice profiles for browser fallback (differentiate by pitch/rate)
  const voiceProfiles: Record<string, { pitch: number; rate: number; voiceIndex: number }> = {
    tanaka: { pitch: 0.85, rate: 0.95, voiceIndex: 0 },
    suzuki: { pitch: 1.15, rate: 1.1, voiceIndex: 1 },
    yamada: { pitch: 0.65, rate: 0.85, voiceIndex: 2 },
    sato: { pitch: 0.95, rate: 1.0, voiceIndex: 3 },
    watanabe: { pitch: 1.0, rate: 1.15, voiceIndex: 0 },
  };

  // Play audio blob and wait for it to finish
  const playAudioBlob = useCallback((blob: Blob): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!blob || blob.size < 100) {
        console.warn('[Audio] Blob is empty or too small:', blob?.size);
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

  // ElevenLabs TTS: call server endpoint, return audio blob
  const speakWithElevenLabs = useCallback(async (text: string, voiceId: string): Promise<boolean> => {
    try {
      console.log('[ElevenLabs] Requesting TTS, voiceId:', voiceId, 'text length:', text.length);
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TTS_ELEVENLABS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn('[ElevenLabs] TTS request failed:', response.status, errText);
        return false;
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('audio')) {
        console.warn('[ElevenLabs] Response is not audio:', contentType);
        return false;
      }

      const audioBlob = await response.blob();
      console.log('[ElevenLabs] Got audio blob, size:', audioBlob.size);
      const played = await playAudioBlob(audioBlob);
      if (!played) {
        console.warn('[ElevenLabs] Audio playback failed, will use fallback');
      }
      return played;
    } catch (err) {
      console.warn('[ElevenLabs] TTS error:', err);
      return false;
    }
  }, [playAudioBlob]);

  // Browser SpeechSynthesis fallback with speaker-specific voice
  const speakWithBrowser = useCallback((text: string, speakerId?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.warn('[Browser TTS] speechSynthesis not available');
        resolve();
        return;
      }
      // Cancel any ongoing speech and wait briefly for cleanup
      window.speechSynthesis.cancel();

      const profile = speakerId && voiceProfiles[speakerId]
        ? voiceProfiles[speakerId]
        : { pitch: 1.0, rate: 1.0, voiceIndex: 0 };

      console.log('[Browser TTS] Speaking as:', speakerId, 'pitch:', profile.pitch, 'rate:', profile.rate);

      // Delay slightly after cancel to avoid Chrome bug where speak() is ignored
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ja-JP';
        utterance.pitch = profile.pitch;
        utterance.rate = profile.rate;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const jaVoices = voices.filter(v => v.lang.startsWith('ja'));
        if (jaVoices.length > 0) {
          utterance.voice = jaVoices[profile.voiceIndex % jaVoices.length];
          console.log('[Browser TTS] Using voice:', utterance.voice.name, 'from', jaVoices.length, 'Japanese voices');
        } else {
          console.warn('[Browser TTS] No Japanese voices found, using default');
        }

        // Safety timeout
        const estimatedMs = Math.max(text.length * 250, 5000);
        const timeout = setTimeout(() => {
          console.warn('[Browser TTS] Timeout reached, cancelling');
          window.speechSynthesis.cancel();
          resolve();
        }, estimatedMs);

        // Chrome workaround: resume periodically to prevent pausing
        const resumeInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(resumeInterval);
          } else {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          }
        }, 10000);

        utterance.onend = () => {
          clearTimeout(timeout);
          clearInterval(resumeInterval);
          resolve();
        };
        utterance.onerror = (event) => {
          console.warn('[Browser TTS] Error:', event.error);
          clearTimeout(timeout);
          clearInterval(resumeInterval);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      }, 100);
    });
  }, []);

  // Speak: ElevenLabs → Browser SpeechSynthesis (skip broken TalkingHead)
  const speakThroughAvatar = useCallback(async (text: string, speakerId: string) => {
    if (!voiceEnabled) return;

    setInterview(prev => ({ ...prev, isSpeaking: true }));

    try {
      const speaker = speakers.find(s => s.id === speakerId);
      console.log('[TTS] Speaking for:', speakerId, 'elevenlabsVoiceId:', speaker?.elevenlabsVoiceId);

      // 1. Try ElevenLabs TTS (highest quality)
      if (speaker?.elevenlabsVoiceId) {
        const success = await speakWithElevenLabs(text, speaker.elevenlabsVoiceId);
        if (success) {
          console.log('[TTS] ElevenLabs succeeded for:', speakerId);
          return;
        }
        console.log('[TTS] ElevenLabs failed, falling back to browser speech');
      }

      // 2. Fallback: browser speech synthesis (skip TalkingHead - causes errors)
      console.log('[TTS] Using browser speech synthesis for:', speakerId);
      await speakWithBrowser(text, speakerId);
    } finally {
      setInterview(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [voiceEnabled, speakWithElevenLabs, speakWithBrowser, speakers]);

  // Web Speech API for voice input
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('お使いのブラウザは音声認識に対応していません。Chrome をお使いください。');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setInterview(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputText(transcript);
    };

    recognition.onend = () => {
      setInterview(prev => ({ ...prev, isListening: false }));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setInterview(prev => ({ ...prev, isListening: false }));
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Start interview
  const startInterview = async () => {
    clearMessages();
    setShowSetup(false);
    setInterview(prev => ({ ...prev, isActive: true, currentPhaseIndex: 0 }));

    // Opening message from lead interviewer
    const leadSpeaker = speakers[0];
    if (!leadSpeaker) return;

    const openingMsg: ConversationMessage = {
      id: `msg-${Date.now()}`,
      speaker: leadSpeaker.id,
      speakerName: leadSpeaker.name,
      content: `${interview.candidateName || '候補者'}さん、本日はお越しいただきありがとうございます。これから面接を始めさせていただきます。`,
      timestamp: Date.now(),
      type: 'agent',
      avatarId: leadSpeaker.id,
    };
    addMessage(openingMsg);
    await speakThroughAvatar(openingMsg.content, leadSpeaker.id);

    // Ask first question
    await askQuestion(0);
  };

  // Ask a question from the current phase
  const askQuestion = async (phaseIndex: number) => {
    const phase = INTERVIEW_PHASES[phaseIndex];
    if (!phase) return;

    // Pick an interviewer (rotate through speakers)
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
    await speakThroughAvatar(questionMsg.content, speaker.id);
  };

  // Submit candidate response
  const submitResponse = async () => {
    if (!inputText.trim() || interview.isProcessing) return;

    const candidateText = inputText.trim();
    setInputText('');

    // Add candidate message
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
      // Pick a speaker to respond
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

      if (!response.ok) throw new Error('Server error');

      const data = await response.json();

      // Add interviewer reaction
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
        await speakThroughAvatar(data.reaction, responder.id);
      }

      // Follow-up question or move to next phase
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
        await speakThroughAvatar(data.followUp, responder.id);
      } else {
        // Move to next phase
        const nextPhaseIndex = interview.currentPhaseIndex + 1;
        if (nextPhaseIndex < INTERVIEW_PHASES.length) {
          setInterview(prev => ({ ...prev, currentPhaseIndex: nextPhaseIndex }));
          // Small delay before next question
          setTimeout(() => askQuestion(nextPhaseIndex), 1500);
        } else {
          // Interview complete
          const closingMsg: ConversationMessage = {
            id: `msg-${Date.now()}-end`,
            speaker: speakers[0]?.id || 'system',
            speakerName: speakers[0]?.name || 'System',
            content: `${interview.candidateName || '候補者'}さん、本日はお時間をいただきありがとうございました。結果は後日ご連絡いたします。`,
            timestamp: Date.now(),
            type: 'agent',
            avatarId: speakers[0]?.id,
          };
          addMessage(closingMsg);
          await speakThroughAvatar(closingMsg.content, speakers[0]?.id || '');
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

  // Setup screen
  if (showSetup) {
    return (
      <div className="interview-panel">
        <div className="interview-setup">
          <h3>面接シミュレーション</h3>
          <p className="interview-setup-desc">3Dアバター面接官との模擬面接を開始します</p>

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
  const currentPhase = INTERVIEW_PHASES[interview.currentPhaseIndex];

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
