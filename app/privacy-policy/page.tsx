import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, Database, Trash2, Cpu, EyeOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy & Zero-Knowledge Protocol | EIH Sanctuary',
  description: 'Zero-knowledge privacy architecture for Emotional Intelligence Healer: client-side AES-GCM-256 vault, local IndexedDB encryption, and zero server-side session tracking.',
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
          <span>Zero-Knowledge Clinical Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100">
          Privacy Policy & Cryptographic Guarantees
        </h1>
        <p className="text-sm text-zinc-400">
          Last Updated: September 2026 • Effective Globally across <span className="text-amber-400 font-mono">eih-chi.vercel.app</span>
        </p>
      </header>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed">
        {/* Core Principles */}
        <section className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400" />
            <span>1. Zero-Knowledge Cryptographic Vault</span>
          </h2>
          <p className="text-zinc-400">
            Emotional Intelligence Healer (EIH) operates on a strict <strong>Zero-Knowledge Architecture</strong>. When you engage in therapeutic reflection, your words are not transmitted to secondary marketing trackers or stored on remote tracking databases.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-zinc-300 text-xs sm:text-sm pl-2">
            <li><strong>AES-GCM-256 Client-Side Encryption:</strong> Keys and sensitive session transcripts are encrypted within your browser using the native Web Crypto API with 310,000 PBKDF2 iterations.</li>
            <li><strong>Local-Only Storage:</strong> Transcripts are stored solely in your device’s local IndexedDB database (<code className="font-mono text-xs bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">EIH_KeyVault</code>).</li>
            <li><strong>Zero Remote Retention:</strong> The server daemon does not retain logs containing user identifiable emotional transcripts.</li>
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
            <span>4. 1-Click Instant Device Data Purge</span>
          </h2>
          <p className="text-zinc-400">
            You maintain complete sovereignty over your psychological data. At any point, clicking the <strong>Purge Vault</strong> button permanently deletes all IndexedDB entries, cryptographic seeds, and conversation memories instantly from your machine without delay.
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
