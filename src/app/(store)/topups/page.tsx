import { Metadata } from 'next';
import { TopUps } from '@/components/features/home';

export const metadata: Metadata = {
  title: 'Top-ups | Gimxa',
  description: 'Browse our wide selection of game top-ups and gift cards.',
  openGraph: {
    title: 'Top-ups | Gimxa',
    description: 'Browse our wide selection of game top-ups and gift cards.',
    url: 'https://gimxa.com/topups',
    images: ['https://gimxa.com/images/og-topups.jpg'],
  },
};

export default function TopUpsPage() {
  return <TopUps />;
}
