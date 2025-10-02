"use client";
import { getQuestions } from "@/features/openAi.services";
import { useRequest } from "@/features/useRequest.hook";
import { QuizForm, Question } from "@/types";
import { Button } from "@heroui/button";
import { CardBody } from "@heroui/card";
import { Form } from "@heroui/form";
import { Input } from "@heroui/input";
import { Slider } from "@heroui/slider";

interface QuestionareFormProps {
  onGenerated: (questions: Question[]) => void;
}

export function QuestionareForm({ onGenerated }: QuestionareFormProps) {
  const { loading, error, setError, request } = useRequest(getQuestions);
  const difficultyLevels = ["Easy", "Medium", "Hard"];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const topic = formData.get("topic")?.toString().trim();
    const num_questions = formData.get("num_questions")?.toString().trim();

    const newErrors: Partial<QuizForm> = {};
    if (!topic) newErrors.topic = "Topic is required";
    if (!num_questions)
      newErrors.num_questions = "Number of questions is required";
    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    const questions = await request(formData, () => form.reset());
    onGenerated(questions);
  };
  return (
    <Form onSubmit={handleSubmit} validationErrors={error}>
      <CardBody>
        <div className="flex w-full flex-wrap md:flex-nowrap mb-6 gap-4">
          <Input
            id="topic"
            name="topic"
            className="w-2/3"
            label="Quiz Topic"
            type="text"
            variant="flat"
          />
          <Input
            id="num_questions"
            name="num_questions"
            className="w-1/3"
            label="Number of Questions"
            type="number"
            variant="flat"
          />
        </div>
        <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-end">
          <div className="flex flex-col flex-wrap md:flex-nowrap gap-4">
            <p className="text-sm">Difficulty distribution</p>
            <div className="flex gap-6">
              {difficultyLevels.map((level) => (
                <Slider
                  key={level}
                  className="w-36 [&_.heroui-slider-label]:text-xs"
                  classNames={{
                    label: "text-xs font-bold",
                    value: "text-xs font-bolde",
                    thumb: "h-3 w-4",
                  }}
                  name={`difficulty_distribution`}
                  formatOptions={{ style: "percent" }}
                  label={level}
                  size="sm"
                  maxValue={1}
                  minValue={0}
                  showTooltip={true}
                  step={0.1}
                />
              ))}
            </div>
          </div>
          <Button
            className="ml-auto bg-primary"
            variant="flat"
            type="submit"
            disabled={loading}
          >
            Generate questions
          </Button>
        </div>
      </CardBody>
    </Form>
  );
}
