'use client';

import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useRouter } from 'next/navigation';

import { AttemptRow, UnifiedSimulado } from './normalizeSimulado';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneName } from '@/shared/lib/scoreTone';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { formatFinishedAt } from '@/app/(workspace)/simulados/[id]/resultado/[attemptId]/components/deriveResult';

interface SimuladoHistoryModalProps {
  readonly simulado: UnifiedSimulado | null;
  readonly onClose: () => void;
}

export function SimuladoHistoryModal({ simulado, onClose }: SimuladoHistoryModalProps) {
  const { t, language } = useTranslation();
  const router = useRouter();

  return (
    <Modal isOpen={!!simulado} size="lg" onClose={onClose}>
      <ModalContent>{simulado && renderContent(simulado)}</ModalContent>
    </Modal>
  );

  function renderContent(s: UnifiedSimulado) {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1 border-b border-divider text-base font-semibold text-foreground">
          <p>{t('simulado.attemptHistory')}</p>
          <p className="text-sm font-normal text-default-400">{s.name ?? s.sourceLabel}</p>
        </ModalHeader>
        <ModalBody className="py-6">
          {s.attempts.length === 0 ? (
            <p className="text-sm text-default-400">{t('simulado.noAttempts')}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {s.attempts.map((attempt, index) => renderAttemptRow(s, attempt, index))}
            </div>
          )}
        </ModalBody>
        <ModalFooter className="border-t border-divider">
          <Button className={buttonStyles.secondary} size="sm" variant="bordered" onPress={onClose}>
            {t('common.close')}
          </Button>
        </ModalFooter>
      </>
    );
  }

  function renderAttemptRow(s: UnifiedSimulado, attempt: AttemptRow, index: number) {
    const correct = attempt.score ?? 0;
    const percent = s.totalQuestions > 0 ? Math.round((correct / s.totalQuestions) * 100) : 0;
    const attemptDate = formatFinishedAt(attempt.finishedAt, language);

    return (
      <div
        key={attempt.id}
        className="flex items-center justify-between gap-3 border-b border-divider py-3 last:border-0"
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{t('simulado.attemptNumber', { n: s.attempts.length - index })}</p>
          <p className="text-xs text-default-400">{attemptDate}</p>
        </div>
        <div className="flex items-center gap-2">
          {attempt.timedOut && (
            <Chip color="warning" size="sm" variant="flat">
              {t('simulado.result.timedOut')}
            </Chip>
          )}
          <Chip className="font-semibold" color={scoreToneName(percent)} size="sm" variant="flat">
            {t('simulado.attemptScore', { correct, total: s.totalQuestions, percent })}
          </Chip>
        </div>
        <Button
          className={buttonStyles.secondary}
          data-testid="simulado-history-view-btn"
          size="sm"
          variant="bordered"
          onPress={() => {
            onClose();
            router.push(`/simulados/${s.id}/resultado/${attempt.id}`);
          }}
        >
          {t('simulado.viewAttempt')}
        </Button>
      </div>
    );
  }
}
