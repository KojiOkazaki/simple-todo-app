import { Bot, User, Send } from 'lucide-react';
import type { ChatMessage } from '../lib/constants';

interface ChatPanelProps {
  chatHistory: ChatMessage[];
  chatInput: string;
  isLoading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement>;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ChatPanel({
  chatHistory,
  chatInput,
  isLoading,
  chatEndRef,
  onInputChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <div className="w-[400px] flex flex-col bg-white border-l border-slate-200 shrink-0 z-20 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)]">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">AI キャリアメンター</h2>
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> オンライン
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            className={`flex ${
              chat.role === 'user' ? 'justify-end' : 'justify-start'
            } animate-slide-in`}
          >
            <div
              className={`max-w-[85%] flex gap-2 ${
                chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-7 h-7 mt-1 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                  chat.role === 'user' ? 'bg-slate-300' : 'bg-blue-600'
                }`}
              >
                {chat.role === 'user' ? (
                  <User className="w-4 h-4 text-slate-600" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`p-3 rounded-2xl text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                  chat.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                {chat.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[85%] flex gap-2 flex-row">
              <div className="w-7 h-7 mt-1 rounded-full bg-blue-600 flex items-center justify-center shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={onSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => onInputChange(e.target.value)}
            disabled={isLoading}
            placeholder="AIに質問・相談する..."
            className="flex-1 p-3 pr-10 bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
          />
          <button
            type="submit"
            disabled={!chatInput.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
