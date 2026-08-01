import '@/shared/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Providers } from './providers';
import { auth } from '@/auth';

import { siteConfig } from '@/config/site';
import { fontSans, fontSora } from '@/config/fonts';
import { parseProperties } from '@/lib/properties-parser';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.certifiqueai.com'),
  title: siteConfig.title,
  description: siteConfig.description,
  openGraph: {
    type: 'website',
    siteName: 'CertifiqueAI',
    url: 'https://www.certifiqueai.com',
    locale: 'pt_BR',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'CertifiqueAI' }],
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
      en: 'https://www.certifiqueai.com',
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

// Carrega as mensagens PT (idioma padrão) no servidor para o SSR renderizar texto real,
// evitando mismatch de hidratação. O cliente troca para EN apenas se o localStorage pedir.
async function loadDefaultMessages(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');
    return parseProperties(raw);
  } catch {
    return {};
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [initialMessages, session] = await Promise.all([loadDefaultMessages(), auth()]);

  return (
    <html suppressHydrationWarning lang="pt-BR">
      <head />
      <body
        className={clsx(
          'min-h-screen text-foreground bg-background font-sans antialiased',
          fontSans.variable,
          fontSora.variable
        )}
      >
        <Providers
          initialMessages={initialMessages}
          session={session}
          themeProps={{ attribute: 'class', defaultTheme: 'dark' }}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
