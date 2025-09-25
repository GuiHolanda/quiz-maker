import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

export async function GET(request: NextRequest) {

  let topic: string | undefined;
  let num_questions: number = 10;
  let difficulty_distribution: { easy: number; medium: number; hard: number } | undefined;

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    topic = params.get("topic")?.trim() ?? undefined;
    num_questions = Number(params.get("num_questions"));
    const easy = Number(params.get("easy"));
    const medium = Number(params.get("medium"));
    const hard = Number(params.get("hard"));

    difficulty_distribution = { easy, medium, hard };

  } catch (err) {
    return NextResponse.json({ error: "invalid query parameters" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const client = new OpenAI({ apiKey });

  const defaultDifficulty = { easy: 25, medium: 45, hard: 30 };
  const finalDifficulty = difficulty_distribution ?? defaultDifficulty;

  if (!Number.isInteger(num_questions) || num_questions <= 0) {
    return NextResponse.json({ error: "num_questions must be an integer > 0" }, { status: 400 });
  }

  const prompt = `You are an expert exam question writer for SAP certifications, specializing in SAP Commerce Cloud (Business User). Generate multiple-choice questions aligned with the SAP Certified Associate – Business User – SAP Commerce Cloud exam (C_C4H32_2411).

Input parameters:
- NUM_QUESTIONS: ${num_questions}
- TOPIC: "${topic}"
- DIFFICULTY_DISTRIBUTION: ${JSON.stringify(difficulty_distribution)}
- FORMATO_SAIDA: JSON

Rules for question creation:
1. Produce exactly ${num_questions} questions.
2. Each question must have exactly 5 options labeled A, B, C, D, E.
3. Questions may be single-choice or multiple-choice; always state at the end of the question: (Number of correct answers: X).
4. Provide the answer key and explanations immediately after all questions.
5. For each option in the answer key, include a clear explanation (at least 2 full sentences) of why it is correct or incorrect.
6. Mix original questions and credible, publicly available sample questions (rephrased).
7. Encourage scenario-based stems that avoid ambiguity.
8. Do not use "All of the above" or "None of the above.".
9. Distribute questions across difficulty levels according to the DIFFICULTY_DISTRIBUTION.
10. Explanations must connect to real Commerce Cloud functions (Backoffice, SmartEdit, PIM, promotions, workflows).
11. Shuffle correct answer positions.
12. Output must be 'strict JSON only'.

Output format: If FORMATO_SAIDA is "json", return a single JSON object with keys 'questions' and 'answer_key' exactly as described.
JSON format (exact schema, required when FORMATO_SAIDA is "json"):
{
  "questions": [
    {
      "id": 1,
      "text": "...",
      "correctCount": 1,
      "options": {"A":"...","B":"...","C":"...","D":"...","E":"..."},
      "topicSubarea": "catalog",
      "difficulty": "medium",
    }
  ],
  "answers": [
    {
      "question_id": 1,
      "correct_options": ["A","C"],
      "explanations": {"A":"...","B":"...","C":"...","D":"...","E":"..."}
    }
  ]
}

Acceptance criteria (model must satisfy when returning JSON):
1. The top-level object must be valid JSON and parseable by JSON.parse.
2. The number of items in questions must equal NUM_QUESTIONS.
3. Each question must have exactly five options A..E.
4. Each question's correct_count must match the length of correct_options in the answer_key for that id.
5. answer_key must contain one entry for each question id and each explanations must include keys A..E with at least 2 full sentences per explanation.
6. difficulty values must be one of ["easy","medium","hard"] and distribution across questions should approximately follow DIFFICULTY_DISTRIBUTION.
7. Do not include extraneous top-level keys; return only the JSON object described.
8. If any rule cannot be satisfied, return a JSON object with an error field explaining which acceptance rule failed.
`;

  // const response = await client.responses.create({
  //   model: 'gpt-5-nano',
  //   input: prompt,
  //   //temperature: 0.2,
  //   //max_output_tokens: 5000,
  // });

  const response = `{
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
      "difficulty": "easy",
      "estimated_time_sec": 90
    },
    {
      "id": 2,
      "question": "Which two components are used to enforce an editorial workflow in Commerce Cloud to ensure catalog and content changes go through review before publishing?",
      "correct_count": 2,
      "options": {
        "A": "Backoffice workflows to route tasks for approval",
        "B": "SmartEdit to publish content directly without approval",
        "C": "PIM to manage product attributes",
        "D": "Promotions to enforce price changes automatically",
        "E": "In Backoffice, configure a workflow with steps for reviewer and approver"
      },
      "topic_subarea": "workflows",
      "difficulty": "medium",
      "estimated_time_sec": 90
    },
    {
      "id": 3,
      "question": "To avoid duplicating media assets across catalogs and ensure a single source of truth for product images, which SAP Commerce Cloud feature best supports centralized media management?",
      "correct_count": 1,
      "options": {
        "A": "Media Library with global media items",
        "B": "Local media items per catalog",
        "C": "Duplicate asset creation for each catalog",
        "D": "CDN optimization only",
        "E": "PIM manages only product data"
      },
      "topic_subarea": "media_management",
      "difficulty": "hard",
      "estimated_time_sec": 90
    },
    {
      "id": 4,
      "question": "You're tasked with updating the base price of a product for multiple currencies in the Backoffice. Which approach is supported in SAP Commerce Cloud?",
      "correct_count": 1,
      "options": {
        "A": "Use price rows in the Price / Base Price section and specify currency",
        "B": "Change the price in Promotions",
        "C": "Use PIM to adjust asset prices",
        "D": "Adjust at checkout",
        "E": "Use SmartEdit to override price for pages"
      },
      "topic_subarea": "pricing_management",
      "difficulty": "medium",
      "estimated_time_sec": 90
    },
    {
      "id": 5,
      "question": "What is the primary purpose of Experience Fragments in SAP Commerce Cloud, and how do they relate to SmartEdit?",
      "correct_count": 1,
      "options": {
        "A": "They store reusable layout and content fragments that can be reused across pages and channels, and can be edited via SmartEdit; they can be included in pages via slots.",
        "B": "They manage supply chain workflows",
        "C": "They handle vendor data",
        "D": "They compute analytics",
        "E": "They manage catalog synchronization"
      },
      "topic_subarea": "experience_management",
      "difficulty": "hard",
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
    },
    {
      "id": 2,
      "correct_options": ["E","A"],
      "explanations": {
        "A": "Backoffice workflows allow routing of tasks for approval, assignment, and tracking, which is essential for enforcing editorial governance before publishing.",
        "B": "SmartEdit can be configured to publish content, but it does not inherently enforce a review workflow unless integrated with specific workflow steps; as phrased, it bypasses the review process.",
        "C": "PIM focuses on product data quality and attributes, not on editorial approval workflows for content or catalogs.",
        "D": "Promotions manage pricing, not editorial content workflow; they do not provide the approval routing required for content changes.",
        "E": "Configuring a dedicated workflow in Backoffice with explicit reviewer and approver steps enforces the editorial process and ensures content changes are validated before publishing."
      }
    },
    {
      "id": 3,
      "correct_options": ["A"],
      "explanations": {
        "A": "Media Library supports global media items, enabling a single asset to be reused across catalogs and channels, which minimizes duplication and maintains a single source of truth.",
        "B": "Local media items per catalog lead to duplication and a lack of centralized control over media assets.",
        "C": "Duplicating assets for each catalog defeats the purpose of centralized media management and increases maintenance effort.",
        "D": "CDN optimization improves delivery performance but does not address centralized asset management or single-source asset governance.",
        "E": "PIM handles product data and attributes; while it can reference media, the centralized, reusable media management is primarily handled via the Media Library."
      }
    },
    {
      "id": 4,
      "correct_options": ["A"],
      "explanations": {
        "A": "Price rows per currency in the pricing area allow defining base prices and currency-specific adjustments, which is the supported method for multi-currency pricing data in Backoffice.",
        "B": "Promotions are for discount logic, not for setting base prices across currencies.",
        "C": "PIM is for product information management, not currency price configuration.",
        "D": "Checkout-level adjustments do not reflect consistent multi-currency pricing in the product catalog.",
        "E": "SmartEdit focuses on page content editing and does not manage currency-based pricing configuration."
      }
    },
    {
      "id": 5,
      "correct_options": ["A"],
      "explanations": {
        "A": "Experience Fragments store reusable content and layout components that can be dropped into pages and reused across channels; SmartEdit can edit these fragments, enabling consistent cross-channel experiences.",
        "B": "Experience Fragments are not primarily about supply chain workflows.",
        "C": "They do not handle vendor data.",
        "D": "They do not perform analytics computations.",
        "E": "They are not used for catalog synchronization; their main role is content/layout reuse for multi-channel experiences."
      }
    }
  ]
}`;

  return NextResponse.json(JSON.parse(response));
}
