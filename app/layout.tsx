import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
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
  title: 'Emotional Intelligence Healer | The Modern Neuroscience of Emotion',
  description: 'Clinical Neuropsychological AI Companion synthesizing Dr. Lisa Feldman Barrett (Constructed Emotion), Alan Cowen (27-D Emotion Gradient), and Lauri Nummenmaa (Bodily Maps).',
  applicationName: 'Emotional Intelligence Healer',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EI Healer',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0c1410',
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
      <body className="bg-[var(--bg-nature-base)] text-[var(--text-nature-primary)] min-h-screen flex flex-col antialiased selection:bg-[#588e73]/30 selection:text-[#ecf3ee]">
        {children}

        {/* Service worker registration with automatic cache invalidation */}
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
