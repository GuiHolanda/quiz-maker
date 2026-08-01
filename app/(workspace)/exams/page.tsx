'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { ExamsList } from './components/list/ExamsList';
import { ExamWizard } from './components/wizard/ExamWizard';
import { EXAM_CONFIG } from './exam-config';

import { ExamsProvider } from '@/features/providers/exams.provider';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import type { ExamType } from '@/shared/types';

export default function ExamsPage() {
  return (
    <ExamsProvider>
      <Suspense>
        <ExamsContent />
      </Suspense>
    </ExamsProvider>
  );
}

function ExamsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const rawType = searchParams.get('type');
  const type: ExamType = rawType === 'public_exam' ? 'public_exam' : 'certification';
  const config = EXAM_CONFIG[type];

  const [isFormOpen, setIsFormOpen] = useState(searchParams.get('new') === 'true');

  return (
    <PageHeader subtitle={t(config.pageSubtitle)} title={t(config.pageTitle)}>
      <div className="flex flex-col gap-6">
        <div
          className={`bg-content1 border rounded-xl overflow-hidden transition-colors duration-200 ${
            isFormOpen ? 'border-primary' : 'border-default-200'
          }`}
        >
          <button
            aria-expanded={isFormOpen}
            className="w-full flex items-center gap-3 p-4 hover:bg-content2 transition-colors duration-200 text-left"
            data-testid="configure-new-section-toggle"
            type="button"
            onClick={() => setIsFormOpen((prev) => !prev)}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FontAwesomeIcon className="w-3.5 h-3.5 text-primary" icon={faPlus} />
            </div>
            <span className="flex-1 text-sm font-semibold text-foreground">{t(config.tabNew)}</span>
            <FontAwesomeIcon
              className="text-default-400 text-xs shrink-0"
              icon={isFormOpen ? faChevronUp : faChevronDown}
            />
          </button>
          {isFormOpen && (
            <div className="border-t border-default-200 p-4">
              <ExamWizard type={type} onSaved={() => setIsFormOpen(false)} />
            </div>
          )}
        </div>

        <section className="border-t border-default-200 pt-8" data-testid="configure-list-section">
          <ExamsList type={type} />
        </section>
      </div>
    </PageHeader>
  );
}
