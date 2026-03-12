import { Target, CheckCircle2, Bot } from 'lucide-react';
import { VALUE_LIST } from '../lib/constants';
import type { ValuesData } from '../lib/constants';

interface ValuesTabProps {
  data: ValuesData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onValueToggle: (val: string) => void;
  onAiFeedback: (label: string, content: string) => void;
}

export function ValuesTab({ data, onChange, onValueToggle, onAiFeedback }: ValuesTabProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <Target className="text-blue-600" /> 価値観と企業選びの軸
        </h2>
        <p className="text-slate-500 text-sm">
          直感的なチェックリストと自由記述を組み合わせて、自分の働く上での「軸」を明確にします。
        </p>
      </div>

      <div className="space-y-6">
        {/* 価値観チェックリスト */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" /> 価値観チェックリスト（最大5つ選択）
          </label>
          <div className="flex flex-wrap gap-2 mb-4">
            {VALUE_LIST.map((val) => {
              const isSelected = data.selectedValues.includes(val);
              return (
                <button
                  key={val}
                  onClick={() => onValueToggle(val)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected && '\u2713 '}
                  {val}
                </button>
              );
            })}
          </div>

          <label className="block text-sm font-bold text-slate-700 mb-2 mt-6">
            人生・働く上で大切にしている価値観（自由記述）
          </label>
          <textarea
            name="coreValue"
            value={data.coreValue}
            onChange={onChange}
            rows={3}
            placeholder="上で選んだキーワードを踏まえて、なぜそれが自分にとって重要なのか書いてみましょう。"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-2 bg-slate-50/50"
          />
          <div className="flex justify-end">
            <button
              onClick={() =>
                onAiFeedback(
                  '大切にしている価値観',
                  `チェックした価値観: ${data.selectedValues.join(',')}\n記述: ${data.coreValue}`
                )
              }
              className="text-xs flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-bold border border-indigo-100"
            >
              <Bot className="w-3.5 h-3.5" /> AIに壁打ちする
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            会社を選ぶ基準（企業選びの軸）
          </label>
          <textarea
            name="criteria"
            value={data.criteria}
            onChange={onChange}
            rows={3}
            placeholder="どのような企業・業界に魅力を感じますか？価値観のリストも参考にしてみてください。"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2 bg-slate-50/50"
          />
          <div className="flex justify-end">
            <button
              onClick={() => onAiFeedback('会社を選ぶ基準', data.criteria)}
              className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 font-bold border border-blue-100"
            >
              <Bot className="w-3.5 h-3.5" /> AIに壁打ちする
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            入社5〜10年後、どうなっていたいですか？
          </label>
          <textarea
            name="future"
            value={data.future}
            onChange={onChange}
            rows={3}
            placeholder="どんなスキルを身につけ、どのような社会人になっていたいか想像して書いてみましょう。"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2 bg-slate-50/50"
          />
          <div className="flex justify-end">
            <button
              onClick={() => onAiFeedback('5〜10年後のビジョン', data.future)}
              className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 font-bold border border-blue-100"
            >
              <Bot className="w-3.5 h-3.5" /> AIに壁打ちする
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
