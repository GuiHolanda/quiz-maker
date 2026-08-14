'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const TESTIMONIALS = [
  {
    quote: 'homepage.testimonials.quote1',
    role: 'homepage.testimonials.role1',
    name: 'Ana Beatriz S.',
    initials: 'AB',
  },
  {
    quote: 'homepage.testimonials.quote2',
    role: 'homepage.testimonials.role2',
    name: 'Carlos M.',
    initials: 'CM',
  },
  {
    quote: 'homepage.testimonials.quote3',
    role: 'homepage.testimonials.role3',
    name: 'Priya K.',
    initials: 'PK',
  },
] as const;

export function TestimonialsStrip() {
  const { t } = useTranslation();

  return (
    <div className="border-y border-navy-800/40 py-14" style={{ background: 'rgba(30,58,95,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl">{t('homepage.testimonials.title')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.quote}
              className="flex gap-4 items-start p-4 rounded-lg"
              style={{ background: 'rgba(7,14,32,0.3)', border: '1px solid rgba(42,79,122,0.3)' }}
            >
              <div className="w-10 h-10 rounded-full border border-navy-700 bg-navy-800 flex items-center justify-center text-xs font-bold text-navy-300 shrink-0">
                {item.initials}
              </div>
              <div>
                <p className="text-sm text-navy-300 leading-relaxed mb-2">&ldquo;{t(item.quote)}&rdquo;</p>
                <p className="text-xs text-navy-400">
                  {item.name} · {t(item.role)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
