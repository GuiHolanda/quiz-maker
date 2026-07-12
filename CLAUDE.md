# CertifiqueAI — Project Context

## Purpose

**CertifiqueAI** (`www.certifiqueai.com`) is a **certification and concursos públicos prep platform** being built as a product for public launch. It generates AI-powered practice questions for a broad range of certification areas — including IT (AWS, Azure, SAP, etc.), healthcare (CRM, nursing boards), finance (CPA, CFP, CFA), law (OAB, legal specializations), and engineering (CREA, CONFEA) — as well as Brazilian concursos públicos. Users can create and manage custom certifications with topics, configure quiz generation, and track answers with AI-generated explanations.

The product is not limited to any single industry vertical. When generating questions or building prompts, treat the domain as generic: the LLM should handle IT, health, finance, law, and engineering exams with equal quality.

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
  admin/                      # Admin dashboard (layout + 4 pages)
  (auth)/                     # Public auth pages (login, register, etc.)
  (workspace)/                # Authenticated workspace pages
shared/
  components/                 # Components reused across multiple pages
    ui/                       # Generic UI primitives (sidebar, workspace-header, PageHeader, etc.)
  types/
    index.ts                  # All shared TypeScript types
  styles/
    globals.css
config/
  constants/index.ts          # App-wide constants, API URLs, localStorage keys, PLAN_LIMITS
  constants/inputStyles.ts    # Shared HeroUI input/select props (inputProperties)
  promptSchemas/              # JSON output validation schemas (questionSchema.json, etc.)
  site.ts                     # Site metadata and nav config
features/
  connectors.ts               # All HTTP client calls (single file)
  hooks/                      # Custom React hooks (*.hook.ts)
  providers/                  # Context providers (*.provider.tsx)
  reducers/                   # State reducers (*.reducer.ts)
  services/                   # Server-side services (quota.service.ts, etc.)
lib/
  prisma.ts                   # Prisma client singleton
  bff.api.ts                  # Axios instance (baseURL: "/api") — client-side only
prisma/
  dev/                        # SQLite dev schema + migrations
  prod/                       # LibSQL (Turso) prod schema + migrations
