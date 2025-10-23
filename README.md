# Quiz Maker — Next.js + OpenAI

This repository contains a Quiz Maker application: a Next.js 14 + TypeScript app that uses the OpenAI API to generate examination-style questions per certification and topic, persists data with Prisma (SQLite in development), and provides a UI to manage certifications and quizzes.

Key features
- Generate question banks per certification and topic using OpenAI.
- Persist quiz data with Prisma (SQLite by default in development).
- Manage certifications from the UI; state is held by React Context + reducers.

Technologies
- Next.js 14 (app router)
- TypeScript
- Tailwind CSS + HeroUI
- Prisma (SQLite for development)
- OpenAI (GPT) for question generation

Quick start (development)
1. Prerequisites
   - Node.js 18+ (recommended)
   - Git
   - (optional) pnpm or yarn

2. Clone

```bash
git clone git@github.com:GuiHolanda/quiz-maker.git
cd quiz-maker
```

3. Install dependencies

```bash
npm install
# or: pnpm install
```

4. Environment variables

- Create a `.env` file in the project root. Minimum variables required:

```env
OPENAI_API_KEY=sk-...
DATABASE_URL="file:.dev.db"
# (optional) other variables for your environment
```

- Replace `sk-...` with your OpenAI API key. Never commit `.env` to source control.

Obtaining an OpenAI API key (do this before running the app)
- Create an account at OpenAI: https://platform.openai.com/
- Visit the API keys page to create a key: https://platform.openai.com/account/api-keys
- Click "Create new secret key" and copy the key into your local `.env` as `OPENAI_API_KEY`.
- If a key is ever exposed, revoke it immediately from the same page and create a replacement.

Saving the reusable prompt in the OpenAI dashboard
---------------------------------------------------------

After you add your `OPENAI_API_KEY` locally you also need to store the reusable prompt in the OpenAI Chat "Prompt" editor so your server can call a stable template by id/version.

1) Open https://platform.openai.com/chat/edit and create a new prompt.
2) In the prompt editor paste the full prompt below and save it (give it a clear name). When saved the dashboard shows a `prompt id` and a `version` you can reference from code.

Prompt to save (copy the block below and paste it into the OpenAI prompt editor):

```text
# Role and Objective
Act as an expert SAP certification exam question writer to generate unique, high-quality exam questions for a specified certification, focusing on a provided topic or subtopic, following SAP certification standards.

# Pre-task Checklist
Begin with a concise checklist (3-7 bullets) of what you will do; keep items conceptual, not implementation-level.

# Instructions
- For the certification {{certification_name}}, generate exactly {{num_questions}} unique, high-quality exam questions about the topic or sub-topic {{topic_name}}.
- Each question must:
  - Be technically accurate, unambiguous, and clearly worded.
  - Address only scenarios, applications, concepts, or implications directly relevant to {{certification_name}} and specifically {{topic_name}}.
  - Vary question types (recall, scenario-based, troubleshooting, interpretation) and cognitive levels as SAP exams require.
  - Prefer scenario-based questions, and vary the length of the question text.
  - Have exactly 5 options (labeled A-E); do not include 'All of the above' or 'None of the above'.
  - Explicitly state the number of correct options (1-3), ensuring at least two plausible distractors.
  - Specify correct options using an array.
  - For each option, provide a detailed explanation (~40+ characters/2+ sentences) stating why it is correct or incorrect.
  - Avoid ambiguous or trivial language in questions and options.
  - Guarantee {{num_questions}} unique questions, using step-by-step reasoning prior to producing answers.

# Reasoning and Output Order
- Conduct internal chain-of-thought reasoning for question type, options, and correctness before presenting the final questions and answers. Do not expose reasoning unless explicitly requested.
- Each output object must match the format specified.

# Output Validation
After generating all questions, briefly validate that each meets the uniqueness and quality standards and that the output array is complete. If not, self-correct or return the diagnostic message as specified.

# Examples
---example1 start---
Input: { "NUM_QUESTIONS": 1, "TOPIC": "SmartEdit" }
Output:
[
  {
    "id": 1,
    "text": "In SmartEdit, which configuration allows editors to personalize storefront components during runtime?",
    "correctCount": 1,
    "certificationTitle": "SAP Commerce Cloud",
    "topic": "SmartEdit",
    "difficulty": "easy",
    "options": {
      "A": "Component Variants",
      "B": "Backoffice Widgets",
      "C": "PIM Exports",
      "D": "Workflow Steps",
      "E": "Promotion Rules"
    },
    "answer": {
      "correctOptions": ["A"],
      "explanations": {
        "A": "Component Variants define alternative component versions and enable runtime personalization in SmartEdit.",
        "B": "Backoffice Widgets provide admin UI functionality, not runtime storefront personalization.",
        "C": "PIM Exports move product data; they do not manage live component personalization.",
        "D": "Workflow Steps coordinate approval processes, unrelated to dynamic personalization logic.",
        "E": "Promotion Rules govern pricing strategies, not direct component rendering variants."
      }
    }
  }
]
---example1 end---

---example2 start---
Input: { "NUM_QUESTIONS": 1, "TOPIC": "Checkout" }
Output:
[
  {
    "id": 1,
    "text": "During checkout, which three features collectively improve validation, payment handling, and order confirmation flow?",
    "correctCount": 3,
    "certificationTitle": "SAP Commerce Cloud",
    "topic": "Checkout",
    "difficulty": "hard",
    "options": {
      "A": "Catalog Sync",
      "B": "Payment Provider Integration",
      "C": "Checkout Validation Hooks",
      "D": "UI Personalization",
      "E": "Order Confirmation Service"
    },
    "answer": {
      "correctOptions": ["B", "C", "E"],
      "explanations": {
        "A": "Catalog Sync keeps product data consistent but does not directly handle checkout validation or payments.",
        "B": "Payment Provider Integration handles transaction processing and is essential for payment handling during checkout.",
        "C": "Checkout Validation Hooks provide server-side validation for input and business rules during the checkout flow.",
        "D": "UI Personalization can improve user experience but does not guarantee payment handling or order confirmation logic.",
        "E": "Order Confirmation Service is responsible for finalizing orders and notifying downstream systems after successful checkout."
      }
    }
  }
]
---example2 end---
When multiple questions are required, use sequential IDs and ensure all questions and answer content are unique.

# Edge Cases and Additional Considerations
- Never repeat identical or near-duplicate questions (including rephrases).
- Do not use code blocks or markdown; output must be plain JSON per the schema.
- Always output a complete array of questions; do not return incomplete sets.
- Use defaults as needed: 'medium' difficulty, input {{certification_name}} for 'certificationTitle', etc.
- If the requested number of unique, high-quality questions cannot be produced, output [] and provide a plain string diagnostic message (e.g., "Unable to generate the requested number of unique, high-quality questions for this topic.").
- Answer options' order may be randomized or grouped logically, as long as it is clear and consistent.

# Input Structure
The input JSON object must have the fields:
- "certification_name": string (SAP certification title)
- "topic_name": string (a topic or sub-topic)
- "num_questions": integer (number of questions to generate)

# Output Structure
Always output a JSON array (not in code/markdown), each item structured as follows:
{
  "id": integer (sequential, 1+),
  "text": string (question statement),
  "correctCount": integer (1-3),
  "certificationTitle": string (from input or inferred),
  "topic": string (use topic_name),
  "difficulty": string ("easy"|"medium"|"hard", default 'medium'),
  "options": { "A": string, "B": string, "C": string, "D": string, "E": string },
  "answer": {
    "correctOptions": [option keys e.g., "A", "C"],
    "explanations": { "A": string, ..., "E": string }
  }
}
If producing the full set is not feasible, output [] and a plain string explanation as above.
```

