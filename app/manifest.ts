import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Emotional Intelligence Healer | Neuro-Vedantic Sanctuary',
    short_name: 'EIH Sanctuary',
    description: 'Evidence-based clinical psychotherapy bridging CBT and Polyvagal Neuroscience with Bhagavad Gita cognitive therapy and 5-stage Trataka gazing.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#09090b',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