```

### Component co-location rule

Page-specific components live in `app/(workspace)/<domain>/<page>/components/`. Components used by more than one page live in `shared/components/`. Never put page-specific components in `shared/components/`.

### `lib/bff.api.ts` — client-side only

The Axios instance uses `baseURL: '/api'` (relative URL). **Never import it in server components or API routes.** Server components that need data must call services directly (e.g. `new AdminService().getOverview()`) or use `prisma` directly.

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

### Renderer functions

Use **renderer functions** (regular functions declared inside the component, after the `return`) to break large JSX into named, scannable pieces — without creating new files or lifting state.

Rules:
- Declare them **after the main `return`** statement, inside the component function body
- Name them `render<What>` — e.g. `renderHeader()`, `renderActionsCell()`, `renderEditingActions()`
- They capture component scope (state, props, handlers) directly — no need to pass anything unless the data only exists in a loop
- Keep each renderer **single-purpose** — if a renderer needs an `if/else` with very different shapes, split it further
- **When to use:** any time the `return` block grows beyond ~40 lines or contains repeated structural patterns (table cells, conditional UI blocks, button groups)
- **When NOT to use:** trivial one-liners, or when the piece would benefit from its own props interface and lifecycle — extract a proper sub-component instead

```tsx
export function MyComponent({ items }: MyComponentProps) {
  const [editing, setEditing] = useState(false);

  return (
    <div>
      {renderHeader()}
      {items.map((item, i) => renderItemRow(item, i))}
      {renderFooter()}
    </div>
  );

  function renderHeader() { ... }
  function renderItemRow(item: Item, index: number) { ... }
  function renderFooter() { ... }
}
```

### useRequest vs manual try/catch

`useRequest` wraps **a single function HTTP call** — use it for simple mutations (save, update, delete) where there is one API call and an optional `onSuccess` callback.

Do **not** use `useRequest` for multi-step orchestration flows that involve:
- Multiple sequential API calls with dependencies between them
- Intermediate business logic between calls (e.g. score calculation)
- Conditional branching based on intermediate responses
- `router.push()` mid-flow

For those cases, use manual `try/catch` with `addToast` for error feedback:

```ts
async function handleComplexFlow() {
  setIsBusy(true);
  try {
    const result1 = await step1();
    if (needsStep2(result1)) await step2(result1);
    const final = await step3();
    router.push('/next-page');
  } catch (e: unknown) {
    addToast({
      title: t('toast.error'),
      description:
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        t('toast.somethingWrong'),
      color: 'danger',
    });
    setIsBusy(false);
  }
}
```

Note: `setIsBusy(false)` goes in the `catch` only — on success the user navigates away so there is no need to reset it.

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

### HTTP timeouts (request chain)

For long-running endpoints (e.g. question generation), the timeout chain is:

| Layer | Setting | File |
|---|---|---|
| Vercel function | `maxDuration = 300` | route handler |
| axios client | `timeout: 280_000` | `lib/bff.api.ts` |
| OpenAI SDK | `timeout: 280_000`, `maxRetries: 0` | `features/services/openAI.service.ts` |

The axios + OpenAI SDK timeouts are deliberately shorter than `maxDuration` so the request fails fast before the platform kills the function. **When raising one, raise the others** — they're co-dependent. `maxRetries: 0` is intentional: timeouts on the OpenAI Responses API are slow-generation, not transient network failures, so retrying just doubles the wait. Per-call overrides are possible (`api.get(url, { timeout: 30_000 })`) but not currently used.

`useRequest.hook.ts` detects axios timeouts (`error.code === 'ECONNABORTED'`) and surfaces `toast.requestTimeout` instead of the generic error toast.

### Prompt management (LLM)

All LLM prompts live in `config/prompts/` as TypeScript files. There are no prompts stored in the OpenAI dashboard.

**Pattern:** one file per prompt, each exports a typed `PromptDefinition<TInput>` object:

```typescript
// config/prompts/my-feature.prompt.ts
import type { PromptDefinition } from './types';

export interface MyFeatureInput {
  readonly param: string;
}

export const myFeaturePrompt = {
  build: (input: MyFeatureInput): string => `...${input.param}...`,
} satisfies PromptDefinition<MyFeatureInput>;
```

**Calling the LLM:** always use `OpenAIService.call(prompt, input)` — a single method that uses the Responses API with `web_search_preview`. Never call `openAIClient` directly in route handlers.

```typescript
const response = await openAIService.call(myFeaturePrompt, { param: 'value' });
```

**Model:** controlled by `OPENAI_MODEL` env var (default `gpt-4o`). One env var governs all non-streaming calls. Change model in one place.

**AI chat** is the only exception — `AiChatService` uses streaming and manages its own `responses.create()` call. Its prompt strings live in `config/prompts/ai-chat-*.prompt.ts` but are not `PromptDefinition` instances.

**Discovery:** `config/prompts/index.ts` re-exports all `PromptDefinition` prompts and their input types.

| File | Prompt | Domain |
|---|---|---|
| `certification-questions.prompt.ts` | Generate certification questions | Any certification (IT, finance, health, engineering…) |
| `certification-answers.prompt.ts` | Validate certification answers | Any certification |
| `certification-explanations.prompt.ts` | Explain certification answers per option | Any certification |
| `public-exam-questions.prompt.ts` | Generate concurso público questions | Concursos brasileiros |
| `public-exam-answers.prompt.ts` | Validate concurso answers | Concursos brasileiros |
| `public-exam-explanations.prompt.ts` | Explain concurso answers per option | Concursos brasileiros |
| `ai-chat-identify.prompt.ts` | First-turn chat classification | AI chat (streaming) |
| `ai-chat-topics.prompt.ts` | Topic retrieval and config chat | AI chat (streaming) |

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
- **Do not introduce new state management libraries** (Redux, Zustand, Jotai). The Context + Reducer pattern is intentional.
- **Ask before implementing** when there are multiple valid approaches. Do not pick a direction silently.
- **Prefer editing existing files** over creating new ones. Do not create abstraction layers or utility files unless the task clearly requires them.
- **No speculative features** — implement only what is asked. No "while I'm here" refactors.

---

## Testes Unitários

### Infraestrutura

| Ferramenta | Versão | Papel |
|---|---|---|
| Vitest | 4.x | Test runner (Node environment, globals: true) |
| vitest-mock-extended | 4.x | Deep mock do PrismaService |
| @vitest/coverage-v8 | 4.x | Cobertura de código |

### Scripts

```bash
npm test              # roda todos os testes (CI-safe, passa com 0 arquivos)
npm run test:watch    # modo watch
npm run test:coverage # gera relatório de cobertura
```

### Estrutura de arquivos

```
tests/
  api/
    __mocks__/
      prisma.ts         ← deep-mock global do prisma (setupFiles)
    services/
      *.service.test.ts ← um arquivo por service
