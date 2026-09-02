import React from 'react';
import { Brain } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="flex flex-col items-center space-y-4 animate-pulse">
        <div className="w-16 h-16 rounded-3xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shadow-glow">
          <Brain className="w-8 h-8 animate-bounce" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-base font-heading font-bold text-slate-100">
            Initializing Neuroscience Engine
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Calibrating Core Affect &amp; 27-D Gradient Models...
          </p>
        </div>
      </div>
    </div>
  );
}
