import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter } from '@heroui/card';
import { Divider } from '@heroui/divider';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';
import { SectionsTable } from '../quiz/SectionsTable';
import { useRef, useState } from 'react';
import useCertificationsContext from '@/features/hooks/useCertificationsContext.hook';
import { CertificationTopic } from '@/types';
import { addToast } from '@heroui/toast';

export function NewCertificationTab() {
  const { addCertification, updateCertification, selectedCertification, certifications } = useCertificationsContext();
  const [topicsList, setTopicsList] = useState<CertificationTopic[]>([]);
  const [topicName, setTopicName] = useState<string>('');
  const topicNameInputRef = useRef<HTMLInputElement>(null);
  const certificationTitleInputRef = useRef<HTMLInputElement>(null);
  const certificationCodeInputRef = useRef<HTMLInputElement>(null);

  const onAddTopic = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const topicName = formData.get('topicName')?.toString().trim();
    const minQuestionsStr = formData.get('minQuestions')?.toString().trim();
    const maxQuestionsStr = formData.get('maxQuestions')?.toString().trim();

    const minQuestions = minQuestionsStr ? parseFloat(minQuestionsStr) : 0;
    const maxQuestions = maxQuestionsStr ? parseFloat(maxQuestionsStr) : 0;
    const name = topicName?.trim();
    if (!name) return;
    if (topicsList.some((t) => t.name === name)) return;
    setTopicsList((prev) => [...prev, { name, minQuestions, maxQuestions }]);
    setTopicName('');
    if (topicNameInputRef.current) topicNameInputRef.current.value = '';
  };

  const onSaveCertification = () => {
    const certificationTitle = certificationTitleInputRef.current?.value.trim();
    const certificationCode = certificationCodeInputRef.current?.value.trim();

    if (!certificationTitle || !certificationCode) {
      addToast({
        title: `Error saving certification`,
        description: 'Certification title or code cannot be empty.',
        color: 'danger',
      });
      return;
    }

    if (certifications.some((certification) => certification.key === certificationCode)) {
      addToast({
        title: `Error saving certification`,
        description: 'Certification with this code already exists.',
        color: 'danger',
      });
      return;
    }
    addCertification({
      label: certificationTitle,
      key: certificationCode,
      topics: topicsList,
    });
  };
  return (
    <Card className="p-2 mt-4">
      <CardBody className="w-full">
        <div className="flex gap-4 mb-4">
          <Input label="Certification Title" type="text" className="w-2/3" ref={certificationTitleInputRef} />
          <Input label="Certification Code" type="text" className="w-1/3" ref={certificationCodeInputRef} />
        </div>
        <h4 className="font-bold">Topics</h4>
        <Form className="flex flex-row items-center gap-6 mb-4" onSubmit={onAddTopic}>
          <Input
            label="Topic Name"
            type="text"
            name="topicName"
            ref={topicNameInputRef}
            value={topicName}
            onChange={(e: any) => setTopicName(e?.target?.value ?? '')}
            className="max-w-md"
          />
          <Slider
            className="w-48"
            classNames={{
              label: 'text-xs text-stone-400 font-bold mb-4',
              value: 'text-xs font-bold',
              labelWrapper: 'flex flex-col items-start',
              thumb: 'h-3 w-4',
            }}
            name="minQuestions"
            formatOptions={{ style: 'percent' }}
            label="Min Questions"
            size="sm"
            defaultValue={0.15}
            maxValue={1}
            minValue={0}
            showTooltip={true}
            step={0.01}
          />
          <Slider
            className="w-48"
            classNames={{
              label: 'text-xs text-stone-400 font-bold mb-4',
              value: 'text-xs font-bold',
              labelWrapper: 'flex flex-col items-start',
              thumb: 'h-3 w-4',
            }}
            name="maxQuestions"
            formatOptions={{ style: 'percent' }}
            label="Max Questions"
            size="sm"
            defaultValue={0.3}
            maxValue={1}
            minValue={0}
            showTooltip={true}
            step={0.01}
          />
          <Button size="sm" variant="solid" color="primary" type="submit" className="ml-auto mt-auto">
            Add topic
            <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
          </Button>
        </Form>
        {topicsList.length > 0 && (
          <>
            <Divider />
            <div className="flex flex-wrap gap-2 mt-4">
              <SectionsTable selectedCertification={selectedCertification} topicsList={topicsList} />
            </div>
          </>
        )}
      </CardBody>
      {topicsList.length > 0 && (
        <CardFooter>
          <Button color="primary" className="ml-auto" onPress={onSaveCertification}>
            Save
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
