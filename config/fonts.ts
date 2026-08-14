import {
  Barlow as FontBarlow,
  Barlow_Condensed as FontBarlowCondensed,
  Fira_Code as FontMono,
  Inter as FontSans,
  Playfair_Display as FontPlayfair,
  Sora as FontSora,
} from 'next/font/google';

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

export const fontPlayfair = FontPlayfair({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '700', '800', '900'],
  display: 'swap',
});

export const fontBarlow = FontBarlow({
  subsets: ['latin'],
  variable: '--font-barlow',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const fontBarlowCondensed = FontBarlowCondensed({
  subsets: ['latin'],
  variable: '--font-barlow-condensed',
  weight: ['400', '600', '700'],
  display: 'swap',
});
