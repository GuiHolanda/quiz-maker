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
config/
  constants/index.ts          # App-wide constants, API URLs, localStorage keys, PLAN_LIMITS
  constants/inputStyles.ts    # Shared HeroUI input/select props (inputProperties)
  promptSchemas/              # JSON output validation schemas
features/
  connectors.ts               # All HTTP client calls (single file)
  hooks/                      # Custom React hooks (*.hook.ts)
  providers/                  # Context providers (*.provider.tsx)
  reducers/                   # State reducers (*.reducer.ts)
  services/                   # Server-side services
lib/
  prisma.ts                   # Prisma client singleton
  bff.api.ts                  # Axios instance (baseURL: "/api") — client-side only
prisma/
  dev/                        # SQLite dev schema + migrations
  prod/                       # LibSQL (Turso) prod schema + migrations
```

**Component co-location:** page-specific components in `app/(workspace)/<domain>/<page>/components/`; components used by 2+ pages in `shared/components/`. Group 3+ related files in a subfolder (`wizard/`, `list/`).

**`lib/bff.api.ts` — client-side only.** Uses `baseURL: '/api'`. Never import in server components or API routes. Server components call services directly.

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx` | `QuestionCard.tsx` |
| Custom hooks | camelCase `.hook.ts` | `useRequest.hook.ts` |
| Providers | camelCase `.provider.tsx` | `certifications.provider.tsx` |
| Reducers | camelCase `.reducer.ts` | `exams.reducer.ts` |
| Services | PascalCase `.service.ts` | `exam.service.ts` |
| API routes | kebab-case folder + `route.ts` | `save-exam/route.ts` |
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

### Código declarativo e legível

Em callbacks de array (`map`, `filter`, `some`, `reduce`), extraia variáveis locais descritivas:

```ts
// ✅ nome revela a intenção
distribution.some((entry, i) => {
  const original = originalDistribution[i];
  return !original || original.questionCount !== entry.questionCount;
});
```

Prefira `entry`, `original`, `current` a `s`, `a`, `x`. Condicionais com múltiplas cláusulas usam variáveis intermediárias nomeadas quando a intenção não é óbvia.

### Component decomposition

Extract to a new file when: the piece has its own props interface; it manages its own state or refs; it appears in 2+ pages; the file grows past ~150 lines.

**Use renderer functions** (declared after `return`, named `render<What>`) only for conditional blocks or table-cell variants that share too much scope to extract cleanly.

### useRequest vs manual try/catch

`useRequest` — single HTTP call + optional `onSuccess`. Do **not** use for multi-step flows with multiple sequential calls, intermediate logic between calls, or `router.push()` mid-flow.

For multi-step flows, use manual `try/catch`:
- `setIsBusy(false)` in `catch` only — on success the user navigates away
- Error feedback via `notify.error` with `err?.response?.data?.message` fallback to i18n key — never `err?.message`

### State Management
- Context + Reducer pattern everywhere
- One provider per domain: `ExamsProvider`, `QuizProvider`
- Providers are composed in `app/layout.tsx`
- **Prefer `useContext` over `useState`** for domain data — consume existing providers before reaching for local state
- `useState` only for truly local, ephemeral UI state
- All HTTP calls go through `features/connectors.ts`

### API Routes
- Each route lives in its own folder under `app/api/`
- Business logic in a co-located `.service.ts` file, not in the route handler
- Route handlers: validate → call service → return `NextResponse.json()`
- Error responses: always go through `toApiErrorResponse(err)` from `lib/api-error.ts`
- Validation errors throw with `.status`: `Object.assign(new Error(...), { status: 409 })`

### Error sanitization (`lib/api-error.ts`)

| Error type | `message` in response | `status` |
|---|---|---|
| Service business-logic error (has `.status`) | present — user-facing | from `.status` |
| `PrismaClientValidationError` | absent | 500 |
| `PrismaClientKnownRequestError` P2002 | absent | 409 |
| Other `PrismaClientKnownRequestError` | absent | 500 |
| Any other `Error` | present (for server logs) | 500 |

**Rules:** every catch block uses `toApiErrorResponse` — no raw `err.message` in responses. Never log the raw Prisma message to the response body. Components with `useRequest` get error toasts automatically — do not add a second `catch`.

### HTTP timeouts (request chain)

