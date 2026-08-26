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
import { alternatesFor } from '@/lib/seo';
import { jsonLd } from '@/lib/json-ld';
import type { ExamLandingConfig } from '@/shared/types';

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
    alternates: alternatesFor(`/simulado/${slug}`),
  };
}

function buildExamLandingSchemas(config: ExamLandingConfig) {
  const url = `https://www.certifiqueai.com/simulado/${config.slug}`;

  const courseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: `Simulado ${config.name}`,
    description: config.seoDescription,
    provider: { '@type': 'Organization', name: 'CertifiqueAI', url: 'https://www.certifiqueai.com' },
    url,
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: `PT${config.examDurationMinutes}M`,
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: config.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.certifiqueai.com' },
      { '@type': 'ListItem', position: 2, name: 'Simulados', item: 'https://www.certifiqueai.com/simulado' },
      { '@type': 'ListItem', position: 3, name: config.name, item: url },
    ],
  };

  return [courseSchema, faqSchema, breadcrumbSchema];
}

export default async function ExamLandingPage({ params }: PageProps) {
  const { 'exam-slug': slug } = await params;
  const config = EXAM_LANDING_PAGE_MAP.get(slug);

  if (!config) notFound();

  return (
    <ExamPracticeProvider config={config}>
      {buildExamLandingSchemas(config).map((schema) => (
        <script key={schema['@type']} type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      ))}
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
