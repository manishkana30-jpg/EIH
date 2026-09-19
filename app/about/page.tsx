import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Brain, Sparkles, Activity, ShieldCheck, ExternalLink } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Clinical Methodology & Neuro-Vedantic Science | EIH Sanctuary',
  description: 'Evidence-based clinical methodology of Emotional Intelligence Healer: synthesizing Western cognitive neuroscience, Polyvagal theory, and classical Ayurvedic Sattvavajaya mind sciences.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/about',
  },
};

export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 sm:py-16 text-zinc-300">
      <header className="mb-12 space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-400 text-xs font-mono">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Clinical & Philosophical Grounding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100">
          The Neuro-Vedantic Clinical Methodology
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
          Emotional Intelligence Healer (EIH) is an autonomous therapeutic architecture bridging cutting-edge Western affective neuroscience with 3,000 years of clinical Ayurvedic psychology.
        </p>
      </header>

      <div className="space-y-12 text-sm sm:text-base leading-relaxed">
        {/* Western Neuroscience Foundations */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-amber-400" />
            <span>1. Western Affective & Cognitive Neuroscience Foundations</span>
          </h2>
          <p className="text-zinc-400">
            Rather than relying on generic conversational heuristics, EIH incorporates four distinct empirical frameworks:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h3 className="font-bold text-zinc-200 text-sm">Theory of Constructed Emotion</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                (Dr. Lisa Feldman Barrett) Emotions are not hardwired circuits, but real-time predictive cognitive concepts constructed by the brain to make meaning of bodily sensations.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h3 className="font-bold text-zinc-200 text-sm">Polyvagal Autonomic Regulation</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                (Dr. Stephen Porges) Mapping nervous system states across the Ventral Vagal (Social Safety), Sympathetic (Mobilization/Anxiety), and Dorsal Vagal (Immobilization/Freeze) pathways.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h3 className="font-bold text-zinc-200 text-sm">27-Dimensional Emotion Topology</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                (Alan Cowen & Dacher Keltner, UC Berkeley) Classifying emotional states along continuous semantic gradients rather than binary positive/negative categorizations.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <h3 className="font-bold text-zinc-200 text-sm">CBT Cognitive Restructuring</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                (Dr. Aaron Beck) Identifying and disputing systematic cognitive distortions such as catastrophizing, mind reading, and emotional reasoning.
              </p>
            </div>
          </div>
        </section>

        {/* Eastern Ayurvedic Mind Sciences */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>2. Classical Ayurvedic Mind Sciences (Sattvavajaya Chikitsa)</span>
          </h2>
          <p className="text-zinc-400">
            In Ayurvedic medicine (Charaka Samhita), psychotherapy is termed <strong>Sattvavajaya Chikitsa</strong>—literally, the restraint of the mind from unwholesome objects and the cultivation of intellectual clarity (Jnana), spiritual awareness (Vijnana), patience (Dhairya), and memory (Smriti).
          </p>
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
            <h3 className="font-serif font-bold text-zinc-200 text-base">The Triguna Psychological Matrix</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Every mental state is viewed as an evolving ratio of three fundamental gunas:
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              <li><strong className="text-emerald-400">Sattva (Clarity & Calmness):</strong> Psychological resilience, compassion, and cognitive equanimity.</li>
              <li><strong className="text-amber-400">Rajas (Kinetic Restlessness):</strong> Overactive agitation, racing thoughts, ambition, and anxiety.</li>
              <li><strong className="text-indigo-400">Tamas (Inertia & Heaviness):</strong> Depression, lethargy, numbness, and avoidance.</li>
            </ul>
          </div>
        </section>

        {/* Bhagavad Gita Cognitive Therapy */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>3. Bhagavad Gita Cognitive Therapy (Karma Yoga Restructuring)</span>
          </h2>
          <p className="text-zinc-400">
            When existential confusion or decision paralysis is detected, EIH retrieves verified Sanskrit Shlokas from ChromaDB, applying a 4-step cognitive reframing sequence:
          </p>
          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border-l-4 border-amber-500 text-amber-100">
              <strong>1. The Shloka:</strong> Sacred Sanskrit in Devanagari and Roman transliteration.
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <strong>2. The Meaning:</strong> Direct philosophical translation without fluff.
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <strong>3. Clinical Reflection:</strong> Systematic mapping of the verses to modern emotional paralysis.
            </div>
            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300">
              <strong>4. Karma Guidance:</strong> Actionable dual-pole prescriptions (What to do vs. What NOT to do).
            </div>
          </div>
        </section>

        {/* Clinical Verification Table */}
        <section className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-zinc-100">
            4. Clinical Synthesis: Western Protocols vs. Vedantic Interventions
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-900 text-zinc-200 border-b border-zinc-800">
                <tr>
                  <th className="p-3.5 font-bold">Psychological State</th>
                  <th className="p-3.5 font-bold">Western Protocol</th>
                  <th className="p-3.5 font-bold">Neuro-Vedantic Protocol</th>
                  <th className="p-3.5 font-bold">Somatic Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-400">
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Acute Panic / Agitation</td>
                  <td className="p-3.5">CBT Reality Testing</td>
                  <td className="p-3.5">Rajas Rebalancing (BG 2.70)</td>
                  <td className="p-3.5">Bindu Trataka + Box Breathing</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Depressive Inertia / Burnout</td>
                  <td className="p-3.5">Behavioral Activation</td>
                  <td className="p-3.5">Tamas Dissolution (BG 6.5)</td>
                  <td className="p-3.5">Flame Trataka + Agni Activation</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Dissociation / Numbness</td>
                  <td className="p-3.5">Somatic Grounding</td>
                  <td className="p-3.5">Self-Witnessing (Sakshi Bhava)</td>
                  <td className="p-3.5">Pratibimb WebRTC Sacred Mirror</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Decision Paralysis</td>
                  <td className="p-3.5">Acceptance & Commitment (ACT)</td>
                  <td className="p-3.5">Karma Yoga Detachment (BG 2.47)</td>
                  <td className="p-3.5">Shoonya Void Contemplation</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* References */}
        <section className="pt-6 border-t border-zinc-800 text-xs text-zinc-500 space-y-2">
          <p className="font-bold text-zinc-400 uppercase tracking-wider">Primary Literature References:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Barrett, L. F. (2017). <em>How Emotions Are Made: The Secret Life of the Brain</em>. Houghton Mifflin Harcourt.</li>
            <li>Porges, S. W. (2011). <em>The Polyvagal Theory: Neurophysiological Foundations of Emotions</em>. W. W. Norton.</li>
            <li>Charaka Samhita, Sutrasthana & Sharirasthana (Classical Ayurvedic Corpus).</li>
            <li>Bhagavad Gita, Chapters 2, 6, and 18 (Philosophical Cognitive Therapy).</li>
          </ul>
        </section>

        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          >
            <span>Enter the Sanctuary &rarr;</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
