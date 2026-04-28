'use client';

import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faFileLines, faRoute } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

/* ── Data ───────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: faRobot,
    heading: 'homepage.features.ai.heading',
    body: 'homepage.features.ai.body',
  },
  {
    icon: faFileLines,
    heading: 'homepage.features.answers.heading',
    body: 'homepage.features.answers.body',
  },
  {
    icon: faRoute,
    heading: 'homepage.features.topics.heading',
    body: 'homepage.features.topics.body',
  },
] as const;

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
    <div className="bg-background text-foreground">
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────── */

function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="w-full md:w-5/12 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-content1 border border-divider w-fit">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs uppercase tracking-widest text-default-500 font-medium">
              {t('homepage.hero.badge')}
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            {t('homepage.hero.headline')}
          </h1>
          <p className="text-base text-default-500 leading-relaxed">
            {t('homepage.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              as={NextLink}
              href="/quiz"
              size="lg"
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              {t('homepage.cta.startFreeTrial')}
            </Button>
            <Button
              as={NextLink}
              href="/generate-questions"
              variant="bordered"
              size="lg"
              className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 rounded-lg"
            >
              {t('homepage.cta.viewSampleQuestions')}
            </Button>
          </div>
        </div>

        <div className="w-full md:w-7/12">
          <AppMockup />
        </div>
      </div>
    </section>
  );
}

/* ── App Mockup ─────────────────────────────────────────── */

function AppMockup() {
  return (
    <div className="relative bg-content1 border border-divider rounded-xl overflow-hidden aspect-[4/3] shadow-lg">
      <div className="absolute top-0 left-0 w-full h-8 bg-content2 border-b border-divider flex items-center px-4 gap-2 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
      </div>
      <div className="absolute inset-0 pt-8 p-5 flex flex-col gap-2 font-mono text-xs select-none overflow-hidden">
        <div>
          <span className="text-indigo-400">const</span>{' '}
          <span className="text-cyan-300">question</span>{' '}
          <span className="text-default-400">=</span>{' '}
          <span className="text-amber-300">await</span>{' '}
          <span className="text-cyan-300">generateQuestion</span>
          <span className="text-default-500">{'({'}</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">certification</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;AWS-SAA-C03&quot;</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">domain</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;Security&quot;</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">difficulty</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-amber-200">&quot;advanced&quot;</span>
        </div>
        <div><span className="text-default-500">{'}'});</span></div>
        <div className="mt-2">
          <span className="text-indigo-400">const</span>{' '}
          <span className="text-cyan-300">score</span>{' '}
          <span className="text-default-400">=</span>{' '}
          <span className="text-default-400">{'{'}</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">correct</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">47</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">total</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">50</span>
          <span className="text-default-500">,</span>
        </div>
        <div className="pl-4">
          <span className="text-cyan-200">confidence</span>
          <span className="text-default-500">:</span>{' '}
          <span className="text-indigo-300">0.942</span>
        </div>
        <div><span className="text-default-500">{'}'}</span></div>
      </div>
      <div className="absolute bottom-4 right-4 bg-content2 border border-divider rounded-lg p-3 flex flex-col gap-0.5">
        <span className="text-xs text-primary font-medium">Analysis Complete</span>
        <span className="text-xs font-mono text-foreground">Confidence: 94.2%</span>
      </div>
    </div>
  );
}

/* ── Trusted By ─────────────────────────────────────────── */

function TrustedBySection() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-divider bg-content1/50 py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
        <span className="text-xs uppercase tracking-widest text-default-400 font-semibold">
          {t('homepage.trustedBy')}
        </span>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {COMPANIES.map((company) => (
            <span
              key={company.name}
              className="text-lg font-black tracking-tight opacity-40 grayscale hover:opacity-60 hover:grayscale-0 transition-all duration-200 cursor-default"
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

/* ── Features ───────────────────────────────────────────── */

function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.heading}
            className="bg-content1 border border-divider rounded-xl p-6 flex flex-col gap-4 hover:border-default-300 transition-colors duration-200"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FontAwesomeIcon icon={feature.icon} className="text-primary text-sm" />
            </div>
            <h3 className="text-lg font-bold text-foreground">{t(feature.heading)}</h3>
            <p className="text-sm text-default-500 leading-relaxed">{t(feature.body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
