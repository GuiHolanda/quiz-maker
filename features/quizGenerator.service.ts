import { OPENAI_POST_URL } from '@/config/constants';
import { PROMPT_CONFIG, PromptConfig } from '@/config/constants/promptConfig';
import { Question, QuizParams } from '@/types';
import api from '@/lib/bff.api';

export async function getQuestions(requestPayload: QuizParams): Promise<Question[]> {
  const { numQuestions, topic, newPercent, certificationTitle } = requestPayload;

  const { data } = await api.get<Question[]>(OPENAI_POST_URL, {
    params: {
      certificationTitle,
      topic,
      numQuestions,
      newPercent: newPercent ?? 0.3,
      easy: 0.2,
      medium: 0.5,
      hard: 0.3,
    },
  });

  return data;
}

/**
 * buildPrompt
 * Creates a deterministic, instruction-rich prompt for the LLM.
 * Output contract: a single top-level JSON array of question objects OR an {"error": string} object.
 */
export function buildPrompt(params: QuizParams, cfg: PromptConfig = PROMPT_CONFIG): string {
  const { numQuestions, topic, difficulty, certificationTitle } = params;
  const safeTopic = (topic || '').trim() || 'General';

  const header = `${cfg.role} specialized in the ${certificationTitle} exam\nExam: ${certificationTitle}`;
  const gen = cfg.generation;
  const generationMeta = `Generation: temperature=${gen.temperature} top_p=${gen.top_p ?? 1} (Return ONLY JSON)`;

  const section = (title: string) => `\n${title.toUpperCase()}:`;
  const numbered = (items: string[]) => items.map((r, i) => `${i + 1}. ${r}`);

  const inputBlock = [
    `CERTIFICATION_TITLE="${certificationTitle}"`,
    `TOPIC="${safeTopic}"`,
    `NUM_QUESTIONS=${numQuestions}`,
    `DIFFICULTY_DISTRIBUTION=${JSON.stringify(difficulty)}`,
  ];

  const rules = numbered(cfg.rules);
  const acceptance = numbered(cfg.acceptance);

  const schemaSummary = `Top-level JSON array where each item should follow the question schema: ${JSON.stringify(cfg.questionSchema)}`;
  const outputDirectives = [
    'Return ONLY the JSON array (no wrapper object, no prose).',
    'If validation impossible: return {"error":"explanation here"} (object, not array).',
    'Never echo this instruction text back.',
    'Do NOT include the schema JSON itself.',
  ];

  const exampleBlocks: string[] = [];
  for (const ex of cfg.examples || []) {
    try {
      exampleBlocks.push(
        [
          `Example: ${ex.name}`,
          ex.input ? `Input:\n${JSON.stringify(ex.input, null, 2)}` : '',
          ex.output ? `Output:\n${JSON.stringify(ex.output, null, 2)}` : '',
        ]
          .filter(Boolean)
          .join('\n')
      );
    } catch {
      // ignore malformed example
    }
  }

  const parts: string[] = [];
  parts.push(header);
  parts.push(generationMeta);
  parts.push(section('Input Parameters'));
  parts.push(...inputBlock);
  parts.push(section('Rules'));
  parts.push(...rules);
  parts.push(section('Schema Summary'));
  parts.push(schemaSummary);
  parts.push(section('Output Instructions'));
  parts.push(...outputDirectives);
  if (exampleBlocks.length) {
    parts.push(section('Few-Shot Examples'));
    parts.push(...exampleBlocks);
  }
  parts.push(section('Acceptance Criteria'));
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
