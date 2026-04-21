import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { addToast } from '@heroui/toast';

import { saveCertification } from '@/features/connectors';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { useCertificationDraft } from '@/features/hooks/useCertificationDraft.hook';
import { useRequest } from '@/features/hooks/useRequest.hook';

import { CertificationHeader } from './CertificationHeader';
import { TopicForm } from './TopicForm';
import { SectionsTable } from '@/sharedComponents/SectionsTable';
import { BusyDialog } from '@/sharedComponents/ui/BusyDialog';

export function NewCertificationTab() {
  const { addCertification, selectedCertification, certifications } = useCertificationsContext();
  const { loading, request } = useRequest(saveCertification);
  const draft = useCertificationDraft();

  const handleAddTopic = (name: string, minQuestions: number, maxQuestions: number) => {
    if (draft.hasTopic(name)) return;
    draft.addTopic({ name, minQuestions, maxQuestions });
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    const code = draft.code.trim();

    if (!title || !code) {
      addToast({ title: 'Validation error', description: 'Title and code are required.', color: 'danger' });
      return;
    }

    if (certifications.some((c) => c.key === code)) {
      addToast({ title: 'Duplicate certification', description: `Code "${code}" already exists.`, color: 'danger' });
      return;
    }

    const certification = { label: title, key: code, topics: draft.topics };
    const saved = await request(certification);

    if (saved) {
      addCertification(certification);
      draft.reset();
      addToast({ title: 'Success', description: `"${title}" saved successfully.`, color: 'success' });
    }
  };

  const hasTopics = draft.topics.length > 0;

  return (
    <div className="clay-section p-6 mt-2">
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
        <>
          <Divider className="clay-divider" />
          <div className="flex flex-wrap gap-2 mt-4">
            <SectionsTable selectedCertification={selectedCertification} topicsList={draft.topics} />
          </div>
          <div className="flex justify-end mt-4">
            <Button
              color="primary"
              onPress={handleSave}
              isDisabled={loading}
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl shadow-[0_4px_14px_rgba(139,92,246,0.4)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.55)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              Save
            </Button>
          </div>
        </>
      )}

      <BusyDialog isOpen={loading} />
    </div>
  );
}
