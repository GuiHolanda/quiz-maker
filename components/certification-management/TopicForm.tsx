import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from '@heroui/button';
import { Form } from '@heroui/form';
import { Input } from '@heroui/input';
import { Slider } from '@heroui/slider';

interface TopicFormProps {
  topicName: string;
  onTopicNameChange: (value: string) => void;
  onSubmit: (name: string, minQuestions: number, maxQuestions: number) => void;
}

const SLIDER_CLASS_NAMES = {
  label: 'text-xs text-stone-400 font-bold mb-4',
  value: 'text-xs font-bold',
  labelWrapper: 'flex flex-col items-start',
  thumb: 'h-3 w-4',
};

function getFormString(formData: FormData, key: string, fallback = ''): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : fallback;
}

export function TopicForm({ topicName, onTopicNameChange, onSubmit }: Readonly<TopicFormProps>) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const name = getFormString(formData, 'topicName');
    const minQuestions = Number.parseFloat(getFormString(formData, 'minQuestions', '0')) || 0;
    const maxQuestions = Number.parseFloat(getFormString(formData, 'maxQuestions', '0')) || 0;

    if (!name) return;
    onSubmit(name, minQuestions, maxQuestions);
  };

  return (
    <>
      <h4 className="font-bold">Topics</h4>
      <Form className="flex flex-row items-center gap-6 mb-4" onSubmit={handleSubmit}>
        <Input
          label="Topic Name"
          type="text"
          name="topicName"
          value={topicName}
          onChange={(e) => onTopicNameChange(e.target.value)}
          className="max-w-md"
        />
        <Slider
          className="w-48"
          classNames={SLIDER_CLASS_NAMES}
          name="minQuestions"
          formatOptions={{ style: 'percent' }}
          label="Min Questions"
          size="sm"
          defaultValue={0.15}
          maxValue={1}
          minValue={0}
          showTooltip
          step={0.01}
        />
        <Slider
          className="w-48"
          classNames={SLIDER_CLASS_NAMES}
          name="maxQuestions"
          formatOptions={{ style: 'percent' }}
          label="Max Questions"
          size="sm"
          defaultValue={0.3}
          maxValue={1}
          minValue={0}
          showTooltip
          step={0.01}
        />
        <Button size="sm" variant="solid" color="primary" type="submit" className="ml-auto mt-auto">
          Add topic
          <FontAwesomeIcon icon={faCirclePlus} className="text-lg" />
        </Button>
      </Form>
    </>
  );
}
