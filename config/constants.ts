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
    "For each option in the answer key, include a clear explanation (at least 2 full sentences) of why it is correct or incorrect.",
    "Mix original questions and credible, publicly available sample questions (rephrased).",
    "Encourage scenario-based stems that avoid ambiguity.",
    "Do not use 'All of the above' or 'None of the above'.",
    "Distribute questions across difficulty levels according to the DIFFICULTY_DISTRIBUTION.",
    "Explanations must connect to real Commerce Cloud functions (Backoffice, SmartEdit, PIM, promotions, workflows).",
    "Shuffle correct answer positions between A..E to avoid patterns.",
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

export const response = `{
  "questions": [
    {
      "id": 1,
      "question": "Scenario: A marketing team wants to apply a 10% promotional discount to all products in the Summer Umbrella category for a limited time. The discount should automatically apply during checkout across all channels. Which SAP Commerce Cloud feature should you configure to achieve this?",
      "correct_count": 1,
      "options": {
        "A": "Create a SmartEdit banner and link it to the promotion",
        "B": "Create a Promotion with a discount rule of 10% and conditions: productCategory = 'Umbrella', catalog = 'Summer', date range set",
        "C": "Manually adjust product prices in Backoffice",
        "D": "Attach a customer segment to the promotion",
        "E": "Create a channel-specific price list"
      },
      "topic_subarea": "promotions",
      "topic": "Commerce Management",
      "difficulty": "easy",
      "estimated_time_sec": 90
    }
  ],
  "answer_key": [
    {
      "id": 1,
      "correct_options": ["B"],
      "explanations": {
        "A": "SmartEdit banners are for content presentation, not for implementing pricing logic. They do not enforce a discounted price at checkout, so this option cannot guarantee the 10% promotion across channels.",
        "B": "This is the correct approach. A Promotion with a 10% rule and conditions on category, catalog, and date range directly ties into the Promotions module and checkout flow, ensuring automatic application across channels.",
        "C": "Manually adjusting prices in Backoffice is not scalable and does not guarantee consistency across channels or time-limited promotions. It also bypasses the automated promotion engine.",
        "D": "Attaching a customer segment can influence promotion eligibility but does not define the discount rule or ensure automatic application across the entire umbrella category.",
        "E": "A channel-specific price list is not the mechanism to apply a time-bound promotional discount across all channels; promotions and rule engines handle this more robustly."
      }
    }
  ]
}`;

export const response01 = `[
    {
      "id": 1,
      "text": "A marketing team wants to apply a 10% promotional discount to all products in the Summer Umbrella category for a limited time. The discount should automatically apply during checkout across all channels. Which SAP Commerce Cloud feature should you configure to achieve this?",
      "correctCount": 3,
      "topic": "Commerce Management",
      "topicSubarea": "promotions",
      "difficulty": "easy",
      "options": {
        "A": "Create a SmartEdit banner and link it to the promotion",
        "B": "Create a Promotion with a discount rule of 10% and conditions: productCategory = 'Umbrella', catalog = 'Summer', date range set",
        "C": "Manually adjust product prices in Backoffice",
        "D": "Attach a customer segment to the promotion",
        "E": "Create a channel-specific price list"
      },
      "answer": {
        "correctOptions": ["B"],
        "explanations": {
          "A": "SmartEdit banners are for content presentation, not for implementing pricing logic. They do not enforce a discounted price at checkout, so this option cannot guarantee the 10% promotion across channels.",
          "B": "This is the correct approach. A Promotion with a 10% rule and conditions on category, catalog, and date range directly ties into the Promotions module and checkout flow, ensuring automatic application across channels.",
          "C": "Manually adjusting prices in Backoffice is not scalable and does not guarantee consistency across channels or time-limited promotions. It also bypasses the automated promotion engine.",
          "D": "Attaching a customer segment can influence promotion eligibility but does not define the discount rule or ensure automatic application across the entire umbrella category.",
          "E": "A channel-specific price list is not the mechanism to apply a time-bound promotional discount across all channels; promotions and rule engines handle this more robustly."
        }
      }
    },
    {
      "id": 2,
      "text": "A marketing team wants to apply a 15% promotional discount to all products in the Winter Umbrella category for a limited time. The discount should automatically apply during checkout across all channels. Which SAP Commerce Cloud feature should you configure to achieve this?",
      "correctCount": 1,
      "topic": "Commerce Management",
      "topicSubarea": "promotions",
      "difficulty": "easy",
      "options": {
        "A": "Create a SmartEdit banner and link it to the promotion",
        "B": "Create a Promotion with a discount rule of 15% and conditions: productCategory = 'Umbrella', catalog = 'Winter', date range set",
        "C": "Manually adjust product prices in Backoffice",
        "D": "Attach a customer segment to the promotion",
        "E": "Create a channel-specific price list"
      },
      "answer": {
        "correctOptions": ["B"],
        "explanations": {
          "A": "SmartEdit banners are for content presentation, not for implementing pricing logic. They do not enforce a discounted price at checkout, so this option cannot guarantee the 15% promotion across channels.",
          "B": "This is the correct approach. A Promotion with a 15% rule and conditions on category, catalog, and date range directly ties into the Promotions module and checkout flow, ensuring automatic application across channels.",
          "C": "Manually adjusting prices in Backoffice is not scalable and does not guarantee consistency across channels or time-limited promotions. It also bypasses the automated promotion engine.",
          "D": "Attaching a customer segment can influence promotion eligibility but does not define the discount rule or ensure automatic application across the entire umbrella category.",
          "E": "A channel-specific price list is not the mechanism to apply a time-bound promotional discount across all channels; promotions and rule engines handle this more robustly."
        }
      }
    }
  ]`