vitest.config.ts        ← raiz do projeto
```

### Padrões de teste

**Mock do Prisma — services com constructor injection:**
```ts
import { prismaMock } from '../__mocks__/prisma';
// ...
const service = new MyService(prismaMock as any);
```

**Mock do Prisma — services com prisma no nível de módulo:**
```ts
import { prismaMock } from '../__mocks__/prisma';
// prismaMock é injetado automaticamente via vi.mock no setupFiles
const service = new MyService(); // usa prismaMock automaticamente
```

**Mock de `$transaction` callback (forma padrão):**
```ts
prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
```

**Mock de `$transaction` array (batch form — ex: `finishAttempt`):**
```ts
prismaMock.$transaction.mockResolvedValue([undefined, undefined]);
```

**Mock de dependências externas (ex: bcryptjs):**
```ts
vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-password') },
}));
import bcrypt from 'bcryptjs';
```

### O que testar

- Lógica de negócio em `.service.ts` — validações, guards de ownership, cálculos
- Caminhos de erro com o `status` correto (`rejects.toMatchObject({ status: 403 })`)
- Efeitos colaterais críticos — ex: campos desnormalizados em `updateSubject`/`updateTopic` devem incluir o `where` completo (cláusula `OR` com fallback legacy)

### O que NÃO testar (fora de escopo atual)

- Serviços externos com streaming (OpenAI, edital extractor)
- Webhooks Stripe (requer assinatura real)
- Route handlers (integração — próxima iteração)
- Componentes React (sem infra de UI testing)

---

## Testes E2E (Playwright)

### Infraestrutura

| Ferramenta | Versão | Papel |
|---|---|---|
| `@playwright/test` | 1.x | Test runner + browser automation |
| Chromium | (bundled) | Único browser testado |

### Scripts

```bash
# Rodar headless (modo padrão)
DATABASE_URL="file:/Users/<you>/.../myquiz/prisma/dev.db" npm run e2e

# Interface gráfica (ver cada step em tempo real)
DATABASE_URL="file:/Users/<you>/.../myquiz/prisma/dev.db" npm run e2e:ui

# Com browser visível
DATABASE_URL="file:/Users/<you>/.../myquiz/prisma/dev.db" npx playwright test --headed

# Spec individual
DATABASE_URL="..." npx playwright test certification-flow

# Ver relatório do último run
npx playwright show-report
```

### Estrutura de arquivos

```
e2e/
  auth/
    storageState.json        ← sessão salva (gitignored)
  fixtures/
    auth.fixture.ts          ← fixture com mocks das rotas OpenAI
    mock-data.ts             ← questões estáticas retornadas pelos mocks
  tests/
    certification-flow.spec.ts   ← jornada completa de certificações
    public-exam-flow.spec.ts     ← jornada completa de concursos
  global-setup.ts            ← cria usuário tester, faz login, salva sessão
  global-teardown.ts         ← deleta todos os dados do usuário E2E
