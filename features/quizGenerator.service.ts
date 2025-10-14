import { OPENAI_POST_URL } from '@/config/constants';
import { PROMPT_CONFIG } from '@/config/constants/promptConfig';
import { Question, QuizForm } from '@/types';
import api from '@/lib/bff.api';

export async function getQuestions(formData: FormData): Promise<Question[]> {
  const { num_questions, topic, newQuestionsPercentage } = parseFormData(formData, [
    'num_questions',
    'topic',
    'newQuestionsPercentage',
  ]);

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

  const generationHint = `GenerationHint: use temperature=${promptConfig.generation?.temperature ?? 0.0}, top_p=${promptConfig.generation?.top_p ?? 1.0}. Prefer deterministic, structured JSON output.`;

  const input = [
    `NUM_QUESTIONS: ${params.num_questions}`,
    `TOPIC: "${params.topic}"`,
    `DIFFICULTY_DISTRIBUTION: ${JSON.stringify(finalDifficulty)}`,
  ];

  const rules = (promptConfig.rules || []).map((r: string, i: number) => `${i + 1}. ${r}`);
  const acceptance = (promptConfig.acceptance || []).map((r: string, i: number) => `${i + 1}. ${r}`);

  const outputInstructions = [
    `JSON top-level object containing an array of question following the structure of the schema: ${JSON.stringify(promptConfig.questionSchema, null, 2)}`,
    `Do NOT include the full JSON Schema in your output`,
  ];
  const examples: string[] = [];
  if (Array.isArray(promptConfig.examples)) {
    for (const ex of promptConfig.examples) {
      try {
        const exInput = ex.input ? `Input:\n${JSON.stringify(ex.input, null, 2)}` : '';
        const exOutput = ex.output ? `Output (exact JSON):\n${JSON.stringify(ex.output, null, 2)}` : '';
        examples.push(`Example: ${ex.name}\n${exInput}\n${exOutput}`);
      } catch (err) {}
    }
  }

  const parts = [
    header,
    generationHint,
    '\nINPUT PARAMETERS:',
    ...input,
    '\nRULES:',
    ...rules,
    '\nOUTPUT INSTRUCTIONS:',
    ...outputInstructions,
  ];

  if (examples.length) {
    parts.push('\nFEW-SHOT EXAMPLES (do not add commentary):');
    parts.push(...examples);
  }

  parts.push('\nACCEPTANCE CRITERIA:');
  parts.push(...acceptance);

  return parts.join('\n');
}

function parseFormData(formData: FormData, fields: string[]) {
  const data: Record<string, string> = {};

  fields.forEach((field) => {
    const value = formData.get(field);

    if (typeof value === 'string') data[field] = value;
  });

  return data;
}