| Layer | Setting | File |
|---|---|---|
| Vercel function | `maxDuration = 300` | route handler |
| axios client | `timeout: 280_000` | `lib/bff.api.ts` |
| OpenAI SDK | `timeout: 280_000`, `maxRetries: 0` | `features/services/openAI.service.ts` |

**When raising one, raise the others** — they're co-dependent. `maxRetries: 0` is intentional: timeouts are slow-generation, not transient failures.

### Prompt management (LLM)

All prompts in `config/prompts/` as TypeScript files, grouped into subfolders by domain — none stored in the OpenAI dashboard. Each exports a `PromptDefinition<TInput>` with a `build(input): string` method (the two `ai-chat/` prompts are the one exception: bare template-string constants, since `AiChatService` doesn't go through `OpenAIService`).

**Calling:** always `openAIService.call(prompt, input)` — never `openAIClient` directly. **Model:** `OPENAI_MODEL` env var (default `gpt-4o`). **Exception:** `AiChatService` uses streaming with its own `responses.create()`.

Dispatch by exam type via `EXAM_PROMPTS: Record<ExamType, { research, review, format, answers, explanations }>` (question generation) and `AUTO_CONFIG_PROMPTS: Record<ExamType, { research, review, format }>` (auto-config blueprint), both in `config/prompts/index.ts`.

| Folder | Domain |
|---|---|
| `certification-questions/` | Question generation for any certification — `research`/`review`/`format`/`answers`/`explanations.prompt.ts` |
| `public-exam-questions/` | Question generation for concursos brasileiros — same five-file shape |
| `certification-config/` | Auto-config blueprint pipeline for certifications — `research`/`review`/`format.prompt.ts` |
| `public-exam-config/` | Auto-config blueprint pipeline for concursos — same three-file shape |
| `ai-chat/` | Conversational chat drawer (streaming) — `identify`/`topics.prompt.ts` |
| `exam-identify.prompt.ts` | Auto-config's shared identify lookup — one file, used by both exam types |

### Imports
- All absolute imports use `@/` alias (maps to project root)
- Never use relative `../..` for cross-directory imports

---

## Internacionalização (i18n)

| Arquivo | Papel |
|---|---|
| `public/messages/en.properties` / `pt.properties` | Strings PT/EN |
| `features/reducers/language.reducer.ts` | Reducer com `setLanguage` / `setMessages` |
| `features/providers/language.provider.tsx` | Provider — lê localStorage, faz fetch do `.properties` |
| `features/hooks/useTranslation.hook.ts` | `useTranslation()` → `{ t, language, setLanguage }` |

**Uso:** `t('common.save')`, interpolação: `t('quiz.progress', { answered: 5, total: 20 })`. Componentes que usam `useTranslation` precisam de `'use client'`.

**Adicionar string:** 1) `en.properties` 2) `pt.properties` (unicode escapes: `ã` → `ã`) 3) `t('chave')`.

**Plural:** chaves separadas (`generate.correctAnswer` / `generate.correctAnswers`), selecione com ternário.

**Observações:** `public/messages/` é seguro — strings de UI não são dados sensíveis. O `middleware.ts` exclui `/messages/*.properties` do guard de autenticação. Idioma padrão: `pt`.

---

## Important Constraints

- **Do not modify the Prisma schema** without explicit approval — schema changes require migrations.
- **Do not introduce new state management libraries** (Redux, Zustand, Jotai).
- **Ask before implementing** when there are multiple valid approaches.
- **Prefer editing existing files** over creating new ones.
- **No speculative features** — implement only what is asked.

---

## Tests

See [`tests/CLAUDE.md`](tests/CLAUDE.md) for unit test patterns, mock infrastructure, E2E setup, and coverage map.

```bash
npm test              # unit tests (CI-safe)
npm run test:watch    # modo watch
npm run test:coverage # cobertura
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e
```

---

## Usage Provider

`UsageProvider` (`features/providers/usage.provider.tsx`) — consumed via `useUsageContext()`:

- `usage` — `UsageStats | null`, fetched once on auth
- `refreshUsage()` — call after saving questions so counters update without reload

**Never call `getBillingUsage()` directly** — always `useUsageContext()`.

---

## Plans and Quotas

```ts
type UserPlan = 'free' | 'pro' | 'pro_ai' | 'sprint' | 'tester' | 'admin';
```

