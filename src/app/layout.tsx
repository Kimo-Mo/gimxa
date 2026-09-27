import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/providers/ThemeProvider';
import NextTopLoader from 'nextjs-toploader';
import CookieConsent from '@/components/layout/CookieConsent';
import ScrollToTopButton from '@/components/layout/ScrollToTopButton';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://gimxa.com'),
  description: 'Get the best deals on game keys and top up.',
  keywords: ['game keys', 'game top up', 'digital games', 'buy games', 'cheap game keys'],
  authors: [{ name: 'Gimxa' }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Gimxa Store',
    title: 'Gimxa Store - Buy Games & Top Up Instantly',
    description:
      'Browse and purchase PC games, game keys, and direct top up for your favorite games and apps. Instant delivery and secure payments.',
    url: 'https://gimxa.com',
    images: [
      {
        url: '/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Gimxa Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gimxa Store - Buy Games & Top Up Instantly',
    description: 'Get the best deals on game keys and top up.',
    images: ['/images/og-default.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${roboto.variable} antialiased`}>
        {/* Progress bar for all client-side navigation */}
        <NextTopLoader
          color="#802cec"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #802cec, 0 0 5px #9853f1"
          easing="ease"
          speed={200}
        />
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange>
            {children}
            <CookieConsent />
            <ScrollToTopButton />
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
