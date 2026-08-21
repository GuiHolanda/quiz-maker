'use client';
import type { ExamType } from '@/shared/types';

import { useRef, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileArrowUp, faLayerGroup, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { ExamSearchForm } from './ExamSearchForm';
import { ExamSeedPathCard } from './ExamSeedPathCard';
import { NextStepsCard } from './NextStepsCard';
import { MyExamsCard } from './MyExamsCard';

interface ExamSeedPickerProps {
  readonly type: ExamType;
  readonly onIdentify: (query: string) => void;
  readonly onUploadEdital: (file: File, role: string | undefined) => void;
  readonly onStartBlank: () => void;
}

export function ExamSeedPicker({ type, onIdentify, onUploadEdital, onStartBlank }: ExamSeedPickerProps) {
  const { t } = useTranslation();
  const [role, setRole] = useState('');
  const [showEditalUpload, setShowEditalUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';
    if (!file) return;
    onUploadEdital(file, role.trim() || undefined);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_560px] gap-6 items-start mt-7">
      <div>
        <div className="bg-content1 border border-content2 rounded-xl p-6">
          <ExamSearchForm isBusy={false} isSearching={false} type={type} onSubmit={onIdentify} />
        </div>

        <div className="flex items-center gap-3.5 my-6">
          <div className="h-px flex-1 bg-divider" />
          <span className="text-xs tracking-widest text-default-400">{t('common.or')}</span>
          <div className="h-px flex-1 bg-divider" />
        </div>

        <div className={`grid gap-5 sm:grid-cols-2 ${type === 'public_exam' ? 'lg:grid-cols-3' : ''}`}>
          <ExamSeedPathCard
            body={t('exam.pathCatalogBody')}
            cta={t('exam.pathCatalogCta')}
            href={`/exams/catalog?type=${type}`}
            icon={faLayerGroup}
            title={t('catalog.browseAction')}
          />
          <ExamSeedPathCard
            body={t('exam.pathBlankBody')}
            cta={t('exam.pathBlankCta')}
            icon={faPenToSquare}
            testId="exam-seed-blank-btn"
            title={t('exam.aiSeedStartBlank')}
            onPress={onStartBlank}
          />
          {type === 'public_exam' && (
            <ExamSeedPathCard
              body={t('exam.pathEditalBody')}
              cta={t('exam.pathEditalCta')}
              icon={faFileArrowUp}
              title={t('exam.aiSeedUploadEdital')}
              onPress={() => setShowEditalUpload(true)}
            />
          )}
        </div>

        {type === 'public_exam' && showEditalUpload && (
          <div className="mt-5 bg-content1 border border-default-200 rounded-xl p-5 flex flex-col gap-4">
            <Input
              {...inputProperties.input}
              label={t('concurso.cargo')}
              placeholder={t('concurso.cargoPlaceholder')}
              value={role}
              onValueChange={setRole}
            />
            <input
              ref={fileInputRef}
              accept="application/pdf"
              className="hidden"
              type="file"
              onChange={handleFileChange}
            />
            <Button
              className={buttonStyles.secondary}
              startContent={<FontAwesomeIcon icon={faFileArrowUp} />}
              variant="bordered"
              onPress={() => fileInputRef.current?.click()}
            >
              {t('exam.aiSeedUploadEdital')}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <NextStepsCard />
        <MyExamsCard type={type} />
      </div>
    </div>
  );
}
