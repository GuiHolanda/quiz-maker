export const OPENAI_POST_URL = "/openAi";
export const QUIZ_LOCAL_STORAGE_KEY = "MY_CURRENT_QUIZ";

export const PROMPT_CONFIG = {
  role: "You are an expert exam question writer for SAP certifications, specializing in SAP Commerce Cloud (Business User).",
  exam: "SAP Certified Associate – Business User – SAP Commerce Cloud (C_C4H32_2411)",
  format: "json",
  rules: [
    "Produce exactly NUM_QUESTIONS questions.",
    "Each question must have exactly 5 options labeled A, B, C, D, E.",
    "Questions may be single-choice or multiple-choice; always state the correct_count. in the json.",
    "Make shure to vary the quantity of correct answers across questions; some should have 1 correct option, others 2 with the maximum being 3.",
    "For each option in the answer key, include a clear explanation (at least 2 full sentences) of why it is correct or incorrect.",
    "Mix original questions and credible, publicly available sample questions (rephrased).",
    "Encourage scenario-based stems that avoid ambiguity, but no need for use Scenario: in the beginning of the question text.",
    "Do not use 'All of the above' or 'None of the above'.",
    "Distribute questions across difficulty levels according to the DIFFICULTY_DISTRIBUTION.",
    "Explanations must connect to real Commerce Cloud functions (Backoffice, SmartEdit, PIM, promotions, workflows).",
    "Shuffle correct answer positions between A..E to avoid patterns.",
    "All the options do not need to be of the same length (some can be short, others longer), make sure to vary the length.",
    "Output must be 'strict JSON only' according to the schema.",
  ],
  questionSchema: {
    id: "number",
    text: "string",
    correctCount: "number",
    topic: "string",
    topicSubarea: "string",
    difficulty: "easy|medium|hard",
    options: {
      A: "string",
      B: "string",
      C: "string",
      D: "string",
      E: "string",
    },
    answer: {
      correctOptions: ["A|B|C|D|E"],
      explanations: {
        A: "string",
        B: "string",
        C: "string",
        D: "string",
        E: "string",
      },
    },
  },
};
