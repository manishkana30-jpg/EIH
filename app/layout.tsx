import type { Metadata, Viewport } from 'next';
import './globals.css';

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
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
