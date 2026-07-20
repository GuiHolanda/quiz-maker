'use client';

import NextLink from 'next/link';
import { useSession } from 'next-auth/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faFileContract,
  faBullseye,
  faFire,
  faClock,
  faTrophy,
  faTriangleExclamation,
  faPlay,
  faArrowTrendUp,
  faMicrochip,
} from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';

const MOCK_FOCUS_AREAS = [
  {
    id: 'db-storage',
    name: 'Database & Storage Architecture',
    detail: 'RDS, DynamoDB, S3 — Domain 2',
    accuracy: 54,
    missed: 47,
    tag: 'High exam weight',
    color: 'danger' as const,
  },
  {
    id: 'networking',
    name: 'Networking & Content Delivery',
    detail: 'VPC, Route53, CloudFront — Domain 3',
    accuracy: 67,
    missed: 29,
    tag: null,
    color: 'warning' as const,
  },
  {
    id: 'security',
    name: 'Security, Identity & Compliance',
    detail: 'IAM, KMS, Shield — Domain 1',
    accuracy: 72,
    missed: null,
    tag: 'Borderline pass threshold',
    color: 'secondary' as const,
  },
] as const;

const MOCK_SESSIONS = [
  { id: 1, title: 'AWS SAA — Storage', meta: 'Today · 45 min · 60 questions', score: 91, scoreColor: 'text-success' },
  {
    id: 2,
    title: 'AWS SAA — Networking',
    meta: 'Yesterday · 32 min · 40 questions',
    score: 67,
    scoreColor: 'text-warning',
  },
  {
    id: 3,
    title: 'Mock Exam — Full Sim',
    meta: 'May 17 · 130 min · 65 questions',
    score: 78,
    scoreColor: 'text-electric',
  },
  {
    id: 4,
    title: 'AWS SAA — Security & IAM',
    meta: 'May 16 · 28 min · 35 questions',
    score: 83,
    scoreColor: 'text-success',
  },
  {
    id: 5,
    title: 'AWS SAA — Compute & EC2',
    meta: 'May 15 · 40 min · 50 questions',
    score: 89,
    scoreColor: 'text-success',
  },
] as const;

const MOCK_DOMAINS = [
  { name: 'Security & Compliance', detail: 'Domain 1 · 16% exam weight', score: 72, cohort: 61, color: '#f59e0b' },
  { name: 'Database & Storage', detail: 'Domain 2 · 24% exam weight', score: 54, cohort: 65, color: '#ef4444' },
  {
    name: 'Networking & Content Delivery',
    detail: 'Domain 3 · 22% exam weight',
    score: 67,
    cohort: 60,
    color: '#f97316',
  },
  {
    name: 'Compute & High Availability',
    detail: 'Domain 4 · 26% exam weight',
    score: 89,
    cohort: 68,
    color: '#00d4ff',
  },
  {
    name: 'Cost Optimization & Billing',
    detail: 'Domain 5 · 12% exam weight',
    score: 93,
    cohort: 70,
    color: '#00d4ff',
  },
] as const;

function getGreeting(name: string | null | undefined): string {
  const hour = new Date().getHours();
  const first = name?.split(' ')[0] ?? '';
  if (hour < 12) return `Bom dia, ${first}.`;
  if (hour < 18) return `Boa tarde, ${first}.`;
  return `Boa noite, ${first}.`;
}

