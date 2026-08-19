'use client';
import type { AutoConfigMatch, ExamType } from '@/shared/types';
import type { ExamSeedState } from '@/app/(workspace)/exams/new/useExamSeed.hook';

import { useRef, useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faFileArrowUp,
  faLayerGroup,
  faPenToSquare,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';

import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { EXAM_CONFIG } from '@/app/(workspace)/exams/exam-config';
import { ExamSeedPathCard } from './ExamSeedPathCard';
import { NextStepsCard } from './NextStepsCard';
import { MyExamsCard } from './MyExamsCard';

interface ExamSeedPickerProps {
  readonly type: ExamType;
  readonly state: ExamSeedState;
  readonly onIdentify: (query: string) => void;
  readonly onSelectMatch: (match: AutoConfigMatch) => void;
  readonly onUploadEdital: (file: File, role: string | undefined) => void;
  readonly onStartBlank: () => void;
}

function matchSubtitle(match: AutoConfigMatch): string {
  const org = match.provider ?? match.examBoard ?? '';

  return match.role ? `${org} — ${match.role}` : org;
}

// Tela 1 (redesign per the imported Claude Design canvas): two-column layout — search card +
// divider + path cards on the left, a "what's next" explainer and the user's own exams on the
// right rail. Same underlying flow as before: search-by-name for both exam types, edital
// upload as a concurso-only alternative (now its own path card instead of an inline toggle).
export function ExamSeedPicker({
  type,
  state,
  onIdentify,
  onSelectMatch,
  onUploadEdital,
  onStartBlank,
}: ExamSeedPickerProps) {
  const { t } = useTranslation();
  const config = EXAM_CONFIG[type];
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showEditalUpload, setShowEditalUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isBusy =
    state.kind === 'identifying' || state.kind === 'loading-blueprint' || state.kind === 'extracting-edital';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    e.target.value = '';
    if (!file) return;
    setPendingFile(file);
    onUploadEdital(file, role.trim() || undefined);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start mt-7">
      <div>
        <div className="bg-content1 border border-default-200 rounded-xl p-6">
          <label className="font-mono text-[11px] uppercase tracking-widest text-default-400">
            {t('exam.newSearchLabel')}
          </label>
          <form
            className="flex gap-2.5 mt-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isBusy) onIdentify(name);
            }}
          >
            <Input
              {...inputProperties.input}
              className="grow"
              isDisabled={isBusy}
              placeholder={t(
                type === 'certification' ? 'exam.aiSeedCertPlaceholder' : 'exam.aiSeedPublicExamPlaceholder'
              )}
              value={name}
              onValueChange={setName}
            />
            <Button
              className={`${buttonStyles.primary} h-11 px-5 shrink-0`}
              isDisabled={isBusy || !name.trim()}
              startContent={
                state.kind === 'identifying' ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <FontAwesomeIcon icon={faMagnifyingGlass} />
                )
              }
              type="submit"
            >
              {t(config.seedSearchActionKey)}
            </Button>
          </form>

          {state.kind === 'disambiguating' && (
            <div className="flex flex-col gap-2 mt-5 pt-4 border-t border-divider">
              <p className="text-xs font-semibold text-default-500">{t('exam.aiSeedDisambiguateTitle')}</p>
              {state.matches.map((match) => (
                <button
                  key={match.label}
                  className="text-left bg-content2 hover:bg-primary/10 border border-default-200 hover:border-primary/30 rounded-lg px-4 py-3 transition-colors duration-200"
                  onClick={() => onSelectMatch(match)}
                >
                  <span className="text-sm font-semibold text-foreground">{match.label}</span>
                  <span className="text-xs text-default-500 ml-2">{matchSubtitle(match)}</span>
                </button>
              ))}
            </div>
          )}

          {state.kind === 'clarifying' && (
            <div className="mt-5 pt-4 border-t border-divider">
              <InlineAlert
                color="primary"
                description={state.message}
                title={t('exam.aiSeedClarifyingTitle')}
                variant="subtle"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3.5 my-6">
          <div className="h-px flex-1 bg-divider" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-default-400">{t('common.or')}</span>
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
              isDisabled={isBusy}
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
            {pendingFile && state.kind === 'extracting-edital' ? (
              <div className="flex items-center gap-2 text-sm text-default-500">
                <Spinner size="sm" />
                <FontAwesomeIcon className="text-danger" icon={faFilePdf} />
                {pendingFile.name}
              </div>
            ) : (
              <Button
                className={buttonStyles.secondary}
                isDisabled={isBusy}
                startContent={<FontAwesomeIcon icon={faFileArrowUp} />}
                variant="bordered"
                onPress={() => fileInputRef.current?.click()}
              >
                {t('exam.aiSeedUploadEdital')}
              </Button>
            )}
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
