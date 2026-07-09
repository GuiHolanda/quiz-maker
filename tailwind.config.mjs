import {heroui} from "@heroui/theme"

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './shared/components/**/*.{js,ts,jsx,tsx,mdx}',
    './config/**/*.{js,ts,jsx,tsx}',
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/input-otp/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        sora: ["var(--font-sora)", "sans-serif"],
      },
      colors: {
        navy: {
          950: '#070e20',
          900: '#0f1b3d',
          800: '#1e3a5f',
          700: '#2a4f7a',
          600: '#3b6fa0',
          500: '#4d87bc',
          400: '#6a9fc8',
        },
        accent: '#00d4ff',
        electric: '#4fc3f7',
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      addCommonColors: true,
      defaultTheme: "dark",
      themes: {
        light: {
          colors: {
            background: "#f8fafc",
            background2: "#eef2f6",
            foreground: "#0f172a",
            primary: {
              50: "#eef2ff",
              100: "#e0e7ff",
              200: "#c7d2fe",
              300: "#a5b4fc",
              400: "#818cf8",
              500: "#6366f1",
              600: "#4f46e5",
              700: "#4338ca",
              800: "#3730a3",
              900: "#312e81",
              DEFAULT: "#4f46e5",
              foreground: "#ffffff",
            },
            secondary: {
              50: "#fffbeb",
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              DEFAULT: "#f59e0b",
              foreground: "#000000",
            },
            content1: "#ffffff",
            content2: "#f1f5f9",
            focus: "#4f46e5",
          },
        },
        dark: {
          colors: {
            background: "#13121B",
            background2: "#09090B",
            foreground: "#f8fafc",
            primary: {
              50: "#eef2ff",
              100: "#e0e7ff",
              200: "#c7d2fe",
              300: "#a5b4fc",
              400: "#818cf8",
              500: "#6366f1",
              600: "#4f46e5",
              700: "#4338ca",
              800: "#3730a3",
              900: "#312e81",
              DEFAULT: "#4f46e5",
              foreground: "#ffffff",
            },
            secondary: {
              50: "#fffbeb",
              100: "#fef3c7",
              200: "#fde68a",
              300: "#fcd34d",
              400: "#fbbf24",
              500: "#f59e0b",
              600: "#d97706",
              700: "#b45309",
              800: "#92400e",
              900: "#78350f",
              DEFAULT: "#f59e0b",
              foreground: "#000000",
            },
            content1: "#1F1F28",
            content2: "#334155",
            focus: "#4f46e5",
          },
        },
      },
    }),
  ],
}

module.exports = config;