When saving the prompt make sure the variable names used in the prompt (`{{certification_name}}`, `{{topic_name}}`, `{{num_questions}}`) match the variable names you plan to pass from your server.

Store prompt id/version in your `.env`
------------------------------------

After saving the prompt in the OpenAI dashboard copy the `prompt id` and `version` values into your project's `.env` so deployments and local runs use the same template. Example entries in `.env`:

```env
PROMPT_ID=pmpt_68fa81f052d88194b295ebf06a4f92540c251c826627e65d
PROMPT_VERSION=7
```

Notes and troubleshooting
- If you get "Unknown prompt variables" errors, open the saved prompt in the dashboard and make sure the variable names declared in the prompt match exactly the keys you send under `prompt.variables`.
- If the Responses API complains about the schema shape (top-level object vs array, required keys, additionalProperties), adjust the JSON Schema in `config/promptSchemas/questionSchema.json` so it meets the API rules (or wrap the schema at call time). We already keep that schema in the repo for convenience.

4.5 Generate local database (create dev.db)
- If you already have committed Prisma migrations (recommended), run:

```bash
npx prisma migrate dev
```

This will create/apply migrations, populate `prisma/dev.db`, and regenerate the Prisma Client.

5. Run the app

```bash
npm run dev
# open http://localhost:3000
```

Prisma — migrations and database management
- Backup (SQLite file):

```bash
mkdir -p prisma/backups
cp prisma/dev.db prisma/backups/dev.db.$(date +%Y%m%d_%H%M%S).db
```

- Generate and apply a migration (development):

```bash
npx prisma migrate dev --name add-some-field
# regenerates Prisma Client automatically
```

- Push schema without creating migrations (fast, use in dev only):

```bash
npx prisma db push
npx prisma generate
```

- Reset (destructive):

```bash
npx prisma migrate reset --force --skip-seed
```

- Apply migrations in production / CI:

```bash
npx prisma migrate deploy
npx prisma generate
```

- Open Prisma Studio to inspect data:

```bash
npx prisma studio
```

Notes on migrations
- `migrate dev` creates a migration and applies it (recommended in development).
- `db push` syncs schema to the database without creating migration files (useful for experiments in dev).
- In production, prefer creating migration files and applying them with `migrate deploy`.

Architecture overview
- Providers and state:
  - `features/providers/CertificationsProvider` — manages `certifications` and `selectedCertification` using a reducer and local persistence.
  - `features/providers/QuizProvider` — manages quiz state (questions, answers, finished state) and local persistence.

- Hooks:
  - `features/hooks/useCertificationsContext.hook.ts` — consumable hook for certifications.
  - `features/hooks/useQuizContext.hook.ts` — consumable hook for quiz state.

- OpenAI integration:
  - Server route(s) under `app/api` call OpenAI to generate questions. Prompt construction and validation live in `features/` and `config/` (including JSON Schema validations in `config/promptSchemas`).

Where to edit the certifications list
- Default certifications are seeded or kept in `config/constants/index.ts`.
- You can add, edit or remove certifications from the UI; they persist in local storage via the certifications provider.

Best practices
- Never commit secrets. Use environment variables in your deployment platform (Vercel, Render, etc.).
- Rotate OpenAI keys when they are exposed.
- Commit Prisma migration files (prisma/migrations) but do not commit the generated database (`prisma/dev.db`).

Helpful commands
- Type-check the project:

```bash
npx tsc --noEmit
```
