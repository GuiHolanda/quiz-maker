export const Templates = {
    GENERATE_QUESTIONS: {
        promptId: process.env.PROMPT_ID ?? "generate_questions",
        version: process.env.PROMPT_VERSION ?? "1.0.0"
    },
    GET_ANSWER: {
        promptId: process.env.GET_ANSWER_PROMPT_ID ?? "get_answer",
        version: process.env.GET_ANSWER_PROMPT_VERSION ?? "1.0.0"
    },
    GENERATE_PUBLIC_EXAM_QUESTIONS: {
        promptId: process.env.PUBLIC_EXAM_PROMPT_ID ?? "generate_public_exam_questions",
        version: process.env.PUBLIC_EXAM_PROMPT_VERSION ?? "1.0.0"
    },
    GET_PUBLIC_EXAM_ANSWERS: {
        promptId: process.env.PUBLIC_EXAM_GET_ANSWER_PROMPT_ID ?? "get_public_exam_answers",
        version: process.env.PUBLIC_EXAM_GET_ANSWER_PROMPT_VERSION ?? "1.0.0"
    }
}