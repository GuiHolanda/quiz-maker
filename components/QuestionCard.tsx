import { FormEvent, useState, useEffect } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Question } from "@/types";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { RadioGroup, Radio } from "@heroui/radio";
import { Form } from "@heroui/form";

interface QuestionCardProps {
  question: Question;
  onAnswerChange: (questionId: number, value: string | string[]) => void;
  initialValue?: string[];
}

export function QuestionCard({
  question,
  onAnswerChange,
  initialValue,
}: QuestionCardProps) {
  const [selectedCount, setSelectedCount] = useState(0);
  const [currentSelection, setCurrentSelection] = useState<string[]>(
    question.correctCount && question.correctCount > 1 ? [] : [""]
  );

  useEffect(() => {
    if (initialValue) {
      setCurrentSelection(initialValue);
      setSelectedCount(Array.isArray(initialValue) ? initialValue.length : 1);
    } else {
      setCurrentSelection(
        question.correctCount && question.correctCount > 1 ? [] : [""]
      );
      setSelectedCount(0);
    }
  }, [question.id, question.correctCount, initialValue]);

  useEffect(() => {
    setSelectedCount(
      Array.isArray(currentSelection)
        ? currentSelection.length
        : currentSelection
          ? 1
          : 0
    );
  }, [currentSelection]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const answer = currentSelection;
    if (!answer) return;
    onAnswerChange?.(question.id, answer);
  };

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
          {selectedCount >=
          (question.correctCount && question.correctCount > 0
            ? question.correctCount
            : 1) ? (
            <Button
              className="ml-auto bg-primary py-0"
              variant="flat"
              type="submit"
            >
              submit
            </Button>
          ) : (
            <input type="hidden" aria-hidden />
          )}
        </Form>
      </CardBody>
    </Card>
  );
}
