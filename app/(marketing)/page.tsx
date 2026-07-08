'use client';

import NextLink from 'next/link';
import Image from 'next/image';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRobot, faFileLines, faRoute, faQuoteLeft } from '@fortawesome/free-solid-svg-icons';

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

const STATS = [
  { value: '2M+', label: 'homepage.stats.questionsGenerated' },
  { value: '40+', label: 'homepage.stats.certificationTracks' },
  { value: '89%', label: 'homepage.stats.passRate' },
  { value: '< 15s', label: 'homepage.stats.generateTime' },
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

const CERTIFICATIONS = [
  { name: 'AWS SAA-C03', provider: 'AWS', color: '#FF9900' },
  { name: 'AWS Developer', provider: 'AWS', color: '#FF9900' },
  { name: 'Azure AZ-900', provider: 'Azure', color: '#0089D6' },
  { name: 'Azure AZ-104', provider: 'Azure', color: '#0089D6' },
  { name: 'GCP Associate', provider: 'GCP', color: '#4285F4' },
  { name: 'SAP C_HCMPAY', provider: 'SAP', color: '#0FAAFF' },
  { name: 'SAP C_ARCON', provider: 'SAP', color: '#0FAAFF' },
  { name: 'CompTIA A+', provider: 'CompTIA', color: '#C8202F' },
  { name: 'CompTIA Network+', provider: 'CompTIA', color: '#C8202F' },
  { name: 'CKA', provider: 'Linux Foundation', color: '#30638E' },
  { name: 'Terraform Associate', provider: 'HashiCorp', color: '#7B42BC' },
  { name: 'Kubernetes CKS', provider: 'Linux Foundation', color: '#30638E' },
] as const;

const TESTIMONIALS = [
  {
    quote: 'homepage.testimonials.quote1',
    role: 'homepage.testimonials.role1',
    initials: 'RC',
  },
  {
    quote: 'homepage.testimonials.quote2',
    role: 'homepage.testimonials.role2',
    initials: 'ML',
  },
  {
    quote: 'homepage.testimonials.quote3',
    role: 'homepage.testimonials.role3',
    initials: 'AK',
  },
] as const;

/* ── Page ───────────────────────────────────────────────── */

export default function HeroPage() {
  return (
    <div className="bg-background text-foreground">
      <HeroSection />
      <StatsSection />
      <CompaniesSection />
      <FeaturesSection />
      <CertificationsSection />
      <TestimonialsSection />
      <CtaSection />
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
            <span className="text-xs font-medium text-default-500">{t('homepage.hero.badge')}</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-foreground">
            {t('homepage.hero.headline')}
          </h1>
          <p className="text-base text-default-500 leading-relaxed">{t('homepage.hero.description')}</p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              as={NextLink}
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              href="/certifications/simulados"
              size="lg"
            >
              {t('homepage.cta.startFreeTrial')}
            </Button>
            <Button
              as={NextLink}
              className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 rounded-lg"
              href="/certifications/questions"
              size="lg"
              variant="bordered"
            >
              {t('homepage.cta.viewSampleQuestions')}
            </Button>
          </div>
          <p className="text-xs text-default-400">{t('homepage.hero.disclaimer')}</p>
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
  const { t } = useTranslation();

  return (
    <div className="relative bg-content1 border border-divider rounded-xl overflow-hidden shadow-lg">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-content2 border-b border-divider">
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-default-300" />
        <div className="ml-3 flex items-center gap-2">
          <Image alt="" aria-hidden height={14} src="/icon.svg" width={14} />
          <span className="text-xs text-default-400 font-medium">certifiqueai.com</span>
        </div>
      </div>

      {/* Quiz interface mockup */}
      <div className="p-5 flex flex-col gap-4">
        {/* Question */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">AWS SAA-C03</span>
            <span className="text-xs text-default-400">Security · Question 3/20</span>
          </div>
          <p className="text-sm text-foreground font-medium leading-relaxed">
            A company needs to store sensitive customer data in Amazon S3. The data must be encrypted at rest
            and the company must manage the encryption keys themselves. Which solution meets these requirements?
          </p>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-2">
          {[
            { label: 'A', text: 'SSE-S3 (Server-Side Encryption with Amazon S3-managed keys)', selected: false },
            { label: 'B', text: 'SSE-KMS with AWS managed key', selected: false },
            { label: 'C', text: 'SSE-KMS with customer managed key (CMK)', selected: true },
            { label: 'D', text: 'SSE-C (Server-Side Encryption with customer-provided keys)', selected: false },
          ].map((opt) => (
            <div
              key={opt.label}
              className={`flex items-start gap-3 p-3 rounded-lg border text-xs transition-colors duration-150 ${
                opt.selected
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-default-200 bg-content2 text-default-500'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-[10px] ${
                  opt.selected ? 'bg-primary text-white' : 'bg-default-200 text-default-500'
                }`}
              >
                {opt.label}
              </span>
              <span>{opt.text}</span>
            </div>
          ))}
        </div>

        {/* Confidence badge */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-default-400">
            {t('homepage.mockup.analysisComplete')}
          </span>
          <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            {t('homepage.mockup.confidence')}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Stats ──────────────────────────────────────────────── */

function StatsSection() {
  const { t } = useTranslation();

  return (
    <section className="border-y border-divider bg-content1/40 py-12 px-6">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1.5 text-center">
            <span className="text-3xl lg:text-4xl font-extrabold text-primary">{stat.value}</span>
            <span className="text-xs text-default-400 leading-snug">{t(stat.label)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── Companies ──────────────────────────────────────────── */

function CompaniesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-10 px-6">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6">
        <span className="text-xs font-semibold text-default-400">{t('homepage.companies.label')}</span>
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
    <section className="py-20 px-6 bg-content1/20">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="text-xs font-semibold text-primary">{t('homepage.features.sectionLabel')}</span>
          <h2 className="text-3xl font-extrabold text-foreground">
            {t('homepage.features.title.before')}{' '}
            <span className="text-primary">{t('homepage.features.title.highlight')}</span>
          </h2>
          <p className="text-sm text-default-500 leading-relaxed">{t('homepage.features.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.heading}
              className="bg-content1 border border-divider rounded-xl p-6 flex flex-col gap-4 hover:border-default-300 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <FontAwesomeIcon className="text-primary text-sm" icon={feature.icon} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{t(feature.heading)}</h3>
              <p className="text-sm text-default-500 leading-relaxed">{t(feature.body)}</p>
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
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="text-xs font-semibold text-primary">{t('homepage.certifications.sectionLabel')}</span>
          <h2 className="text-3xl font-extrabold text-foreground">{t('homepage.certifications.title')}</h2>
          <p className="text-sm text-default-500 leading-relaxed">{t('homepage.certifications.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {CERTIFICATIONS.map((cert) => (
            <div
              key={cert.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-content1 border border-divider hover:border-default-300 transition-colors duration-200"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: cert.color }}
              />
              <span className="text-sm font-medium text-foreground">{cert.name}</span>
              <span className="text-xs text-default-400">{cert.provider}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
            <span className="text-sm font-medium text-primary">+ many more</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────────── */

function TestimonialsSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6 bg-content1/20">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3 max-w-2xl">
          <span className="text-xs font-semibold text-primary">{t('homepage.testimonials.sectionLabel')}</span>
          <h2 className="text-3xl font-extrabold text-foreground">{t('homepage.testimonials.title')}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((item) => (
            <div
              key={item.quote}
              className="bg-content1 border border-divider rounded-xl p-6 flex flex-col gap-5 hover:border-default-300 transition-colors duration-200"
            >
              <FontAwesomeIcon className="text-primary/40 text-xl" icon={faQuoteLeft} />
              <p className="text-sm text-default-500 leading-relaxed flex-1">&ldquo;{t(item.quote)}&rdquo;</p>
              <div className="flex items-center gap-3 pt-2 border-t border-divider">
                <span className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {item.initials}
                </span>
                <span className="text-xs text-default-400">{t(item.role)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA2 ───────────────────────────────────────────────── */

function CtaSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-10 md:p-14 flex flex-col items-center gap-6 text-center">
          <Image alt="CertifiqueAI" className="mb-2" height={40} src="/icon.svg" width={40} />
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
            {t('homepage.cta2.title')}
          </h2>
          <p className="text-sm text-default-500 leading-relaxed max-w-xl">
            {t('homepage.cta2.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Button
              as={NextLink}
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
              href="/certifications/simulados"
              size="lg"
            >
              {t('homepage.cta2.generateQuiz')}
            </Button>
            <Button
              as={NextLink}
              className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 rounded-lg"
              href="/certifications/configure"
              size="lg"
              variant="bordered"
            >
              {t('homepage.cta2.setupCertification')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
