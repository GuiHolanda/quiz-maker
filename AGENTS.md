# CertifiqueAI — Agent Context

## Purpose

**CertifiqueAI** (`www.certifiqueai.com`) is a **certification and concursos públicos prep platform** being built for public launch. It generates AI-powered practice questions for IT certifications (AWS, Azure, SAP), healthcare boards, finance exams, law, and engineering, as well as Brazilian concursos públicos.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + React 18 |
| Language | TypeScript 5 (strict mode) |
| UI | [HeroUI](https://heroui.com/docs/react/components) + Tailwind CSS 4 |
| Icons | FontAwesome (`@fortawesome/react-fontawesome`) |
| Animations | Framer Motion |
| State | React Context + useReducer (no Redux/Zustand) |
| Database | Prisma 6 + SQLite (dev) / LibSQL (prod) |
| HTTP Client | Axios (via `@/lib/bff.api`) |
| AI | OpenAI SDK |

---

## Project Structure

```
app/
  api/               # Route handlers — one folder per endpoint
  admin/             # Admin dashboard (separate layout, plan=admin guard)
  (auth)/            # Public auth pages
  (workspace)/       # Authenticated workspace pages
  (marketing)/       # Public marketing pages
shared/
  components/ui/     # Generic UI primitives
  types/index.ts     # ALL shared TypeScript types
  lib/notify.ts      # Toast helper (notify.success/error/warning/info)
config/
  constants/index.ts        # URLs, PLAN_LIMITS, localStorage keys
  constants/inputStyles.ts  # inputProperties spread (HeroUI inputs)
  constants/buttonStyles.ts # buttonStyles.* constants (HeroUI buttons)
  prompts/                  # LLM prompt files (PromptDefinition pattern)
features/
  connectors.ts      # ALL HTTP calls — single file, no exceptions
  hooks/             # *.hook.ts
  providers/         # *.provider.tsx
  reducers/          # *.reducer.ts
  services/          # Server-side services (*.service.ts)
lib/
  prisma.ts          # Prisma client singleton
  bff.api.ts         # Axios client (baseURL: "/api") — client-side ONLY
  api-error.ts       # toApiErrorResponse(err)
prisma/
  dev/               # SQLite dev schema + migrations
  prod/              # LibSQL prod schema + migrations
tests/
  unit/              # Vitest — service unit tests
  e2e/               # Playwright — full journey tests
```

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `QuestionCard.tsx` |
| Custom hooks | camelCase `.hook.ts` | `useRequest.hook.ts` |
| Providers | camelCase `.provider.tsx` | `exams.provider.tsx` |
| Reducers | camelCase `.reducer.ts` | `exams.reducer.ts` |
| Services | PascalCase `.service.ts` | `exam.service.ts` |
| API routes | kebab-case folder + `route.ts` | `save-exam/route.ts` |
| Pages | kebab-case folder + `page.tsx` | `configure-exam/page.tsx` |
| Branches | `feature/<kebab-case>` | `feature/exam-catalog` |

---

## Code Patterns

### Components
- **Named exports only** — no `export default` on components
- Props with `readonly` modifiers: `interface XyzProps { readonly foo: string }`
- `'use client'` at the top of interactive components
- No barrel `index.ts` in component directories
- No JSDoc or multi-line comments
- UI exclusively with **HeroUI** — check docs before building custom

### State Management
- Context + Reducer — never Redux/Zustand
- One provider per domain: `ExamsProvider`, `MockExamsProvider`
- **Prefer `useContext`** over `useState` for domain data — consume `useExamsContext()`, `useUsageContext()`, `useMockExamsContext()` before reaching for local state
- `useState` only for truly local, ephemeral UI (hover, transient flags)
- All HTTP calls through `features/connectors.ts`

### Toasts
- Always `notify` from `shared/lib/notify.ts` — never `addToast` directly
- `notify.success(t('key'), t('description'))` / `notify.error(...)` etc.

### API Routes
- Each route in its own folder under `app/api/`
- Business logic in `features/services/*.service.ts` or co-located `.service.ts`
- Route handler pattern: `auth check → service call → NextResponse.json()`
- **Every catch block**: `toApiErrorResponse(err)` from `lib/api-error.ts` — never raw `err.message`

### Imports
- Absolute `@/` alias — never `../..` cross-directory

---

## Critical Constraints

1. **Do not modify the Prisma schema** without explicit approval — changes require migrations
2. **Do not introduce state management libraries** — Context + Reducer is intentional
3. **Ask before implementing** when multiple valid approaches exist
4. **Prefer editing existing files** over creating new ones
5. **No speculative features** — implement only what is asked

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

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

Single line, ≤72 chars, no body.