| Plan | Questions/period | Exams | Create/edit exams | Auto-config/period | AI Chat | Admin |
|---|---|---|---|---|---|---|
| `free` | 100 | 2 | ✗ (catalog-only, read-only) | 0 | ✗ | ✗ |
| `pro` | 1000 | 6 | ✓ | 15 | ✗ | ✗ |
| `pro_ai` | 2000 | 12 | ✓ | 30 | ✓ | ✗ |
| `sprint` | 2000 | 12 | ✓ | 30 | ✓ | ✗ |
| `tester` | ∞ | ∞ | ✓ | ∞ | ✓ | ✗ |
| `admin` | ∞ | ∞ | ✓ | ∞ | ✓ | ✓ |

**Single `maxExams` counter** shared across both exam types. `tester`/`admin` assigned manually. `pro_ai` differentiated by Stripe price ID. Subscribers who signed up under the old 1500/2500 `pro`/`pro_ai` quotas keep them via `customQuotaOverride` (migration `backfill_founder_quota_lock`) — the lower numbers above only apply to signups after that migration ran.

**`sprint`:** 90-day, one-time payment (R$89,90, no renewal) — "tudo do Pro AI" (`PLAN_LIMITS.sprint` mirrors `pro_ai` exactly). Checkout uses `mode: 'payment'` instead of `'subscription'` (`app/api/billing/checkout/route.ts`) and the webhook branches on `session.mode === 'payment'` to set `plan: 'sprint'` + `User.sprintExpiresAt` directly, skipping the subscription lookup entirely — Sprint users never get a `stripeSubscriptionId`. Expiry is enforced in exactly one place: `auth.ts`'s `session()` callback downgrades `plan` to `'free'` (and clears `sprintExpiresAt`) the first time it reads a user past their expiry date — every other plan is indefinite, so nothing else in the quota model needs to know about expiry. Because that callback runs at the top of every authenticated request, `QuotaService` and every `canEditExams`/`AI_CHAT_ALLOWED_PLANS` check downstream always see the already-corrected plan.

**`customQuotaOverride`:** `null` = plan default, `-1` = infinity sentinel, `N > 0` = custom. Logic in `quota.service.ts → resolveBaseQuestionsLimit()`. Applies to questions only — `autoConfigPerPeriod` always comes straight from `PLAN_LIMITS`.

**`bonusQuestions`:** additive, non-expiring top-up on top of `resolveBaseQuestionsLimit()` (plan default or `customQuotaOverride`) — `resolveQuestionsLimit()` returns their sum. Never reset by the 30-day period rollover (`getUserWithPeriodReset` only zeroes `questionsGeneratedThisPeriod`/`autoConfigThisPeriod`), and survives a plan upgrade or an admin override being set, since it lives in its own field instead of overwriting `customQuotaOverride`. `checkAndRecordQuestions()` only draws on it for the portion of a request that overflows past the base limit, and records exactly how much on `UsageLog.bonusQuestionsConsumed` so `rollbackQuota()` can restore the right amount instead of re-deriving it. Grant mechanism for the referral program (indicações) — see **Referral reward** below for who writes to it.

**Plan-change quota reset** (`app/api/webhooks/stripe/route.ts`): `questionsGeneratedThisPeriod`/`periodStartDate` reset only when a plan change raises the questions/period ceiling — never on a same-or-lower move. `checkout.session.completed` resets unconditionally, since `BillingOverview.tsx` only shows the checkout-driven "Fazer upgrade" CTA to `free` users (`hasStripeSubscription` hides it once a subscription exists), so this event always represents a brand-new paid period starting now. Existing subscribers change plans through the Stripe customer portal instead (`billing.changePlan` → `customer.subscription.updated`), which also fires for reasons that aren't a plan change at all (payment retries, `cancel_at_period_end` toggles) — so that handler gates the reset behind `isCapacityUpgrade()`, comparing `PLAN_LIMITS[oldPlan].questionsPerPeriod` (read from the DB before the update) against the new plan's, and only resets on a genuine upgrade, never a downgrade. `customer.subscription.deleted` no longer zeroes the counter on cancellation — usage now rides out its normal 30-day window via `getUserWithPeriodReset` like any other plan. This closes the cancel-and-resubscribe quota-recycling exploit that the old unconditional resets enabled together (pricing tier audit achados 11–12).

