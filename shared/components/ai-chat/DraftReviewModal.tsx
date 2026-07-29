'use client';
import type { ReactNode } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

import { Certification, CertificationTopic, PublicExam } from '@/shared/types';
import { useCertificationDraftCard } from '@/features/hooks/useCertificationDraftCard.hook';
import { useExamDraftCard } from '@/features/hooks/useExamDraftCard.hook';
import { ExamDistributionTable } from '@/shared/components/ai-chat/ExamDistributionTable';
import { InlineAlert } from '@/shared/components/ui/InlineAlert';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const TH =
  'text-left font-mono text-[11px] text-default-400 uppercase tracking-widest px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';

type DraftReviewModalProps =
  | {
      readonly type: 'certification';
      readonly data: Certification;
      readonly isOpen: boolean;
      readonly onClose: () => void;
      readonly onSaved: (saved: Certification) => void;
    }
  | {
      readonly type: 'public-exam';
      readonly data: PublicExam;
      readonly isOpen: boolean;
      readonly onClose: () => void;
      readonly onSaved: (saved: PublicExam) => void;
    };

export function DraftReviewModal(props: DraftReviewModalProps) {
  if (props.type === 'certification') {
    return <CertificationModal data={props.data} isOpen={props.isOpen} onClose={props.onClose} onSaved={props.onSaved} />;
  }
  return <ExamModal data={props.data} isOpen={props.isOpen} onClose={props.onClose} onSaved={props.onSaved} />;
}

interface CertificationModalProps {
  readonly data: Certification;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: Certification) => void;
}

