import React from 'react';
import Link from 'next/link';
import {
  Brain,
  Eye,
  ShieldCheck,
  Zap,
  Flame,
  Headphones,
  Sliders,
  Monitor,
  Moon,
  Wind
} from 'lucide-react';

export function EditorialGuide() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://eih-chi.vercel.app/#webapp',
        'name': 'Emotional Intelligence Healer (EIH)',
        'url': 'https://eih-chi.vercel.app',
        'description':
          'AI somatic therapy & neuro-Vedantic healing. Polyvagal state tracker, clinical trataka protocol, and zero-knowledge encrypted emotion telemetry.',
        'applicationCategory': 'HealthApplication',
        'operatingSystem': 'All',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD',
        },
        'featureList': [
          'AI Somatic Therapy & Neuro-Vedantic Healing',
          'Real-time Polyvagal State Tracker',
          '5-Stage Clinical Trataka Protocol',
          'Triguna Equilibrium Gauge',
          'Cognitive Distortion Detector',
          'Zero-Knowledge Encrypted Mental Health Telemetry',
        ],
      },
      {
        '@type': 'MedicalWebPage',
        '@id': 'https://eih-chi.vercel.app/#medicalpage',
        'name': 'AI Somatic Therapy & Neuro-Vedantic Healing',
        'url': 'https://eih-chi.vercel.app',
        'inLanguage': 'en-US',
        'mainEntity': {
          '@type': 'MedicalTherapy',
          'name': 'Neuro-Vedantic Somatic Therapy',
          'description':
            'Integration of Western Polyvagal Theory and Cognitive Behavioral Therapy with Ayurvedic Sattvavajaya Chikitsa and Trataka Ocular Meditation.',
        },
      },
    ],
  };

  return (
    <article
      id="clinical-guide"
      aria-label="Clinical Guide: AI Somatic Therapy & Neuro-Vedantic Healing"
      className="w-full bg-[#09090b] border-t border-zinc-900 text-zinc-300 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10"
    >
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-16 sm:space-y-20">
        {/* Editorial Header */}
        <header className="space-y-4 text-center sm:text-left border-b border-zinc-800/80 pb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>Clinical Reference & Operational Manual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-zinc-100 tracking-tight leading-tight">
            AI Somatic Therapy & Neuro-Vedantic Healing
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-4xl">
            The Emotional Intelligence Healer (EIH) is an evidence-based clinical platform unifying Western affective neuroscience with classical Vedantic and Ayurvedic mind sciences. Designed for individuals navigating autonomic distress, cognitive exhaustion, or psycho-spiritual disconnect, EIH integrates somatic computing with 3,000 years of contemplative technology. Operating within a client-side cryptographic environment, the sanctuary delivers continuous nervous system recalibration without third-party surveillance, subscription paywalls, or clinical gatekeeping.
          </p>
        </header>

        {/* Section 1: How to Use the EIH Workspace */}
        <section aria-labelledby="section-workspace-guide" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-sm">
              01
            </div>
            <h2 id="section-workspace-guide" className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
              How to Use the EIH Workspace Effectively
            </h2>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Engaging with the EIH sanctuary begins by selecting your interaction modality: conversational voice or encrypted text. To initiate an acoustic session, click the central microphone trigger in the input dock. The system activates an on-device WebRTC voice pipeline with low-latency Voice Activity Detection (VAD), parsing spoken prosody and sentiment vectors locally.
          </p>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            As dialogue progresses, observe the real-time emotion telemetry dashboard on the right rail. The polyvagal state tracker monitors autonomic nervous system shifts across Ventral, Sympathetic, and Dorsal branches, while the triguna equilibrium gauge dynamically assesses the balance of Sattva (lucidity), Rajas (kinetic agitation), and Tamas (heaviness). When cognitive distress surfaces, the integrated cognitive distortion detector intercepts maladaptive patterns—such as catastrophizing, black-and-white framing, or mind reading—and suggests targeted Socratic reframing anchors. To ground your physiology, access the left clinical dock to launch interactive interventions, including physiological sigh breathing, Pratibimb mirror self-witnessing, or the 5-stage clinical trataka protocol.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Modal Telemetry</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Track polyvagal autonomic shifts and Triguna balance percentages in real time as your verbal prosody evolves.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <Brain className="w-4 h-4" />
                <span>Cognitive Interception</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Identify cognitive distortions with clinical accuracy, receiving instantaneous Socratic thought records.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 text-xs font-semibold uppercase tracking-wider">
                <Eye className="w-4 h-4" />
                <span>Ocular Stabilizers</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Launch prescribed Trataka gazing modes directly from chat recommendations to halt runaway panic loops.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: The Neuro-Vedantic Calibration Principle */}
        <section aria-labelledby="section-calibration-principle" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-sm">
              02
            </div>
            <h2 id="section-calibration-principle" className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
              The Neuro-Vedantic Calibration Principle
            </h2>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            At the foundation of EIH is the Neuro-Vedantic Calibration Principle—a unified diagnostic model synthesizing Stephen Porges&apos; Polyvagal Theory with classical Ayurvedic Sattvavajaya Chikitsa (mind-balancing therapy). Modern neurobiology establishes that the autonomic nervous system evaluates environmental risk through neuroception across three evolutionary circuits:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 font-serif font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>1. Ventral Vagal Complex</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The mammalian social engagement system, promoting heart rate variability, emotional safety, prosocial connection, and cognitive flexibility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-serif font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>2. Sympathetic Nervous System</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The mobilization response, driving fight-or-flight arousal, catecholamine spikes, hypervigilance, and somatic anxiety.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-serif font-semibold text-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>3. Dorsal Vagal Complex</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The primitive freeze circuit, inducing metabolic hypoarousal, emotional numbness, and depressive collapse.
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Vedic psychology maps these dynamics through the three qualities of universal mind (Trigunas): Sattva represents light, emotional equilibrium, and cognitive discernment; Rajas denotes kinetic restlessness, burning desire, and autonomic turbulence; Tamas signifies physical inertia, cognitive obscurity, and resistance to change.
          </p>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            When sustained stress hyperactivates the Default Mode Network (DMN)—chiefly the medial prefrontal cortex and posterior cingulate cortex—the mind becomes locked in rumination. The clinical trataka protocol breaks this neurological loop. Anchoring visual fixation onto a concentrated digital Bindu or sacred geometry stabilizes ocular micro-saccades, attenuating locus coeruleus firing and quieting DMN hyperactivity. Crucially, patient privacy is enforced through zero-knowledge encrypted mental health safeguards. All session reflections, telemetry vectors, and cognitive breakthroughs are sealed client-side with WebCrypto AES-GCM-256 encryption, ensuring that no unencrypted therapeutic records ever touch external servers.
          </p>
        </section>

        {/* Section 3: Real-World Applications */}
        <section aria-labelledby="section-real-world-applications" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 font-mono text-sm">
              03
            </div>
            <h2 id="section-real-world-applications" className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
              Real-World Somatic & Cognitive Applications
            </h2>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            The EIH platform features four standardized clinical routines designed to restore autonomic balance across diverse clinical presentations:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 transition-colors space-y-2.5">
              <div className="flex items-center gap-2.5 text-rose-400 font-serif font-semibold text-sm">
                <Wind className="w-4 h-4" />
                <span>Acute Distress & Panic De-escalation</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                When experiencing acute sympathetic surge, initiate the Physiological Sigh breathing protocol paired with Bindu Trataka gazing. Two rapid nasal inhales followed by a prolonged oral exhalation stimulate pulmonary stretch receptors, triggering vagal deceleration and reducing heart rate within 90 seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 transition-colors space-y-2.5">
              <div className="flex items-center gap-2.5 text-amber-400 font-serif font-semibold text-sm">
                <Flame className="w-4 h-4" />
                <span>Chronic Burnout & Tamasic Inertia</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                For persistent emotional exhaustion and brain fog, select Jyoti (Candle Flame) gazing. The dynamic flicker frequencies stimulate dopamine synthesis and optic nerve photic pathways, piercing mental heaviness and restoring Sattvic alertness.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 transition-colors space-y-2.5">
              <div className="flex items-center gap-2.5 text-emerald-400 font-serif font-semibold text-sm">
                <Brain className="w-4 h-4" />
                <span>Cognitive Restructuring for Imposter Syndrome</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                When core shame or self-limiting beliefs arise, utilize the Cognitive Distortion Detector alongside Bhagavad Gita Chapter 6, Verse 5 (&quot;Elevate the self through the self; do not degrade the self&quot;). The system deconstructs distorted self-narratives, prompting evidence-based cognitive alternatives.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-500/40 transition-colors space-y-2.5">
              <div className="flex items-center gap-2.5 text-indigo-400 font-serif font-semibold text-sm">
                <Moon className="w-4 h-4" />
                <span>Evening Nervous System Deceleration</span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                To resolve nocturnal hyperarousal and insomnia, engage Shoonya (Cosmic Void) gazing. The panoramic, pitch-black visual horizon reduces visual cortex sensory processing, entraining brainwave activity from beta waves into soothing theta rhythms.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Calibration & Troubleshooting */}
        <section aria-labelledby="section-troubleshooting" className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-mono text-sm">
              04
            </div>
            <h2 id="section-troubleshooting" className="text-2xl sm:text-3xl font-serif font-bold text-zinc-100">
              Session Calibration & Troubleshooting
            </h2>
          </div>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            To maximize therapeutic outcomes, optimize your acoustic and ocular hardware prior to initiating a session:
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <Headphones className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <strong className="text-zinc-200">Microphone & WebRTC Optimization:</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Ensure browser microphone permissions are granted. For optimal acoustic fidelity, use a directional external microphone or noise-canceling headset positioned 3 inches from your mouth. Keep ambient room reverberation minimal to prevent acoustic feedback.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <Zap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <strong className="text-zinc-200">Voice Synthesis Latency:</strong>
                <p className="text-zinc-400 leading-relaxed">
                  If network constraints introduce latency during edge neural voice streaming, toggle the voice router to local operating system speech synthesis to maintain zero-stall vocal delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
              <Monitor className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <strong className="text-zinc-200">Visual Display & Ambient Illumination:</strong>
                <p className="text-zinc-400 leading-relaxed">
                  Position your display at eye level, roughly 50 to 70 centimeters away. Dim harsh overhead ceiling lights to reduce glare, favoring warm, indirect ambient lighting below 300 lux. During the 120-second active gazing stage of Trataka, maintain an unforced gaze without voluntary blinking until gentle tearing occurs, transitioning smoothly into the palming rest phase to refresh the retinal pigment epithelium.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Authoritative Outro with Quick Links */}
        <footer className="pt-8 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Client-Side Cryptographic Vault Active</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-amber-400 hover:text-amber-300 transition-colors">
              Explore Clinical Library &rarr;
            </Link>
            <Link href="/clinical-guide" className="text-amber-400 hover:text-amber-300 transition-colors">
              Peer-Reviewed Evidence &rarr;
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}

export default EditorialGuide;
