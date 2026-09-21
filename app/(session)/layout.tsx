import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    absolute: 'AI Somatic Therapy & Neuro-Vedantic Healing | EIH',
  },
  description:
    'AI somatic therapy & neuro-Vedantic healing. Polyvagal state tracker, clinical trataka protocol, and zero-knowledge encrypted emotion telemetry.',
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
    'CBT Cognitive Restructuring',
    'Sattvavajaya Chikitsa',
    'Pratibimb Sacred Mirror Therapy',
  ],
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
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
