'use client';

import { useEffect, useState } from 'react';
import NextLink from 'next/link';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowRight,
  faPlay,
  faStar,
  faCheck,
  faXmark,
  faRobot,
  faDatabase,
  faLandmark,
  faFileLines,
  faChartLine,
} from '@fortawesome/free-solid-svg-icons';
import { faAws, faMicrosoft } from '@fortawesome/free-brands-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

/* ── Data ───────────────────────────────────────────────── */

const MARQUEE_ITEMS = [
  { label: 'Questions Generated Today', value: '14,203' },
  { label: 'Active Study Sessions', value: '4,891' },
  { label: 'AI Accuracy Rate', value: '98.2%' },
  { label: 'Certifications Passed This Month', value: '2,107' },
  { label: 'AWS SAA-C03 — Updated Questions', value: '47 New' },
  { label: 'CESPE/CEBRASPE — 2025 Edital Sync', value: 'Active' },
] as const;

const EXAM_TRACKS = [
  {
    icon: faAws,
    provider: 'Amazon Web Services',
    title: 'AWS',
    tracks: ['SAA-C03 · Solutions Architect', 'DVA-C02 · Developer', 'SOA-C02 · SysOps Admin', '+ 8 more tracks'],
    count: '340K+ questions',
  },
  {
    icon: faMicrosoft,
    provider: 'Microsoft Azure',
    title: 'Azure',
    tracks: ['AZ-900 · Fundamentals', 'AZ-104 · Administrator', 'AZ-305 · Solutions Expert', '+ 6 more tracks'],
    count: '280K+ questions',
  },
  {
    icon: faDatabase,
    provider: 'SAP Enterprise',
    title: 'SAP',
    tracks: ['C_HANATEC · Technology', 'C_S4FTR · Finance', 'P_SAPEA · Enterprise Arch', '+ 5 more tracks'],
    count: '190K+ questions',
  },
  {
    icon: faLandmark,
    provider: 'Setor Público · Brasil',
    title: 'Concursos Públicos',
    tracks: ['CESPE/CEBRASPE · Edital', 'FCC · Federal Courts', 'IBFC · INSS · PRF', '+ 12 more bancas'],
    count: '390K+ questions',
  },
] as const;

const STATS = [
  { value: '1.2M+', label: 'homepage.stats.questionsGenerated' },
  { value: '32', label: 'homepage.stats.certificationTracks' },
  { value: '94.7%', label: 'homepage.stats.passRate' },
  { value: '<200ms', label: 'homepage.stats.generateTime' },
] as const;

const TESTIMONIALS = [
  {
    quote: 'homepage.testimonials.quote1',
    role: 'homepage.testimonials.role1',
    initials: 'AB',
  },
  {
    quote: 'homepage.testimonials.quote2',
    role: 'homepage.testimonials.role2',
    initials: 'CM',
  },
  {
    quote: 'homepage.testimonials.quote3',
    role: 'homepage.testimonials.role3',
    initials: 'PK',
  },
] as const;

const TERMINAL_QUESTION =
  'A company is designing a highly available web application on AWS. The application requires session persistence, automatic failover across Availability Zones, and the ability to handle traffic spikes of up to 10x normal load within 60 seconds. Which combination of services BEST meets these requirements?';

const TERMINAL_OPTIONS = [
  { label: 'A', text: 'Use Amazon S3 Cross-Region Replication with S3-IA storage class for infrequent access patterns', selected: false },
  { label: 'B', text: 'Deploy a Multi-AZ RDS instance with read replicas and ElastiCache for session management', selected: true },
  { label: 'C', text: 'Configure AWS Global Accelerator with an ALB and Auto Scaling group across two Availability Zones', selected: false },
  { label: 'D', text: 'Implement AWS Direct Connect with a VPN backup and Transit Gateway for hybrid connectivity', selected: false },
] as const;

/* ── Page ───────────────────────────────────────────────── */

