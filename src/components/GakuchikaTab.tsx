import { PenTool, Bot } from 'lucide-react';
import type { GakuchikaData } from '../lib/constants';

interface GakuchikaTabProps {
  data: GakuchikaData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onAiFeedback: (label: string, content: string) => void;
}

export function GakuchikaTab({ data, onChange, onAiFeedback }: GakuchikaTabProps) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2 mb-2">
          <PenTool className="text-blue-600" /> 学生時代に力を入れたこと
        </h2>
        <p className="text-slate-500 text-sm">
          大学時代に最も注力した経験を深く掘り下げ、あなたの行動特性を明らかにします。
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            取り組みの概要（タイトル）
          </label>
          <input
            type="text"
            name="title"
            value={data.title}
            onChange={onChange}
            placeholder="例：カフェのアルバイトでの新人教育マニュアル作成"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50/50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">
            具体的な役割と行動
          </label>
          <textarea
            name="detail"
            value={data.detail}
            onChange={onChange}
            rows={3}
            placeholder="チーム内でどのような役割を担い、具体的に何を行いましたか？"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50/50"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => onAiFeedback('ガクチカの具体的な行動', data.detail)}
              className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 font-bold border border-blue-100"
            >
              <Bot className="w-3.5 h-3.5" /> AIと深掘りする
            </button>
          </div>
        </div>
        <div className="pt-4 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-1">
            直面した最も大きな困難と、その乗り越え方
          </label>
          <textarea
            name="difficulty"
            value={data.difficulty}
            onChange={onChange}
            rows={4}
            placeholder="課題に対して、あなたが「自ら考えて工夫したこと」を書いてください。"
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50/50"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => onAiFeedback('ガクチカの困難と乗り越え方', data.difficulty)}
              className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 font-bold border border-blue-100"
            >
              <Bot className="w-3.5 h-3.5" /> AIと深掘りする
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
