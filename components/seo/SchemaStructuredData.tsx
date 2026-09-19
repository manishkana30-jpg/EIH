import React from "react";

export const SchemaStructuredData: React.FC = () => {
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": "https://eih-chi.vercel.app/#webapp",
        "name": "Emotional Intelligence Healer",
        "alternateName": "EIH Neuro-Vedantic Mind Sanctuary",
        "url": "https://eih-chi.vercel.app/",
        "applicationCategory": "HealthApplication",
        "operatingSystem": "All modern browsers (Chrome, Safari, Firefox, Edge)",
        "browserRequirements": "Requires JavaScript. Requires WebRTC for Pratibimb Mirror.",
        "description": "Evidence-based clinical psychotherapy and emotional regulation platform bridging CBT, Polyvagal theory, 5-Stage Trataka visual gazing, and Bhagavad Gita Cognitive Therapy.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "author": {
          "@type": "Organization",
          "name": "Emotional Intelligence Healer Clinical Research Team",
          "url": "https://eih-chi.vercel.app/about",
        },
      },
      {
        "@type": "MedicalWebPage",
        "@id": "https://eih-chi.vercel.app/#medicalpage",
        "name": "Neuro-Vedantic Psychotherapy & Emotional Regulation",
        "url": "https://eih-chi.vercel.app/",
        "aspect": ["Overview", "Therapy", "MentalHealth"],
        "medicalAudience": "Patients, Individuals experiencing acute stress, burnout, anxiety, or decision paralysis",
        "description": "Clinical neuropsychological grounding combining Western affective neuroscience with Ayurvedic Sattvavajaya Chikitsa, Polyvagal autonomic regulation, and Vedantic cognitive restructuring.",
        "about": [
          {
            "@type": "MedicalCondition",
            "name": "Anxiety & Decision Paralysis",
            "possibleTreatment": [
              {
                "@type": "MedicalTherapy",
                "name": "Bhagavad Gita Cognitive Therapy (Karma Yoga Detachment)",
              },
              {
                "@type": "MedicalTherapy",
                "name": "5-Stage Trataka Ocular Fixation",
              },
            ],
          },
          {
            "@type": "MedicalCondition",
            "name": "Autonomic Nervous System Dysregulation",
            "possibleTreatment": [
              {
                "@type": "MedicalTherapy",
                "name": "Polyvagal Diaphragmatic Pranayama (Sama Vritti 4:4:4:4)",
              },
            ],
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
};

export const FAQAccordion: React.FC = () => {
  const faqs = [
    {
      question: "How does Bhagavad Gita Cognitive Therapy complement modern CBT?",
      answer:
        "Modern Cognitive Behavioral Therapy (CBT) identifies cognitive distortions and catastrophizing. The Bhagavad Gita provides philosophical cognitive restructuring, particularly through Karma Yoga (BG 2.47)—shifting locus of control entirely from uncontrollable outcomes to immediate duty, systematically neutralizing performance anxiety and decision paralysis.",
    },
    {
      question: "What is the 2-Minute Digital Eye-Safety Limit in Trataka?",
      answer:
        "Digital eye strain occurs when blink rates drop during prolonged screen gazing. EIH enforces an automated clinical safety protocol capping external digital gazing (Bahiranga Trataka) at precisely 2 minutes, followed immediately by internal visualization (Antaranga Trataka) and palming relaxation to protect the optic nerve.",
    },
    {
      question: "Is my video camera stream recorded during Pratibimb Mirror Therapy?",
      answer:
        "No. Pratibimb camera processing occurs 100% locally in volatile browser memory using WebRTC. Zero frames, video feeds, or biometric data are transmitted to any external server. All media tracks are immediately destroyed when the session concludes.",
    },
    {
      question: "How does the Zero-Knowledge Client Vault protect my privacy?",
      answer:
        "All optional third-party API keys and session transcripts are encrypted client-side using AES-GCM-256 with a unique PBKDF2 device seed in local IndexedDB. Server daemons never receive raw plaintext credentials, and a 1-click panic button permanently wipes all stored data.",
    },
    {
      question: "What should I do if I am experiencing an acute psychological crisis?",
      answer:
        "EIH is an AI-assisted psychoeducational sanctuary, not an emergency clinical service. If you are experiencing thoughts of self-harm or acute distress, please dial your local emergency services (instantly accessible via our GPS Crisis Directory) or connect with verified 24/7 crisis hotlines.",
    },
  ];

  return (
    <section aria-labelledby="faq-heading" className="w-full max-w-4xl mx-auto my-12 px-4">
      <h2 id="faq-heading" className="text-xl sm:text-2xl font-serif font-bold text-zinc-100 text-center mb-8">
        Frequently Asked Clinical Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details
            key={idx}
            className="group rounded-2xl bg-zinc-900/60 border border-zinc-800/80 p-5 transition-all open:bg-zinc-900/90 open:border-amber-500/30"
          >
            <summary className="cursor-pointer list-none flex items-center justify-between text-sm sm:text-base font-medium text-zinc-200 group-hover:text-amber-300 transition-colors">
              <span>{faq.question}</span>
              <span className="ml-4 text-zinc-500 group-open:rotate-180 transition-transform font-mono">
                ▼
              </span>
            </summary>
            <p className="mt-3 text-xs sm:text-sm text-zinc-400 leading-relaxed pt-3 border-t border-zinc-800/60">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
};
