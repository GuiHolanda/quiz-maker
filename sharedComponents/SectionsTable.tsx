'use client';

import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from '@heroui/table';
import React, { Key, useCallback, useRef } from 'react';
import { Certification, CertificationTopic } from '@/types';
import { Button } from '@heroui/button';
import { Slider } from '@heroui/slider';
import { updateCertificationTopic } from '@/features/connectors';
import { addToast } from '@heroui/toast';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

interface SectionsTableProps {
  selectedCertification: Certification | null;
  topicsList?: CertificationTopic[];
  editable?: boolean;
  onTopicChanged?: (topicName: string, field: 'minQuestions' | 'maxQuestions', value: number) => void;
}

const SLIDER_CLASS_NAMES = {
  label: 'text-xs text-stone-400 font-bold',
  value: 'text-xs font-bold',
  labelWrapper: 'flex flex-col items-start',
  thumb: 'h-3 w-4',
};

const TOPICS_TABLE_CONFIG = {
  columns: [
    { key: 'name', label: 'certification.topicName' },
    { key: 'minQuestions', label: 'certification.minQuestions' },
    { key: 'maxQuestions', label: 'certification.maxQuestions' },
    { key: 'actions', label: 'certification.actions' },
  ],
};

export function SectionsTable({ selectedCertification, topicsList, editable = false, onTopicChanged }: SectionsTableProps) {
  const { t } = useTranslation();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const persistTopicChange = useCallback(
    (certificationKey: string, topicName: string, topic: CertificationTopic, field: 'minQuestions' | 'maxQuestions', value: number) => {
      const timerKey = `${topicName}-${field}`;

      if (debounceTimers.current[timerKey]) {
        clearTimeout(debounceTimers.current[timerKey]);
      }

      debounceTimers.current[timerKey] = setTimeout(async () => {
        try {
          await updateCertificationTopic({
            certificationKey,
            topicName,
            minQuestions: field === 'minQuestions' ? value : topic.minQuestions,
            maxQuestions: field === 'maxQuestions' ? value : topic.maxQuestions,
          });
        } catch {
          addToast({ title: t('toast.error'), description: t('toast.failedToUpdate', { name: topicName }), color: 'danger' });
        }
      }, 600);
    },
    [t]
  );

  const handleSliderChange = useCallback(
    (entry: CertificationTopic, field: 'minQuestions' | 'maxQuestions', value: number) => {
      onTopicChanged?.(entry.name, field, value);

      if (selectedCertification) {
        persistTopicChange(selectedCertification.key, entry.name, entry, field, value);
      }
    },
    [selectedCertification, onTopicChanged, persistTopicChange]
  );

  const renderCell = useCallback(
    (entry: CertificationTopic, columnKey: Key) => {
      const cellValue = entry[columnKey as keyof CertificationTopic];

      switch (columnKey) {
        case 'minQuestions':
        case 'maxQuestions':
          if (editable) {
            return (
              <Slider
                className="w-36"
                classNames={SLIDER_CLASS_NAMES}
                size="sm"
                value={cellValue as number}
                formatOptions={{ style: 'percent' }}
                maxValue={1}
                minValue={0}
                showTooltip
                step={0.01}
                aria-label={columnKey}
                onChange={(val) => handleSliderChange(entry, columnKey, val as number)}
              />
            );
          }
          return (cellValue as number).toLocaleString(undefined, { style: 'percent', minimumFractionDigits: 0 });
        case 'actions':
          return (
            <Button variant="flat" size="sm" color="danger">
              {t('common.remove')}
            </Button>
          );
        default:
          return cellValue;
      }
    },
    [editable, handleSliderChange, t]
  );

  return (
    <Table isStriped aria-label={t('aria.certificationTopics')}>
      <TableHeader columns={TOPICS_TABLE_CONFIG.columns}>
        {(column) => <TableColumn key={column.key}>{t(column.label)}</TableColumn>}
      </TableHeader>
      <TableBody items={selectedCertification?.topics || topicsList || []} emptyContent={t('certification.noTopics')}>
        {(topic) => (
          <TableRow key={topic.name}>
            {(columnKey) => <TableCell>{renderCell(topic, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
