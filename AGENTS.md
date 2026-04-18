# MyQuiz — Agent Context

## Purpose

MyQuiz is a **certification exam prep platform** being built for public launch. It generates AI-powered practice questions for IT certifications (SAP, AWS, etc.), allows users to create and manage custom certifications with topics, and provides configurable quiz generation with answer tracking and explanations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Language | TypeScript 5 (strict mode) |
| UI | HeroUI component library + Tailwind CSS 4 |
| Icons | FontAwesome (`@fortawesome/react-fontawesome`) |
| Animations | Framer Motion |
| State | React Context + useReducer (no Redux/Zustand) |
| Database | Prisma 6 + SQLite (dev) / LibSQL (prod) |
| HTTP Client | Axios (via `@/lib/bff.api`) |
| AI | OpenAI SDK |

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
  constants/           # App-wide constants, initial state, API URLs
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
types/index.ts         # All shared TypeScript types
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

### State Management
- Context + Reducer pattern everywhere
- One provider per domain: `CertificationsProvider`, `QuizProvider`
- Providers composed in `app/layout.tsx`
- UI-only state (selected item) → localStorage
- Domain data (certifications, questions) → database (source of truth)
- All HTTP calls go through `features/connectors.ts`

### API Routes
- Each route lives in its own folder under `app/api/`
- Business logic in a co-located `.service.ts` file, not in the route handler
- Route handlers: validate → call service → return `NextResponse.json()`
- Error responses: `{ error, message }` with appropriate HTTP status
- Validation errors: `Object.assign(new Error(...), { status: 409 })`

### Imports
- All absolute imports use `@/` alias (maps to project root)
- Never use relative `../..` for cross-directory imports

---

## Critical Constraints

1. **Do not modify the Prisma schema** without explicit approval — changes require migrations.
2. **Do not add tests** — no test infrastructure, not a current priority.
3. **Do not introduce state management libraries** (Redux, Zustand, etc.) — Context + Reducer is intentional.
4. **Ask before implementing** when multiple valid approaches exist.
5. **Prefer editing existing files** over creating new ones.
6. **No speculative refactors** — implement only what is asked.

---

## Database

| Env | Schema | DB |
|---|---|---|
| Dev | `prisma/dev/schema.prisma` | SQLite (`prisma/dev.db`) |
| Prod | `prisma/prod/schema.prisma` | LibSQL (Turso) |

---

## Commit Convention

```
<type>: <short description>
```

Types used: `feat`, `fix`, `refactor`, `chore`, `docs`
