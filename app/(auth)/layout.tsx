import NextLink from 'next/link';

import { LanguageSwitch } from '@/shared/components/ui/language-switch';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Top utility bar — brand chip + language toggle. Sits above the split-screen layout. */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 sm:px-8 py-5 pointer-events-none">
        <NextLink aria-label="CertifiqueAI home" className="flex items-center gap-2 group pointer-events-auto" href="/">
          {/* Plain <img> intentional: this is a server component, next/image shifts React fiber
              counters and causes react-aria useId() mismatches in child client components. */}
          <span className="w-8 h-8 rounded-xl overflow-hidden lg:bg-white/10 flex items-center justify-center transition-opacity group-hover:opacity-90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="" aria-hidden className="w-full h-full" src="/icon.svg" />
          </span>
          <span className="text-foreground lg:text-primary-foreground font-semibold text-sm tracking-tight">
            CertifiqueAI
          </span>
        </NextLink>

        <div className="pointer-events-auto">
          <LanguageSwitch />
        </div>
      </div>

      {children}
    </div>
  );
}
