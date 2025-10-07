import { FormEvent, useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Question } from "@/types";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { RadioGroup, Radio } from "@heroui/radio";
import { Form } from "@heroui/form";

interface QuestionCardProps {
  readonly question: Question;
  readonly onAnswerChange: (questionId: number, value: string | string[]) => void;
  readonly initialValue?: string[];
}

export function QuestionCard({
  question,
  onAnswerChange,
  initialValue,
}: QuestionCardProps) {
  const [currentSelection, setCurrentSelection] = useState<string[]>([]);

  useEffect(() => {
    if (initialValue) {
      setCurrentSelection(initialValue);
    } else {
      setCurrentSelection([]);
    }
  }, [question.id, question.correctCount, initialValue]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const answer = currentSelection;
    if (!answer) return;
    onAnswerChange?.(question.id, answer);
  };

  const minSelectionCount =
    question.correctCount && question.correctCount > 0
      ? question.correctCount
      : 1;

  return (
    <Card className="p-4">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">
            <span>
              <span className="inline-block mr-2">
                {String(question.id).padStart(2, "0")}.
              </span>
            </span>
            {question.text}
          </h4>
        </div>
      </CardHeader>
      <CardBody>
        <Form onSubmit={handleSubmit} className="flex flex-row items-end">
          {question.correctCount && question.correctCount > 1 ? (
            <CheckboxGroup
              label={`${question.correctCount} correct answers`}
              value={currentSelection}
              onValueChange={(value) => setCurrentSelection(value)}
            >
              {Object.entries(question.options).map(([key, val]) => {
                return (
                  <Checkbox
                    key={key}
                    value={key}
                    size="sm"
                    className="w-4/5"
                    classNames={{ label: "text-sm font-light" }}
                  >
                    {String(val)}
                  </Checkbox>
                );
              })}
            </CheckboxGroup>
          ) : (
            <RadioGroup
              value={currentSelection[0]}
              onValueChange={(value) => setCurrentSelection([value])}
            >
              {Object.entries(question.options).map(([key, val]) => {
                return (
                  <Radio key={key} value={key} size="sm" className="w-4/5">
                    {String(val)}
                  </Radio>
                );
              })}
            </RadioGroup>
          )}
          {currentSelection.length >= minSelectionCount ? (
            <Button
              className="ml-auto bg-primary py-0"
              variant="flat"
              type="submit"
            >
              submit
            </Button>
          ) : (
            <input type="hidden" />
          )}
        </Form>
      </CardBody>
    </Card>
  );
}
