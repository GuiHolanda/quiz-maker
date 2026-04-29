import { Button } from '@heroui/button';
import { addToast } from '@heroui/toast';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

import { CertificationHeader } from './CertificationHeader';
import { TopicForm } from './TopicForm';
import { SectionsTable } from '@/sharedComponents/SectionsTable';
import { FormAccordion } from '@/sharedComponents/ui/FormAccordion';

export function NewCertificationTab() {
  const { addCertification, selectedCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();
  const { t } = useTranslation();

  const handleAddTopic = (name: string, minQuestions: number, maxQuestions: number) => {
    if (draft.hasTopic(name)) return;
    draft.addTopic({ name, minQuestions, maxQuestions });
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    const code = draft.code.trim();

    if (!title || !code) {
      addToast({ title: t('toast.validationError'), description: t('error.titleCodeRequired'), color: 'danger' });
      return;
    }

    if (certifications.some((c) => c.key === code)) {
      addToast({ title: t('toast.duplicateCertification'), description: t('error.duplicateCode', { code }), color: 'danger' });
      return;
    }

    const certification = { label: title, key: code, topics: draft.topics };
    const saved = await request(certification);

    if (saved) {
      addCertification(certification);
      draft.reset();
      addToast({ title: t('toast.success'), description: t('toast.savedSuccessfully', { title }), color: 'success' });
    }
  };

  const hasTopics = draft.topics.length > 0;

  return (
    <FormAccordion
      title={t('certification.tabNew')}
      accordionKey="new-certification"
      isLoading={loading}
      footer={
        hasTopics ? (
          <div className="flex justify-end pt-4">
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={loading}
              className="bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition-opacity duration-200"
            >
              {t('common.save')}
            </Button>
          </div>
        ) : null
      }
    >
      <CertificationHeader
        title={draft.title}
        code={draft.code}
        onTitleChange={draft.setTitle}
        onCodeChange={draft.setCode}
      />
      <TopicForm
        topicName={draft.topicName}
        onTopicNameChange={draft.setTopicName}
        onSubmit={handleAddTopic}
      />
      {hasTopics && (
        <SectionsTable selectedCertification={selectedCertification} topicsList={draft.topics} />
      )}
    </FormAccordion>
  );
}
