'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw, Home, Brain } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('EIH Client Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl glass-panel border border-red-500/40 shadow-2xl space-y-6 text-center animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shadow-glow">
          <AlertCircle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-slate-100">
            Neuro-System Encountered an Anomaly
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            A temporary client-side runtime exception occurred. Your encrypted session vault remains intact.
          </p>
        </div>

        {error.message && (
          <div className="p-3 rounded-xl bg-surface-100 border border-slate-800 text-[11px] font-mono text-red-300 text-left overflow-x-auto max-h-28">
            <code>{error.message}</code>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-glow transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Recover Session</span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-surface-100 hover:bg-surface-50 border border-slate-700 text-slate-200 font-medium text-xs transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Reload Application</span>
          </button>
        </div>
      </div>
    </div>
  );
}
