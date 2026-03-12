import { useState } from 'react';
import type { TabId } from './lib/constants';
import { callGeminiAPI } from './lib/gemini';
import { useWorksheet } from './hooks/useWorksheet';
import { useChat } from './hooks/useChat';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GuideModal } from './components/GuideModal';
import { LifelineTab } from './components/LifelineTab';
import { StrengthsTab } from './components/StrengthsTab';
import { GakuchikaTab } from './components/GakuchikaTab';
import { ValuesTab } from './components/ValuesTab';
import { Dashboard } from './components/Dashboard';
import { ChatPanel } from './components/ChatPanel';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('lifeline');
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [aiSummary, setAiSummary] = useState('');

  const worksheet = useWorksheet();
  const chat = useChat();

  const generatePR = async () => {
    if (worksheet.strengthsData.selectedStrengths.length === 0 || !worksheet.strengthsData.episode.trim()) {
      alert('強みを選択し、エピソードを入力してから生成ボタンを押してください。');
      return;
    }
    chat.setIsLoading(true);
    try {
      const prompt = `以下の学生の「強み」と「エピソード」をもとに、新卒採用向けの「自己PR（約400文字）」を作成してください。\n\n【選択した強み】: ${worksheet.strengthsData.selectedStrengths.join(', ')}\n【強みが発揮されたエピソード】: ${worksheet.strengthsData.episode}`;
      const instruction =
        'あなたはプロのES添削者です。提供された強みとエピソードを魅力的なストーリーに仕立て上げ、説得力のある自己PRを作成してください。構成は「結論（強み）→具体例（課題・行動・結果）→入社後の貢献」としてください。';
      const result = await callGeminiAPI(prompt, instruction);
      worksheet.setStrengthsData((prev) => ({ ...prev, prText: result }));
    } catch (error) {
      console.error(error);
      alert('生成に失敗しました。時間をおいて再度お試しください。');
    } finally {
      chat.setIsLoading(false);
    }
  };

  const generateSummary = async () => {
    chat.setIsLoading(true);
    try {
      const dataObj = {
        lifelineData: worksheet.lifelineData,
        strengthsData: worksheet.strengthsData,
        gakuchikaData: worksheet.gakuchikaData,
        valuesData: worksheet.valuesData,
      };
      const prompt = `以下の学生の自己分析データ（自分史、強み、ガクチカ、価値観）を総合的に分析し、この学生の「コアとなる人物像と強み」「大切にしている価値観」「今後の就活への具体的なアドバイス」を400文字程度で分かりやすくまとめてください。\n\n${JSON.stringify(dataObj, null, 2)}`;
      const instruction =
        'あなたはプロのキャリアコンサルタントです。提供された構造化データをもとに、学生を勇気づけ、強みを明確に言語化するサマリーレポートを作成してください。';
      const result = await callGeminiAPI(prompt, instruction);
      setAiSummary(result);
    } catch (error) {
      console.error(error);
      alert('生成に失敗しました。時間をおいて再度お試しください。');
    } finally {
      chat.setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {isGuideOpen && <GuideModal onClose={() => setIsGuideOpen(false)} />}

      <Header onOpenGuide={() => setIsGuideOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 中央ペイン: ワークシートエリア */}
        <div className="flex-1 flex flex-col bg-slate-50 border-r border-slate-200 relative overflow-y-auto">
          <div className="max-w-3xl w-full mx-auto p-8">
            {activeTab === 'lifeline' && (
              <LifelineTab
                data={worksheet.lifelineData}
                onChange={worksheet.handleLifelineChange}
                onAiFeedback={chat.handleAiFeedback}
              />
            )}

            {activeTab === 'strengths' && (
              <StrengthsTab
                data={worksheet.strengthsData}
                isLoading={chat.isLoading}
                onToggle={worksheet.handleStrengthToggle}
                onEpisodeChange={(v) =>
                  worksheet.setStrengthsData((prev) => ({ ...prev, episode: v }))
                }
                onPrTextChange={(v) =>
                  worksheet.setStrengthsData((prev) => ({ ...prev, prText: v }))
                }
                onGeneratePR={generatePR}
              />
            )}

            {activeTab === 'gakuchika' && (
              <GakuchikaTab
                data={worksheet.gakuchikaData}
                onChange={worksheet.handleGakuchikaChange}
                onAiFeedback={chat.handleAiFeedback}
              />
            )}

            {activeTab === 'values' && (
              <ValuesTab
                data={worksheet.valuesData}
                onChange={worksheet.handleValuesChange}
                onValueToggle={worksheet.handleValueToggle}
                onAiFeedback={chat.handleAiFeedback}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                aiSummary={aiSummary}
                isLoading={chat.isLoading}
                onGenerateSummary={generateSummary}
              />
            )}

            <div className="h-12" />
          </div>
        </div>

        <ChatPanel
          chatHistory={chat.chatHistory}
          chatInput={chat.chatInput}
          isLoading={chat.isLoading}
          chatEndRef={chat.chatEndRef as React.RefObject<HTMLDivElement>}
          onInputChange={chat.setChatInput}
          onSubmit={chat.handleSendMessage}
        />
      </div>
    </div>
  );
}

export default App;
