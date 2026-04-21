import type { Metadata, Viewport } from 'next';
import { Orbitron, Inter } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegistrar } from '@/components/ui/ServiceWorkerRegistrar';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-display' });
const inter = Inter({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: {
    default: 'DodoDots',
    template: '%s · DodoDots',
  },
  description: 'A Tron-styled graph puzzle. Trace every dot, every line, every night.',
  applicationName: 'DodoDots',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'DodoDots',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'DodoDots',
    description: 'Trace every dot, every line, every night.',
    type: 'website',
    url: 'https://dodo-dots.vercel.app',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DodoDots',
    description: 'Trace every dot, every line, every night.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#05070d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable}`}>
      <body>
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