function scoreTextColor(score: number) {
  if (score >= 75) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

function focusBarColor(color: 'danger' | 'warning' | 'secondary') {
  if (color === 'danger') return 'bg-danger';
  if (color === 'warning') return 'bg-warning';
  return 'bg-secondary';
}

function focusBorderColor(color: 'danger' | 'warning' | 'secondary') {
  if (color === 'danger') return 'border-danger/20';
  if (color === 'warning') return 'border-warning/20';
  return 'border-secondary/20';
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const greeting = getGreeting(session?.user?.name);

  return (
    <div className="min-h-full bg-background2 px-6 py-6 space-y-5">
      <div className="container mx-auto pt-8 px-4 pb-12 space-y-5">
        {/* ── PERFORMANCE HEADER ── */}
        <section className="bg-content1 border border-default-200 rounded-xl overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Greeting + CTAs */}
            <div className="flex-1 p-6 lg:p-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="font-mono text-[9px] text-default-400 tracking-widest uppercase">AWS SAA-C03</span>
              </div>
              <h1 className="font-bold text-foreground text-2xl lg:text-3xl mb-2 leading-snug">
                {greeting} <span className="text-primary">{t('dashboard.onTrack')}</span>
              </h1>
              <p className="text-default-500 text-sm mb-6 max-w-sm">
                {t('dashboard.weakAreasNote', { count: '3' })} antes do seu exame estimado em{' '}
                <span className="text-foreground font-semibold">14 de junho, 2025</span>.
              </p>
              <div className="flex gap-3 max-w-xs">
                <NextLink
                  className="flex items-center gap-2 bg-foreground text-background font-semibold text-xs py-2.5 px-4 rounded-lg transition-opacity hover:opacity-80"
                  href="/certifications/questions"
                >
                  <FontAwesomeIcon className="text-primary text-xs" icon={faBolt} />
                  {t('dashboard.quickPractice')}
                </NextLink>
                <NextLink
                  className="flex items-center gap-2 border border-default-200 text-foreground hover:border-default-400 font-semibold text-xs py-2.5 px-4 rounded-lg transition-colors"
                  href="/certifications/simulados"
                >
                  <FontAwesomeIcon className="text-default-400 text-xs" icon={faFileContract} />
                  {t('dashboard.mockExam')}
                </NextLink>
              </div>
            </div>

            {/* Readiness gauge */}
            <div className="shrink-0 lg:w-64 bg-navy-900 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(59,111,160,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(59,111,160,0.15) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
              <p className="font-mono text-[9px] text-navy-500 uppercase tracking-widest mb-4 relative z-10">
                {t('dashboard.examReadiness')}
              </p>
              <div className="relative z-10">
                <svg className="overflow-visible" height="100" viewBox="0 0 160 100" width="160">
                  <defs>
                    <linearGradient id="gaugeGrad" x1="0%" x2="100%" y1="0%" y2="0%">
                      <stop offset="0%" stopColor="#c4641a" />
                      <stop offset="100%" stopColor="#e07820" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 20 90 A 60 60 0 0 1 140 90"
                    fill="none"
                    stroke="rgba(59,111,160,0.15)"
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                  <path
                    d="M 20 90 A 60 60 0 0 1 140 90"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeDasharray="188.4"
                    strokeDashoffset="41.4"
                    strokeLinecap="round"
                    strokeWidth="10"
                  />
                  <line
                    opacity="0.6"
                    stroke="#4ade80"
                    strokeDasharray="2,2"
                    strokeWidth="1.5"
                    x1="84"
                    x2="84"
                    y1="32"
                    y2="22"
                  />
                  <text
                    fill="#4ade80"
                    fontFamily="monospace"
                    fontSize="8"
                    opacity="0.7"
                    textAnchor="middle"
                    x="84"
                    y="18"
                  >
                    Pass
                  </text>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                  <span className="font-bold text-white text-3xl leading-none">
                    78<span className="text-primary text-xl">%</span>
                  </span>
                  <span className="font-mono text-[9px] text-navy-400 mt-0.5">↑ 5.2% this week</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 relative z-10">
                <div className="text-center">
                  <p className="font-mono text-xs text-white font-semibold">82%</p>
                  <p className="font-mono text-[9px] text-navy-500">{t('dashboard.projectedScore')}</p>
                </div>
                <div className="w-px h-6 bg-navy-800" />
                <div className="text-center">
                  <p className="font-mono text-xs text-primary font-semibold">Top 12%</p>
                  <p className="font-mono text-[9px] text-navy-500">{t('dashboard.peerRank')}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── KPI RIBBON ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {renderKpi(
            <div
              className="w-8 h-8 border border-primary/20 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.07)' }}
            >
              <FontAwesomeIcon className="text-primary text-xs" icon={faBullseye} />
            </div>,
            <span
              className="font-mono text-[9px] text-success border border-success/20 rounded px-1.5 py-0.5"
              style={{ background: 'rgba(74,222,128,0.07)' }}
            >
              ↑ 3.2%
            </span>,
            '87.4%',
            t('dashboard.successRate'),
            t('dashboard.successRateDetail', { count: '412' })
          )}
          {renderKpi(
            <div
              className="w-8 h-8 border border-orange-400/20 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(251,146,60,0.07)' }}
            >
              <FontAwesomeIcon className="text-orange-400 text-xs" icon={faFire} />
            </div>,
            <span
              className="font-mono text-[9px] text-orange-400 border border-orange-400/20 rounded px-1.5 py-0.5"
              style={{ background: 'rgba(251,146,60,0.07)' }}
            >
              Personal Best
            </span>,
            '14 dias',
            t('dashboard.studyStreak'),
            t('dashboard.studyStreakBest', { best: '14', avg: '8.3' })
          )}
          {renderKpi(
            <div
              className="w-8 h-8 border border-electric/20 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(79,195,247,0.07)' }}
            >
              <FontAwesomeIcon className="text-electric text-xs" icon={faClock} />
            </div>,
            <span className="font-mono text-[9px] text-default-400 border border-default-200 rounded px-1.5 py-0.5">
              This week
            </span>,
            '18h 42m',
            t('dashboard.studyTime'),
            t('dashboard.studyTimeAvg', { avg: '2h 40m' })
          )}
          {renderKpi(
            <div
              className="w-8 h-8 border border-success/20 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.07)' }}
            >
              <FontAwesomeIcon className="text-success text-xs" icon={faTrophy} />
            </div>,
            <span
              className="font-mono text-[9px] text-success border border-success/20 rounded px-1.5 py-0.5"
              style={{ background: 'rgba(74,222,128,0.07)' }}
            >
              +47 today
            </span>,
            '2.841',
            t('dashboard.questionsMastered'),
            t('dashboard.questionsMasteredDetail')
          )}
        </div>

        {/* ── SPLIT ANALYSIS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Focus Areas — 3/5 */}
          <div className="lg:col-span-3 bg-content1 border border-default-200 rounded-xl flex flex-col">
            <div className="p-5 border-b border-default-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <FontAwesomeIcon className="text-warning text-xs" icon={faTriangleExclamation} />
                  <p className="font-bold text-foreground text-sm">{t('dashboard.focusAreas')}</p>
                </div>
                <p className="text-xs text-default-400">{t('dashboard.focusAreasSubtitle')}</p>
              </div>
              <button className="font-mono text-xs text-primary border border-primary/20 hover:border-primary/40 px-3 py-1.5 rounded-lg transition-colors">
                {t('dashboard.viewAll')}
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1">
              {MOCK_FOCUS_AREAS.map((area) => (
                <div key={area.id} className={`p-4 rounded-xl border ${focusBorderColor(area.color)} bg-content1`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${focusBarColor(area.color)}`} />
                        <p className="font-semibold text-foreground text-sm">{area.name}</p>
                      </div>
                      <p className="font-mono text-[10px] text-default-400 ml-4">{area.detail}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`font-bold text-lg leading-none ${scoreTextColor(area.accuracy)}`}>
                        {area.accuracy}%
                      </p>
                      <p className="font-mono text-[9px] text-default-400">{t('dashboard.accuracy')}</p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] text-default-400">{t('dashboard.masteryProgress')}</span>
                      <span className={`font-mono text-[9px] ${scoreTextColor(area.accuracy)}`}>
                        {area.accuracy} / 100
                      </span>
                    </div>
                    <div className="h-1.5 bg-default-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${focusBarColor(area.color)}`}
                        style={{ width: `${area.accuracy}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {area.missed && (
                      <span className="font-mono text-[9px] text-default-400 border border-default-200 rounded px-2 py-0.5 bg-default-100">
                        {area.missed} questions missed
                      </span>
                    )}
                    {area.tag && (
                      <span className="font-mono text-[9px] text-default-400 border border-default-200 rounded px-2 py-0.5 bg-default-100">
                        {area.tag}
                      </span>
                    )}
                    <button className="ml-auto flex items-center gap-1.5 font-semibold text-xs text-background bg-foreground hover:opacity-80 px-3 py-1.5 rounded-lg transition-opacity">
                      <FontAwesomeIcon className="text-primary text-xs" icon={faBolt} />
                      {t('dashboard.studyNow')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Score Trend + Recent Sessions — 2/5 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Score Trend */}
            <div className="bg-content1 border border-default-200 rounded-xl p-5 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-bold text-foreground text-sm">Score Trend</p>
                  <p className="text-xs text-default-400">Últimos 14 dias · Todos os domínios</p>
                </div>
                <span className="font-mono text-[10px] text-success flex items-center gap-1">
                  <FontAwesomeIcon icon={faArrowTrendUp} /> +12.3%
                </span>
              </div>
              {/* Inline SVG sparkline — no external charting lib */}
              <svg className="w-full" height="80" viewBox="0 0 300 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#e07820" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#e07820" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon
                  fill="url(#sparkGrad)"
                  points="0,80 0,55 20,52 40,58 60,50 80,45 100,48 120,42 140,38 160,35 180,30 200,28 220,25 240,22 260,18 280,15 300,12 300,80"
                />
                <polyline
                  fill="none"
                  points="0,55 20,52 40,58 60,50 80,45 100,48 120,42 140,38 160,35 180,30 200,28 220,25 240,22 260,18 280,15 300,12"
                  stroke="#e07820"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Recent Sessions */}
            <div className="bg-content1 border border-default-200 rounded-xl flex flex-col flex-1">
              <div className="p-5 border-b border-default-200 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground text-sm">{t('dashboard.recentSessions')}</p>
                  <p className="text-xs text-default-400">{t('dashboard.recentSessionsSubtitle')}</p>
                </div>
                <button className="font-mono text-[10px] text-default-400 hover:text-foreground transition-colors">
                  View All →
                </button>
              </div>
              <div className="divide-y divide-default-100">
                {MOCK_SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-content2 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-navy-900 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon className="text-primary text-xs" icon={faPlay} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-xs truncate">{session.title}</p>
                      <p className="font-mono text-[9px] text-default-400 truncate">{session.meta}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${session.scoreColor}`}>{session.score}%</p>
                      <p className="font-mono text-[9px] text-default-400">{t('dashboard.score')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── DOMAIN BREAKDOWN ── */}
        <section className="bg-content1 border border-default-200 rounded-xl">
          <div className="p-5 border-b border-default-200 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground text-sm">{t('dashboard.domainBreakdown')}</p>
              <p className="text-xs text-default-400">{t('dashboard.domainBreakdownSubtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-default-400">
                <span className="w-2 h-2 rounded-full bg-primary inline-block" /> You
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] text-default-400">
                <span className="w-2 h-2 rounded-full bg-default-400 inline-block" /> {t('dashboard.cohortAvg')}
              </span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {MOCK_DOMAINS.map((domain) => (
              <div key={domain.name} className="flex items-center gap-4">
                <div className="w-44 shrink-0">
                  <p className="font-semibold text-foreground text-xs truncate">{domain.name}</p>
                  <p className="font-mono text-[9px] text-default-400">{domain.detail}</p>
                </div>
                <div className="flex-1 relative">
                  <div className="h-2 bg-default-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${domain.score}%` }} />
                  </div>
                  {/* Cohort avg marker */}
                  <div
                    className="absolute top-0 h-2 w-0.5 bg-default-400/60 rounded-full"
                    style={{ left: `${domain.cohort}%` }}
                  />
                </div>
                <div className="w-10 text-right shrink-0">
                  <span className={`font-mono font-semibold text-xs ${scoreTextColor(domain.score)}`}>
                    {domain.score}%
                  </span>
                </div>
                <span className="w-16 font-mono text-[9px] text-default-400 border border-default-200 rounded px-1.5 py-0.5 text-center shrink-0">
                  Avg: {domain.cohort}%
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FOOTER STRIP ── */}
        <footer className="flex items-center justify-between py-2 pb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 border border-primary/30 rounded flex items-center justify-center"
              style={{ background: 'rgba(0,212,255,0.07)' }}
            >
              <FontAwesomeIcon className="text-primary" icon={faMicrochip} style={{ fontSize: '8px' }} />
            </div>
            <span className="font-mono text-[10px] text-default-400">CertifiqueAI Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-default-400">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              All systems operational
            </span>
          </div>
        </footer>
      </div>
    </div>
  );

  function renderKpi(icon: React.ReactNode, badge: React.ReactNode, value: string, label: string, detail: string) {
    return (
      <div className="bg-content1 border border-default-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          {icon}
          {badge}
        </div>
        <p className="font-bold text-foreground text-2xl leading-none mb-1">{value}</p>
        <p className="text-xs text-default-400">{label}</p>
        <p className="font-mono text-[9px] text-default-400 mt-1">{detail}</p>
      </div>
    );
  }
}
