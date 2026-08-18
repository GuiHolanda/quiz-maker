import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EXAM_LANDING_PAGES, EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';
import { ExamPracticeProvider } from '@/app/(marketing)/components/exam-landing/ExamPracticeContext';
import { ExamLandingHero } from '@/app/(marketing)/components/exam-landing/ExamLandingHero';
import { ExamFactsStrip } from '@/app/(marketing)/components/exam-landing/ExamFactsStrip';
import { ExamSyllabusSection } from '@/app/(marketing)/components/exam-landing/ExamSyllabusSection';
import { ExamSimuladoSection } from '@/app/(marketing)/components/exam-landing/ExamSimuladoSection';
import { ExamRoutineSection } from '@/app/(marketing)/components/exam-landing/ExamRoutineSection';
import { ExamTrustSection } from '@/app/(marketing)/components/exam-landing/ExamTrustSection';
import { ExamFaqSection } from '@/app/(marketing)/components/exam-landing/ExamFaqSection';
import { ExamFinalCtaSection } from '@/app/(marketing)/components/exam-landing/ExamFinalCtaSection';
import { OG_IMAGES } from '@/config/og';

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
      images: OG_IMAGES,
    },
    alternates: { canonical: `https://www.certifiqueai.com/simulado/${slug}` },
  };
}

export default async function ExamLandingPage({ params }: PageProps) {
  const { 'exam-slug': slug } = await params;
  const config = EXAM_LANDING_PAGE_MAP.get(slug);

  if (!config) notFound();

  return (
    // The hero sample question and the syllabus grid share one selection, so
    // both sit inside the same provider.
    <ExamPracticeProvider config={config}>
      <ExamLandingHero config={config} />
      <ExamFactsStrip config={config} />
      <ExamSyllabusSection config={config} />
      <ExamSimuladoSection config={config} />
      <ExamRoutineSection config={config} />
      <ExamTrustSection config={config} />
      <ExamFaqSection config={config} />
      <ExamFinalCtaSection config={config} />
    </ExamPracticeProvider>
  );
}
