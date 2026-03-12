import { LineChart, Award, PenTool, Target, LayoutDashboard } from 'lucide-react';
import type { TabId } from '../lib/constants';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const worksheetTabs: { id: TabId; label: string; icon: typeof LineChart }[] = [
  { id: 'lifeline', label: '自分史・チャート', icon: LineChart },
  { id: 'strengths', label: '強み発見・自己PR', icon: Award },
  { id: 'gakuchika', label: 'ガクチカ深掘り', icon: PenTool },
  { id: 'values', label: '価値観・企業選び', icon: Target },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-slate-800 text-slate-300 flex flex-col py-6 shadow-inner z-10 shrink-0">
      <div className="px-6 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Worksheets
      </div>
      <nav className="space-y-1 px-3">
        {worksheetTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === id
                ? 'bg-blue-600 text-white font-bold'
                : 'hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5" /> {label}
          </button>
        ))}
      </nav>

      <div className="px-6 mt-10 mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
        Output
      </div>
      <nav className="px-3">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'hover:bg-slate-700 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" /> 分析結果まとめ
        </button>
      </nav>
    </div>
  );
}
