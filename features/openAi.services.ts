import { OPENAI_POST_URL } from "@/config/constants";
import { Questionare, QuizForm } from "@/types";
import api from "@/lib/bff.api";
import { PROMPT_CONFIG } from "@/config/constants";

export async function getQuestions(formData: FormData): Promise<Questionare> {
  const { num_questions, topic, difficulty_distribution } = parseFormData(
    formData,
    ["num_questions", "topic", "difficulty_distribution"]
  );

  const { data } = await api.get<Questionare>(OPENAI_POST_URL, {
    params: {
      num_questions,
      topic,
      easy: 0.2,
      medium: 0.5,
      hard: 0.3,
    },
  });

  return data;
}

export function buildPrompt(cfg = PROMPT_CONFIG, params: QuizForm) {
  const defaultDifficulty = { easy: 25, medium: 45, hard: 30 };
  const finalDifficulty = params.difficulty_distribution ?? defaultDifficulty;

  const header = `${cfg.role} Generate multiple-choice questions aligned with the ${cfg.exam}.`;
  const input = [
    `NUM_QUESTIONS: ${params.num_questions}`,
    `TOPIC: "${params.topic}"`,
    `DIFFICULTY_DISTRIBUTION: ${JSON.stringify(finalDifficulty)}`,
    `FORMATO_SAIDA: ${cfg.format}`,
  ];
  const rules = cfg.rules.map((r: string, i: number) => `${i + 1}. ${r}`);
  const outputSchema = `Output format: If FORMATO_SAIDA is \"json\", return a single JSON object with keys 'questions' and 'answer_key' exactly as described.\nJSON format (exact schema, required when FORMATO_SAIDA is \"json\"):\n${JSON.stringify(cfg.outputSchema, null, 2)}`;
  const acceptance = `Acceptance criteria (model must satisfy when returning JSON):\n1. The top-level object must be valid JSON and parseable by JSON.parse.\n2. The number of items in questions must equal NUM_QUESTIONS.\n3. Each question must have exactly five options A..E.\n4. Each question's correct_count must match the length of correct_options in the answer_key for that id.\n5. answer_key must contain one entry for each question id and each explanations must include keys A..E with at least 2 full sentences per explanation.\n6. difficulty values must be one of [\\\"easy\\\",\\\"medium\\\",\\\"hard\\\"] and distribution across questions should approximately follow DIFFICULTY_DISTRIBUTION.\n7. Do not include extraneous top-level keys; return only the JSON object described.\n8. If any rule cannot be satisfied, return a JSON object with an error field explaining which acceptance rule failed.`;

  return [
    header,
    "\nInput parameters:",
    ...input,
    "\nRules for question creation:",
    ...rules,
    "\n",
    outputSchema,
    "\n",
    acceptance,
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
