'use client';

import { useState } from 'react';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal';
import { useRouter } from 'next/navigation';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { useCertSimuladosContext } from '@/features/providers/certSimulados.provider';
import { deleteCertSimulado, ensureCertSimuladoAnswers, startCertSimuladoAttempt } from '@/features/connectors';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { notify } from '@/shared/lib/notify';
import { CertSimuladoListItem } from '@/shared/types';
import { buttonStyles } from '@/config/constants/buttonStyles';

type AttemptSummary = CertSimuladoListItem['attempts'][number];

function scoreColor(percent: number): 'success' | 'warning' | 'danger' {
  if (percent >= 70) return 'success';
  if (percent >= 50) return 'warning';

  return 'danger';
}

interface SimuladosListTabProps {
  readonly onCreateNew?: () => void;
}

export function SimuladosListTab({ onCreateNew }: SimuladosListTabProps = {}) {
  const { t } = useTranslation();
  const { simulados, isLoading, removeSimulado } = useCertSimuladosContext();
  const [deleteTarget, setDeleteTarget] = useState<CertSimuladoListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);
  const [historyTarget, setHistoryTarget] = useState<CertSimuladoListItem | null>(null);
  const router = useRouter();

  async function handleStart(simulado: CertSimuladoListItem) {
    setStartingId(simulado.id);
    try {
      await ensureCertSimuladoAnswers(simulado.id);
      const attempt = await startCertSimuladoAttempt(simulado.id);

      router.push(`/certifications/simulados/${simulado.id}/tentativa/${attempt.id}`);
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
      setStartingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCertSimulado(deleteTarget.id);
      removeSimulado(deleteTarget.id);
      const removedName = deleteTarget.name ?? deleteTarget.certLabel;

      setDeleteTarget(null);
      notify.success(t('simulado.deleted'), t('simulado.deletedDescription', { name: removedName }));
    } catch (e: unknown) {
      notify.error(
        t('toast.error'),
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? t('toast.somethingWrong')
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) return <SkeletonListLoader />;

  if (!simulados.length) {
    return (
      <EmptyState
        action={onCreateNew ? { label: t('simulado.tabNew'), onPress: onCreateNew } : undefined}
        description={t('simulado.noSimuladosDescription')}
        title={t('simulado.noSimulados')}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">{simulados.map((s) => renderCard(s))}</div>

      <Modal isOpen={!!deleteTarget} onClose={() => !isDeleting && setDeleteTarget(null)}>
        <ModalContent>
          <ModalHeader>{t('simulado.deleteConfirm')}</ModalHeader>
          <ModalBody>
            <p className="text-default-500">{deleteTarget?.name ?? deleteTarget?.certLabel}</p>
          </ModalBody>
          <ModalFooter>
            <Button
              isDisabled={isDeleting}
              variant="bordered"
              className={buttonStyles.secondary}
              onPress={() => setDeleteTarget(null)}
            >
              {t('common.cancel')}
            </Button>
            <Button className={buttonStyles.danger} isLoading={isDeleting} onPress={handleDelete}>
              {t('common.delete')}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={!!historyTarget} size="lg" onClose={() => setHistoryTarget(null)}>
        <ModalContent>{historyTarget && renderHistoryModal(historyTarget)}</ModalContent>
      </Modal>
    </>
  );

  function renderCard(s: CertSimuladoListItem) {
    const isAnswered = s.attemptCount > 0;
    const attempts =
      s.attemptCount === 1
        ? t('simulado.attempt', { count: s.attemptCount })
        : t('simulado.attempts', { count: s.attemptCount });

    return (
      <div key={s.id} className="bg-content1 border border-default-200 rounded-xl p-4 flex flex-col">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold">{s.name ?? s.certLabel}</p>
          <Chip color={isAnswered ? 'success' : 'warning'} size="sm" variant="flat">
            {isAnswered ? t('simulado.statusAnswered') : t('simulado.statusPending')}
          </Chip>
        </div>

        <div className="flex justify-between mt-1">
          <p className="text-default-400 text-sm">{s.certLabel}</p>
          <p className="text-default-400 text-sm">
            {s.totalQuestions} questões · {attempts}
            {s.bestScore !== null && ` · ${t('simulado.bestScore', { score: s.bestScore, total: s.totalQuestions })}`}
          </p>
        </div>

        <div className="flex flex-wrap justify-between mt-8">
          <div className="flex gap-2">
            <Button
              className={buttonStyles.primarySm}
              isDisabled={startingId !== null}
              isLoading={startingId === s.id}
              size="sm"
              onPress={() => handleStart(s)}
            >
              {isAnswered ? t('simulado.tryAgain') : t('simulado.respond')}
            </Button>
            {isAnswered && (
              <Button
                className={buttonStyles.secondary}
                size="sm"
                variant="bordered"
                onPress={() => setHistoryTarget(s)}
              >
                {t('simulado.viewResults')}
              </Button>
            )}
          </div>
          <Button className={buttonStyles.danger} size="sm" onPress={() => setDeleteTarget(s)}>
            {t('simulado.delete')}
          </Button>
        </div>
      </div>
    );
  }

  function renderHistoryModal(s: CertSimuladoListItem) {
    return (
      <>
        <ModalHeader className="flex flex-col gap-1">
          <p>{t('simulado.attemptHistory')}</p>
          <p className="text-default-400 text-sm font-normal">{s.name ?? s.certLabel}</p>
        </ModalHeader>
        <ModalBody>
          {s.attempts.length === 0 ? (
            <p className="text-default-400 text-sm">{t('simulado.noSimulados')}</p>
          ) : (
            <div className="flex flex-col gap-2">{s.attempts.map((a, i) => renderAttemptRow(s, a, i))}</div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="bordered" className={buttonStyles.secondary} onPress={() => setHistoryTarget(null)}>
            {t('common.cancel')}
          </Button>
        </ModalFooter>
      </>
    );
  }

  function renderAttemptRow(s: CertSimuladoListItem, attempt: AttemptSummary, i: number) {
    const score = attempt.score ?? 0;
    const percent = s.totalQuestions > 0 ? Math.round((score / s.totalQuestions) * 100) : 0;
    const date = attempt.finishedAt
      ? new Date(attempt.finishedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

    return (
      <div
        key={attempt.id}
        className="flex items-center justify-between gap-3 py-3 border-b border-default-100 last:border-0"
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">{t('simulado.attemptNumber', { n: s.attempts.length - i })}</p>
          <p className="text-xs text-default-400">{date}</p>
        </div>
        <Chip className="font-semibold" color={scoreColor(percent)} size="sm" variant="flat">
          {t('simulado.attemptScore', { correct: score, total: s.totalQuestions, percent })}
        </Chip>
        <Button
          size="sm"
          variant="bordered"
          onPress={() => {
            setHistoryTarget(null);
            router.push(`/certifications/simulados/${s.id}/resultado/${attempt.id}`);
          }}
        >
          {t('simulado.viewAttempt')}
        </Button>
      </div>
    );
  }
}
