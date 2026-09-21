import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import { GlobalFooter } from '@/components/navigation/GlobalFooter';
import './globals.css';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  title: {
    default: 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH',
    template: '%s | EIH Sanctuary',
  },
  description:
    'AI somatic therapy & neuro-Vedantic healing. Polyvagal state tracker, clinical trataka protocol, and zero-knowledge encrypted emotion telemetry.',
  applicationName: 'Emotional Intelligence Healer (EIH)',
  alternates: {
    canonical: 'https://eih-chi.vercel.app',
  },
  keywords: [
    'AI Somatic Therapy & Neuro-Vedantic Healing',
    'polyvagal state tracker',
    'clinical trataka protocol',
    'triguna equilibrium gauge',
    'cognitive distortion detector',
    'real-time emotion telemetry',
    'zero-knowledge encrypted mental health',
    'AI Emotional Intelligence Healer',
    'Bhagavad Gita Cognitive Therapy',
    'Trataka Ocular Meditation',
    'Polyvagal Theory Somatic Grounding',
    'CBT Cognitive Restructuring',
    'Clinical Neuropsychology Sanctuary',
    'Sattvavajaya Chikitsa',
  ],
  authors: [{ name: 'EIH Clinical & Neuroscience Research Group' }],
  creator: 'EIH Sanctuary Systems',
  publisher: 'Emotional Intelligence Healer Inc.',
  formatDetection: {
    telephone: true,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://eih-chi.vercel.app',
    siteName: 'Emotional Intelligence Healer (EIH)',
    title: 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH',
    description:
      'AI somatic therapy & neuro-Vedantic healing. Polyvagal state tracker, clinical trataka protocol, and zero-knowledge encrypted emotion telemetry.',
    images: [
      {
        url: 'https://eih-chi.vercel.app/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'AI Somatic Therapy & Neuro-Vedantic Healing — Emotional Intelligence Healer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH',
    description:
      'AI somatic therapy & neuro-Vedantic healing. Polyvagal state tracker, clinical trataka protocol, and zero-knowledge encrypted emotion telemetry.',
    images: ['https://eih-chi.vercel.app/opengraph-image'],
    creator: '@eih_sanctuary',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'Health & Medical Psychotherapy',
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable} h-full`}>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* Preconnect to critical third-party API origins — eliminates DNS+TLS latency */}
        <link rel="preconnect" href="https://api.groq.com" />
        <link rel="preconnect" href="https://generativelanguage.googleapis.com" />
        <link rel="dns-prefetch" href="https://eutils.ncbi.nlm.nih.gov" />
        <link rel="dns-prefetch" href="https://en.wikipedia.org" />
      </head>
      <body className="bg-[#09090b] text-[#ecf3ee] h-full h-[100dvh] flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-100 overflow-hidden">
        {/* Global Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#09090b]/85 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-6 py-2.5 transition-all shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-serif font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400 transition-colors">
                <Brain className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm sm:text-base tracking-wide text-zinc-100 group-hover:text-amber-300 transition-colors">
                  Emotional Intelligence Healer
                </span>
                <span className="text-[10px] text-zinc-400 tracking-wider uppercase font-sans">
                  Neuro-Vedantic Cognitive Science
                </span>
              </div>
            </Link>

            <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-6 text-xs text-zinc-300 font-medium">
              <Link href="/library" className="hover:text-amber-400 transition-colors">Clinical Library</Link>
              <Link href="/clinical-guide" className="hover:text-amber-400 transition-colors">Clinical Evidence</Link>
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
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {children}
          {/* Global Authoritative Footer */}
          <GlobalFooter />
        </div>

        {/* Service worker registration with instant deployment pickup */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('caches' in window) {
                caches.keys().then(function(names) {
                  for (var i = 0; i < names.length; i++) {
                    if (names[i] !== 'eih-pwa-v5' && names[i] !== 'eih-static-v5' && names[i] !== 'eih-fonts-v1') {
                      caches.delete(names[i]);
                    }
                  }
                });
              }
              if ('serviceWorker' in navigator) {
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      registration.update();
                      setInterval(function() { registration.update(); }, 60000);
                    },
                    function(err) {
                      console.warn('EIH ServiceWorker registration notice: ', err);
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
