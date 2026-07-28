import '@/shared/styles/globals.css';
import { Metadata, Viewport } from 'next';
import clsx from 'clsx';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Providers } from './providers';

import { siteConfig } from '@/config/site';
import { fontSans, fontSora } from '@/config/fonts';
import { parseProperties } from '@/lib/properties-parser';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
  const initialMessages = await loadDefaultMessages();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          'min-h-screen text-foreground bg-background font-sans antialiased',
          fontSans.variable,
          fontSora.variable
        )}
      >
        <Providers initialMessages={initialMessages} themeProps={{ attribute: 'class', defaultTheme: 'dark' }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
