import React from "react";
import { Questionare } from "@/types";
import { QuestionCard } from "./QuestionCard";
import { Card, CardHeader, CardBody } from "@heroui/card";

export function QuestionList({ data }: { data: Questionare }) {
  const total = data.questions.length;
  const byDifficulty = data.questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">Questions</h3>
              <p className="text-xs text-muted-foreground">Total: {total}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {Object.entries(byDifficulty).map(([k, v]) => (
                <span key={k} className="ml-3">{k}: {v}</span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {data.questions.map((q) => (
            <QuestionCard key={q.id} q={q} />
          ))}
        </CardBody>
      </Card>
  );
}
