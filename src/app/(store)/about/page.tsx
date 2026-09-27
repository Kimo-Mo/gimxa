import { Metadata } from 'next';
import { Gamepad2 } from 'lucide-react';
import { AboutHero } from '@/components/features/about/AboutHero';
import { AboutValues } from '@/components/features/about/AboutValues';
import { AboutStats } from '@/components/features/about/AboutStats';

export const metadata: Metadata = {
  title: 'About Us | Gimxa',
  description: 'Learn more about Gimxa, your premier destination for digital games and top up.',
  openGraph: {
    title: 'About Us | Gimxa',
    description: 'Learn more about Gimxa, your premier destination for digital games and top up.',
    url: 'https://gimxa.com/about',
    images: ['https://gimxa.com/images/og-about.jpg'],
  },
};

export default function AboutPage() {
  return (
    <div className="space-y-20">
      <AboutHero />
      <AboutValues />
      <AboutStats />

      {/* ── Journey Footer ── */}
      <section className="text-center bg-card w-full mx-auto space-y-6 p-10 rounded-xl shadow-sm border border-border">
        <div className="size-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <Gamepad2 size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold">Join the Gimxa family today</h2>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          Whether you&apos;re looking for the latest Battle Pass or want to gift your friend a game,
          we&apos;ve got you covered with the best prices and lightning-fast service.
        </p>
      </section>
    </div>
  );
}
