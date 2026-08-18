'use client';
import type { ExamType } from '@/shared/types';
import type { CertificationMatch } from '@/lib/parse-identify-response';
import type { ExamSeedState } from '@/app/(workspace)/exams/new/useExamSeed.hook';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faFileArrowUp, faLayerGroup, faPenToSquare, faFilePdf } from '@fortawesome/free-solid-svg-icons';

import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

interface ExamSeedPickerProps {
  readonly type: ExamType;
  readonly state: ExamSeedState;
  readonly onIdentify: (name: string) => void;
  readonly onSelectMatch: (match: CertificationMatch) => void;
  readonly onUploadEdital: (file: File, role: string | undefined) => void;
  readonly onStartBlank: () => void;
}

// Tela 1 (plan §2.1): a single primary action per exam type — search-by-name for
// certifications, edital upload for concursos — plus catalog and blank as secondary
// links. Never a choice between "which tool to use" up front.
export function ExamSeedPicker({
  type,
  state,
  onIdentify,
  onSelectMatch,
  onUploadEdital,
  onStartBlank,
}: ExamSeedPickerProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
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
    <div className="flex flex-col gap-8">
      <div className="bg-content1 border border-default-200 rounded-xl p-8 flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold text-foreground">
            {t(type === 'certification' ? 'exam.aiSeedCertQuestion' : 'exam.aiSeedPublicExamQuestion')}
          </h2>
          <p className="text-sm text-default-500">{t('exam.aiSeedSubtitle')}</p>
        </div>

        {type === 'certification' ? (
          <form
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!isBusy) onIdentify(name);
            }}
          >
            <Input
              {...inputProperties.input}
              className="grow"
              isDisabled={isBusy}
              placeholder={t('exam.aiSeedCertPlaceholder')}
              value={name}
              onValueChange={setName}
            />
            <Button
              className={buttonStyles.primary}
              isDisabled={isBusy || !name.trim()}
              isIconOnly
              startContent={
                state.kind === 'identifying' ? (
                  <Spinner color="current" size="sm" />
                ) : (
                  <FontAwesomeIcon icon={faArrowRight} />
                )
              }
              type="submit"
            />
          </form>
        ) : (
          <div className="flex flex-col gap-4">
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

        {state.kind === 'disambiguating' && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-default-500">{t('exam.aiSeedDisambiguateTitle')}</p>
            {state.matches.map((match) => (
              <button
                key={match.label}
                className="text-left bg-content2 hover:bg-primary/10 border border-default-200 hover:border-primary/30 rounded-lg px-4 py-3 transition-colors duration-200"
                onClick={() => onSelectMatch(match)}
              >
                <span className="text-sm font-semibold text-foreground">{match.label}</span>
                <span className="text-xs text-default-500 ml-2">{match.provider}</span>
              </button>
            ))}
          </div>
        )}

        {state.kind === 'clarifying' && (
          <InlineAlert
            color="primary"
            description={state.message}
            title={t('exam.aiSeedClarifyingTitle')}
            variant="subtle"
          />
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-default-400">
        <div className="h-px flex-1 bg-divider" />
        {t('common.or')}
        <div className="h-px flex-1 bg-divider" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          className="flex-1 flex items-center gap-3 bg-content1 border border-default-200 hover:border-primary/30 rounded-xl p-4 transition-colors duration-200"
          href={`/exams/catalog?type=${type}`}
        >
          <FontAwesomeIcon className="text-primary" icon={faLayerGroup} />
          <span className="text-sm font-semibold text-foreground">{t('catalog.browseAction')}</span>
        </Link>
        <button
          className="flex-1 flex items-center gap-3 bg-content1 border border-default-200 hover:border-primary/30 rounded-xl p-4 transition-colors duration-200 text-left"
          data-testid="exam-seed-blank-btn"
          onClick={onStartBlank}
        >
          <FontAwesomeIcon className="text-primary" icon={faPenToSquare} />
          <span className="text-sm font-semibold text-foreground">{t('exam.aiSeedStartBlank')}</span>
        </button>
      </div>
    </div>
  );
}
