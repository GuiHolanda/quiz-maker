// The shape of an exam item — which labels exist, what they mean, and how many of
// them may be correct. Cardinality is one attribute of the format, not the concept
// itself: Certo/Errado is not "two options", it is a different kind of question whose
// labels carry meaning.
//
// This registry is the single source of truth. Prompts derive their rules and output
// templates from it, validation checks generated questions against it, and the
// persistence layer reads `labelsAreSemantic` to decide whether option texts may be
// reassigned across labels.
export type QuestionFormatKey = 'mc_4' | 'mc_5' | 'true_false';

export interface QuestionFormat {
  readonly key: QuestionFormatKey;
  readonly labels: readonly string[];
  // When true the label IS the meaning ("C" = Certo), so shuffling texts across labels
  // would corrupt the question. Only formats with interchangeable distractors may be
  // shuffled to break the drafting model's position bias.
  readonly labelsAreSemantic: boolean;
  readonly maxCorrect: number;
  // Injected into the drafting prompt as a numbered rule.
  readonly draftRule: string;
  // The plain-text option block the drafting prompt asks the model to fill in.
  readonly draftTemplate: string;
}

const optionTemplate = (labels: readonly string[], placeholder: string): string =>
  labels.map((label) => `${label}: <${placeholder}>`).join('\n');

const MC_4_LABELS = ['A', 'B', 'C', 'D'] as const;
const MC_5_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;
const TRUE_FALSE_LABELS = ['C', 'E'] as const;

export const QUESTION_FORMATS: Record<QuestionFormatKey, QuestionFormat> = {
  mc_4: {
    key: 'mc_4',
    labels: MC_4_LABELS,
    labelsAreSemantic: false,
    maxCorrect: 2,
    draftRule: 'Each question must have exactly 4 options labeled A, B, C, D.',
    draftTemplate: optionTemplate(MC_4_LABELS, 'option text'),
  },
  mc_5: {
    key: 'mc_5',
    labels: MC_5_LABELS,
    labelsAreSemantic: false,
    maxCorrect: 3,
    draftRule: 'Each question must have exactly 5 options labeled A, B, C, D, E.',
    draftTemplate: optionTemplate(MC_5_LABELS, 'option text'),
  },
  true_false: {
    key: 'true_false',
    labels: TRUE_FALSE_LABELS,
    labelsAreSemantic: true,
    maxCorrect: 1,
    draftRule:
      'Write each question as a single assertion to be judged true or false. Provide exactly two options: "C" whose text is "Certo" and "E" whose text is "Errado". Never write distractors — the assertion itself carries the difficulty.',
    draftTemplate: 'C: Certo\nE: Errado',
  },
};

export const DEFAULT_QUESTION_FORMAT: QuestionFormatKey = 'mc_5';

export function isQuestionFormatKey(value: unknown): value is QuestionFormatKey {
  return typeof value === 'string' && value in QUESTION_FORMATS;
}

// Falls back to the default rather than throwing: a question persisted before this
// registry existed, or an exam whose stored key was retired, must still render.
export function resolveQuestionFormat(key: unknown): QuestionFormat {
  return isQuestionFormatKey(key) ? QUESTION_FORMATS[key] : QUESTION_FORMATS[DEFAULT_QUESTION_FORMAT];
}

// Default format for an exam by the body that writes it. Only a starting point — the
// exam stores its own key and the user can change it. Cebraspe/CESPE runs mixed provas,
// so this picks the style that dominates their concursos rather than the only one.
const FORMAT_BY_SOURCE: Record<string, QuestionFormatKey> = {
  cespe: 'true_false',
  cebraspe: 'true_false',
};

export function defaultFormatForSource(sourceName?: string | null): QuestionFormatKey {
  if (!sourceName) return DEFAULT_QUESTION_FORMAT;

  const normalized = sourceName.trim().toLowerCase();
  const matched = Object.keys(FORMAT_BY_SOURCE).find((source) => normalized.includes(source));

  return matched ? FORMAT_BY_SOURCE[matched] : DEFAULT_QUESTION_FORMAT;
}
