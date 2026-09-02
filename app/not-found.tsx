'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md p-8 rounded-3xl glass-panel border border-slate-700 shadow-2xl text-center space-y-5 animate-fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center shadow-glow">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-heading font-bold text-slate-100">404: State Not Found</h2>
          <p className="text-xs text-slate-300">
            The requested path does not exist in the emotional neural graph.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs shadow-glow transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Session</span>
        </Link>
      </div>
    </div>
  );
}
