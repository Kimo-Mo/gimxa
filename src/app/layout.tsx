import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from '@/components/ui';
import { ThemeProvider } from '@/providers/ThemeProvider';
import NextTopLoader from 'nextjs-toploader';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Gimxa | Digital Gaming Store',
  description: 'Get the best deals on game keys and top-ups.',
  openGraph: {
    title: 'Gimxa Store - Buy Games & Top-Ups Instantly',
    description:
      'Browse and purchase PC games, game keys, and direct top-ups for your favorite games and apps. Instant delivery and secure payments.',
    url: 'https://gimxa.com',
    images: [
      {
        url: 'https://gimxa.com/images/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Gimxa Store',
      },
    ],
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
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
