import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ShieldAlert, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Service & Psychiatric Disclaimer | EIH Sanctuary',
  description: 'Clinical psychiatric disclaimer and terms of use for Emotional Intelligence Healer: AI-assisted psychoeducational and somatic regulation guidance.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/terms',
  },
};

export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-zinc-300">
      <header className="mb-10 space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <FileText className="w-3.5 h-3.5" />
          <span>Clinical & Legal Boundaries</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100">
          Terms of Service & Psychiatric Disclaimer
        </h1>
        <p className="text-sm text-zinc-400">
          Last Updated: September 2026 • Effective for all sessions on <span className="text-amber-400 font-mono">eih-chi.vercel.app</span>
        </p>
      </header>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed">
        {/* Critical Medical Disclaimer */}
        <section className="p-6 rounded-2xl bg-rose-950/25 border-l-4 border-rose-500 text-rose-100 space-y-4">
          <h2 className="text-xl font-serif font-bold text-rose-200 flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>1. Mandatory Psychiatric & Medical Disclaimer</span>
          </h2>
          <p className="text-rose-100/90 font-medium">
            EMOTIONAL INTELLIGENCE HEALER (EIH) IS AN ARTIFICIAL INTELLIGENCE RESEARCH EXPERIMENT AND PSYCHOEDUCATIONAL TOOL. IT IS NOT A LICENSED HEALTHCARE PROVIDER, MEDICAL CLINIC, OR EMERGENCY SERVICE.
          </p>
          <p className="text-rose-200/80 text-xs sm:text-sm">
            The therapeutic insights, Bhagavad Gita cognitive reframings, Polyvagal observations, and Trataka exercises provided by EIH are designed solely for self-reflection, stress reduction, and educational purposes. EIH does not diagnose mental disorders, prescribe pharmaceuticals, or formulate medical treatment plans.
          </p>
        </section>

        {/* Crisis Escalation */}
        <section className="p-6 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>2. Acute Crisis & Emergency Situations</span>
          </h2>
          <p className="text-zinc-400">
            If you or someone you are supporting is experiencing thoughts of suicide, self-harm, severe psychiatric episodes, or imminent danger, <strong>do not rely on this application</strong>. Exit the sanctuary immediately and contact professional emergency responders using our <Link href="/crisis" className="text-amber-400 underline font-semibold">24/7 GPS Emergency Crisis Directory</Link>, which dynamically resolves your exact device GPS coordinates to connect you with verified local emergency numbers, national suicide prevention hotlines, and nearby physical psychiatric facilities worldwide.
          </p>
        </section>

        {/* Permitted Use & Age Restrictions */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            3. Eligibility & User Responsibilities
          </h2>
          <p className="text-zinc-400">
            By accessing the sanctuary, you represent that you are at least 18 years of age (or the age of majority in your jurisdiction) or are accessing the platform with the informed consent and supervision of a legal guardian. You agree to use the platform in a spirit of constructive self-reflection and not for unlawful or abusive purposes.
          </p>
        </section>

        {/* Digital Ocular Safety */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            4. Trataka Ocular Safety & Physical Protocols
          </h2>
          <p className="text-zinc-400">
            Trataka gazing exercises involve ocular concentration. While EIH enforces automated 2-minute safety caps on external digital gazing, users with pre-existing optical conditions (e.g., severe myopia, photophobia, active corneal abrasion, or epilepsy) should discontinue visual gazing if eye strain, dryness, or discomfort occurs.
          </p>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            5. Limitation of Liability
          </h2>
          <p className="text-zinc-400">
            To the maximum extent permitted by applicable law, the Emotional Intelligence Healer Clinical Research Team, contributors, and hosting providers disclaim all warranties and liability for any indirect, incidental, or psychological outcomes arising from reliance on algorithmic guidance or technical interruptions.
          </p>
        </section>

        <section className="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
          <p>
            Review our <Link href="/privacy-policy" className="text-amber-400 underline">Privacy Policy</Link> for details on our zero-knowledge encryption architecture.
          </p>
          <p>
            Return to the <Link href="/" className="text-amber-400 underline">Sanctuary Interface</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
