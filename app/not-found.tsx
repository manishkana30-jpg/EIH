import React from 'react';
import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="min-h-[70vh] text-zinc-100 flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-md p-8 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl text-center space-y-5 backdrop-blur-xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <Compass className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-serif font-bold text-zinc-100">404: State Not Found</h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The requested path does not exist in the emotional neural graph. Let us return to the grounded presence of the sanctuary.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return to Sanctuary</span>
        </Link>
      </div>
    </main>
  );
}
