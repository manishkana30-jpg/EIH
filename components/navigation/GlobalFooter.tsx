'use client';

import React from 'react';
import Link from 'next/link';
import { Brain } from 'lucide-react';

export function GlobalFooter() {
  return (
    <footer className="bg-[#09090b] border-t border-zinc-900 text-zinc-400 text-xs py-10 px-4 sm:px-8 mt-auto shrink-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-100 font-serif font-bold text-sm">
            <Brain className="w-4 h-4 text-amber-400" />
            <span>EIH Mind Sanctuary</span>
          </div>
          <p className="text-zinc-500 leading-relaxed text-[11px]">
            Autonomous clinical psychotherapy and emotional resilience platform bridging Western neuropsychology (CBT, Polyvagal theory) with classical Ayurvedic mind sciences (Sattvavajaya Chikitsa, 5-stage Trataka, Bhagavad Gita cognitive therapy).
          </p>
          <p className="text-[10px] text-zinc-600">
            Deployed globally at <span className="text-amber-500/90 font-mono">eih-chi.vercel.app</span>
          </p>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">Therapeutic Modules</h4>
          <ul className="space-y-1.5 text-zinc-400 text-[11px]">
            <li><Link href="/" className="hover:text-amber-400 transition-colors">Bhagavad Gita Cognitive Therapy</Link></li>
            <li><Link href="/" className="hover:text-amber-400 transition-colors">5-Stage Trataka Visual Gazing</Link></li>
            <li><Link href="/" className="hover:text-amber-400 transition-colors">Pratibimb WebRTC Sacred Mirror</Link></li>
            <li><Link href="/library" className="hover:text-amber-400 transition-colors">Clinical & Psychoeducational Library</Link></li>
            <li><Link href="/clinical-guide" className="hover:text-amber-400 transition-colors">Authoritative Clinical Reference</Link></li>
          </ul>
        </div>

        <div className="space-y-2.5">
          <h4 className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">Evidence & Transparency</h4>
          <ul className="space-y-1.5 text-zinc-400 text-[11px]">
            <li><Link href="/clinical-guide" className="hover:text-amber-400 transition-colors">Clinical Evidence & Peer-Reviewed Guide</Link></li>
            <li><Link href="/about" className="hover:text-amber-400 transition-colors">Clinical Methodology & E-E-A-T</Link></li>
            <li><Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">Zero-Knowledge Privacy Vault</Link></li>
            <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Psychiatric Disclaimers & Terms</Link></li>
            <li><Link href="/crisis" className="text-rose-400 hover:text-rose-300 transition-colors font-medium">GPS Emergency Crisis Directory</Link></li>
            <li><a href="/llms.txt" className="hover:text-amber-400 transition-colors font-mono">llms.txt (AI Knowledge Graph)</a></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h4 className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">YMYL Medical Disclaimer</h4>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Emotional Intelligence Healer (EIH) is an AI-assisted psychoeducational and somatic regulation platform. It does not provide medical diagnosis, psychiatric prescription, or crisis stabilization. If you or someone you know is in acute distress, call your local emergency services (detected via our GPS directory) or access verified 24/7 crisis support immediately.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-zinc-900/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-600 text-[11px]">
        <p>&copy; {new Date().getFullYear()} Emotional Intelligence Healer Clinical Research Team. All rights reserved.</p>
        <div className="flex items-center gap-4 text-zinc-500">
          <Link href="/privacy-policy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/crisis" className="hover:text-rose-400 transition-colors">Crisis Protocol</Link>
          <span>•</span>
          <Link href="/about" className="hover:text-zinc-300 transition-colors">About & Sources</Link>
        </div>
      </div>
    </footer>
  );
}

export default GlobalFooter;