export default function HeroPage() {
  return (
    <div className="bg-navy-900 text-[#e8edf3]">
      <MarqueeDataStrip />
      <HeroSection />
      <StatsStrip />
      <ExamGridSection />
      <FeaturesSection />
      <TestimonialsStrip />
      <CtaSection />
    </div>
  );
}

/* ── Marquee Data Strip ─────────────────────────────────── */

function MarqueeDataStrip() {
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS];

  return (
    <div className="bg-navy-950 border-b border-navy-800/40 overflow-hidden h-8">
      <div className="marquee-track flex items-center h-full whitespace-nowrap">
        {items.map((item, i) => (
          <span key={i} className="flex items-center gap-10 px-6 h-full font-mono text-xs text-navy-400">
            <span className="text-accent font-medium">{item.value}</span>
            {' '}{item.label}
            <span className="text-navy-600 mx-4">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────── */

function HeroSection() {
  const { t } = useTranslation();
  const [displayedText, setDisplayedText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  useEffect(() => {
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < TERMINAL_QUESTION.length) {
          setDisplayedText(TERMINAL_QUESTION.slice(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
          setTimeout(() => setShowOptions(true), 300);
        }
      }, 22);
      return () => clearInterval(interval);
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <section className="pt-16 pb-24 relative overflow-hidden grid-bg">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, #070e20 0%, #0f1b3d 50%, rgba(30,58,95,0.2) 100%)' }}
      />
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'rgba(0,212,255,0.04)', filter: 'blur(60px)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 border border-navy-700 rounded px-3 py-1.5 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs text-navy-400 tracking-wider">{t('homepage.hero.badge')}</span>
            </div>

            <h1 className="font-sora font-extrabold text-white text-3xl sm:text-4xl xl:text-5xl leading-tight mb-6">
              {t('homepage.hero.headline')}
            </h1>

            <p className="text-navy-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
              {t('homepage.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Button
                as={NextLink}
                className="font-semibold text-sm bg-navy-600 hover:bg-navy-500 text-white border border-navy-500 rounded tracking-wide"
                href="/certifications/simulados"
                size="lg"
              >
                {t('homepage.cta.startFreeTrial')}
                <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
              </Button>
              <Button
                as={NextLink}
                className="font-medium text-sm text-navy-400 hover:text-white border border-navy-700 hover:border-navy-600 rounded tracking-wide"
                href="/certifications/questions"
                size="lg"
                variant="bordered"
              >
                <FontAwesomeIcon className="text-xs mr-2 text-accent" icon={faPlay} />
                {t('homepage.cta.viewSampleQuestions')}
              </Button>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex -space-x-2">
                {['AB', 'ML', 'RC', 'PK'].map((initials) => (
                  <div
                    key={initials}
                    className="w-8 h-8 rounded-full border-2 border-navy-900 bg-navy-700 flex items-center justify-center text-[10px] font-bold text-navy-300"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <FontAwesomeIcon key={i} className="text-yellow-400 text-xs" icon={faStar} />
                  ))}
                </div>
                <p className="font-mono text-xs text-navy-400">
                  <span className="text-white">12,400+</span> professionals certified
                </p>
              </div>
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="relative">
            <div className="border border-navy-700 rounded-lg overflow-hidden bg-navy-950/80">
              {/* Terminal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-navy-800 bg-navy-900/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="font-mono text-xs text-navy-400">certifyai · question-generator</span>
                </div>
                <span className="font-mono text-xs text-green-400">● LIVE</span>
              </div>

              {/* Terminal body */}
              <div className="p-5 min-h-72">
                <div className="mb-3">
                  <span className="font-mono text-xs text-navy-600">$</span>
                  <span className="font-mono text-xs text-navy-400 ml-2">
                    generate --exam aws-saa-c03 --difficulty hard --topic &quot;architecture&quot;
                  </span>
                </div>
                <div className="font-mono text-xs text-accent mb-2">✓ Generating AWS Solutions Architect question...</div>

                <div className="border-l-2 border-accent/40 pl-4 mt-4">
                  <p className="font-mono text-xs text-navy-400 mb-2 uppercase tracking-widest">
                    QUESTION #4,891 · AWS-SAA-C03 · HARD
                  </p>
                  <p className="font-mono text-sm text-white leading-relaxed">
                    {displayedText}
                    {displayedText.length < TERMINAL_QUESTION.length && (
                      <span className="text-accent animate-pulse">▌</span>
                    )}
                  </p>
                </div>

                {showOptions && (
                  <div className="mt-5 space-y-2">
                    {TERMINAL_OPTIONS.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-start gap-3 p-2.5 border rounded transition-colors ${
                          opt.selected
                            ? 'border-accent/30 bg-accent/5'
                            : 'border-navy-800 hover:border-navy-600'
                        }`}
                      >
                        <span className={`font-mono text-xs mt-0.5 w-4 shrink-0 ${opt.selected ? 'text-accent' : 'text-navy-500'}`}>
                          {opt.label}.
                        </span>
                        <span className={`font-mono text-xs ${opt.selected ? 'text-white' : 'text-navy-300'}`}>
                          {opt.text}
                        </span>
                      </div>
                    ))}

                    <div className="mt-4 pt-3 border-t border-navy-800 flex items-center gap-4">
                      <span className="font-mono text-xs text-navy-600">Difficulty:</span>
                      <span className="font-mono text-xs text-orange-400">HARD</span>
                      <span className="font-mono text-xs text-navy-600">Domain:</span>
                      <span className="font-mono text-xs text-navy-300">High Availability</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 rounded-full pointer-events-none"
              style={{ background: 'rgba(0,212,255,0.08)', filter: 'blur(16px)' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Stats Strip ────────────────────────────────────────── */

function StatsStrip() {
  const { t } = useTranslation();

  return (
    <div className="bg-navy-950 border-y border-navy-800/40 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-navy-800">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center sm:px-6">
              <p className="font-mono text-xl sm:text-2xl font-medium text-white">{stat.value}</p>
              <p className="font-mono text-xs text-navy-500 mt-0.5 uppercase tracking-widest">{t(stat.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Exam Grid ──────────────────────────────────────────── */

function ExamGridSection() {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-navy-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-px h-4 bg-accent" />
            <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">{t('homepage.examGrid.sectionLabel')}</span>
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl mb-3">{t('homepage.examGrid.title')}</h2>
          <p className="text-navy-400 text-base max-w-xl">{t('homepage.examGrid.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXAM_TRACKS.map((track) => (
            <div
              key={track.title}
              className="group border border-navy-700/60 rounded-lg p-6 bg-navy-950/40 hover:bg-navy-950/70 cursor-pointer relative overflow-hidden transition-all duration-200"
              style={{ '--tw-border-opacity': '1' } as React.CSSProperties}
            >
              <div
                className="absolute top-0 right-0 w-16 h-16 rounded-bl-full pointer-events-none"
                style={{ background: 'rgba(0,212,255,0.03)' }}
              />
              <div className="w-12 h-12 border border-navy-700 group-hover:border-accent/40 rounded flex items-center justify-center mb-5 transition-colors duration-200">
                <FontAwesomeIcon className="text-navy-400 group-hover:text-accent text-xl transition-colors duration-200" icon={track.icon} />
              </div>
              <div className="mb-2">
                <span className="font-mono text-xs text-navy-500 uppercase tracking-widest">{track.provider}</span>
              </div>
              <h3 className="font-sora font-semibold text-white text-lg mb-3">{track.title}</h3>
              <div className="space-y-1.5 mb-5">
                {track.tracks.map((name) => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-navy-600" />
                    <span className="font-mono text-xs text-navy-400">{name}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-accent">{track.count}</span>
                <FontAwesomeIcon className="text-xs text-navy-600 group-hover:text-accent transition-colors duration-200" icon={faArrowRight} />
              </div>
            </div>
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
    <section className="py-20 bg-navy-950 border-t border-navy-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-px h-4 bg-accent" />
            <span className="font-mono text-xs text-navy-400 tracking-widest uppercase">{t('homepage.features.sectionLabel')}</span>
          </div>
          <h2 className="font-sora font-bold text-white text-2xl sm:text-3xl">{t('homepage.features.subtitle')}</h2>
        </div>

        {renderFeature1()}
        {renderFeature2()}
        {renderFeature3()}
      </div>
    </section>
  );

  function renderFeature1() {
    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 pb-16 border-b border-navy-800/40">
        <div className="order-2 lg:order-1">
          <span className="font-mono text-xs text-accent tracking-widest uppercase block mb-4">01 — AI Generation</span>
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">{t('homepage.features.ai.heading')}</h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.ai.body')}</p>
          <div className="space-y-3">
            {['Supports any certification standard or Edital', 'Difficulty calibration per domain', 'Portuguese and English language support'].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative border border-navy-700 rounded-lg overflow-hidden bg-navy-900/60">
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
              <div className="scan-line" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <FontAwesomeIcon className="text-navy-500 text-sm" icon={faFileLines} />
                <span className="font-mono text-xs text-navy-500">source_material.pdf → AWS_Well_Architected_Framework.pdf</span>
              </div>
              <div className="bg-navy-950/60 rounded p-4 mb-4 border border-navy-800">
                <p className="font-mono text-xs text-navy-400 leading-relaxed">
                  <span className="text-navy-600 select-none">01 </span>The Well-Architected Framework provides a consistent approach...<br />
                  <span className="text-navy-600 select-none">02 </span>
                  <span className="px-0.5" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>The five pillars include: Operational Excellence, Security, Reliability,</span><br />
                  <span className="text-navy-600 select-none">03 </span>
                  <span className="px-0.5" style={{ background: 'rgba(0,212,255,0.2)', color: '#00d4ff' }}>Performance Efficiency, and Cost Optimization.</span>
                </p>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-navy-800" />
                <span className="font-mono text-xs text-accent px-2">AI PROCESSING</span>
                <div className="h-px flex-1 bg-navy-800" />
              </div>
              <div className="bg-navy-950/60 rounded p-4 border border-accent/20">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-2">Generated Question:</p>
                <p className="font-mono text-xs text-white">Which of the following correctly identifies the five pillars of the AWS Well-Architected Framework?</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>Quality: 98/100</span>
                  <span className="font-mono text-xs text-navy-500">· 4 distractors generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderFeature2() {
    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center mb-16 pb-16 border-b border-navy-800/40">
        <div>
          <div className="border border-navy-700 rounded-lg overflow-hidden bg-navy-900/60">
            <div className="flex border-b border-navy-800">
              <div className="flex-1 p-4 border-r border-navy-800">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">Your Answer</p>
                <div className="rounded p-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon className="text-red-400 text-xs mt-0.5 shrink-0" icon={faXmark} />
                    <p className="font-mono text-xs text-red-300">A. SQS standard queues guarantee exactly-once delivery</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4">
                <p className="font-mono text-xs text-navy-500 uppercase tracking-widest mb-3">Correct Answer</p>
                <div className="rounded p-3" style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)' }}>
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon className="text-green-400 text-xs mt-0.5 shrink-0" icon={faCheck} />
                    <p className="font-mono text-xs text-green-300">D. FIFO queues provide exactly-once processing</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)' }}>
                  <FontAwesomeIcon className="text-accent text-xs" icon={faRobot} />
                </div>
                <span className="font-mono text-xs text-accent">AI Explanation</span>
              </div>
              <p className="font-mono text-xs text-navy-300 leading-relaxed">
                Standard SQS queues use a distributed architecture providing{' '}
                <span className="text-white">at-least-once delivery</span>, meaning duplicates can occur. FIFO queues ensure{' '}
                <span className="text-white">exactly-once processing</span> using message deduplication IDs.
              </p>
            </div>
          </div>
        </div>
        <div>
          <span className="font-mono text-xs text-accent tracking-widest uppercase block mb-4">02 — Real-time Feedback</span>
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">{t('homepage.features.answers.heading')}</h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.answers.body')}</p>
          <div className="space-y-3">
            {['Distractor pattern analysis for every wrong option', 'Links to official documentation', 'Automatic weak-area flagging'].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderFeature3() {
    return (
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="order-2 lg:order-1">
          <span className="font-mono text-xs text-accent tracking-widest uppercase block mb-4">03 — Topic Weighting</span>
          <h3 className="font-sora font-bold text-white text-xl sm:text-2xl mb-4">{t('homepage.features.topics.heading')}</h3>
          <p className="text-navy-400 text-base leading-relaxed mb-6">{t('homepage.features.topics.body')}</p>
          <div className="space-y-3">
            {['Domain-by-domain percentage control', 'Match real exam distribution', 'Custom sessions per topic'].map((item) => (
              <div key={item} className="flex items-center gap-3 py-3 border-b border-navy-800/40 last:border-0">
                <FontAwesomeIcon className="text-accent text-xs w-4 shrink-0" icon={faCheck} />
                <span className="text-sm text-navy-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="border border-navy-700 rounded-lg bg-navy-900/60 p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs text-navy-400 uppercase tracking-widest">Domain Distribution · AWS SAA-C03</span>
              <FontAwesomeIcon className="text-accent text-sm" icon={faChartLine} />
            </div>
            <div className="mt-5 space-y-4">
              {[
                { label: 'Design Resilient Architectures', value: 30, color: '#00d4ff' },
                { label: 'Design High-Performing', value: 28, color: '#4fc3f7' },
                { label: 'Design Secure Architectures', value: 24, color: '#818cf8' },
                { label: 'Design Cost-Optimized', value: 18, color: '#6a9fc8' },
              ].map((domain) => (
                <div key={domain.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-xs text-navy-400">{domain.label}</span>
                    <span className="font-mono text-xs text-white">{domain.value}%</span>
                  </div>
                  <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${domain.value}%`, background: domain.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* ── Testimonials ───────────────────────────────────────── */

function TestimonialsStrip() {
  const { t } = useTranslation();

  return (
    <div className="border-y border-navy-800/40 py-10" style={{ background: 'rgba(30,58,95,0.3)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <p className="font-mono text-xs text-navy-500">{t(item.role)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── CTA Section ────────────────────────────────────────── */

function CtaSection() {
  const { t } = useTranslation();

  return (
    <div className="bg-navy-950 border-t border-navy-800/40 py-14">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono text-xs text-green-400 tracking-wider">All Systems Operational · 99.98% Uptime</span>
        </div>
        <h2 className="font-sora font-extrabold text-white text-2xl sm:text-4xl mb-5">
          {t('homepage.cta2.title')}
        </h2>
        <p className="text-navy-400 text-base mb-8 max-w-lg mx-auto">
          {t('homepage.cta2.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            as={NextLink}
            className="font-semibold text-sm bg-navy-600 hover:bg-navy-500 text-white border border-navy-500 rounded tracking-wide w-full sm:w-auto"
            href="/certifications/simulados"
            size="lg"
          >
            {t('homepage.cta2.generateQuiz')}
            <FontAwesomeIcon className="ml-2 text-xs" icon={faArrowRight} />
          </Button>
          <Button
            as={NextLink}
            className="font-medium text-sm text-navy-400 hover:text-white tracking-wide"
            href="/certifications/configure"
            size="lg"
            variant="light"
          >
            {t('homepage.cta2.setupCertification')}
          </Button>
        </div>
        <p className="font-mono text-xs text-navy-600 mt-4">{t('homepage.hero.disclaimer')}</p>
      </div>
    </div>
  );
}
