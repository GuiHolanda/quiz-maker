import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EXAM_LANDING_PAGES, EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';
import { ExamLandingHero } from './components/ExamLandingHero';
import { ExamLandingStats } from './components/ExamLandingStats';
import { ExamTopicsSection } from './components/ExamTopicsSection';
import { DemoSimuladoSection } from './components/DemoSimuladoSection';
import { ExamFaqSection } from './components/ExamFaqSection';

interface PageProps {
  readonly params: Promise<{ 'exam-slug': string }>;
}

export function generateStaticParams() {
  return EXAM_LANDING_PAGES.map((exam) => ({ 'exam-slug': exam.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { 'exam-slug': slug } = await params;
  const config = EXAM_LANDING_PAGE_MAP.get(slug);
  if (!config) return {};

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `https://www.certifiqueai.com/simulado/${slug}`,
      type: 'website',
    },
    alternates: { canonical: `https://www.certifiqueai.com/simulado/${slug}` },
  };
}

export default async function ExamLandingPage({ params }: PageProps) {
  const { 'exam-slug': slug } = await params;
  const config = EXAM_LANDING_PAGE_MAP.get(slug);

  if (!config) notFound();

  return (
    <div className="text-foreground">
      <ExamLandingHero config={config} />
      <ExamLandingStats config={config} />
      <ExamTopicsSection config={config} />
      <DemoSimuladoSection config={config} />
      <ExamFaqSection config={config} />
    </div>
  );
}
