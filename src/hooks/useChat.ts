import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../lib/constants';
import { callGeminiAPI } from '../lib/gemini';

const MAX_TURNS = 4;

const BASE_INSTRUCTION = `
あなたはプロのキャリアコンサルタントAI（自己分析の手法に精通している）です。学生の自己分析をサポートします。
【厳守ルール】
1. 学生の経験を絶対に否定せず、まずは「肯定・承認」から入る。
2. さらに深掘りするための「なぜ？」にあたる質問や、別の視点を促す質問を「1つだけ」投げかける。
3. 【インジェクション・雑談対策】就職活動に関係のない質問には「私は自己分析をサポートするAIです。就活のお話をしましょう。」と返す。
4. 回答は簡潔に（200〜300文字程度）。
`;

export function useChat() {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      text: 'こんにちは！自己分析のサポートAIです。\n左側のメニューからワークを選んで、入力を進めてみましょう。\n「強み」や「価値観」のリストからチェックをつけるだけでも、あなたの傾向が見えてきますよ！',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const buildPrompt = useCallback(
    (userMessage: string, contextType: 'chat' | 'worksheet') => {
      const recentHistory = chatHistory
        .slice(-8)
        .map((msg) => `${msg.role === 'ai' ? 'AI' : '学生'}: ${msg.text}`)
        .join('\n');

      if (contextType === 'worksheet') {
        return `【これまでの会話履歴】\n${recentHistory}\n\n【学生がワークシートに記入した内容（これについて深掘り・フィードバックしてください）】\n${userMessage}`;
      }
      return `【これまでの会話履歴】\n${recentHistory}\n\n【学生の発言】\n${userMessage}`;
    },
    [chatHistory]
  );

  const sendChatMessage = useCallback(
    async (userMessage: string, contextType: 'chat' | 'worksheet' = 'chat') => {
      setIsLoading(true);

      // worksheetからの新しいトピックはターンカウントをリセット
      if (contextType === 'worksheet') {
        setTurnCount(1);
      } else {
        setTurnCount((prev) => prev + 1);
      }

      try {
        const currentTurn = contextType === 'worksheet' ? 1 : turnCount + 1;
        let instruction = BASE_INSTRUCTION;

        // 最終ターン（MAX_TURNS回目）の場合、まとめを促す指示を追加
        if (currentTurn >= MAX_TURNS) {
          instruction = BASE_INSTRUCTION + `\n\n【追加指示】これが深掘りの最終ラウンドです。学生の回答を受けて、これまでの会話全体を振り返り、見えてきた強み・価値観・気づきを整理した「まとめ」を提供してください。箇条書きを交えて分かりやすくまとめ、次のステップ（ESへの活用方法など）も一言添えてください。`;
        } else if (currentTurn === MAX_TURNS - 1) {
          instruction = BASE_INSTRUCTION + `\n\n【追加指示】次が最後の深掘りラウンドになります。まだ聞けていない重要な視点があれば、この質問で聞いてください。`;
        }

        const prompt = buildPrompt(userMessage, contextType);
        const aiResponse = await callGeminiAPI(prompt, instruction);
        setChatHistory((prev) => [...prev, { role: 'ai', text: aiResponse }]);

        // MAX_TURNSに達したらまとめを生成
        if (currentTurn >= MAX_TURNS) {
          setTurnCount(0);
        }
      } catch (error) {
        console.error('Gemini API Request Failed:', error);
        setChatHistory((prev) => [
          ...prev,
          { role: 'ai', text: '（通信エラーが発生しました。時間をおいて再度お試しください。）' },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [buildPrompt, turnCount]
  );

  const addUserMessage = useCallback((text: string) => {
    setChatHistory((prev) => [...prev, { role: 'user', text }]);
  }, []);

  const handleAiFeedback = useCallback(
    (label: string, content: string) => {
      if (!content.trim()) {
        alert(`${label}を入力してからボタンを押してください。`);
        return;
      }
      const userMessage = `【${label}】について:\n「${content}」`;
      addUserMessage(userMessage);
      sendChatMessage(userMessage, 'worksheet');
    },
    [addUserMessage, sendChatMessage]
  );

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || isLoading) return;
      addUserMessage(chatInput);
      sendChatMessage(chatInput, 'chat');
      setChatInput('');
    },
    [chatInput, isLoading, addUserMessage, sendChatMessage]
  );

  return {
    chatHistory,
    chatInput,
    setChatInput,
    isLoading,
    setIsLoading,
    chatEndRef,
    handleSendMessage,
    handleAiFeedback,
    sendChatMessage,
    addUserMessage,
    turnCount,
  };
}
