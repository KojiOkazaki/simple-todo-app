import { Award, Sparkles, CheckCircle2 } from 'lucide-react';
import { METI_STRENGTHS } from '../lib/constants';
import type { StrengthsData } from '../lib/constants';

interface StrengthsTabProps {
  data: StrengthsData;
  isLoading: boolean;
  onToggle: (strength: string) => void;
  onEpisodeChange: (value: string) => void;
  onPrTextChange: (value: string) => void;
  onGeneratePR: () => void;
}

export function StrengthsTab({
  data,
  isLoading,
  onToggle,
  onEpisodeChange,
  onPrTextChange,
  onGeneratePR,
}: StrengthsTabProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Award className="text-blue-600" /> 強み発見＆自己PR作成
        </h2>
        <p className="text-slate-500 text-sm">
          「社会人基礎力の12の能力要素」からあなたの強みを選び、エピソードをもとにAIで自己PRを作成します。
        </p>
      </div>

      {/* Step 1: 強みを選ぶ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">Step 1</span>
          自分の強みに最も近いものを選択（最大3つ）
        </h3>
        <div className="space-y-6">
          {METI_STRENGTHS.map((group) => (
            <div key={group.category}>
              <div className="text-sm font-bold text-slate-500 mb-3 border-b border-slate-100 pb-1">
                {group.category}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => {
                  const isSelected = data.selectedStrengths.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => onToggle(item)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right text-sm text-slate-500">
          選択中:{' '}
          <span className="font-bold text-blue-600">{data.selectedStrengths.length}</span> / 3
        </div>
      </div>

      {/* Step 2: エピソード入力 */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">Step 2</span>
          その強みが発揮されたエピソード
        </h3>
        <textarea
          value={data.episode}
          onChange={(e) => onEpisodeChange(e.target.value)}
          rows={4}
          placeholder="選択した強みが活きた具体的な経験を書いてください。（例：主体性を活かして、サークルで自ら企画を立ち上げ、周囲を巻き込んで実現した。等）箇条書きでも構いません。"
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50/50"
        />

        <div className="mt-4 flex justify-center">
          <button
            onClick={onGeneratePR}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              '生成中...'
            ) : (
              <>
                <Sparkles className="w-5 h-5" /> AIで自己PRを作成する
              </>
            )}
          </button>
        </div>
      </div>

      {/* Step 3: AI自己PR結果 */}
      {data.prText && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 shadow-sm animate-zoom-in">
          <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle2 className="text-blue-600" /> 自己PR（AI生成）
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            ※この文章をベースに、自分らしい言葉に編集してES（エントリーシート）に活用してください。
          </p>
          <textarea
            value={data.prText}
            onChange={(e) => onPrTextChange(e.target.value)}
            rows={8}
            className="w-full p-4 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm leading-relaxed bg-white shadow-inner"
          />
        </div>
      )}
    </div>
  );
}
