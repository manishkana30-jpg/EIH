import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

export const revalidate = 3600; // Cache for 1 hour at the Edge

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://eih-chi.vercel.app'),
  title: 'Emotional Intelligence Healer | Neuro-Vedantic Mind Sanctuary',
  description: 'Evidence-based clinical psychotherapy bridging CBT and Polyvagal Neuroscience with Bhagavad Gita cognitive therapy and 5-stage Trataka gazing.',
  applicationName: 'Emotional Intelligence Healer',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/',
  },
  keywords: [
    'AI Emotional Intelligence Healer',
    'Bhagavad Gita Cognitive Therapy',
    'Polyvagal Emotional Regulation',
    '5-Stage Trataka Online',
    'Triguna Constitutional Balance',
    'Pratibimb Mirror Therapy',
    'Sattvavajaya Chikitsa',
    'CBT Cognitive Restructuring',
  ],
  authors: [{ name: 'Emotional Intelligence Healer Clinical Research Team' }],
  creator: 'Emotional Intelligence Healer Clinical Research Team',
  publisher: 'Emotional Intelligence Healer',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EI Healer',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eih-chi.vercel.app/',
    siteName: 'Emotional Intelligence Healer',
    title: 'Emotional Intelligence Healer | Neuro-Vedantic Mind Sanctuary',
    description: 'Evidence-based clinical psychotherapy bridging CBT and Polyvagal Neuroscience with Bhagavad Gita cognitive therapy and 5-stage Trataka gazing.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Emotional Intelligence Healer — Neuro-Vedantic Mind Sanctuary',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Emotional Intelligence Healer | Neuro-Vedantic Mind Sanctuary',
    description: 'Evidence-based clinical psychotherapy bridging CBT and Polyvagal Neuroscience with Bhagavad Gita cognitive therapy and 5-stage Trataka gazing.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-[#09090b] text-[#ecf3ee] min-h-screen flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-100">
        {/* Permanent Top Crisis Safety Banner */}
        <aside
          role="region"
          aria-label="Crisis Support Quick Access"
          className="bg-rose-950/80 border-b border-rose-900/60 text-rose-100 text-xs py-1.5 px-4 sticky top-0 z-50 backdrop-blur-md"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="font-semibold text-rose-200">Immediate Crisis Support:</span>
              <span className="text-rose-100/90">
                USA/Canada: <a href="tel:988" className="underline font-bold hover:text-white">988</a> | India (tele-MANAS): <a href="tel:14416" className="underline font-bold hover:text-white">14416</a> | UK: <a href="tel:111" className="underline font-bold hover:text-white">111</a>
              </span>
            </div>
            <Link
              href="/crisis"
              className="text-[11px] underline font-medium text-rose-300 hover:text-white transition-colors"
            >
              International 24/7 Directory &rarr;
            </Link>
          </div>
        </aside>

        {/* Global Sticky Sanctuary Header */}
        <header className="sticky top-[31px] z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400 transition-colors">
                ॐ
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-zinc-100 group-hover:text-amber-300 transition-colors">
                  Emotional Intelligence Healer
                </span>
                <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-sans">
                  Neuro-Vedantic Mind Sanctuary
                </span>
              </div>
            </Link>

            <nav aria-label="Main Sanctuary Navigation" className="hidden md:flex items-center gap-6 text-xs text-zinc-300 font-medium">
              <Link href="/" className="hover:text-amber-400 transition-colors">Sanctuary</Link>
              <Link href="/library" className="hover:text-amber-400 transition-colors">Clinical Library</Link>
              <Link href="/about" className="hover:text-amber-400 transition-colors">Methodology</Link>
              <Link href="/crisis" className="text-rose-400 hover:text-rose-300 transition-colors font-semibold">Crisis Hotlines</Link>
            </nav>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Ventral Vagal (Regulated)</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono" title="Zero-Knowledge Client-Side AES-GCM-256 Vault">
                <span>🔒 Vault Active</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {children}
        </div>

        {/* Global Authoritative Footer */}
        <footer className="bg-[#09090b] border-t border-zinc-900 text-zinc-400 text-xs py-10 px-4 sm:px-8 mt-auto">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-100 font-serif font-bold text-sm">
                <span>ॐ</span>
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
                <li><Link href="/" className="hover:text-amber-400 transition-colors">Sama Vritti & Vagal Pranayama</Link></li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">Evidence & Transparency</h4>
              <ul className="space-y-1.5 text-zinc-400 text-[11px]">
                <li><Link href="/about" className="hover:text-amber-400 transition-colors">Clinical Methodology & E-E-A-T</Link></li>
                <li><Link href="/privacy-policy" className="hover:text-amber-400 transition-colors">Zero-Knowledge Privacy Vault</Link></li>
                <li><Link href="/terms" className="hover:text-amber-400 transition-colors">Psychiatric Disclaimers & Terms</Link></li>
                <li><Link href="/crisis" className="text-rose-400 hover:text-rose-300 transition-colors font-medium">Emergency Crisis Directory</Link></li>
                <li><a href="/llms.txt" className="hover:text-amber-400 transition-colors font-mono">llms.txt (AI Knowledge Graph)</a></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-zinc-200 font-bold uppercase tracking-wider text-[11px]">YMYL Medical Disclaimer</h4>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Emotional Intelligence Healer (EIH) is an AI-assisted psychoeducational and somatic regulation platform. It does not provide medical diagnosis, psychiatric prescription, or crisis stabilization. If you or someone you know is in acute distress, call <strong>988</strong> (USA/Canada), <strong>14416</strong> (India), or local emergency services immediately.
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

        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (var i = 0; i < names.length; i++) {
                    if (names[i] !== 'eih-pwa-v2') {
                      caches.delete(names[i]);
                    }
                  }
                });
              }
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) { r.update(); }
                  });
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      registration.update();
                    },
                    function(err) {
                      console.log('EIH ServiceWorker registration failed: ', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
