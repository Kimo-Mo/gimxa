import { Metadata } from 'next';
import { SupportHeader } from '@/components/features/support/SupportHeader';
import { SupportClient } from '@/components/features/support/SupportClient';

export const metadata: Metadata = {
  title: 'Support | Gimxa',
  description: 'Get help with your orders, account, or any other questions.',
  openGraph: {
    title: 'Support | Gimxa',
    description: 'Get help with your orders, account, or any other questions.',
    url: 'https://gimxa.com/support',
    images: ['https://gimxa.com/images/og-support.jpg'],
  },
};

export default function SupportPage() {
  return (
    <div>
      <SupportHeader />
      <SupportClient />
    </div>
  );
}
