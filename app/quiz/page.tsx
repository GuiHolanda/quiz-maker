"use client";
import { useState } from "react";
import { Card, CardHeader } from "@heroui/card";
import { Divider } from "@heroui/divider";
import { QuestionareForm } from "@/components/questionareForm";
import { title } from "@/components/primitives";
import { Questionare } from "@/types";
import { QuestionCard } from "@/components/QuestionCard";

export default function AboutPage() {
  const [questions, setQuestions] = useState<Questionare | null>(null);

  return (
    <>
      <div className="flex flex-col mb-8 gap-2">
        <h1 className={title()}>Generate your Quiz</h1>
        <h3 className="text-lg font-bold text-zinc-400 pl-2">
          Create personalized quizzes for your certifications practice
        </h3>
      </div>

      <Card className="w-full p-4">
        <CardHeader className="flex gap-3">
          <div className="flex flex-col">
            <p className="text-md">Configure the questionaire</p>
          </div>
        </CardHeader>
        <Divider />
        <QuestionareForm onGenerated={setQuestions} />
      </Card>

      <div className="flex flex-col gap-4 mt-8">
        {questions &&
          questions.questions.map((q) => <QuestionCard key={q.id} question={q} />)}
      </div>
    </>
  );
}
