'use client';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';

import { CertificationTopic } from '@/shared/types';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

const TH =
  'text-left font-mono text-[11px] text-default-400 uppercase tracking-widest px-4 py-3 border-b border-default-200';
const TD = 'px-4 py-3 text-sm text-foreground border-b border-default-200';

interface CertificationTopicsTableProps {
  readonly topics: CertificationTopic[];
  readonly isSaving: boolean;
  readonly onUpdateTopic: (index: number, patch: Partial<CertificationTopic>) => void;
  readonly onRemoveTopic: (index: number) => void;
}

export function CertificationTopicsTable({
  topics,
  isSaving,
  onUpdateTopic,
  onRemoveTopic,
}: CertificationTopicsTableProps) {
  const { t } = useTranslation();

  if (topics.length === 0) return null;

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
          <tbody>
            {topics.map((topic, ti) => (
              <tr key={ti} className="bg-content1 hover:bg-content2 transition-colors duration-150">
                <td className={TD}>
                  <Input
                    {...inputProperties.input}
                    aria-label={t('chat.topicName')}
                    className="min-w-0"
                    isDisabled={isSaving}
                    size="sm"
                    value={topic.name}
                    onValueChange={(v) => onUpdateTopic(ti, { name: v })}
                  />
                </td>
                <td className={TD}>
                  <Input
                    {...inputProperties.input}
                    aria-label={t('chat.minPercent')}
                    className="w-24"
                    endContent={<span className="text-xs text-default-400">%</span>}
                    isDisabled={isSaving}
                    size="sm"
                    type="number"
                    value={String(Math.round(topic.minQuestions ?? 0))}
                    onValueChange={(v) => onUpdateTopic(ti, { minQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })}
                  />
                </td>
                <td className={TD}>
                  <Input
                    {...inputProperties.input}
                    aria-label={t('chat.maxPercent')}
                    className="w-24"
                    endContent={<span className="text-xs text-default-400">%</span>}
                    isDisabled={isSaving}
                    size="sm"
                    type="number"
                    value={String(Math.round(topic.maxQuestions ?? 0))}
                    onValueChange={(v) => onUpdateTopic(ti, { maxQuestions: Math.min(100, Math.max(0, parseFloat(v) || 0)) })}
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
                    onPress={() => onRemoveTopic(ti)}
                  >
                    <FontAwesomeIcon className="w-3 h-3" icon={faXmark} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
