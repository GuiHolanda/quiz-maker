export const Templates = {
  GENERATE_QUESTIONS: {
    promptId: process.env.PROMPT_ID ?? 'generate_questions',
    version: process.env.PROMPT_VERSION ?? '1.0.0',
  },
  GET_ANSWER: {
    promptId: process.env.GET_ANSWER_PROMPT_ID ?? 'get_answer',
    version: process.env.GET_ANSWER_PROMPT_VERSION ?? '1.0.0',
  },
};
