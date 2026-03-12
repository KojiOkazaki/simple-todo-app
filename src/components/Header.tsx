import { Sparkles, Info } from 'lucide-react';

interface HeaderProps {
  onOpenGuide: () => void;
}

export function Header({ onOpenGuide }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between shadow-md z-20">
      <div className="flex items-center gap-3">
        <div className="bg-blue-500 p-1.5 rounded-md">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-bold tracking-wide">自己分析 Workspace</h1>
      </div>
      <button
        onClick={onOpenGuide}
        className="text-sm text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
      >
        <Info className="w-4 h-4" /> 使い方ガイド
      </button>
    </header>
  );
}
