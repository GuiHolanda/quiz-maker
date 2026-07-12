# MyQuiz

> AI-powered certification exam prep platform. Generate practice questions, manage certifications and topics, and run configurable quizzes — all backed by a persistent question bank.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Language | TypeScript 5 (strict mode) |
| UI | [HeroUI](https://heroui.com/docs/react/components) + Tailwind CSS 4 |
| Icons | FontAwesome |
| Animations | Framer Motion |
| State | React Context + useReducer |
| Database | Prisma 6 — SQLite (dev) / LibSQL / Turso (prod) |
| AI | OpenAI SDK (GPT) |
| Dev | Turbopack, ESLint, Prettier |

---

## Project Structure

```
app/
  api/                        # API route handlers (one folder per endpoint)
  configure-certification/
    page.tsx
    components/               # Components scoped to this page
  generate-questions/
    page.tsx
    components/
  quiz/
    page.tsx
    components/
sharedComponents/             # Components reused across pages
  ui/                         # Generic UI primitives
config/
  constants/                  # App-wide constants, API URLs, localStorage keys
  promptSchemas/              # JSON schemas for LLM output validation
features/
  connectors.ts               # All HTTP calls (single file)
  hooks/                      # Custom React hooks (*.hook.ts)
  providers/                  # Context providers (*.provider.tsx)
  reducers/                   # State reducers (*.reducer.ts)
  services/                   # Client-side services
prisma/
  dev/                        # SQLite schema + migrations + scripts
  prod/                       # LibSQL schema + migrations
types/index.ts                # All shared TypeScript types
```

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- Git

### 2. Clone & install

```bash
git clone git@github.com:GuiHolanda/quiz-maker.git
cd quiz-maker
npm install
```

### 3. Environment variables

Create a `.env` file in the project root:

```env
OPENAI_API_KEY=sk-...
PROMPT_ID=<your-openai-prompt-id>
PROMPT_VERSION=<your-openai-prompt-version>
DATABASE_URL="file:./prisma/dev.db"
```

> Never commit `.env` to source control.

### 4. Database setup

Run migrations and generate the Prisma client:

```bash
npm run prisma:migrate:dev
npm run prisma:generate:dev
```

Optionally seed the database with a sample SAP certification and ~60 questions:

```bash
npm run db:seed:dev
```

### 5. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint with auto-fix |
| `npm run prisma:migrate:dev` | Apply dev migrations |
| `npm run prisma:generate:dev` | Regenerate Prisma client (dev) |
| `npm run prisma:migrate:prod` | Apply prod migrations |
| `npm run prisma:generate:prod` | Regenerate Prisma client (prod) |
| `npm run db:seed:dev` | Seed dev database with sample data |
| `npm run db:clear:dev` | Wipe all dev database records |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run e2e` | Run E2E tests (Playwright) |
| `npm run e2e:ui` | Open Playwright UI — interactive test runner |
| `npm run e2e:debug` | Run E2E tests with Playwright Inspector |

---

## Testing

### Unit Tests (Vitest)

Tests live in `tests/api/services/`. Each service has its own test file. Prisma is deep-mocked via `vitest-mock-extended`.

```bash
npm test                 # run all tests (CI-safe)
npm run test:watch       # watch mode
npm run test:coverage    # with coverage report
```

### E2E Tests (Playwright)

Two spec files covering the full user journeys end-to-end against a real `next dev` server:

| Spec | Journey |
|---|---|
| `e2e/tests/certification-flow.spec.ts` | Configure cert → generate questions → create simulado → answer → result → cancel |
| `e2e/tests/public-exam-flow.spec.ts` | Configure concurso → generate questions → create simulado → answer → result → cancel |

**Setup — one-time:**

1. Create `.env.test` at the project root:

```env
E2E_USER_EMAIL=e2e-test@certifiqueai.test
E2E_USER_PASSWORD=E2ePassword123!
```

2. Install Playwright browsers:

```bash
npx playwright install chromium
```

**Run:**

```bash
# Headless (CI-style)
DATABASE_URL="file:/Users/<you>/path/to/myquiz/prisma/dev.db" npm run e2e

# Interactive UI — watch each step execute
DATABASE_URL="file:/Users/<you>/path/to/myquiz/prisma/dev.db" npm run e2e:ui

# Headed browser (visible window)
DATABASE_URL="file:/Users/<you>/path/to/myquiz/prisma/dev.db" npx playwright test --headed

# Single spec
DATABASE_URL="file:/Users/<you>/path/to/myquiz/prisma/dev.db" npx playwright test certification-flow
```

**View last run report:**

```bash
npx playwright show-report
```

**How it works:**

- `globalSetup` creates/resets a `tester`-plan user in the dev DB, performs a real UI login, and saves the session cookie to `e2e/auth/storageState.json` — all subsequent tests start pre-authenticated.
- OpenAI API routes (`question-generator`, `answers`) are intercepted by `page.route()` and return static fixtures — no API key consumed during tests.
- `globalTeardown` deletes all data created by the E2E user after the suite completes.

**CI:** The workflow at `.github/workflows/e2e.yml` runs on every push to `main`. Required GitHub Actions secrets: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXTAUTH_SECRET`.

---

## OpenAI Prompt Setup

The question generator uses a stored prompt in the OpenAI dashboard.

1. Go to [platform.openai.com](https://platform.openai.com/) and create a new prompt in the **Prompts** editor.
2. The prompt template uses three variables: `{{certification_name}}`, `{{topic_name}}`, `{{num_questions}}`.
3. After saving, copy the `prompt id` and `version` into your `.env`:

```env
PROMPT_ID=pmpt_...
PROMPT_VERSION=7
```

The JSON output schema for the prompt is kept at `config/promptSchemas/questionSchema.json`.

---

## Architecture

### State Management

| Concern | Where |
|---|---|
| Certifications list + selected cert | `CertificationsProvider` (Context + Reducer) |
| Quiz state (questions, answers) | `QuizProvider` (Context + Reducer) |
| UI-only state (active tab, etc.) | `localStorage` |
| Domain data | Database (source of truth) via API |

All HTTP calls go through `features/connectors.ts`. The Axios instance lives at `@/lib/bff.api`.

### API Routes

Each route lives under `app/api/<route-name>/`. Business logic is co-located in a `.service.ts` file. The route handler only validates input, calls the service, and returns `NextResponse.json()`.

### Component Co-location

- Components used by a single page → `app/<page>/components/`
- Components shared across pages → `sharedComponents/`

---

## Database

Two environments, two schemas:

| Env | Schema | DB |
|---|---|---|
| Dev | `prisma/dev/schema.prisma` | SQLite (`prisma/dev.db`) |
| Prod | `prisma/prod/schema.prisma` | LibSQL (Turso) |

Key dev models: `Certification`, `CertificationTopic`, `Question`, `Option`, `Answer`, `Explanation`.

---

## Best Practices

- Never commit secrets — use environment variables on your deployment platform (Vercel, Render, etc.).
- Commit Prisma migration files; do **not** commit `prisma/dev.db`.
- Rotate OpenAI keys immediately if exposed.

---

## Useful One-Liners

```bash
# Type-check without emitting
npx tsc --noEmit

# Backup dev database
cp prisma/dev.db prisma/dev.db.$(date +%Y%m%d_%H%M%S).bak

# Open Prisma Studio
npx prisma studio --schema=prisma/dev/schema.prisma
```
