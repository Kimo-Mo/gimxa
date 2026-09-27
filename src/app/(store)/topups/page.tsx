import { Metadata } from 'next';
import { TopUps } from '@/components/features/home';

export const metadata: Metadata = {
  title: 'Top Up | Gimxa',
  description: 'Browse our wide selection of game top up and gift cards.',
  openGraph: {
    title: 'Top Up | Gimxa',
    description: 'Browse our wide selection of game top up and gift cards.',
    url: 'https://gimxa.com/topups',
    images: ['https://gimxa.com/images/og-topups.jpg'],
  },
};

export default function TopUpsPage() {
  return <TopUps />;
}
