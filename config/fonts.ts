import { Fira_Code as FontMono, Plus_Jakarta_Sans as FontSans } from "next/font/google";

export const fontSans = FontSans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
});
