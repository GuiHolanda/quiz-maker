import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { EXAM_LANDING_PAGES, EXAM_LANDING_PAGE_MAP } from '@/config/exam-landing-pages';
import { ExamLandingHero } from '@/app/(marketing)/components/exam-landing/ExamLandingHero';
import { SocialProofSection } from '@/app/(marketing)/components/exam-landing/SocialProofSection';
import { ExamFeaturesSection } from '@/app/(marketing)/components/exam-landing/ExamFeaturesSection';
import { ExamHowItWorksSection } from '@/app/(marketing)/components/exam-landing/ExamHowItWorksSection';
import { ExamDiagnosisSection } from '@/app/(marketing)/components/exam-landing/ExamDiagnosisSection';
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
    <div>
      <ExamLandingHero config={config} />
      <SocialProofSection config={config} />
      <ExamDiagnosisSection config={config} />
      <ExamFeaturesSection config={config} />
      <ExamHowItWorksSection config={config} />
      <ExamFaqSection config={config} />
      <ExamFinalCtaSection config={config} />
    </div>
  );
}
