import { Metadata } from 'next';
import { LegalHeader } from '@/components/features/legal/LegalHeader';
import { LegalTabs } from '@/components/features/legal/LegalTabs';

export const metadata: Metadata = {
  title: 'Legal Hub | Gimxa',
  description: 'Read our terms of service, privacy policy, and other legal documents.',
  openGraph: {
    title: 'Legal Hub | Gimxa',
    description: 'Read our terms of service, privacy policy, and other legal documents.',
    url: 'https://gimxa.com/legal',
    images: ['https://gimxa.com/images/og-legal.jpg'],
  },
};

export default function LegalHubPage() {
  return (
    <div className="container py-12 space-y-12">
      <LegalHeader />
      <LegalTabs />
    </div>
  );
}
