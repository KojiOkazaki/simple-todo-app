import { LayoutDashboard, Sparkles, FileText, Bot } from 'lucide-react';

interface DashboardProps {
  aiSummary: string;
  isLoading: boolean;
  onGenerateSummary: () => void;
}

export function Dashboard({ aiSummary, isLoading, onGenerateSummary }: DashboardProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <LayoutDashboard className="text-blue-600" /> 自己分析サマリーレポート
        </h2>
        <p className="text-slate-500 text-sm">
          これまでの入力データを元に、AIがあなたの自己分析結果をまとめます。
        </p>
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 rounded-2xl shadow-xl text-white flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>

        {!aiSummary ? (
          <div className="text-center z-10">
            <div className="bg-blue-500/20 p-4 rounded-full inline-block mb-4">
              <FileText className="w-12 h-12 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold mb-4">
              入力を完了したらレポートを作成しましょう
            </h3>
            <button
              onClick={onGenerateSummary}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 px-8 rounded-full transition-all shadow-lg flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              {isLoading ? (
                '生成中...'
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> AIサマリーを生成する
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="z-10 w-full text-left">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
              <Bot className="text-blue-400" /> AIによる分析結果
            </h3>
            <div className="prose prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
              {aiSummary}
            </div>
            <div className="mt-8 flex justify-center">
              <button
                onClick={() =>
                  alert(
                    'この機能はモックアップです。実際にはES案やPDFが出力されます。'
                  )
                }
                className="bg-white text-slate-900 font-bold py-2.5 px-6 rounded-lg hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> レポートをダウンロード
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
