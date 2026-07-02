'use client';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { inputProperties } from '@/config/constants/inputStyles';
import { buttonStyles } from '@/config/constants/buttonStyles';

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
    onSubmit(name, minRaw, maxRaw);
  };

  return (
    <>
      <h4 className="font-bold text-sm text-foreground">{t('certification.topics')}</h4>
      <Form className="flex flex-row items-end gap-4 mb-2" onSubmit={handleSubmit}>
        <Input
          className="flex-1"
          label={t('certification.topicName')}
          name="topicName"
          placeholder={t('certification.topicNamePlaceholder')}
          type="text"
          value={topicName}
          onChange={(e) => onTopicNameChange(e.target.value)}
          {...inputProperties.input}
        />
        <Input
          className="w-28"
          label={t('certification.minQuestions')}
          max={100}
          min={0}
          name="minQuestions"
          placeholder={t('certification.minQuestionsPlaceholder')}
          type="number"
          {...inputProperties.input}
        />
        <Input
          className="w-28"
          label={t('certification.maxQuestions')}
          max={100}
          min={0}
          name="maxQuestions"
          placeholder={t('certification.maxQuestionsPlaceholder')}
          type="number"
          {...inputProperties.input}
        />
        <Button className={`mb-0.5 ${buttonStyles.primarySm}`} size="sm" type="submit">
          {t('certification.addTopic')}
          <FontAwesomeIcon className="text-lg" icon={faCirclePlus} />
        </Button>
      </Form>
    </>
  );
}
