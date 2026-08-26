import '@/shared/styles/globals.css';
import { config } from '@fortawesome/fontawesome-svg-core';

config.autoAddCss = false;

import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { Providers } from './providers';

import { siteConfig } from '@/config/site';
import { fontMono, fontSans, fontSora } from '@/config/fonts';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.certifiqueai.com'),
  title: siteConfig.title,
  description: siteConfig.description,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
  },
  openGraph: {
    type: 'website',
    siteName: 'Certifique AI',
    url: 'https://www.certifiqueai.com',
    locale: 'pt_BR',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Certifique AI' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://www.certifiqueai.com',
    languages: {
      'pt-BR': 'https://www.certifiqueai.com',
      'x-default': 'https://www.certifiqueai.com',
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning lang="pt-BR">
      <head />
      <body
        className={clsx(
          'min-h-screen text-foreground bg-background font-sans antialiased',
          fontSans.variable,
          fontSora.variable,
          fontMono.variable
        )}
      >
        <Providers themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>{children}</Providers>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
