import { Fira_Code as FontMono, Inter as FontSans, Sora as FontSora } from 'next/font/google';

export const fontSans = FontSans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const fontSora = FontSora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});