function CertificationModal({ data, isOpen, onClose, onSaved }: CertificationModalProps) {
  const { t } = useTranslation();
  const { draft, status, updateField, updateNumericField, updateTopic, addTopic, removeTopic, handleSave } =
    useCertificationDraftCard(data);

  const isSaving = status === 'saving';
  const hasError = status === 'error';
  const canSave = draft.label.trim() !== '' && draft.key.trim() !== '';

  const handleSaveAndClose = async () => {
    const result = await handleSave();
    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <ModalShell
      addLabel={t('chat.addTopicShort')}
      canSave={canSave}
      error={
        hasError
          ? { title: t('chat.errorGeneric'), description: t('chat.errorGenericDescription'), onRetry: handleSaveAndClose }
          : null
      }
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      saveLabel={isSaving ? t('chat.saving') : t('chat.saveCertification')}
      subtitle={draft.label}
      title={t('chat.certificationPreview')}
      onAddPrimary={addTopic}
      onClose={onClose}
      onSave={handleSaveAndClose}
    >
      {renderTopicsTable()}
    </ModalShell>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex w-3/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.certificationLabel')}
              placeholder=" "
              value={draft.label}
              onValueChange={(v) => updateField('label', v)}
            />
          </div>
          <div className="flex w-1/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.certificationYear')}
              placeholder=" "
              type="number"
              value={draft.year?.toString() ?? ''}
              onValueChange={(v) => updateNumericField('year', v ? parseInt(v, 10) : undefined)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationKey')}
            placeholder=" "
            value={draft.key}
            onValueChange={(v) => updateField('key', v)}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationProvider')}
            placeholder=" "
            value={draft.provider ?? ''}
            onValueChange={(v) => updateField('provider', v)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            isRequired
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('certification.totalQuestions')}
            min={1}
            placeholder="e.g. 65"
            size="sm"
            type="number"
            value={draft.totalQuestions ? String(draft.totalQuestions) : ''}
            onValueChange={(v) => updateNumericField('totalQuestions', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={
              <span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>
            }
            isDisabled={isSaving}
            label={t('certification.examDuration')}
            min={1}
            placeholder="e.g. 130"
            size="sm"
            type="number"
            value={draft.examDurationMinutes != null ? String(draft.examDurationMinutes) : ''}
            onValueChange={(v) => updateNumericField('examDurationMinutes', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={<span className="text-xs text-default-400 self-center">%</span>}
            isDisabled={isSaving}
            label={t('certification.passingScore')}
            max={100}
            min={0}
            placeholder="e.g. 72"
            size="sm"
            type="number"
            value={draft.passingScore != null ? String(draft.passingScore) : ''}
            onValueChange={(v) => updateNumericField('passingScore', parseFloat(v) || undefined)}
          />
        </div>
      </div>
    );
  }

  function renderTopicsTable() {
    if (draft.topics.length === 0) return null;

    return (
      <div>
        <p className="text-xs font-semibold text-default-500 uppercase tracking-wide mb-3">{t('chat.topics')}</p>
        <div className="w-full rounded-xl border border-default-200">
          <table className="w-full border-collapse">
            <thead className="bg-content2">
              <tr>
                <th className={TH}>{t('chat.topicName')}</th>
                <th className={TH}>{t('chat.minPercent')}</th>
                <th className={TH}>{t('chat.maxPercent')}</th>
                <th className={TH} />
              </tr>
            </thead>
            <tbody>{draft.topics.map((topic, ti) => renderTopicRow(topic, ti))}</tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTopicRow(topic: CertificationTopic, ti: number) {
    const minPctValue = Math.round(topic.minQuestions ?? 0);
    const maxPctValue = Math.round(topic.maxQuestions ?? 0);

    return (
      <tr key={ti} className="bg-content1 hover:bg-content2 transition-colors duration-150">
        <td className={TD}>
          <Input
            {...inputProperties.input}
            className="min-w-0"
            isDisabled={isSaving}
            size="sm"
            value={topic.name}
            onValueChange={(v) => updateTopic(ti, { name: v })}
          />
        </td>
        <td className={TD}>
          <Input
            {...inputProperties.input}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={minPctValue.toString()}
            onValueChange={(v) => updateTopic(ti, { minQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })}
          />
        </td>
        <td className={TD}>
          <Input
            {...inputProperties.input}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={maxPctValue.toString()}
            onValueChange={(v) => updateTopic(ti, { maxQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })}
          />
        </td>
        <td className={TD}>
          <Button
            isIconOnly
            aria-label={t('common.remove')}
            className={buttonStyles.iconOnly.danger}
            isDisabled={isSaving}
            size="sm"
            variant="light"
            onPress={() => removeTopic(ti)}
          >
            <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
          </Button>
        </td>
      </tr>
    );
  }
}

interface ExamModalProps {
  readonly data: PublicExam;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (saved: PublicExam) => void;
}

function ExamModal({ data, isOpen, onClose, onSaved }: ExamModalProps) {
  const { t } = useTranslation();
  const {
    draft,
    status,
    updateField,
    updateNumericField,
    updateExamBoardName,
    updateSubject,
    removeSubject,
    addSubject,
    addTopic,
    removeTopic,
    updateTopic,
    handleSave,
  } = useExamDraftCard(data);

  const isSaving = status === 'saving';
  const hasError = status === 'error';

  const totalTopics = draft.subjects.reduce((sum, subject) => sum + (subject.topics ?? []).length, 0);

  const isDistributionValid = draft.subjects.every((subject) => {
    return subject.name.trim() && subject.maxQuestions >= subject.minQuestions;
  });

  const canSave = draft.name.trim() !== '' && draft.examBoard.name.trim() !== '' && isDistributionValid;

  const handleSaveAndClose = async () => {
    const result = await handleSave();
    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <ModalShell
      addLabel={t('chat.addSubject')}
      canSave={canSave}
      error={
        hasError
          ? { title: t('chat.examSaveError'), description: t('chat.examSaveErrorDescription'), onRetry: handleSaveAndClose }
          : null
      }
      headerFields={renderHeaderFields()}
      isOpen={isOpen}
      isSaving={isSaving}
      saveLabel={isSaving ? t('chat.saving') : t('chat.saveExam')}
      subtitle={t('chat.examExtractionSummary', { subjects: draft.subjects.length, topics: totalTopics })}
      title={t('chat.examFound')}
      onAddPrimary={addSubject}
      onClose={onClose}
      onSave={handleSaveAndClose}
    >
      <ExamDistributionTable
        isSaving={isSaving}
        subjects={draft.subjects}
        onAddTopic={addTopic}
        onRemoveSubject={removeSubject}
        onRemoveTopic={removeTopic}
        onUpdateSubject={updateSubject}
        onUpdateTopic={updateTopic}
      />
    </ModalShell>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          <div className="flex w-3/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.examName')}
              placeholder=" "
              value={draft.name}
              onValueChange={(v) => updateField('name', v)}
            />
          </div>
          <div className="flex w-1/4">
            <Input
              {...inputProperties.input}
              isDisabled={isSaving}
              label={t('chat.examYear')}
              placeholder=" "
              type="number"
              value={draft.year?.toString() ?? ''}
              onValueChange={(v) => updateField('year', v ? parseInt(v, 10) : null)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.examBoard')}
            placeholder=" "
            value={draft.examBoard.name}
            onValueChange={updateExamBoardName}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.examRole')}
            placeholder=" "
            value={draft.role ?? ''}
            onValueChange={(v) => updateField('role', v || null)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Input
            isRequired
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('certification.totalQuestions')}
            min={1}
            placeholder="e.g. 65"
            size="sm"
            type="number"
            value={draft.totalQuestions != null ? String(draft.totalQuestions) : ''}
            onValueChange={(v) => updateNumericField('totalQuestions', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={
              <span className="text-xs text-default-400 self-center">{t('certification.examDurationUnit')}</span>
            }
            isDisabled={isSaving}
            label={t('certification.examDuration')}
            min={1}
            placeholder="e.g. 130"
            size="sm"
            type="number"
            value={draft.examDurationMinutes != null ? String(draft.examDurationMinutes) : ''}
            onValueChange={(v) => updateNumericField('examDurationMinutes', parseInt(v, 10) || undefined)}
          />
          <Input
            {...inputProperties.input}
            endContent={<span className="text-xs text-default-400 self-center">%</span>}
            isDisabled={isSaving}
            label={t('certification.passingScore')}
            max={100}
            min={0}
            placeholder="e.g. 72"
            size="sm"
            type="number"
            value={draft.passingScore != null ? String(draft.passingScore) : ''}
            onValueChange={(v) => updateNumericField('passingScore', parseFloat(v) || undefined)}
          />
        </div>
      </div>
    );
  }
}

interface ModalShellError {
  readonly title: string;
  readonly description?: string;
  readonly onRetry: () => void;
}

interface ModalShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly subtitle?: ReactNode;
  readonly headerFields: ReactNode;
  readonly children: ReactNode;
  readonly addLabel: string;
  readonly onAddPrimary: () => void;
  readonly saveLabel: string;
  readonly isSaving: boolean;
  readonly canSave: boolean;
  readonly error?: ModalShellError | null;
  readonly onSave: () => void;
}

function ModalShell({
  isOpen,
  onClose,
  title,
  subtitle,
  headerFields,
  children,
  addLabel,
  onAddPrimary,
  saveLabel,
  isSaving,
  canSave,
  error,
  onSave,
}: ModalShellProps) {
  const { t } = useTranslation();

  return (
    <Modal className="p-4" isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">{title}</p>
          {subtitle && <p className="text-xs text-default-400 font-normal">{subtitle}</p>}
        </ModalHeader>

        <ModalBody className="gap-6">
          {error && (
            <InlineAlert
              color="danger"
              description={error.description}
              endContent={
                <Button
                  className={`${buttonStyles.dangerFlat} text-xs h-7 px-3 shrink-0`}
                  size="sm"
                  onPress={error.onRetry}
                >
                  {t('common.retry')}
                </Button>
              }
              title={error.title}
            />
          )}
          {headerFields}
          {children}
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button
              className={`${buttonStyles.flat} text-xs`}
              isDisabled={isSaving}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faPlus} />}
              onPress={onAddPrimary}
            >
              {addLabel}
            </Button>
            <Button
              className={buttonStyles.primarySm}
              isDisabled={isSaving || !canSave}
              size="sm"
              startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
              onPress={onSave}
            >
              {saveLabel}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
