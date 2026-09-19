import type { Metadata } from 'next';
import Link from 'next/link';
import { PhoneCall, ShieldAlert, HeartHandshake, Globe2, MessageSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: '24/7 International Emergency Crisis Directory | EIH Sanctuary',
  description: 'Verified 24/7 emergency psychological support hotlines and crisis intervention lifelines across the United States, India, United Kingdom, Canada, Australia, and worldwide.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/crisis',
  },
};

export default function CrisisDirectoryPage() {
  const regions = [
    {
      country: 'United States & Canada',
      flag: '🇺🇸 🇨🇦',
      services: [
        {
          name: '988 Suicide & Crisis Lifeline',
          action: 'Call or Text 988',
          href: 'tel:988',
          description: 'Free, confidential support available 24/7 in English and Spanish.',
          hours: '24 hours, 7 days a week',
        },
        {
          name: 'Crisis Text Line',
          action: 'Text HOME to 741741',
          href: 'sms:741741&body=HOME',
          description: 'Connect with a volunteer crisis counselor via free SMS.',
          hours: '24/7 Support via SMS',
        },
        {
          name: 'Veterans Crisis Line',
          action: 'Dial 988, then Press 1',
          href: 'tel:988',
          description: 'Caring, qualified responders with the Department of Veterans Affairs.',
          hours: '24/7 Dedicated Responder Line',
        },
      ],
    },
    {
      country: 'India',
      flag: '🇮🇳',
      services: [
        {
          name: 'tele-MANAS (Govt. of India)',
          action: 'Call 14416 or 1800-891-4416',
          href: 'tel:14416',
          description: 'National tele-mental health programme of India with multilingual clinical counselors.',
          hours: '24/7 Toll-Free Multi-Language Helpline',
        },
        {
          name: 'KIRAN National Mental Health Helpline',
          action: 'Call 1800-599-0019',
          href: 'tel:18005990019',
          description: 'Ministry of Social Justice and Empowerment psychological support in 13 languages.',
          hours: '24/7 Toll-Free Support',
        },
        {
          name: 'Vandrevala Foundation',
          action: 'Call +91 9999 666 555',
          href: 'tel:+919999666555',
          description: 'Free psychological counseling and crisis intervention by professional therapists.',
          hours: '24/7 Free Helpline',
        },
      ],
    },
    {
      country: 'United Kingdom',
      flag: '🇬🇧',
      services: [
        {
          name: 'NHS Urgent Mental Health Services',
          action: 'Call 111',
          href: 'tel:111',
          description: 'Direct clinical triage with local NHS mental health teams.',
          hours: '24 hours, 7 days a week',
        },
        {
          name: 'Samaritans UK',
          action: 'Call 116 123',
          href: 'tel:116123',
          description: 'Confidential, non-judgmental listening service for anyone in distress.',
          hours: '24/7 Free Call Service',
        },
        {
          name: 'Shout Crisis Text Line',
          action: 'Text SHOUT to 85258',
          href: 'sms:85258&body=SHOUT',
          description: 'Free, confidential, 24/7 text messaging support service.',
          hours: '24/7 Free Text Line',
        },
      ],
    },
    {
      country: 'Australia & New Zealand',
      flag: '🇦🇺 🇳🇿',
      services: [
        {
          name: 'Lifeline Australia',
          action: 'Call 13 11 14',
          href: 'tel:131114',
          description: '24-hour crisis support and suicide prevention services.',
          hours: '24/7 Hotline',
        },
        {
          name: 'Beyond Blue Australia',
          action: 'Call 1300 22 4636',
          href: 'tel:1300224636',
          description: 'Mental health support and advice from trained professionals.',
          hours: '24/7 Support Line',
        },
        {
          name: '1737 Need to Talk? (New Zealand)',
          action: 'Call or Text 1737',
          href: 'tel:1737',
          description: 'Free call or text service with trained counselors.',
          hours: '24/7 National Service',
        },
      ],
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 py-12 sm:py-16 text-zinc-300">
      <header className="mb-12 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Immediate Crisis Support Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-zinc-100">
          You Are Not Alone. Help Is Here.
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          If you are experiencing acute pain, self-harm impulses, or feeling overwhelmed beyond your capacity to cope, please reach out directly to these confidential, professional emergency services.
        </p>
      </header>

      {/* Regional Hotline Cards */}
      <div className="space-y-10">
        {regions.map((reg, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-zinc-100 flex items-center gap-2">
              <span>{reg.flag}</span>
              <span>{reg.country}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {reg.services.map((svc, sIdx) => (
                <div
                  key={sIdx}
                  className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-all"
                >
                  <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                      {svc.name}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {svc.description}
                    </p>
                    <span className="inline-block text-[10px] text-zinc-500 font-mono">
                      ⏱ {svc.hours}
                    </span>
                  </div>

                  <a
                    href={svc.href}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(225,29,72,0.3)] active:scale-[0.98] transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{svc.action}</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}

        {/* Global Directory Link */}
        <section className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-zinc-200 font-serif font-bold text-base">
            <Globe2 className="w-5 h-5 text-amber-400" />
            <span>International Helplines Directory</span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto">
            If your country is not listed above, please access the global directory maintained by <strong>Befrienders Worldwide</strong> and the <strong>International Association for Suicide Prevention (IASP)</strong> to find confidential local assistance anywhere in the world.
          </p>
          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="https://www.befrienders.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              Befrienders Worldwide &rarr;
            </a>
            <span className="text-zinc-600">•</span>
            <a
              href="https://www.iasp.info/resources/Crisis_Centres/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              IASP Crisis Centres Directory &rarr;
            </a>
          </div>
        </section>

        {/* Return to Sanctuary */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
          >
            <span>&larr; Return to Safe Sanctuary</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