**Referral attribution** (`User.referralCode`, `User.referredByUserId`): groundwork for the referral program, chosen over a third-party analytics tool. `RegisterService.register()` generates every new user's own shareable `referralCode` (`lib/referral-code.ts` — 8 chars, unambiguous alphabet, collision-checked with a bounded retry) and, when the signup URL carries `?ref=<code>` (captured client-side in `RegisterForm.tsx` via `useSearchParams`, which is why `register/page.tsx` wraps it in `<Suspense>`), resolves that code to the referrer's `id` and sets `referredByUserId` — silently, if the code doesn't match anything, so a stale or mistyped invite link never blocks signup. Google OAuth signups don't go through `RegisterService` — `PrismaAdapter` creates that `User` row itself — so the same two fields are set from `auth.ts`'s `events.createUser` instead, the one hook that fires only for adapter-created users (never for credentials signups, which `RegisterService` already covers, and never for an existing account linking Google later via `allowDangerousEmailAccountLinking`, since that path resolves to the existing user instead of creating one). It reads the `?ref=` code from a short-lived cookie (`REFERRAL_CODE_COOKIE_KEY`, 10 min) that `RegisterForm.tsx`'s `handleGoogle()` sets client-side right before the redirect — the only way the code survives the trip to Google and back, since the OAuth callback lands on `auth.ts` with no access to the original page's query string. The whole thing is wrapped in try/catch: a failure here must never block a Google sign-up whose `User` row already exists by that point, and a `referralCode` left null is lazily backfilled the same way as any pre-existing user's, by `getOrCreateReferralCode()`; a `referredByUserId` missed this way has no such retry and is simply lost, same as a stale `?ref=` on the credentials path.

