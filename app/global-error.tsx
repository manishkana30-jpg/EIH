'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('EIH Global Layout Error:', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#080C14] text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md p-6 rounded-3xl bg-[#0f172a] border border-red-500/40 shadow-2xl text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Application Global Error</h2>
          <p className="text-xs text-slate-300">
            A critical error occurred at root level. Click below to reset the interface.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
