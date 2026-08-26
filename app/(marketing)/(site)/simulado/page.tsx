import type { Metadata } from 'next';
import NextLink from 'next/link';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { EXAM_LANDING_PAGES } from '@/config/exam-landing-pages';
import { alternatesFor } from '@/lib/seo';
import { jsonLd } from '@/lib/json-ld';
import { parseProperties } from '@/lib/properties-parser';
import { OG_IMAGES } from '@/config/og';
import type { ExamLandingConfig } from '@/shared/types';

export const metadata: Metadata = {
  title: 'Simulados grátis por certificação',
  description:
    'Escolha uma certificação — AWS, Azure, CEA, CPA, OAB e mais — e responda questões novas no formato da prova, com o porquê de cada alternativa.',
  openGraph: {
    title: 'Simulados grátis por certificação',
    description:
      'Escolha uma certificação e responda questões novas no formato da prova, com o porquê de cada alternativa.',
    url: 'https://www.certifiqueai.com/simulado',
    type: 'website',
    images: OG_IMAGES,
  },
  alternates: alternatesFor('/simulado'),
};

// Slug -> broad area, purely for grouping this index page. Kept local instead of on
// ExamLandingConfig itself since it's a presentation concern of this one listing, not
// a fact about the exam.
const CATEGORY_BY_SLUG: Record<string, 'it' | 'finance' | 'law'> = {
  'aws-solutions-architect': 'it',
  'aws-cloud-practitioner': 'it',
  'aws-developer-associate': 'it',
  'azure-fundamentals': 'it',
  'gcp-professional-cloud-architect': 'it',
  'comptia-security-plus': 'it',
  'cisco-ccna': 'it',
  'terraform-associate': 'it',
  'kubernetes-cka': 'it',
  cea: 'finance',
  'cpa-20': 'finance',
  'cpa-10': 'finance',
  cfp: 'finance',
  'cfa-level-1': 'finance',
  'frm-part-1': 'finance',
  'aai-ancord': 'finance',
  oab: 'law',
};

const CATEGORY_ORDER = ['it', 'finance', 'law'] as const;

async function loadMessages(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'messages', 'pt.properties'), 'utf-8');
    return parseProperties(raw);
  } catch {
    return {};
  }
}

function groupByCategory(exams: readonly ExamLandingConfig[]) {
  const groups = new Map<string, ExamLandingConfig[]>();

  for (const exam of exams) {
    const category = CATEGORY_BY_SLUG[exam.slug] ?? 'it';
    const existing = groups.get(category) ?? [];
    existing.push(exam);
    groups.set(category, existing);
  }

  return groups;
}

export default async function SimuladoHubPage() {
  const messages = await loadMessages();
  const grouped = groupByCategory(EXAM_LANDING_PAGES);

  const categoryLabels: Record<string, string> = {
    it: messages['homepage.certs.domain.cloud'],
    finance: messages['homepage.certs.domain.finance'],
    law: messages['homepage.certs.domain.law'],
  };

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Simulados grátis por certificação',
    url: 'https://www.certifiqueai.com/simulado',
    hasPart: EXAM_LANDING_PAGES.map((exam) => ({
      '@type': 'Course',
      name: `Simulado ${exam.name}`,
      url: `https://www.certifiqueai.com/simulado/${exam.slug}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://www.certifiqueai.com' },
      { '@type': 'ListItem', position: 2, name: 'Simulados', item: 'https://www.certifiqueai.com/simulado' },
    ],
  };

  return (
    <div className="text-mkt-text">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbSchema) }} />

      <section className="py-20 px-6 text-center bg-mkt-bg border-b border-mkt-divider">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-6">
          <h1 className="ds-heading text-mkt-text text-3xl sm:text-4xl xl:text-5xl leading-tight text-wrap-balance">
            {messages['simuladoHub.title']}
          </h1>
          <p className="text-sm text-mkt-text opacity-60 leading-relaxed max-w-xl">
            {messages['simuladoHub.subtitle']}
          </p>
        </div>
      </section>

      <section className="px-6 py-20 bg-mkt-bg">
        <div className="max-w-6xl mx-auto flex flex-col gap-16">
          {CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => (
            <div key={category}>
              <span className="kick mb-4 block">{categoryLabels[category]}</span>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-mkt-divider border border-mkt-divider">
                {grouped.get(category)?.map((exam) => (
                  <NextLink
                    key={exam.slug}
                    className="bg-mkt-bg p-6 flex flex-col gap-3 hover:bg-mkt-surface transition-colors duration-200"
                    href={`/simulado/${exam.slug}`}
                  >
                    <div>
                      <h2 className="ds-heading text-mkt-text text-lg">{exam.name}</h2>
                      <p className="text-xs text-mkt-text opacity-50 mt-1">{exam.provider}</p>
                    </div>
                    <p className="text-sm text-mkt-text opacity-60 flex-1">{exam.fullName}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-mkt-divider">
                      <span className="mono text-xs text-mkt-text opacity-50">
                        {messages['simuladoHub.questionsCount']?.replace('{count}', String(exam.totalQuestions))}
                      </span>
                      <span className="text-sm font-semibold text-mkt-accent">{messages['simuladoHub.cardCta']}</span>
                    </div>
                  </NextLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
