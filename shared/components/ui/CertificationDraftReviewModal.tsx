'use client';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Spinner } from '@heroui/spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';

import { Certification, CertificationTopic } from '@/shared/types';
import { useCertificationDraftCard } from '@/features/hooks/useCertificationDraftCard.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface CertificationDraftReviewModalProps {
  readonly certification: Certification;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSaved: (savedDraft: Certification) => void;
}

const TH = 'text-left text-xs font-semibold text-default-400 px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';
const TD_LAST = 'px-4 py-3 text-sm text-foreground';

export function CertificationDraftReviewModal({
  certification,
  isOpen,
  onClose,
  onSaved,
}: CertificationDraftReviewModalProps) {
  const { t } = useTranslation();
  const { draft, status, updateField, updateTopic, addTopic, removeTopic, handleSave } =
    useCertificationDraftCard(certification);

  const isSaving = status === 'saving';

  const handleSaveAndClose = async () => {
    const result = await handleSave();

    if (result === 'success') {
      onSaved(draft);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} scrollBehavior="inside" size="5xl" onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <p className="text-base font-bold text-foreground">{t('chat.certificationPreview')}</p>
          <p className="text-xs text-default-400 font-normal">{draft.label}</p>
        </ModalHeader>

        <ModalBody className="gap-6">
          {renderHeaderFields()}
          {renderTopicsTable()}
        </ModalBody>

        <ModalFooter>
          <div className="flex gap-2 w-full">
            <Button
              className="bg-default-100 border border-default-200 text-default-600 hover:bg-default-200 text-xs font-semibold rounded-lg"
              isDisabled={isSaving}
              size="sm"
              startContent={<FontAwesomeIcon className="w-3 h-3" icon={faPlus} />}
              variant="flat"
              onPress={addTopic}
            >
              {t('chat.addTopicShort')}
            </Button>
            <Button
              className="bg-primary text-primary-foreground font-semibold rounded-lg"
              isDisabled={isSaving || !draft.label.trim() || !draft.key.trim()}
              size="sm"
              startContent={isSaving ? <Spinner color="current" size="sm" /> : undefined}
              onPress={handleSaveAndClose}
            >
              {isSaving ? t('chat.saving') : t('chat.saveCertification')}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );

  function renderHeaderFields() {
    return (
      <div className="flex flex-col gap-4">
        <Input
          {...inputProperties.input}
          isDisabled={isSaving}
          label={t('chat.certificationLabel')}
          value={draft.label}
          onValueChange={(v) => updateField('label', v)}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationKey')}
            value={draft.key}
            onValueChange={(v) => updateField('key', v)}
          />
          <Input
            {...inputProperties.input}
            isDisabled={isSaving}
            label={t('chat.certificationProvider')}
            value={draft.provider ?? ''}
            onValueChange={(v) => updateField('provider', v)}
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
            <thead className="bg-default-100">
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
    const isLast = ti === draft.topics.length - 1;
    const tdClass = isLast ? TD_LAST : TD;
    const rowBg = ti % 2 === 0 ? 'bg-content1' : 'bg-default-50';
    const minPctValue = Math.round(topic.minQuestions ?? 0);
    const maxPctValue = Math.round(topic.maxQuestions ?? 0);

    return (
      <tr key={ti} className={rowBg}>
        <td className={tdClass}>
          <Input
            {...inputProperties.input}
            className="min-w-0"
            isDisabled={isSaving}
            size="sm"
            value={topic.name}
            onValueChange={(v) => updateTopic(ti, { name: v })}
          />
        </td>
        <td className={tdClass}>
          <Input
            {...inputProperties.input}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={minPctValue.toString()}
            onValueChange={(v) =>
              updateTopic(ti, { minQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })
            }
          />
        </td>
        <td className={tdClass}>
          <Input
            {...inputProperties.input}
            className="w-24"
            endContent={<span className="text-xs text-default-400">%</span>}
            isDisabled={isSaving}
            size="sm"
            type="number"
            value={maxPctValue.toString()}
            onValueChange={(v) =>
              updateTopic(ti, { maxQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })
            }
          />
        </td>
        <td className={tdClass}>
          <Button
            isIconOnly
            aria-label={t('common.remove')}
            className="text-default-400 hover:text-danger"
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
