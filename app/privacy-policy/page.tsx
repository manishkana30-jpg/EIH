import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Database, Trash2, Cpu, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero-Retention Protocol | EIH Sanctuary',
  description: 'Zero-retention ephemeral architecture for Emotional Intelligence Healer: 100% in-memory processing, zero disk/IndexedDB transcript persistence, and automatic purge on session close.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-zinc-300">
      <header className="mb-10 space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Retention Ephemeral Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100">
          Privacy Policy & Zero-Retention Guarantees
        </h1>
        <p className="text-sm text-zinc-400">
          Last Updated: September 2026 • Effective Globally across <span className="text-amber-400 font-mono">eih-chi.vercel.app</span>
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed">
        {/* Core Principles */}
        <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>1. Zero-Retention Ephemeral In-Memory Architecture</span>
          </h2>
          <p className="text-zinc-400">
            Emotional Intelligence Healer (EIH) operates on a strict <strong>Zero-Retention Ephemeral Architecture</strong>. When you engage in therapeutic reflection, all dialogue, emotional classification, and audio synthesis exist solely in real-time volatile RAM.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-xs sm:text-sm pl-2">
            <li><strong>Zero Persistent History:</strong> Transcripts, messages, and session records are NEVER saved to your device’s IndexedDB, local disk, or remote databases.</li>
            <li><strong>Zero Cache History:</strong> Telemetry and psychological assessments are processed in-memory for the active turn only and not persisted across sessions.</li>
            <li><strong>Automatic Purge on Exit:</strong> Closing your browser tab, navigating away, or clicking "End Session" instantly and irreversibly wipes 100% of memory and temporary caches.</li>
          </ul>
        </section>

        {/* WebRTC Video & Microphone */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <EyeOff className="w-5 h-5 text-amber-400" />
            <span>2. WebRTC Pratibimb (Mirror) & Microphone Streams</span>
          </h2>
          <p className="text-zinc-400">
            The <strong>Pratibimb Sacred Mirror</strong> module utilizes WebRTC to provide a real-time self-witnessing reflective video surface for dissociation and emotional numbness.
          </p>
          <p className="text-zinc-400">
            <strong>Camera frames and audio buffers are processed 100% locally in volatile browser memory.</strong> No video frames are ever recorded, compressed for upload, or transmitted to any server. When you close the Pratibimb component or finish Trataka, the browser immediately stops all hardware tracks (<code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">track.stop()</code>) to guarantee hardware release.
          </p>
        </section>

        {/* Bring-Your-Own-Key */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>3. Bring-Your-Own-Key (BYOK) Security</span>
          </h2>
          <p className="text-zinc-400">
            If you choose to supply a personal API credential (such as OpenAI, Anthropic, or Groq), the key is encrypted client-side using your unique device-derived seed. Plaintext keys are never logged, and only masked representations (<code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">sk-••••3456</code>) are surfaced in the UI.
          </p>
        </section>

        {/* 1-Click Panic Wipe */}
        <section className="p-6 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-4">
          <h2 className="text-xl font-serif font-bold text-rose-200 flex items-center gap-2.5">
            <Trash2 className="w-5 h-5 text-rose-400" />
            <span>4. 1-Click Instant Complete Data Purge</span>
          </h2>
          <p className="text-zinc-400">
            You maintain complete sovereignty over your psychological data. At any point, clicking the <strong>Purge All Traces Now</strong> button permanently deletes all in-memory entries, temporary caches, and conversation state instantly from your machine without delay.
          </p>
        </section>

        {/* Regulatory Alignment */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            5. GDPR, CCPA, and HIPAA Architectural Alignment
          </h2>
          <p className="text-zinc-400">
            Because EIH does not collect, store, or sell personal identifiers or protected health information (PHI) on centralized servers, the system is designed to exceed standard GDPR and CCPA minimization principles by keeping your personal health insights strictly localized to your private device.
          </p>
        </section>

        {/* Contact */}
        <section className="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
          <p>
            For clinical inquiries, research partnerships, or algorithmic audits, please contact the Emotional Intelligence Healer Clinical Research Team via <Link href="/about" className="text-amber-400 underline">our research documentation</Link>.
          </p>
          <p>
            Return to the <Link href="/" className="text-amber-400 underline">Sanctuary Interface</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
