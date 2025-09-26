import { ChangeEvent, FormEvent, useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Question } from "@/types";
import { CheckboxGroup, Checkbox } from "@heroui/checkbox";
import { RadioGroup, Radio } from "@heroui/radio";
import { Form } from "@heroui/form";

interface QuestionCardProps {
  question: Question;
  onAnswerChange?: (questionId: number, value: string | string[]) => void;
}

export function QuestionCard({ question, onAnswerChange }: QuestionCardProps) {
  const [selectedCount, setSelectedCount] = useState(0);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    if (question.correctCount && question.correctCount > 1) {
      const values = formData
        .getAll("option")
        .map((value) => String(value))
        .filter(Boolean);

      onAnswerChange?.(question.id, values);
    } else {
      const value = formData.get("option")!.toString();
      onAnswerChange?.(question.id, value);
    }
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
            <CheckboxGroup label={`${question.correctCount} correct answers`}>
              {Object.entries(question.options).map(([key, val]) => (
                <Checkbox
                  key={key}
                  name="opetion"
                  value={key}
                  defaultChecked={false}
                  size="sm"
                  className="w-4/5"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    setSelectedCount((c) => (e.target.checked ? c + 1 : c - 1));
                  }}
                >
                  {String(val)}
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <RadioGroup name={`q-${question.id}`}>
              {Object.entries(question.options).map(([key, val]) => (
                <Radio
                  key={key}
                  name="opetion"
                  value={key}
                  defaultChecked={false}
                  size="sm"
                  className="w-4/5"
                  onChange={() => setSelectedCount(1)}
                >
                  {String(val)}
                </Radio>
              ))}
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
              Submit
            </Button>
          ) : (
            <input type="hidden" aria-hidden />
          )}
        </Form>
      </CardBody>
    </Card>
  );
}
