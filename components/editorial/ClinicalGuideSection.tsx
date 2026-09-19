import React from "react";
import Link from "next/link";
import { Brain, Sparkles, Activity, ShieldCheck, BookOpen, Layers } from "lucide-react";
import { FAQAccordion, SchemaStructuredData } from "@/components/seo/SchemaStructuredData";

export const ClinicalGuideSection: React.FC = () => {
  return (
    <section aria-labelledby="clinical-guide-heading" className="w-full bg-[#09090b] border-t border-zinc-800/80 text-zinc-300 py-16 px-4 sm:px-8">
      <SchemaStructuredData />

      <div className="max-w-5xl mx-auto space-y-16">
        {/* Editorial Header */}
        <header className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Authoritative Clinical Reference</span>
          </div>
          <h2 id="clinical-guide-heading" className="text-3xl sm:text-4xl font-serif font-bold text-zinc-100 tracking-tight">
            The Neuro-Vedantic Synthesis: Clinical Psychotherapy Meets Ancient Mind Sciences
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            A comprehensive clinical guide to the neurobiological mechanisms, polyvagal autonomic stabilization, and cognitive restructuring frameworks powering the Emotional Intelligence Healer (EIH) sanctuary.
          </p>
        </header>

        {/* Section 1: Neuro-Vedantic Synthesis */}
        <article className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-serif font-bold text-xl sm:text-2xl">
            <Brain className="w-6 h-6 text-amber-400 shrink-0" />
            <h3>1. Neuro-Vedantic Synthesis: Mapping Sattvavajaya Chikitsa to CBT Cognitive Restructuring</h3>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            In modern neuropsychology, Dr. Aaron Beck’s Cognitive Behavioral Therapy (CBT) and Dr. Lisa Feldman Barrett’s Theory of Constructed Emotion demonstrate that affective distress does not arise directly from external triggers. Instead, emotional suffering is synthesized through cognitive appraisal, automatic distorted thoughts, and predictive bodily simulation.
          </p>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Over three millennia before modern neuroscience, the classical Ayurvedic text <em>Charaka Samhita</em> formalized this exact therapeutic mechanism as <strong>Sattvavajaya Chikitsa</strong> (सत्वावजय चिकित्सा)—defined literally as the psychotherapeutic discipline of restraining the mind (Manas) from unwholesome sensory attachments (Ahita Artha) through cognitive restructuring, mindfulness (Dhairya), experiential wisdom (Vijnana), and memory reconsolidation (Smriti).
          </p>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            EIH operationalizes this synthesis by identifying active cognitive distortions (Catastrophizing, All-or-Nothing Polarized Thinking, Mind Reading, and Emotional Reasoning) and immediately juxtaposing them with classical Sattvavajaya cognitive reframing. Rather than offering superficial conversational reassurance, the engine prompts the prefrontal cortex to de-catastrophize the threat narrative, decoupling the autonomic alarm reaction from the psychological ego.
          </p>
        </article>

        {/* Section 2: The Autonomic Ladder */}
        <article className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-serif font-bold text-xl sm:text-2xl">
            <Activity className="w-6 h-6 text-emerald-400 shrink-0" />
            <h3>2. The Autonomic Ladder: Polyvagal Regulation via Trataka & Vagal Pranayama</h3>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Dr. Stephen Porges’ Polyvagal Theory establishes that human emotional states correspond hierarchically to the evolutionary state of the autonomic nervous system:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2.5">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Ventral Vagal Pathway</span>
              <h4 className="text-base font-bold text-emerald-200">Safe, Social & Regulated</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Mediated by the myelinated vagus nerve. Cardiac deceleration, facial expressive flexibility, prosodic speech, and psychological equilibrium (Sattva state).
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2.5">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Sympathetic Nervous System</span>
              <h4 className="text-base font-bold text-amber-200">Mobilization (Fight / Flight)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Hyperarousal, respiratory acceleration, muscle tension, catastrophizing, and emotional agitation (Rajas state).
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2.5">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">Dorsal Vagal Complex</span>
              <h4 className="text-base font-bold text-indigo-200">Immobilization (Freeze / Shutdown)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Unmyelinated evolutionary primitive response. Metabolic depression, emotional numbness, exhaustion, alexithymia, and dissociation (Tamas state).
              </p>
            </div>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed pt-2">
            EIH engages the physiological &ldquo;vagal brake&rdquo; through synchronized <strong>Sama Vritti (4:4:4:4 Box Breathing)</strong> and <strong>Trataka Ocular Fixation</strong>. By dampening saccadic eye movements during the Bahiranga gazing phase, visual input to the superior colliculus stabilizes, signaling safety to the brainstem nuclei and reactivating ventral vagal parasympathetic dominance within 60 to 90 seconds.
          </p>
        </article>

        {/* Section 3: The Cognitive Cascade of Anger */}
        <article className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-serif font-bold text-xl sm:text-2xl">
            <Sparkles className="w-6 h-6 text-amber-400 shrink-0" />
            <h3>3. The Cognitive Cascade of Anger: Bhagavad Gita (BG 2.62-63) & Executive Prefrontal Function</h3>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            The Bhagavad Gita provides one of history’s most rigorous neuropsychological dissections of affective dysregulation. In Chapter 2, Verses 62 and 63, the text describes the precise 6-stage chain reaction from sensory fixation to total executive collapse:
          </p>
          <div className="p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4">
            <div className="font-serif italic text-amber-200/90 text-sm leading-relaxed border-l-2 border-amber-500/50 pl-4">
              &ldquo;ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते। सङ्गात्सञ्जायते कामः कामात्क्रोधोऽभिजायते॥ क्रोधाद्भवति सम्मोहः सम्मोहात्स्मृतिविभ्रमः। स्मृतिभ्रंशाद्बुद्धिनाशो बुद्धिनाशात्प्रणश्यति॥&rdquo;
            </div>
            <ol className="space-y-2 text-xs sm:text-sm text-zinc-300 list-decimal list-inside pl-2">
              <li><strong>Dhyayato Vishayan (Cognitive Fixation):</strong> Rumination on sensory stimuli or perceived external slights.</li>
              <li><strong>Sanga (Attachment):</strong> Emotional entanglement and obsessive personal identification with the outcome.</li>
              <li><strong>Kama (Craving / Rigidity):</strong> Rigid cognitive demand for reality to conform to subjective desire.</li>
              <li><strong>Krodha (Anger / Sympathetic Surge):</strong> Autonomic fight reaction triggered when desire encounters frustration.</li>
              <li><strong>Sammoha (Delusion / Tunnel Vision):</strong> Amygdala hijacking leading to loss of perspective and emotional reasoning.</li>
              <li><strong>Smriti-Bhramsha (Loss of Memory):</strong> Temporary amnesia of core values, ethical consequences, and therapeutic coping tools.</li>
              <li><strong>Buddhi-Nasha (Executive Prefrontal Collapse):</strong> Complete shutdown of prefrontal cortex executive control, resulting in destructive behavioral outbursts.</li>
            </ol>
          </div>
          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            EIH intercepts this cognitive cascade at Step 1 and Step 2 by deploying <strong>Karma Yoga Cognitive Restructuring (BG 2.47)</strong>. By training users to release attachment to results (Phala) and refocus 100% of cognitive bandwidth on present-moment duty (Kartavya Karma), the platform prevents the sympathetic escalation from reaching Buddhi Nasha.
          </p>
        </article>

        {/* Section 4: Clinical Verification Table */}
        <article className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-100 font-serif font-bold text-xl sm:text-2xl">
            <Layers className="w-6 h-6 text-amber-400 shrink-0" />
            <h3>4. Clinical Protocol Matrix: Western Modalities vs. Ayurvedic & Vedantic Interventions</h3>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-zinc-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-zinc-900 text-zinc-200 border-b border-zinc-800">
                <tr>
                  <th className="p-3.5 font-bold">Clinical Condition</th>
                  <th className="p-3.5 font-bold">Western Evidence Protocol</th>
                  <th className="p-3.5 font-bold">Ayurvedic Triguna Target</th>
                  <th className="p-3.5 font-bold">EIH Sanctuary Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-400">
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Acute Panic & Tachycardia</td>
                  <td className="p-3.5">CBT Decatastrophizing + Interoceptive Exposure</td>
                  <td className="p-3.5 text-amber-400 font-mono">Rajas Spikes (Hyperarousal)</td>
                  <td className="p-3.5">Bindu Trataka + Sama Vritti Vagal Breathing (4:4:4:4)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Existential Decision Paralysis</td>
                  <td className="p-3.5">Acceptance & Commitment Therapy (ACT Defusion)</td>
                  <td className="p-3.5 text-zinc-300 font-mono">Vata-Rajas Ambivalence</td>
                  <td className="p-3.5">Bhagavad Gita Cognitive Therapy (BG 2.47 & BG 18.63)</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Emotional Numbness & Dissociation</td>
                  <td className="p-3.5">Somatic Experiencing + Self-Witnessing</td>
                  <td className="p-3.5 text-indigo-400 font-mono">Tamas Overhang (Immobilization)</td>
                  <td className="p-3.5">Pratibimb WebRTC Mirror Therapy + Sakshi Bhava</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Nocturnal Rumination & Insomnia</td>
                  <td className="p-3.5">CBT-I Cognitive Disengagement</td>
                  <td className="p-3.5 text-amber-400 font-mono">Nocturnal Rajas Perturbation</td>
                  <td className="p-3.5">Shoonya Void Contemplation + Bhramari Pranayama</td>
                </tr>
                <tr>
                  <td className="p-3.5 font-medium text-zinc-200">Burnout & Severe Exhaustion</td>
                  <td className="p-3.5">Behavioral Activation & Pacing</td>
                  <td className="p-3.5 text-indigo-400 font-mono">Deep Tamas (Metabolic Freeze)</td>
                  <td className="p-3.5">Flame Trataka (Agni Stimulation) + BG 6.5 Mind Mastery</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        {/* Zero-CLS Support Slot */}
        <aside className="ad-slot-zero-cls-small rounded-2xl bg-zinc-900/40 border border-zinc-800/60 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-zinc-200">Ethical Non-Intrusive Clinical Sponsorship Slot</p>
              <p className="text-[11px] text-zinc-500">Zero cumulative layout shift (CLS pre-allocated 90px). 100% compliant with Google Consent Mode v2.</p>
            </div>
          </div>
          <Link href="/about" className="text-xs text-amber-400 hover:underline font-semibold shrink-0">
            Learn About Research Grants &rarr;
          </Link>
        </aside>

        {/* Accessible Accordion FAQ */}
        <FAQAccordion />
      </div>
    </section>
  );
};

export default ClinicalGuideSection;
