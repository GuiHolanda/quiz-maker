# MyQuiz — Project Context

## Purpose

MyQuiz is a **certification exam prep platform** being built as a product for public launch. It generates AI-powered practice questions for IT certifications (SAP, AWS, etc.), allows users to create and manage custom certifications with topics, and provides configurable quiz generation with answer tracking and explanations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Language | TypeScript 5 (strict mode) |
| UI | [HeroUI](https://heroui.com/docs/react/components) component library + Tailwind CSS 4 |
| Icons | FontAwesome (`@fortawesome/react-fontawesome`) |
| Animations | Framer Motion |
| State | React Context + useReducer (no Redux/Zustand) |
| Database | Prisma 6 + SQLite (dev) / LibSQL (prod) |
| HTTP Client | Axios (via `@/lib/bff.api`) |
| AI | OpenAI SDK |
| Dev | Turbopack, ESLint, Prettier |

---

## Project Structure

```
app/                   # Next.js App Router (pages + API routes)
  api/                 # Route handlers — one folder per endpoint
  (pages)/page.tsx     # Page components
components/            # React components grouped by domain
  quiz/                # Quiz flow components
  certification-management/  # Certification CRUD components
  ui/                  # Generic UI utilities
config/
  constants/index.ts   # App-wide constants, API URLs, initial certifications state (10 SAP certs pre-loaded), localStorage keys
  promptSchemas/       # LLM prompt templates
  site.ts              # Site metadata and nav config
features/
  connectors.ts        # All HTTP client calls (single file)
  hooks/               # Custom React hooks (*.hook.ts)
  providers/           # Context providers (*.provider.tsx)
  reducers/            # State reducers (*.reducer.ts)
lib/
  prisma.ts            # Prisma client singleton
  bff.api.ts           # Axios instance (baseURL: "/api")
prisma/
  dev/                 # SQLite dev schema + migrations
  prod/                # LibSQL prod schema + migrations
types/index.ts         # All shared TypeScript types (AIQuestion, StoredQuestion, Certification, CertificationTopic, QuizParams, etc.)
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `QuestionCard.tsx` |
| Custom hooks | camelCase `.hook.ts` | `useRequest.hook.ts` |
| Providers | camelCase `.provider.tsx` | `certifications.provider.tsx` |
| Reducers | camelCase `.reducer.ts` | `certifications.reducer.ts` |
| Services | PascalCase `.service.ts` | `certification.service.ts` |
| API routes | kebab-case folder + `route.ts` | `save-certification/route.ts` |
| Pages | kebab-case folder + `page.tsx` | `configure-certification/page.tsx` |
| Branches | `feature/<kebab-case>` | `feature/separate-questions` |

---

## Code Patterns

### Components
- **Named exports only** — no default exports on components
- Props interfaces with `readonly` modifiers: `interface XyzProps { readonly foo: string }`
- `'use client'` at the top of interactive components
- No barrel `index.ts` files in component directories
- No JSDoc or multi-line comment blocks
- UI built exclusively with **[HeroUI](https://heroui.com/docs/react/components)** — always look up available components there before building custom ones

### State Management
- Context + Reducer pattern everywhere
- One provider per domain: `CertificationsProvider`, `QuizProvider`
- Providers are composed in `app/layout.tsx`
- UI-only state (selected item, active tab) → localStorage
- Domain data (certifications list, questions) → database (source of truth)
- All HTTP calls go through `features/connectors.ts`

### API Routes
- Each route lives in its own folder under `app/api/`
- Business logic in a co-located `.service.ts` file, not in the route handler
- Route handlers: validate → call service → return `NextResponse.json()`
- Error responses: `{ error, message }` with appropriate HTTP status
- Validation errors throw with a `.status` property: `Object.assign(new Error(...), { status: 409 })`

### Imports
- All absolute imports use `@/` alias (maps to project root)
- Never use relative `../..` for cross-directory imports

---

## Important Constraints

- **Do not modify the Prisma schema** (`prisma/dev/schema.prisma` or `prisma/prod/schema.prisma`) without explicit approval. Schema changes require migrations.
- **Do not add tests** — no test infrastructure is configured and it is not a current priority.
- **Do not introduce new state management libraries** (Redux, Zustand, Jotai). The Context + Reducer pattern is intentional.
- **Ask before implementing** when there are multiple valid approaches. Do not pick a direction silently.
- **Prefer editing existing files** over creating new ones. Do not create abstraction layers or utility files unless the task clearly requires them.
- **No speculative features** — implement only what is asked. No "while I'm here" refactors.

---

## Database

Two environments, two schemas:

| Env | Schema | DB |
|---|---|---|
| Dev | `prisma/dev/schema.prisma` | SQLite (`prisma/dev.db`) |
| Prod | `prisma/prod/schema.prisma` | LibSQL (Turso) |

Useful scripts:
```bash
npm run prisma:migrate:dev    # Run dev migrations
npm run prisma:generate:dev   # Regenerate Prisma client (dev)
npm run db:clear:dev          # Wipe dev database
```

---

## Commit Convention

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`

Examples from this repo:
- `feat: sync certifications state with database as source of truth`
- `refactor: Use queueMicrotask for setting errors in QuestionGeneratorForm`
