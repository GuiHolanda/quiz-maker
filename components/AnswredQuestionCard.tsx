import { Card, CardHeader, CardBody } from '@heroui/card';
import { Question } from '@/types';
import { Alert } from '@heroui/alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark } from '@fortawesome/free-solid-svg-icons';

interface QuestionCardProps {
  readonly question: Question;
  readonly answer: string[];
}

export function AnsweredQuestionCard({ question, answer }: QuestionCardProps) {
  const correct = new Set(question.answer?.correctOptions || []);
  const selected = new Set(answer || []);
  const isCorrectlyAnswered = Array.from(correct).every((opt) => selected.has(opt)) && correct.size === selected.size;

  function renderOptionAlerts() {
    return Object.entries(question.options).map(([key, val]) => {
      const isCorrect = correct.has(key);
      const isSelected = selected.has(key);

      let color: 'success' | 'danger' | 'warning' | undefined = undefined;
      if (isSelected && isCorrect) color = 'success';
      else if (isSelected && !isCorrect) color = 'danger';

      const optionText = typeof val === 'string' ? val : JSON.stringify(val);
      return (
        <Alert
          hideIconWrapper
          key={key}
          color={color}
          title={optionText}
          classNames={{
            title: 'text-xs',
            description: 'text-xs',
            base: 'py-1 px-2',
            alertIcon: 'w-6 h-6',
          }}
        />
      );
    });
  }

  function renderExplanations() {
    return Object.entries(question.answer?.explanations || {}).map(([key, val]) => {
      const explanationText = typeof val === 'string' ? val : JSON.stringify(val);
      const isCorrect = correct.has(key);

      return (
        <Alert
          hideIconWrapper
          key={key}
          color={isCorrect ? 'success' : 'danger'}
          title={explanationText}
          classNames={{
            title: 'text-xs',
            description: 'text-xs',
            base: 'py-1 px-2',
            alertIcon: 'w-6 h-6',
          }}
        />
      );
    });
  }

  return (
    <>
      <Card className="p-4">
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="flex items-center justify-between flex-1">
            <h4 className="font-semibold text-foreground">
              <span className="inline-block mr-2">{String(question.id).padStart(2, '0')}.</span>
              {question.text}
            </h4>
            {isCorrectlyAnswered ? (
              <FontAwesomeIcon icon={faCircleCheck} className="text-success text-2xl" />
            ) : (
              <FontAwesomeIcon icon={faCircleXmark} className="text-danger text-2xl" />
            )}
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">{renderOptionAlerts()}</CardBody>
      </Card>

      <Card className="p-4">
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold text-foreground">Explanations</h4>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">{renderExplanations()}</CardBody>
      </Card>
    </>
  );
}