playwright.config.ts         ← raiz do projeto
.env.test                    ← credenciais E2E (gitignored)
.github/workflows/e2e.yml   ← CI no push para main
```

### Setup local obrigatório

Criar `.env.test` na raiz do projeto (gitignored):

```
E2E_USER_EMAIL=e2e-test@certifiqueai.test
E2E_USER_PASSWORD=E2ePassword123!
```

Instalar browsers uma vez:

```bash
npx playwright install chromium
```

### Como funciona

- **`globalSetup`**: cria/reseta usuário `tester` (sem limite de quota) no banco dev, faz login pela UI, salva `storageState.json`. Todos os testes partem autenticados sem re-login.
- **Mocks OpenAI**: `auth.fixture.ts` intercepta `/api/certification/question-generator`, `/api/public-exam/question-generator` e os endpoints `answers` — retorna questões estáticas de `mock-data.ts`. Nenhuma chamada real à OpenAI.
- **`globalTeardown`**: deleta todos os dados do usuário E2E em ordem de dependência FK (simulados, tentativas, questões, certificações, concursos).
- **DATABASE_URL**: o `globalSetup` e o `globalTeardown` precisam usar o mesmo banco que o `next dev` — passe o path absoluto como variável de ambiente.

### Jornadas cobertas

Ambas as specs cobrem o mesmo fluxo de 6 steps:

1. Configurar (certification ou concurso) via wizard de 3 steps
2. Gerar questões (mockado) → selecionar todas → salvar
3. Criar simulado
4. Responder todas as questões → finalizar
5. Analisar resultado (score + botão "Tentar novamente")
6. Iniciar nova tentativa → cancelar → voltar para lista

### CI (GitHub Actions)

`.github/workflows/e2e.yml` — trigger: `push` em `main`.

Secrets necessários no repositório: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXTAUTH_SECRET`.

Em falha, o report HTML (screenshots + traces) é salvo como artifact em `playwright-report/`.

### Nota técnica — HeroUI Radio

O componente `Radio` do HeroUI v2 renderiza um `<input type="radio">` com `opacity: 0.0001` sobreposto ao label. Playwright não aceita `.click()` em elementos quasi-invisíveis. A solução correta é usar `dispatchEvent('click')` no input, que bypassa a verificação de visibilidade e dispara os handlers React corretamente:

```typescript
await group.locator('input').first().dispatchEvent('click');
```

Não use: `.click({ force: true })`, `.check({ force: true })`, `page.mouse.click()` com boundingBox, ou `page.evaluate` com eventos sintéticos — nenhum desses funciona com React Aria.

---

## Plans and Quotas

### `UserPlan` type

```ts
type UserPlan = 'free' | 'pro' | 'pro_ai' | 'tester' | 'admin';
```

### Plan limits (`config/constants/index.ts` → `PLAN_LIMITS`)

| Plan | Questions/period | Certifications | Public exams | AI Chat | Admin panel |
|---|---|---|---|---|---|
| `free` | 250 | 2 | 0 | ✗ | ✗ |
| `pro` | 1500 | 5 | 2 | ✗ | ✗ |
| `pro_ai` | 2500 | 5 | 5 | ✓ | ✗ |
| `tester` | ∞ | ∞ | ∞ | ✓ | ✗ |
| `admin` | ∞ | ∞ | ∞ | ✓ | ✓ |

`tester` and `admin` are assigned manually (no Stripe product). `pro_ai` is a Stripe add-on differentiated by price ID (`STRIPE_PRICE_ID_PRO_AI_MONTHLY/YEARLY`).

### `customQuotaOverride` (User field)

