export const PROMPT_CONFIG = {
  prompt_version: '1.1',
  role: 'You are an expert exam question writer for SAP certifications, specializing in SAP Commerce Cloud (Business User).',
  exam: 'SAP Certified Associate – Business User – SAP Commerce Cloud (C_C4H32_2411)',

  generation: {
    temperature: 0.0,
    top_p: 0.9,
    // max_tokens: 1600,
    retries: 2,
  },

  rules: [
    'Produce exactly NUM_QUESTIONS questions.',
    'All generated questions must be about (or related to) the TOPIC provided in the input parameters.',
    'Each question must have exactly 5 options labeled A, B, C, D, E.',
    'Questions may be single-choice or multiple-choice; always include correctCount as an integer.',
    'Vary the number of correct answers across the set (1..3); never exceed 3 correct options.',
    'For each option in the answer key, include an explanation of why it is correct or incorrect (minimum ~40 characters, ideally 2 sentences).',
    'Mix original items and credible, publicly available sample questions (rephrased).',
    'Favor scenario-based stems that avoid ambiguity.',
    "Do not use 'All of the above' or 'None of the above'.",
    'Distribute questions across difficulty levels according to DIFFICULTY_DISTRIBUTION.',
    'Explanations must reference real Commerce Cloud functions where applicable (Backoffice, SmartEdit, PIM, promotions, workflows).',
    'Shuffle correct answer positions between A..E to avoid predictable patterns.',
    'Return only strict JSON that matches the provided schema — no markdown, no surrounding text, no extra keys.',
  ],

  acceptance: [
    'The number of items in the array must equal NUM_QUESTIONS.',
    'Each question must have exactly five options A..E and a correctCount matching the correctOptions length.',
    'Each explanation must be descriptive (2 sentences preferred) and contain at least ~40 characters.',
    'Difficulty must be one of ["easy", "medium", "hard"] and follow DIFFICULTY_DISTRIBUTION approximately.',
    'If unable to comply, return { "error": "explanation here" } and no other top-level keys.',
  ],

  questionSchema: require('../promptSchemas/questionSchema.json'),

  examples: [
    {
      name: 'perfect_single',
      input: { NUM_QUESTIONS: 1, TOPIC: 'SmartEdit' },
      output: [
        {
          id: 1,
          text: 'In SmartEdit, which configuration allows editors to personalize storefront components at runtime?',
          correctCount: 1,
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
              A: 'Component Variants allow editors to define different presentations of a component and are used by SmartEdit for runtime personalization. This makes them the correct choice.',
              B: 'Backoffice Widgets are used for administrative UIs and not for runtime storefront personalization.',
              C: 'PIM Exports are related to product data exchange and not SmartEdit UI configuration.',
              D: 'Workflow Steps coordinate business processes and are unrelated to SmartEdit personalization.',
              E: 'Promotion Rules apply pricing/discount logic and are not for component presentation.',
            },
          },
        },
      ],
    },
  ],
};