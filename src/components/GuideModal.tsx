import { X, Target, LineChart, Award, PenTool, Lightbulb } from 'lucide-react';

interface GuideModalProps {
  onClose: () => void;
}

const steps = [
  {
    icon: LineChart,
    title: '1. 自分史（ライフライン）',
    desc: '幼少期からのモチベーションと出来事を振り返ります。',
  },
  {
    icon: Award,
    title: '2. 強み発見＆自己PR',
    desc: '12の基礎力から強みを選び、AIに自己PRを作成してもらいます。',
  },
  {
    icon: PenTool,
    title: '3. ガクチカ深掘り',
    desc: '学生時代に最も力を入れた経験を言語化します。',
  },
  {
    icon: Lightbulb,
    title: '4. 価値観の言語化',
    desc: 'チェックリストから価値観を選び、企業選びの軸を整理します。',
  },
];

export function GuideModal({ onClose }: GuideModalProps) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full m-4 relative animate-zoom-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            統合・自己分析ツールへようこそ
          </h2>
        </div>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          このツールは、過去から現在までの自分を深く理解するための統合ワークスペースです。左側のメニューからワークを切り替えられます。
        </p>
        <div className="space-y-3">
          {steps.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100"
            >
              <Icon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-sm">{title}</h4>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
        >
          自己分析を始める
        </button>
      </div>
    </div>
  );
}
