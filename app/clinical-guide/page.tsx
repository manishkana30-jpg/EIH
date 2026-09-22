import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Brain, ShieldAlert } from 'lucide-react';
import { ClinicalGuideSection } from '@/components/editorial/ClinicalGuideSection';

export const metadata: Metadata = {
  title: 'Authoritative Clinical Reference & Neuro-Vedantic Evidence | EIH',
  description:
    'Comprehensive peer-reviewed clinical reference on Sattvavajaya Chikitsa, Polyvagal Autonomic Stabilization, CBT cognitive restructuring, and Bhagavad Gita cognitive therapy.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/clinical-guide',
  },
  keywords: [
    'Clinical Neuropsychology Reference',
    'Sattvavajaya Chikitsa Evidence',
    'Polyvagal Autonomic Regulation',
    'CBT Cognitive Restructuring Matrix',
    'Bhagavad Gita Cognitive Therapy Guide',
    'Trataka Neuro-Ocular Studies',
  ],
};

export default function ClinicalGuidePage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-[#ecf3ee]">
      {/* Top Breadcrumbs & Back Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap text-xs">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-400 font-medium transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Safe Sanctuary Session</span>
          </Link>

          <div className="flex items-center gap-3 text-zinc-500">
            <span>YMYL Clinical Taxonomy</span>
            <span>•</span>
            <Link href="/library" className="hover:text-amber-400 text-zinc-400 transition-colors">
              Psychology Library
            </Link>
            <span>•</span>
            <Link href="/crisis" className="hover:text-rose-400 text-rose-300 transition-colors">
              GPS Crisis Directory
            </Link>
          </div>
        </div>
      </div>

      {/* Main Authoritative Editorial Content */}
      <ClinicalGuideSection />

      {/* Bottom Action Footer */}
      <div className="border-t border-zinc-800/80 bg-zinc-950/40 py-12 px-4 text-center space-y-4">
        <h3 className="text-xl font-serif font-bold text-zinc-100">
          Ready to Experience the Neuro-Vedantic Sanctuary?
        </h3>
        <p className="text-sm text-zinc-400 max-w-xl mx-auto">
          Engage in real-time cognitive restructuring, sacred Bhagavad Gita reframing, and 5-stage Trataka ocular stabilization.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all"
          >
            <Brain className="w-4 h-4" />
            <span>Launch Sanctuary Healing Session</span>
          </Link>
          <Link
            href="/crisis"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-rose-300 text-sm font-medium transition-colors"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>GPS Emergency Directory</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
