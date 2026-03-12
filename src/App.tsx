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
      const prompt = `以下の学生の自己分析データ（自分史、強み、ガクチカ、価値観）を総合的に分析し、詳細なサマリーレポートを作成してください。

【分析データ】
${JSON.stringify(dataObj, null, 2)}`;
      const instruction = `あなたはプロのキャリアコンサルタントです。提供された構造化データを深く分析し、以下の形式で詳細なサマリーレポートを作成してください。

【出力形式（必ずこの構成で記述してください）】

━━━━━━━━━━━━━━━━━━━━
■ 1. コアとなる人物像
━━━━━━━━━━━━━━━━━━━━
自分史・ガクチカ・強みのデータから総合的に読み取れる人物像を3〜4文で記述。どのような場面で力を発揮するタイプか、行動パターンの特徴は何かを具体的に言語化する。

━━━━━━━━━━━━━━━━━━━━
■ 2. 強みの分析（選択した強み×エピソードの整合性）
━━━━━━━━━━━━━━━━━━━━
選択された強みがエピソードとどう結びついているかを分析。面接で説得力を持たせるための補強ポイントも提示。箇条書きで2〜3点。

━━━━━━━━━━━━━━━━━━━━
■ 3. 大切にしている価値観と企業選びの軸
━━━━━━━━━━━━━━━━━━━━
選択した価値観キーワードと自由記述から、この学生が本質的に重視していることを整理。企業選びの軸との一貫性を分析。

━━━━━━━━━━━━━━━━━━━━
■ 4. モチベーション傾向の分析
━━━━━━━━━━━━━━━━━━━━
ライフラインチャートのスコア推移から読み取れるモチベーションパターン（どんな環境で上がる/下がるか）を分析。

━━━━━━━━━━━━━━━━━━━━
■ 5. 就活への具体的アドバイス
━━━━━━━━━━━━━━━━━━━━
・ESで活かすポイント（2点）
・面接で伝えるべきこと（2点）
・企業研究で注目すべき視点（1〜2点）
・注意点や改善の余地があれば正直に（1点）

━━━━━━━━━━━━━━━━━━━━
■ 6. 一言メッセージ
━━━━━━━━━━━━━━━━━━━━
学生を勇気づける激励メッセージ（2〜3文）

全体で800〜1200文字程度で詳しく記述してください。データが未入力の項目がある場合は、その旨を述べつつ入力済みの情報から最大限分析してください。`;
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
