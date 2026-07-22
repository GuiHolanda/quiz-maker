'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Chip } from '@heroui/chip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { CertQuestionsContent } from './CertQuestionsContent';
import { PublicExamQuestionsContent } from './PublicExamQuestionsContent';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { UpgradeModal } from '@/shared/components/ui/UpgradeModal';

type QuestionsType = 'certification' | 'public_exam';

export function QuestionsPageContent() {
  const { t } = useTranslation();
  const { usage } = useUsageContext();
  const searchParams = useSearchParams();

  const initialType = (searchParams.get('type') as QuestionsType) ?? 'certification';
  const [selectedType, setSelectedType] = useState<QuestionsType>(initialType);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const hasConcursoAccess = !usage || usage.publicExamsLimit !== 0;

  return (
    <PageHeader subtitle={t('generate.pageSubtitle')} title={t('generate.pageTitle')}>
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">{t('generate.chooseType')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label={t('generate.chooseType')}>
            {renderTypeOption('certification', t('generate.typeCertification'), t('generate.chooseTypeCertification'), faGraduationCap)}
            {renderTypeOption('public_exam', t('generate.typePublicExam'), t('generate.chooseTypePublicExam'), faClipboardList)}
          </div>
        </div>

        {selectedType === 'certification' ? (
          <CertQuestionsContent />
        ) : (
          <PublicExamQuestionsContent />
        )}
      </div>

      <UpgradeModal isOpen={isUpgradeOpen} onClose={() => setIsUpgradeOpen(false)} />
    </PageHeader>
  );

  function renderTypeOption(value: QuestionsType, title: string, description: string, icon: IconDefinition) {
    const isSelected = selectedType === value;
    const isConcursoLocked = value === 'public_exam' && !hasConcursoAccess;

    function handleClick() {
      if (isConcursoLocked) {
        setIsUpgradeOpen(true);
      } else {
        setSelectedType(value);
      }
    }

    return (
      <button
        aria-pressed={isSelected}
        data-testid={`type-option-${value}`}
        className={`text-left rounded-xl border p-4 transition-colors duration-200 flex items-start gap-3 ${
          isSelected
            ? 'border-primary bg-primary/10'
            : 'border-default-200 bg-content1 hover:bg-content2 hover:border-default-300'
        }`}
        type="button"
        onClick={handleClick}
      >
        <span className={`mt-0.5 shrink-0 ${isSelected ? 'text-primary' : 'text-default-400'}`}>
          <FontAwesomeIcon className="w-4 h-4" icon={icon} />
        </span>
        <span className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className={`text-sm font-semibold leading-snug flex items-center gap-2 ${isSelected ? 'text-primary' : 'text-foreground'}`}>
            {title}
            {isConcursoLocked && (
              <Chip color="primary" size="sm" variant="flat">Pro</Chip>
            )}
          </span>
          <span className="text-xs text-default-500 leading-snug">{description}</span>
        </span>
      </button>
    );
  }
}
