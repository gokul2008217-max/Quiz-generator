import React from 'react';
import { Sparkles, Zap } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-8 bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-10">
      <h1 className="text-xl font-semibold tracking-tight text-zinc-100">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-xs text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Powered by Gemini 3.6 Flash</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span>AI Ready</span>
        </div>
      </div>
    </header>
  );
};
