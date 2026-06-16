'use client';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';

interface TopicFormProps {
  readonly topicName: string;
  readonly onTopicNameChange: (value: string) => void;
  readonly onSubmit: (name: string, minQuestions: number, maxQuestions: number) => void;
}

function getFormString(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : fallback;
}

export function TopicForm({ topicName, onTopicNameChange, onSubmit }: TopicFormProps) {
  const { t } = useTranslation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = getFormString(formData, 'topicName');
    const minRaw = Number.parseFloat(getFormString(formData, 'minQuestions', '0')) || 0;
    const maxRaw = Number.parseFloat(getFormString(formData, 'maxQuestions', '0')) || 0;

    if (!name) return;
    onSubmit(name, minRaw / 100, maxRaw / 100);
  };

  return (
    <>
      <h4 className="font-bold text-sm text-foreground">{t('certification.topics')}</h4>
      <Form className="flex flex-row items-end gap-4 mb-2" onSubmit={handleSubmit}>
        <Input
          label={t('certification.topicName')}
          type="text"
          name="topicName"
          value={topicName}
          onChange={(e) => onTopicNameChange(e.target.value)}
          className="flex-1"
          placeholder={t('certification.topicNamePlaceholder')}
          {...inputProperties.input}
        />
        <Input
          label={t('certification.minQuestions')}
          type="number"
          name="minQuestions"
          className="w-28"
          placeholder={t('certification.minQuestionsPlaceholder')}
          min={0}
          max={100}
          {...inputProperties.input}
        />
        <Input
          label={t('certification.maxQuestions')}
          type="number"
          name="maxQuestions"
          className="w-28"
          placeholder={t('certification.maxQuestionsPlaceholder')}
          min={0}
          max={100}
          {...inputProperties.input}
        />
        <Button size="sm" variant="solid" color="primary" type="submit" className="mb-0.5">
          {t('certification.addTopic')}
          <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
        </Button>
      </Form>
    </>
  );
}
