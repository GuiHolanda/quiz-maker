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
app/                          # Next.js App Router (pages + API routes)
  api/                        # Route handlers — one folder per endpoint
    certifications/route.ts
    get-anwers/route.ts
    question-generator/       # route.ts + question.service.ts
    quiz-generator/           # route.ts + quiz-generator.service.ts
    save-certification/       # route.ts + certification.service.ts
    save-questions/route.ts
  configure-certification/
    page.tsx
    components/               # Components used exclusively by this page
      CertificationHeader.tsx
      CertificationsListTab.tsx
      EditCertificationTab.tsx
      NewCertificationTab.tsx
      TopicForm.tsx
  generate-questions/
    page.tsx
    components/
      GeneratedQuestionsCard.tsx
      GeneratedQuestionsList.tsx
      QuestionGeneratorForm.tsx
  quiz/
    page.tsx
    components/
      AnswredQuestionCard.tsx
      QuestionCard.tsx
      QuestionList.tsx
      QuizForm.tsx
sharedComponents/             # Components reused across multiple pages
  CertificationManager.tsx
  SectionsTable.tsx
  icons.tsx
  primitives.ts
  ui/                         # Generic UI primitives
    BusyDialog.tsx
    ItemsPerPageSelect.tsx
    PaginationControls.tsx
    navbar.tsx
    theme-switch.tsx
config/
  constants/index.ts          # App-wide constants, API URLs, localStorage keys
  promptSchemas/              # LLM prompt templates (JSON schemas)
  site.ts                     # Site metadata and nav config
features/
  connectors.ts               # All HTTP client calls (single file)
  hooks/                      # Custom React hooks (*.hook.ts)
  providers/                  # Context providers (*.provider.tsx)
  reducers/                   # State reducers (*.reducer.ts)
  services/                   # Client-side services (e.g. openAI.service.ts)
lib/
  prisma.ts                   # Prisma client singleton
  bff.api.ts                  # Axios instance (baseURL: "/api")
prisma/
  dev/                        # SQLite dev schema + migrations + scripts
  prod/                       # LibSQL prod schema + migrations
types/index.ts                # All shared TypeScript types (AIQuestion, StoredQuestion, Certification, CertificationTopic, QuizParams, etc.)
```

### Component co-location rule

Page-specific components live in `app/<page>/components/`. Components used by more than one page live in `sharedComponents/`. Never put page-specific components in `sharedComponents/`.

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

## Internacionalização (i18n)

### Arquitetura

i18n implementado sem dependências externas: arquivos `.properties` + Context + Reducer custom.

| Arquivo | Papel |
|---|---|
| `public/messages/en.properties` | Strings em inglês |
| `public/messages/pt.properties` | Strings em português (unicode escapes `\uXXXX`) |
| `lib/properties-parser.ts` | Parser `.properties` → `Record<string, string>` (decodifica `\uXXXX`) |
| `features/reducers/language.reducer.ts` | Reducer: `language`, `messages`, actions `setLanguage` / `setMessages` |
| `features/providers/language.provider.tsx` | Provider central — lê localStorage no mount, faz fetch do `.properties`, expõe `LanguageContext` |
| `features/hooks/useTranslation.hook.ts` | Hook `useTranslation()` → `{ t, language, setLanguage }` |
| `sharedComponents/ui/language-switch.tsx` | Toggle 🇧🇷 PT / 🇺🇸 EN no navbar |

### Como usar em componentes

```tsx
'use client';
import { useTranslation } from '@/features/hooks/useTranslation.hook';

const { t } = useTranslation();
// chave simples
t('common.save')
// com interpolação de variáveis
t('quiz.progress', { answered: 5, total: 20 })  // → "5 of 20"
```

### Convenções de chaves

Namespaces por domínio: `common.*`, `homepage.*`, `login.*`, `certification.*`, `generate.*`, `quiz.*`, `error.*`, `toast.*`, `busy.*`, `aria.*`, `nav.*`

Para plural, use chaves separadas:
```properties
generate.correctAnswer={count} correct answer
generate.correctAnswers={count} correct answers
```
```tsx
t(count === 1 ? 'generate.correctAnswer' : 'generate.correctAnswers', { count })
```

### Adicionar nova string

1. Adicionar a chave em `public/messages/en.properties`
2. Adicionar a chave em `public/messages/pt.properties` (caracteres especiais como unicode escapes: `ã` → `\u00E3`)
3. Usar `t('chave')` no componente

### Formato `.properties`

```properties
# comentário
chave.simples=Valor aqui
chave.com.variavel=Olá {nome}, você tem {count} mensagens
```

### Observações

- `public/messages/` é seguro e intencional — strings de UI não são dados sensíveis e precisam de acesso público para o `fetch` do cliente
- O `middleware.ts` exclui `/messages/*.properties` do guard de autenticação
- O idioma padrão é `pt`; preferência persiste em `localStorage` via `LANGUAGE_LOCAL_STORAGE_KEY`
- Componentes que usam `useTranslation` precisam obrigatoriamente de `'use client'`

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
npm run db:seed:dev           # Seed dev database with sample certifications + questions
npm run db:clear:dev          # Wipe dev database
```

---

## Git Workflow

### Branch creation

Before starting any non-trivial task (new feature, refactor, bug fix), ask the user whether to create a new branch. If yes, create it following the naming convention `feature/<kebab-case>` (or `fix/<kebab-case>` for bug fixes) and switch to it before writing any code.

```bash
git checkout -b feature/<kebab-case-description>
```

Do **not** commit directly to `main` or the current branch unless the user explicitly says so.

### Commits

Group related changes into logical, cohesive commits — never one giant commit for an entire task and never micro-commits per file. A good grouping might be:

- Foundation / configuration changes
- Shared/reusable components
- Page-specific components
- Documentation

Each commit message follows the convention below. Keep the diff reviewable: if a commit touches more than ~10 files, look for a natural split.

---

## Commit Convention

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`

Examples from this repo:
- `feat: sync certifications state with database as source of truth`
- `refactor: Use queueMicrotask for setting errors in QuestionGeneratorForm`
