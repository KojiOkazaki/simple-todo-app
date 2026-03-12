import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '../lib/constants';
import { callGeminiAPI } from '../lib/gemini';

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  const buildPrompt = useCallback(
    (userMessage: string, contextType: 'chat' | 'worksheet') => {
      const recentHistory = chatHistory
        .slice(-4)
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
      try {
        const prompt = buildPrompt(userMessage, contextType);
        const aiResponse = await callGeminiAPI(prompt, BASE_INSTRUCTION);
        setChatHistory((prev) => [...prev, { role: 'ai', text: aiResponse }]);
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
    [buildPrompt]
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
  };
}
