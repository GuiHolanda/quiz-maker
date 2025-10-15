export interface PromptExample {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
}

export interface PromptGenerationConfig {
  temperature: number;
  top_p?: number;
  retries?: number;
  // max_tokens intentionally omitted (handled at client call site)
}

export interface PromptConfig {
  prompt_version: string;
  role: string;
  generation: PromptGenerationConfig;
  rules: string[];
  acceptance: string[];
  questionSchema: any;
  examples: PromptExample[];
}

export const PROMPT_CONFIG: PromptConfig = {
  prompt_version: '1.2',
  role: 'You are an expert exam question writer for SAP certifications',
  generation: {
    temperature: 0.0,
    top_p: 0.9,
    retries: 1,
  },
  rules: [
    `All the questions must be about the certification exam being targeted in the input parameter CERTIFICATION_TITLE.`,
    'All generated questions must relate to the provided TOPIC (direct concept, application, scenario or implication).',
    'Produce exactly NUM_QUESTIONS questions.',
    'Each question must have exactly 5 options labeled A, B, C, D, E.',
    'Questions may be single-choice or multiple-choice; always include correctCount (1..3).',
    'Vary the number of correct answers across the set (some 1, some 2, optionally a few 3).',
    'For EVERY option include an explanation stating WHY it is correct or incorrect (minimum ~40 characters, ideally 2 sentences).',
    'Mix original items and rephrased public sample questions (maintain accuracy).',
    'Favor concise, scenario-based stems; avoid ambiguity and trivia wording.',
    "Never use 'All of the above' or 'None of the above'.",
    'Distribute difficulty roughly following DIFFICULTY_DISTRIBUTION (easy/medium/hard).',
    'Shuffle correct answers among A..E to avoid patterns.',
    'Return ONLY a JSON array (no wrapper object, no markdown, no extra prose).',
  ],
  acceptance: [
    'Output is a single top-level JSON array parseable by JSON.parse.',
    'Array length equals NUM_QUESTIONS.',
    'Each question has fields: id, text, topic, (optional topicSubarea), difficulty, correctCount, options, answer.',
    'options contains exactly keys A..E (strings).',
    'answer.correctOptions length equals correctCount and all values in [A,B,C,D,E].',
    'answer.explanations includes keys A..E with meaningful text (>= ~40 chars each).',
    'difficulty ∈ ["easy","medium","hard"] and global distribution approximates DIFFICULTY_DISTRIBUTION.',
    'If any rule cannot be satisfied return: {"error":"explanation here"} (object, not array) and nothing else.',
  ],
  questionSchema: require('../promptSchemas/questionSchema.json'),
  examples: [
    {
      name: 'perfect_single',
      input: { NUM_QUESTIONS: 1, TOPIC: 'SmartEdit' },
      output: [
        {
          id: 1,
          text: 'In SmartEdit, which configuration allows editors to personalize storefront components during runtime?',
          correctCount: 1,
          certificationTitle: 'SAP Commerce Cloud',
          topic: 'SmartEdit',
          topicSubarea: 'personalization',
          difficulty: 'easy',
          options: {
            A: 'Component Variants',
            B: 'Backoffice Widgets',
            C: 'PIM Exports',
            D: 'Workflow Steps',
            E: 'Promotion Rules',
          },
          answer: {
            correctOptions: ['A'],
            explanations: {
              A: 'Component Variants define alternative component versions and enable runtime personalization in SmartEdit.',
              B: 'Backoffice Widgets provide admin UI functionality, not runtime storefront personalization.',
              C: 'PIM Exports move product data; they do not manage live component personalization.',
              D: 'Workflow Steps coordinate approval processes, unrelated to dynamic personalization logic.',
              E: 'Promotion Rules govern pricing strategies, not direct component rendering variants.',
            },
          },
        },
      ],
    },
  ],
};