Overrides `questionsPerPeriod` for a specific user, regardless of plan:
- `null` → use plan default
- `-1` → infinity (sentinel value, since DB can't store `Infinity`)
- `N > 0` → custom numeric limit

Logic is in `features/services/quota.service.ts` → `resolveQuestionsLimit()`.

### `QuotaAction` type

```ts
type QuotaAction = 'generate_questions' | 'create_certification' | 'create_public_exam';
```

`quota.service.ts` enforces all three. `create_public_exam` uses `maxPublicExams` from `PLAN_LIMITS`. Free users have `maxPublicExams: 0` — they cannot create any concurso.

### `UsageStats` shape

```ts
interface UsageStats {
  plan: UserPlan;
  questionsUsed: number;
  questionsLimit: number;      // -1 means unlimited
  certificationsUsed: number;
  certificationsLimit: number; // -1 means unlimited
  publicExamsUsed: number;
  publicExamsLimit: number;    // -1 means unlimited, 0 means no access
  periodStartDate: string;
}
```

`-1` is the "unlimited" sentinel throughout the UI. The `UsageBadge` hides itself when `questionsLimit === -1`.

---

## Admin Dashboard

### Route structure

`app/admin/` — completely separate from `(workspace)`, uses its own layout with a sidebar. Does **not** use the workspace navbar.

```
app/admin/
  layout.tsx           ← server component: auth guard (plan === 'admin') + sidebar
  page.tsx             ← redirect → /admin/overview
  overview/page.tsx    ← KPI cards + plan distribution
  users/page.tsx       ← user table with inline plan/quota editing
  analytics/page.tsx   ← plan distribution bars + top 10 users
  audit-log/page.tsx   ← paginated history of admin actions
```

### Access guard

`app/admin/layout.tsx` is a **server component** that reads the DB directly:
```ts
const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { plan: true } });
if (dbUser?.plan !== 'admin') redirect('/');
```

All `/api/admin/*` routes perform the same check independently (defense in depth).

### Admin API routes

```
app/api/admin/
  admin.service.ts          ← AdminService: getOverview, listUsers, updateUser, getAuditLog
  overview/route.ts         ← GET → AdminOverviewStats
  users/route.ts            ← GET → AdminUsersResponse (paginated, searchable, filterable)
  users/[id]/route.ts       ← PATCH → update plan and/or customQuotaOverride
  audit-log/route.ts        ← GET → AdminAuditLogResponse (paginated)
```

**Important:** Admin server components (`overview/page.tsx`, `analytics/page.tsx`) call `AdminService` **directly** — they do NOT use `features/connectors.ts` (which uses the relative-URL axios instance and would fail server-side).

### Audit log

Every `PATCH /api/admin/users/[id]` call writes a row to `AdminAuditLog` with `adminId`, `targetId`, `action`, `before` (JSON), `after` (JSON).

### Session — `plan` field

`auth.ts` `session` callback fetches the user's plan from DB on every session read and exposes it as `session.user.plan`. This makes `plan` available both server-side (via `auth()`) and client-side (via `useSession()`).

---

## Feature Gating (UI)

Features that require specific plans are hidden at the UI layer as well as enforced at the API layer.

| Feature | Plans | Where gated |
|---|---|---|
| Concursos section in sidebar | `pro`, `pro_ai`, `tester`, `admin` | `sidebar.tsx` — hidden when `usage.publicExamsLimit === 0` |
| AI Chat FAB + Drawer | `pro_ai`, `tester`, `admin` | `AiChatWrapper.tsx` — hidden unless `session.user.plan` is in allowed list |
| Admin link in sidebar | `admin` | `sidebar.tsx` — hidden unless `session.user.plan === 'admin'` |
| Usage badge (header) | plans with finite limit | `UsageBadge.tsx` inside `WorkspaceHeader` — hidden when `questionsLimit === -1` |
| Upgrade CTA (user dropdown) | `free` | `workspace-header.tsx` — shown only when `usage.plan === 'free'` |
| Public exams counter (sidebar) | `pro`, `pro_ai`, `tester`, `admin` | `sidebar.tsx` — hidden when `publicExamsLimit === 0` |

---

## Session & Inactivity Policy

### JWT expiration (server)

`auth.ts` configures `session: { strategy: 'jwt', maxAge: 8 * 60 * 60 }` — JWT cookie expires **8 hours** after login regardless of activity. On the next request after expiry, NextAuth invalidates the session and the `authorized` callback in `auth.config.ts` redirects to `/login`.

Do **not** increase `maxAge` without explicit approval — it directly impacts security on shared or unattended devices.

### Inactivity auto-logout (client)

`features/hooks/useInactivityLogout.hook.ts` monitors `mousemove`, `mousedown`, `keydown`, `touchstart`, and `scroll` events on `window`. If no event fires within `AI_CHAT_LOGOUT_INACTIVITY_MS` (30 minutes, in `config/constants/index.ts`), it calls `signOut({ callbackUrl: '/login' })`.

The hook is wired **globally** via `<InactivityGuard />` in `app/providers.tsx` — it runs for every authenticated user on every page, not just inside the AI chat. It activates when `status === 'authenticated'` and tears down cleanly on logout or unmount.

**Combined policy:**
| Trigger | Timeout | Layer |
|---|---|---|
| No interaction (mouse/key/touch/scroll) | 30 min | Client (`useInactivityLogout`) |
| Absolute session ceiling from last login | 8 h | Server (JWT `maxAge`) |

### AI chat history isolation

Chat messages are scoped to the authenticated user via user-specific localStorage keys:
- `AI_CHAT_MESSAGES_{userId}` — message history
- `AI_CHAT_FOLLOWUP_TS_{userId}` — inactivity follow-up timer

The keys are computed by `AI_CHAT_LOCAL_STORAGE_KEY(userId)` and `AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId)` (both functions in `config/constants/index.ts`). When `useAiChat(userId)` detects a `userId` change (e.g., user A logs out and user B logs in on the same device), it aborts any active stream, clears all in-memory state, and loads user B's messages from their own key. User A's history is never shown to user B.

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

### Topic / subject percentage unit

`CertificationTopic.minQuestions` / `maxQuestions` and `PublicExamSubject.minQuestions` / `maxQuestions` are **integers 0–100** (e.g. `25` means 25%). This is the canonical unit across the entire stack: AI chat prompts, draft modal, manual wizard, SectionsTable sliders/inputs, API routes, and the database all use integer 0–100. **Do not multiply or divide by 100 when reading or writing these fields.**

The only exception is `QuizGeneratorService.distributeQuestions` in [features/services/quiz-generator.service.ts](features/services/quiz-generator.service.ts), which converts to a fraction internally to multiply by `total` (`Math.floor((t.minQuestions / 100) * total)`).

A historical mixed-unit window (fractional rows from old AI chat saves) was normalized via `scripts/normalize-topic-units.ts` — re-run with `--apply` if a fresh DB import brings in old fractional data.

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

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

**Mensagens curtas e objetivas — uma única linha, sem corpo.** Apenas a `<short description>` (≤ 72 caracteres). Não escreva bullets, não enumere arquivos, não justifique decisões já cobertas pelo plano. O diff e o título já dizem o que mudou.

Examples from this repo:
- `feat: sync certifications state with database as source of truth`
- `refactor: Use queueMicrotask for setting errors in QuestionGeneratorForm`

---

## GitHub Issues

The project backlog is tracked as GitHub Issues at **https://github.com/GuiHolanda/quiz-maker/issues**.

Issues are created via the `gh` CLI (authenticated to `github.com`):

```bash
gh issue create --repo GuiHolanda/quiz-maker --title "<title>" --label "<label>" --body "<body>"
```

Common labels: `bug`, `feature`, `enhancement`, `backlog`.

### When to suggest creating an issue

**Always ask the user** whether to create a GitHub Issue when you identify any of the following during a task:

- A bug or broken behavior spotted in code that is **out of scope** for the current task
- A gap in UX or functionality (missing button, missing feedback, missing validation, etc.)
- A technical debt item or known limitation worth tracking
- An inconsistency between certifications and public-exams flows that should be unified

The question should be brief and specific — name the problem, then ask: *"Quer que eu crie uma issue para isso?"*. Do **not** create issues silently without asking.
