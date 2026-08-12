'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BreadcrumbItem, Breadcrumbs } from '@heroui/breadcrumbs';
import { useSession } from 'next-auth/react';

import type { ExamType } from '@/shared/types';
import { ExamsProvider } from '@/features/providers/exams.provider';
import { ExamWizard } from '@/app/(workspace)/exams/components/wizard/ExamWizard';
import { AiChatBanner } from '@/app/(workspace)/exams/components/AiChatBanner';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { AI_CHAT_ALLOWED_PLANS } from '@/config/constants';

export default function NewExamPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';

  const plan = session?.user?.plan ?? '';
  const hasAiChat = AI_CHAT_ALLOWED_PLANS.includes(plan);
  const listHref = `/exams?type=${type}`;
  const listLabel = type === 'certification' ? t('nav.certifications') : t('nav.publicExams');
  const newLabel = type === 'certification' ? t('nav.newCertification') : t('nav.newConcurso');
  const pageTitle = type === 'certification' ? t('exam.newCertificationTitle') : t('exam.newConcursoTitle');
  return (
    <ExamsProvider>
      <Suspense>
        <PageHeader
          breadcrumbs={
            <Breadcrumbs>
              <BreadcrumbItem href="/">{t('nav.dashboard')}</BreadcrumbItem>
              <BreadcrumbItem href={listHref}>{listLabel}</BreadcrumbItem>
              <BreadcrumbItem>{newLabel}</BreadcrumbItem>
            </Breadcrumbs>
          }
          title={pageTitle}
        >
          <div className="flex flex-col gap-10">
            <AiChatBanner hasAiChat={hasAiChat} />

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-xl font-semibold text-foreground">{t('exam.manualSection.title')}</h2>
                <p className="text-sm text-default-500">{t('exam.manualSection.subtitle')}</p>
              </div>
              <ExamWizard type={type} onBack={() => router.push(listHref)} onSaved={() => router.push(listHref)} />
            </div>
          </div>
        </PageHeader>
      </Suspense>
    </ExamsProvider>
  );
}
