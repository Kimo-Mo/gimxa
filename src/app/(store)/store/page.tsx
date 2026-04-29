import { Metadata } from 'next';
import { Suspense } from 'react';
import { StoreClient } from '@/components/features/store/StoreClient';

export const metadata: Metadata = {
  title: 'Store | Gimxa',
  description: 'Browse our catalog of games, software, and digital products.',
  openGraph: {
    title: 'Store | Gimxa',
    description: 'Browse our catalog of games, software, and digital products.',
    url: 'https://gimxa.com/store',
    images: ['https://gimxa.com/images/og-store.jpg'],
  },
};

export default function StorePage() {
  return (
    <Suspense fallback={<div className="container py-12">Loading store...</div>}>
      <StoreClient />
    </Suspense>
  );
}
