'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { tv } from 'tailwind-variants';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

/* ── Variants ───────────────────────────────────────────── */

const featureCard = tv({
  base: 'relative overflow-hidden rounded-3xl p-8 border-2 backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1',
  variants: {
    color: {
      blue: 'bg-blue-500/10 border-blue-400/30 shadow-[0_8px_32px_rgba(37,99,235,0.2),inset_0_-3px_0_rgba(37,99,235,0.35)]',
      cyan: 'bg-cyan-500/10 border-cyan-400/30 shadow-[0_8px_32px_rgba(6,182,212,0.2),inset_0_-3px_0_rgba(6,182,212,0.35)]',
      violet: 'bg-violet-500/10 border-violet-400/30 shadow-[0_8px_32px_rgba(139,92,246,0.2),inset_0_-3px_0_rgba(139,92,246,0.35)]',
    },
  },
  defaultVariants: { color: 'blue' },
});

/* ── Data ───────────────────────────────────────────────── */

const STATS = [
  { value: '50,000+', label: 'homepage.stats.questionsGenerated' },
  { value: '12', label: 'homepage.stats.certificationTracks' },
  { value: '94%', label: 'homepage.stats.passRate' },
  { value: '< 60s', label: 'homepage.stats.generateTime' },
];

const FEATURES = [
  {
    color: 'blue' as const,
    icon: '🤖',
    heading: 'homepage.features.ai.heading',
    body: 'homepage.features.ai.body',
  },
  {
    color: 'cyan' as const,
    icon: '🎯',
    heading: 'homepage.features.topics.heading',
    body: 'homepage.features.topics.body',
  },
  {
    color: 'violet' as const,
    icon: '📊',
    heading: 'homepage.features.answers.heading',
    body: 'homepage.features.answers.body',
  },
];

const CERTIFICATIONS = [
  { name: 'AWS Solutions Architect', abbr: 'AWS', bg: '#FF9900', text: '#000' },
  { name: 'Microsoft Azure', abbr: 'AZ', bg: '#0078D4', text: '#fff' },
  { name: 'Google Cloud', abbr: 'GCP', bg: '#4285F4', text: '#fff' },
  { name: 'SAP Certified', abbr: 'SAP', bg: '#0070F2', text: '#fff' },
  { name: 'CompTIA Security+', abbr: 'SEC+', bg: '#C8202F', text: '#fff' },
  { name: 'Kubernetes CKA', abbr: 'CKA', bg: '#326CE5', text: '#fff' },
  { name: 'HashiCorp Terraform', abbr: 'TF', bg: '#7B42BC', text: '#fff' },
  { name: 'Oracle Cloud', abbr: 'OCI', bg: '#C74634', text: '#fff' },
  { name: 'Cisco CCNA', abbr: 'CCNA', bg: '#1BA0D7', text: '#fff' },
  { name: 'Linux Foundation', abbr: 'LFS', bg: '#2D2D2D', text: '#fff' },
  { name: 'CompTIA Network+', abbr: 'NET+', bg: '#C8202F', text: '#fff' },
  { name: 'VMware VCP', abbr: 'VCP', bg: '#607078', text: '#fff' },
] as const;

const TESTIMONIALS = [
  {
    quote: 'homepage.testimonials.quote1',
    name: 'Rafael Mendes',
    role: 'homepage.testimonials.role1',
    initials: 'RM',
    color: 'from-orange-500 to-amber-500',
  },
  {
    quote: 'homepage.testimonials.quote2',
    name: 'Priya Sharma',
    role: 'homepage.testimonials.role2',
    initials: 'PS',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    quote: 'homepage.testimonials.quote3',
    name: 'Lucas Oliveira',
    role: 'homepage.testimonials.role3',
    initials: 'LO',
    color: 'from-violet-500 to-indigo-500',
  },
];

const COMPANIES = [
  { name: 'Accenture', color: '#A100FF' },
  { name: 'Deloitte', color: '#86BC25' },
  { name: 'Capgemini', color: '#0070AD' },
  { name: 'IBM', color: '#1F70C1' },
  { name: 'NTT Data', color: '#003087' },
  { name: 'Wipro', color: '#341C54' },
  { name: 'Cognizant', color: '#0033A0' },
  { name: 'Infosys', color: '#007CC5' },
] as const;

/* ── Page ───────────────────────────────────────────────── */

