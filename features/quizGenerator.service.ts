import { OPENAI_POST_URL } from "@/config/constants";
import { PROMPT_CONFIG } from "@/config/constants/promptConfig";
import { Question, QuizForm } from "@/types";
import api from "@/lib/bff.api";

export async function getQuestions(formData: FormData): Promise<Question[]> {
  const { num_questions, topic, newQuestionsPercentage } = parseFormData(
    formData,
    ["num_questions", "topic", "newQuestionsPercentage"]
  );

  const { data } = await api.get<Question[]>(OPENAI_POST_URL, {
    params: {
      topic,
      num_questions,
      new_percent: newQuestionsPercentage ?? 0.3,
      easy: 0.2,
      medium: 0.5,
      hard: 0.3,
    },
  });

  return data;
}

export function buildPrompt(params: QuizForm, promptConfig: any = PROMPT_CONFIG) {
  const defaultDifficulty = { easy: 25, medium: 45, hard: 30 };
  const finalDifficulty = params.difficulty_distribution ?? defaultDifficulty;

  const header = `${promptConfig.role} Generate multiple-choice questions aligned with the ${promptConfig.exam}.`;
  const input = [
    `NUM_QUESTIONS: ${params.num_questions}`,
    `TOPIC: "${params.topic}"`,
    `DIFFICULTY_DISTRIBUTION: ${JSON.stringify(finalDifficulty)}`,
  ];
  const rules = promptConfig.rules.map((r: string, i: number) => `${i + 1}. ${r}`);
  const acceptance = promptConfig.acceptance.map((r: string, i: number) => `${i + 1}. ${r}`);
  const outputSchema = `Output format: return an array of 'questions' where each question is exactly as described in the following question schema:\n${JSON.stringify(promptConfig.questionSchema, null, 2)}`;

  return [
    header,
    "\nInput parameters:",
    ...input,
    "\nRules for question creation:",
    ...rules,
    "\n",
    outputSchema,
    "\nAcceptance criteria (model must satisfy when returning JSON):",
    ...acceptance,
  ].join("\n");
}

function parseFormData(formData: FormData, fields: string[]) {
  const data: Record<string, string> = {};

  fields.forEach((field) => {
    const value = formData.get(field);

    if (typeof value === "string") data[field] = value;
  });

  return data;
}
