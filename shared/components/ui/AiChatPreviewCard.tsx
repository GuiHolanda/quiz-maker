'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { Certification } from '@/shared/types';

interface AiChatPreviewCardProps {
  readonly certification: Certification;
  readonly onConfirm: () => void;
  readonly onAdjust: () => void;
  readonly isSaving?: boolean;
  readonly saveResult?: 'success' | 'error';
  readonly errorMessage?: string;
}

export function AiChatPreviewCard({
  certification,
  onConfirm,
  onAdjust,
  isSaving,
  saveResult,
  errorMessage,
}: AiChatPreviewCardProps) {
  const { t } = useTranslation();

  const total = certification.topics.reduce((sum, topic) => sum + topic.maxQuestions, 0);

  return (
    <div className="bg-content1 border-2 border-primary rounded-xl p-4 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">{t('chat.certificationPreview')}</span>
        <Chip color="primary" size="sm" variant="flat">
          {certification.key}
        </Chip>
      </div>

      {/* Certification name */}
      <p className="text-sm font-semibold text-foreground mt-2">{certification.label}</p>

      {/* Topics table */}
      <div className="mt-3">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 mb-1">
          <span className="text-xs text-default-400 uppercase">{t('chat.topicName')}</span>
          <span className="text-xs text-default-400 uppercase text-right">{t('chat.minPercent')}</span>
          <span className="text-xs text-default-400 uppercase text-right">{t('chat.maxPercent')}</span>
        </div>
        {certification.topics.map((topic) => {
          const minPct = total > 0 ? ((topic.minQuestions / total) * 100).toFixed(0) : '0';
          const maxPct = total > 0 ? ((topic.maxQuestions / total) * 100).toFixed(0) : '0';

          return (
            <div key={topic.name} className="grid grid-cols-[1fr_auto_auto] gap-x-4 py-0.5">
              <span className="text-sm text-default-500">{topic.name}</span>
              <span className="text-sm text-default-500 text-right">{minPct}%</span>
              <span className="text-sm text-default-500 text-right">{maxPct}%</span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4">
        {saveResult === 'success' ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success border border-success/20 text-sm font-semibold">
            <FontAwesomeIcon className="w-3 h-3" icon={faCheck} /> {t('chat.created')}
          </span>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
                isDisabled={isSaving}
                size="sm"
                startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
                onPress={onConfirm}
              >
                {isSaving ? t('chat.saving') : t('chat.create')}
              </Button>
              <Button
                className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200"
                isDisabled={isSaving}
                size="sm"
                variant="bordered"
                onPress={onAdjust}
              >
                {t('chat.adjust')}
              </Button>
            </div>
            {saveResult === 'error' && errorMessage && <p className="text-danger text-xs mt-2">{errorMessage}</p>}
          </>
        )}
      </div>
    </div>
  );
}
