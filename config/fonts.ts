import { Fira_Code as FontMono, Inter as FontSans, Sora as FontSora } from 'next/font/google';

export const fontSans = FontSans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
});

export const fontMono = FontMono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const fontSora = FontSora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['300', '400', '500', '600', '700', '800'],
});
