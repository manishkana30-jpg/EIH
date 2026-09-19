import type { Metadata } from 'next';
import { GpsCrisisDirectoryView } from '@/components/crisis/GpsCrisisDirectoryView';

export const metadata: Metadata = {
  title: '24/7 GPS Emergency Crisis Directory & Care Locator | EIH Sanctuary',
  description:
    'Instant GPS-detected local emergency services, national mental health lifelines, and nearby physical psychiatric care facilities worldwide.',
  alternates: {
    canonical: 'https://eih-chi.vercel.app/crisis',
  },
  keywords: [
    'GPS Emergency Crisis Directory',
    'Local Mental Health Lifeline',
    '24/7 Suicide Prevention Hotline',
    'Nearby Psychiatric Emergency Hospital',
    'Tele-MANAS',
    'Crisis Support Locator',
  ],
};

export default function CrisisPage() {
  return <GpsCrisisDirectoryView />;
}
