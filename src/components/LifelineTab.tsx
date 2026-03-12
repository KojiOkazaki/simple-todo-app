import { LineChart, Bot } from 'lucide-react';
import { LifelineGraph } from './LifelineGraph';
import type { LifelineItem } from '../lib/constants';

interface LifelineTabProps {
  data: LifelineItem[];
  onChange: (id: string, field: string, value: string) => void;
  onAiFeedback: (label: string, content: string) => void;
}

export function LifelineTab({ data, onChange, onAiFeedback }: LifelineTabProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <LineChart className="text-blue-600" /> 自分史・モチベーションチャート
        </h2>
        <p className="text-slate-500 text-sm">
          過去の各年代でモチベーションがどう変化したか、その理由となる出来事を振り返ります。
        </p>
      </div>

      <LifelineGraph data={data} />

      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex gap-4"
          >
            <div className="w-32 shrink-0">
              <div className="font-bold text-slate-700 mb-2">{item.period}</div>
              <div className="text-xs text-slate-500 mb-1">モチベーション</div>
              <input
                type="range"
                min="-100"
                max="100"
                value={item.score}
                onChange={(e) => onChange(item.id, 'score', e.target.value)}
                className="w-full accent-blue-600"
              />
              <div className="text-center font-mono font-bold text-blue-600">
                {item.score > 0 ? `+${item.score}` : item.score}
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <input
                type="text"
                placeholder="主な出来事（例：部活で県大会出場、受験失敗など）"
                value={item.event}
                onChange={(e) => onChange(item.id, 'event', e.target.value)}
                className="w-full p-2 border-b border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
              />
              <textarea
                placeholder="なぜモチベーションが上がった/下がったのですか？その時の感情や行動を具体的に。"
                value={item.reason}
                onChange={(e) => onChange(item.id, 'reason', e.target.value)}
                rows={2}
                className="w-full p-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={() =>
                    onAiFeedback(
                      `${item.period}の経験`,
                      `出来事: ${item.event}\n理由: ${item.reason}`
                    )
                  }
                  className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors font-bold border border-blue-100"
                >
                  <Bot className="w-3.5 h-3.5" /> AIに分析してもらう
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