export default function HeroPage() {
  return (
    <div className="bg-[#0a1628] text-white">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <CertificationsSection />
      <TestimonialsSection />
      <CompaniesSection />
      <CtaSection />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────── */

function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden px-6">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
        <Chip
          variant="flat"
          radius="full"
          className="text-xs tracking-widest uppercase font-semibold px-4 bg-violet-500/15 text-violet-300 border border-violet-400/20"
        >
          {t('homepage.chip')}
        </Chip>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
          <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">{t('homepage.hero.line1')}</span>
          <br />
          <span className="text-white">{t('homepage.hero.line2')}</span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          {t('homepage.hero.description')}
        </p>

        <div className="flex flex-wrap gap-4 justify-center mt-2">
          <Button
            as={NextLink}
            href="/quiz"
            size="lg"
            radius="full"
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-8 shadow-[0_6px_24px_rgba(139,92,246,0.5)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            {t('homepage.cta.startPracticing')}
          </Button>
          <Button
            as={NextLink}
            href="/configure-certification"
            variant="bordered"
            size="lg"
            radius="full"
            className="font-semibold px-8 border-white/20 text-white/70 hover:text-white hover:border-white/40 transition-all duration-200"
          >
            {t('homepage.cta.setupCertification')}
          </Button>
        </div>

        <p className="text-xs text-zinc-600 mt-1">{t('homepage.hero.disclaimer')}</p>
      </div>
    </section>
  );
}

/* ── Stats ──────────────────────────────────────────────── */

function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-12 px-6 border-y border-white/[0.06]">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center text-center gap-1">
            <span className="text-3xl font-extrabold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">
              {stat.value}
            </span>
            <span className="text-zinc-500 text-xs font-medium">{t(stat.label)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Features ───────────────────────────────────────────── */

function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold mb-4">{t('homepage.features.sectionLabel')}</p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            {t('homepage.features.title.before')} <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">{t('homepage.features.title.highlight')}</span>
          </h2>
          <p className="text-zinc-400 mt-4 max-w-2xl mx-auto">
            {t('homepage.features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          {FEATURES.map((card) => (
            <div key={card.heading} className={featureCard({ color: card.color })}>
              <div className="text-4xl mb-5">{card.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{t(card.heading)}</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">{t(card.body)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Certifications ─────────────────────────────────────── */

function CertificationsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6 bg-white/[0.02] border-y border-white/[0.05]">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold mb-4">{t('homepage.certifications.sectionLabel')}</p>
        <h2 className="text-3xl font-extrabold text-white mb-3">
          {t('homepage.certifications.title')}
        </h2>
        <p className="text-zinc-500 text-sm mb-12 max-w-xl mx-auto">
          {t('homepage.certifications.subtitle')}
        </p>

        <div className="flex flex-wrap justify-center gap-4">
          {CERTIFICATIONS.map((cert) => (
            <div
              key={cert.name}
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] hover:border-white/[0.14] transition-all duration-200 cursor-default"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black flex-shrink-0"
                style={{ backgroundColor: cert.bg, color: cert.text }}
              >
                {cert.abbr}
              </div>
              <span className="text-zinc-300 text-sm font-medium whitespace-nowrap">{cert.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────────── */

function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-violet-400 font-semibold mb-4">{t('homepage.testimonials.sectionLabel')}</p>
          <h2 className="text-4xl font-extrabold text-white">
            {t('homepage.testimonials.title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="relative rounded-3xl p-7 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.06] transition-colors duration-300 flex flex-col gap-5"
            >
              <div className="text-4xl text-white/10 font-serif leading-none select-none">&ldquo;</div>
              <p className="text-zinc-300 text-sm leading-relaxed flex-1 -mt-2">{t(testimonial.quote)}</p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
                <div
                  className={`w-9 h-9 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}
                >
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-semibold">{testimonial.name}</p>
                  <p className="text-zinc-500 text-xs">{t(testimonial.role)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Companies ──────────────────────────────────────────── */

function CompaniesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-16 px-6 bg-white/[0.02] border-y border-white/[0.05]">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-600 font-semibold mb-10">
          {t('homepage.companies.label')}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-6">
          {COMPANIES.map((company) => (
            <span
              key={company.name}
              className="text-lg font-black tracking-tight opacity-30 hover:opacity-60 transition-opacity duration-200 cursor-default"
              style={{ color: company.color }}
            >
              {company.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ────────────────────────────────────────────────── */

function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-28 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl p-10 bg-gradient-to-br from-violet-900/60 to-indigo-900/40 border border-violet-500/20 shadow-[0_16px_64px_rgba(139,92,246,0.25)]">
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center gap-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              {t('homepage.cta2.title')}
            </h2>
            <p className="text-zinc-400 max-w-lg leading-relaxed">
              {t('homepage.cta2.subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                as={NextLink}
                href="/quiz"
                size="lg"
                radius="full"
                className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-10 shadow-[0_6px_24px_rgba(139,92,246,0.5)] hover:shadow-[0_8px_32px_rgba(139,92,246,0.65)] hover:-translate-y-0.5 transition-all duration-200"
              >
                {t('homepage.cta2.generateQuiz')}
              </Button>
              <Button
                as={NextLink}
                href="/configure-certification"
                variant="bordered"
                size="lg"
                radius="full"
                className="border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold px-8 transition-all duration-200"
              >
                {t('homepage.cta2.setupCertification')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