**UTM attribution** (`User.utmSource`/`utmMedium`/`utmCampaign`, `lib/utm.ts`): pricing tier audit's priority action 1 — without this, a campaign link's UTM params died on the landing page with no way to tell which channel a signup came from. First-touch only: `captureUtmFromUrl()` writes a 30-day cookie (`UTM_COOKIE_KEY`) the first time `utm_source`/`utm_medium`/`utm_campaign` show up in the URL, and never overwrites it — a later visit with no UTM (or a different one, e.g. clicking a friend's referral link) doesn't erase the campaign that originally brought the visitor in. Mounted once via `<UtmCapture />` in `app/(marketing)/layout.tsx` (wrapped in `<Suspense>`, same reason as the referral code's `useSearchParams()` above) so it runs on every public marketing page without per-page wiring; `RegisterForm.tsx` also calls it on mount for the direct-to-register case (an email campaign linking straight past marketing pages), since that page isn't under `(marketing)`. Read at the same two signup call sites as referral attribution — `RegisterService.register()` reads it from the request body (`RegisterForm.tsx`'s `handleSubmit` attaches `readUtmCookie()`'s result), `auth.ts`'s `events.createUser` reads the cookie itself via `cookies()` — but unlike `REFERRAL_CODE_COOKIE_KEY`, nothing needs to re-set it before the Google redirect: it's already sitting in the browser from whenever it was first captured, long before the OAuth round-trip. Deliberately only 3 fields, not the full 5-field UTM set — `utm_term`/`utm_content` exist for paid-search granularity this product doesn't run yet.

**Referral reward** (`User.referralActivatedAt`, `features/services/referral.service.ts`): pays out the two-way bonus from the pricing tier audit's referral section — **+100 `bonusQuestions`** to the referred user, **+150** to the referrer — gated behind activation, never the signup itself, so throwaway emails can't farm it. `ReferralService.activateIfEligible(userId)` fires from two call sites, either one enough to trigger it: `generation-job.service.ts`'s `processTopic()` (first question batch generated) and `mock-exam.service.ts`'s `finishAttempt()` (first mock exam completed). Both call sites wrap it in try/catch — a bookkeeping failure never fails the generation or the attempt itself. The function is a cheap no-op for non-referred or already-activated users, so it's safe to call on every such event rather than tracking "is this the first one" separately; the conditional `updateMany` gated on `referralActivatedAt: null` is simultaneously the payout and the duplicate-grant lock (a concurrent second call sees `count: 0` and bails out). `REFERRAL_REWARD.maxRewardedReferralsPerAccount` (10, in `config/constants/index.ts`) caps how many of a single referrer's invitees can ever pay out the referrer's side — the invitee's own `+100` is unaffected by the cap. Each successful grant sends a Resend email (`EmailService.sendReferralRewardToFriend` / `sendReferralRewardToReferrer`) — best-effort, individually try/caught so a Resend failure never rolls back a bonus that already landed in the DB.

**Referral UI** (`GET /api/billing/referral`, `ReferralCard.tsx`): the "convide amigos" surface lives as a card on `/billing`, not a separate page — it's read alongside plan usage, not a growth-team destination. `ReferralService.getOrCreateReferralCode(userId)` lazily backfills a code for anyone who signed up before this field existed (shares the retry-on-collision generator in `lib/referral-code.ts` with `RegisterService`) and `getStats(userId)` returns `{ referralCode, referralLink, referredCount, activatedCount, bonusQuestionsEarned }` — `referralLink` is built server-side from `AUTH_URL` (same convention as `forgot-password.service.ts`'s reset link) so the component never touches `window.location`. `bonusQuestionsEarned` is `activatedCount` (capped at `maxRewardedReferralsPerAccount`) `× referrerBonus`, derived rather than read off `bonusQuestions` itself, since that field pools every bonus source together and drains as it's spent.

**Auto-config quota** (`QuotaAction: 'auto_config'`, `User.autoConfigThisPeriod`): metered by `QuotaService.checkAndRecordAutoConfig()`, one unit per call. Covers both `POST /api/exam/auto-config` (certification search/blueprint — the headless counterpart to `/api/ai/ai-chat` used by `/exams/new`'s AI seed, gated at `pro`+ rather than `pro_ai`-only) and `POST /api/exam/extract-from-edital`. `canEditExams(plan)` (`config/constants/index.ts`) is the single source of truth gating every exam create/edit/delete-section-or-topic route (`app/api/exam/save-exam/route.ts`) and the corresponding UI (`/exams/new`, `/exams/[id]/edit` show an upgrade wall; `ExamDetailPanel`'s "Editar" button becomes "Fazer upgrade" for `free`). Deleting a whole exam stays open to `free` so a forked catalog exam is never a trap.

**AI Chat quota** (`QuotaAction: 'ai_chat'`, `User.aiChatMessagesThisPeriod`, `PLAN_LIMITS[plan].aiChatMessagesPerPeriod`): pricing tier audit achado 15 — AI Chat was the one feature justifying Pro AI's price over Pro, metered for cost visibility but never capped. 300 messages/period for `pro_ai`/`sprint` (the doc's proposed grade), `0` for `free`/`pro` (never reached — `AI_CHAT_ALLOWED_PLANS` blocks the route before any quota check runs), `Infinity` for `tester`/`admin`. `QuotaService.checkAndRecordAiChatMessage()` mirrors `checkAndRecordAutoConfig()` — atomic `updateMany` gate, one unit per POST to `/api/ai/ai-chat`, resets alongside the other two period counters in `getUserWithPeriodReset()`. Its `logId` is passed into `AiChatService.streamChat()` instead of that service creating its own `UsageLog` row (it used to, via `MetricsService.createLog`) — one row per message, not two, since the admin analytics `tokensByAction` aggregation would otherwise double-count every chat turn. `rollbackQuota()` only fires on a synchronous pre-stream failure (bad request, OpenAI call rejects immediately); a failure mid-stream still consumes the message, matching how `AiChatService` already treats it as cost incurred for metrics. The rejection code (`ai_chat_limit`) deliberately isn't in the shared `QuotaLimitCode` union `LimitReachedModal` reads — that component always offers an upgrade, and there's no higher plan to sell someone who is already on `pro_ai`/`sprint`, the only plans this feature is even available on. Instead `useAiChat.hook.ts` preserves the response body's `code` on the thrown error and renders `chat.errorLimitReached` as a normal chat-bubble error, the same way it already handles a dropped connection or an expired session.

**`-1` is the "unlimited" sentinel** throughout the UI — `UsageBadge` hides when `questionsLimit === -1`.

`questionsUsed` rastreia chamadas à LLM (quota/custo); `questionsSavedInLibrary` conta questões salvas pelo usuário — são métricas distintas.

---

## Admin Dashboard

`app/admin/` — completely separate from `(workspace)`. Auth guard in `layout.tsx` (server component, reads DB directly). All `/api/admin/*` routes verify `plan === 'admin'` independently.

Admin server components call `AdminService` **directly** — do NOT use `features/connectors.ts` server-side.

Routes: `overview`, `users`, `users/[id]` (PATCH — writes `AdminAuditLog`), `audit-log`, `exchange-rate` (live USD/BRL, 1h cache), `catalog`, `catalog/[examId]`.

`tokensByPlan` is computed in `getOverview()` via two queries + application-side join (usageLog groupBy userId → user.findMany to resolve plan).

---

