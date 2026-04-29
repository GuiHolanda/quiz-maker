'use client';
import { faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { CertificationTopic } from '@/shared/types';
import { SectionsTable } from '@/shared/components/SectionsTable';
import { TopicForm } from './TopicForm';
import { StepProgress } from './StepProgress';

interface Step2DefineTopicsProps {
  readonly topics: CertificationTopic[];
  readonly topicName: string;
  readonly onTopicNameChange: (v: string) => void;
  readonly onAddTopic: (name: string, min: number, max: number) => void;
  readonly hasTopic: (name: string) => boolean;
  readonly onBack: () => void;
  readonly onNext: () => void;
}

export function Step2DefineTopics({
  topics, topicName, onTopicNameChange, onAddTopic, hasTopic, onBack, onNext,
}: Step2DefineTopicsProps) {
  const { t } = useTranslation();
  const hasTopics = topics.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <StepProgress currentStep={2} />

      <div className="bg-content1 border border-default-200 rounded-xl p-6 flex flex-col gap-4">
        <TopicForm
          topicName={topicName}
          onTopicNameChange={onTopicNameChange}
          onSubmit={(name, min, max) => {
            if (!hasTopic(name)) onAddTopic(name, min, max);
          }}
        />

        {hasTopics && (
          <SectionsTable selectedCertification={null} topicsList={topics} />
        )}

        <div className="flex items-center justify-between pt-4 border-t border-default-200">
          <Button
            variant="bordered"
            className="border-default-300 text-default-600 hover:text-foreground hover:border-default-400 font-semibold transition-colors duration-200 flex items-center gap-2"
            onPress={onBack}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t('common.back')}
          </Button>
          <Button
            className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200 flex items-center gap-2"
            isDisabled={!hasTopics}
            onPress={onNext}
          >
            {t('certification.nextReview')}
            <FontAwesomeIcon icon={faArrowRight} />
          </Button>
        </div>
      </div>
    </div>
  );
}
