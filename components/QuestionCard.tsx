import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Questionare } from "@/types";
import {CheckboxGroup, Checkbox} from "@heroui/checkbox";
import { RadioGroup, Radio } from "@heroui/radio";

type Question = NonNullable<Questionare["questions"]>[number];

function difficultyClasses(d: string) {
  const v = String(d).toLowerCase();
  if (v === "easy") return "bg-green-100 text-green-800";
  if (v === "medium") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function QuestionCard({ q }: { q: Question }) {
  return (
    <Card className="p-4">
      <CardHeader className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">
            {q.id}. {q.text}
          </h4>
          <div className="mt-1 text-xs text-muted-foreground">
            {q.topicSubarea}
          </div>
        </div>
      </CardHeader>
      <CardBody>
          {q.correctCount && q.correctCount > 1 ? (
            <CheckboxGroup label={`${q.correctCount} correct answers`} >
              {Object.entries(q.options).map(([key, val]) => (
                <Checkbox key={key} id={`q-${q.id}-${key}`} value={key} classNames={{ label: "text-sm" }} className="w-4/5">
                  {String(val)}
                </Checkbox>
              ))}
            </CheckboxGroup>
          ) : (
            <RadioGroup name={`q-${q.id}`}>
              {Object.entries(q.options).map(([key, val]) => (
                <Radio key={key} value={key} classNames={{ label: "text-sm" }} className="w-4/5">
                  {val}
                </Radio>
              ))}
            </RadioGroup>
          )}
      </CardBody>
      <CardFooter className="flex justify-end">
        <Button variant="ghost" size="sm">
          Show explanation
        </Button>
      </CardFooter>
    </Card>
  );
}