## Feature Gating (UI)

Gate in two places: API (403) + UI (not rendered). `session.user.plan` client-side via `useSession()`, server components query `prisma.user` directly.

| Feature | Plans |
|---|---|
| AI Chat FAB + Drawer | `pro_ai`, `sprint`, `tester`, `admin` |
| Admin link in sidebar | `admin` |
| Usage badge (header) | plans with finite limit |
| Upgrade CTA | `free` |

---

## Session & Inactivity Policy

**JWT:** expires 8h after login (`auth.ts → session.maxAge`). Do not increase without approval.

**Inactivity:** `useInactivityLogout` → signOut after 30 min without interaction. Wired globally via `<InactivityGuard />` in `app/providers.tsx` — do not move outside `<SessionProvider>` (uses `useSession()`).

**AI chat isolation:** `useAiChat(userId)` uses `AI_CHAT_LOCAL_STORAGE_KEY(userId)` and `AI_CHAT_FOLLOWUP_TIMESTAMP_KEY(userId)`. Never call without `userId` or with a static string — would collapse all users' history into one key.

---

## Database

| Env | Schema | DB |
|---|---|---|
| Dev | `prisma/dev/schema.prisma` | SQLite (`prisma/dev.db`) |
| Prod | `prisma/prod/schema.prisma` | LibSQL (Turso) |

```bash
npm run prisma:migrate:dev    # Run dev migrations
npm run prisma:generate:dev   # Regenerate Prisma client (dev)
npm run db:seed:dev           # Seed dev database
npm run db:clear:dev          # Wipe dev database
```

**Section percentage unit:** `ExamSection.minQuestions`/`maxQuestions` are **integers 0–100** (25 = 25%). Do not multiply or divide by 100 — the entire stack uses integer 0–100. Exception: `QuizGeneratorService.distributeQuestions` divides internally (`minQuestions / 100 * total`).

---

## Prova Completa (Full Exam Job)

Async job that generates questions for all topics at once with SSE progress and persistence across reloads.

**Flow:** POST `/api/full-exam-job` → returns `{ jobId }` in <1s → front connects `EventSource` to `/[jobId]/stream` → receives `progress`/`done`/`error` with `topics[]`. On reload: GET `/api/full-exam-job?type=&refKey=` reconnects if still `running`.

**Processing:** batches of 5 topics in parallel (`Promise.allSettled`); batches sequential; per-topic `pending → running → done/error`; topic failure doesn't cancel others.

**Cancelamento:** `DELETE /api/full-exam-job/[jobId]`. Cleanup cron at `0 3 * * *` via `vercel.json` (marks `running` jobs older than 30min as `error`, protected by `CRON_SECRET`).

Dev unlock: `sqlite3 prisma/dev.db "UPDATE FullExamJob SET status='error' WHERE status='running';"`

---

## Git Workflow

Before any non-trivial task, ask the user whether to create a new branch: `feature/<kebab-case>` or `fix/<kebab-case>`.

**Never commit directly to `main`.** All work through a feature/fix branch.

Group related changes into logical commits — not one giant commit, not micro-commits per file. Keep the diff reviewable (if a commit touches more than ~10 files, look for a natural split).

---

## Commit Convention

```
<type>: <short description>
```

Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`

One line only, ≤ 72 chars, no body. Examples:
- `feat: sync certifications state with database as source of truth`
- `refactor: Use queueMicrotask for setting errors in QuestionGeneratorForm`

---

## GitHub Issues

Backlog at **https://github.com/GuiHolanda/quiz-maker/issues**. Create via `gh issue create --repo GuiHolanda/quiz-maker --title "<title>" --label "<label>" --body "<body>"`.

**Always ask** before creating an issue for: out-of-scope bugs, UX gaps, tech debt, cert/public_exam inconsistencies. Never create silently.

---

## Design Context

- **[PRODUCT.md](PRODUCT.md)** — brand register, positioning, personality, anti-references. Read before any marketing/landing page work.
- **[DESIGN.MD](app/DESIGN.MD)** — color tokens, typography, spacing, component specs. Read before any UI work.
- **[app/CLAUDE.md](app/CLAUDE.md)** — frontend patterns, component inventory, visual rules.
- **[app/api/CLAUDE.md](app/api/CLAUDE.md)** — API routes, service layer map, backend patterns.
- **[tests/CLAUDE.md](tests/CLAUDE.md)** — test infrastructure, Prisma mock patterns, E2E setup.
