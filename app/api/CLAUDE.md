# Backend Structure — `app/api/`

All API routes live under `app/api/` (one `route.ts` per folder). Business logic in `features/services/` — route handlers only validate session, call service, return `NextResponse`.

**Error handling:** every `catch` uses `toApiErrorResponse(err)` from `lib/api-error.ts` — never raw `err.message`.

```ts
} catch (err: unknown) {
  console.error('Failed to ...:', err);
  const { status, ...body } = toApiErrorResponse(err);
  return NextResponse.json(body, { status });
}
```

---

## Domain groups

### `auth/`

| Route | Method | Description |
|---|---|---|
| `auth/[...nextauth]` | — | NextAuth.js catch-all |
| `auth/register` | POST | Register new user (bcrypt, duplicate check) |
| `auth/forgot-password` | POST | Send reset email via Resend |
| `auth/reset-password` | POST | Validate token and update password |
| `auth/resend-verification` | POST | Resend email verification link |
| `auth/verify-email` | POST | Verify email via token |

### `billing/`

Services: `features/services/quota.service.ts` (usage), `features/services/billing.service.ts` (Stripe read-through + cancel), `features/services/referral.service.ts` (referral stats).

| Route | Method | Description |
|---|---|---|
| `billing/checkout` | GET | Create Stripe checkout session, returns `{ url }` |
| `billing/portal` | GET | Create Stripe customer portal URL, returns `{ url }` |
| `billing/usage` | GET | Returns current quota usage (`UsageStats`) |
| `billing/subscription` | GET | Returns `BillingDetails` (payment method, next invoice, subscription meta, billing profile, recent invoices) — `null` when the user has no `stripeCustomerId`. Read-only; every edit path opens the Stripe portal |
| `billing/cancel` | POST | Sets `cancel_at_period_end` on the subscription; optional `{ reason }` maps to Stripe `cancellation_details.feedback` |
| `billing/referral` | GET | Returns `ReferralStats` (code, link, counts, bonus earned) |

### `exam/`

Unified domain for `ExamType: 'certification' | 'public_exam'`.

| Route | Method | Description |
|---|---|---|
| `exam/exams` | GET | List user's exams (filtered by `?type=`) |
| `exam/save-exam` | POST/PUT/PATCH/DELETE | Create exam; add section; update exam/section/topic; delete. Every write except exam-level `DELETE` requires `pro`+ (`free` is catalog-only, read-only). |
| `exam/providers` | GET | List all providers |
| `exam/exam-boards` | GET/POST | List / create exam boards |
| `exam/save-questions` | POST | Persist generated questions to DB |
| `exam/questions/[questionId]/explanation` | GET | Generate and cache per-option explanation |
| `exam/browse-questions/questions` | GET/DELETE | Paginated list + delete (ownership check) |
| `exam/browse-questions/summary` | GET | Question counts grouped by exam/section |
| `exam/catalog` | GET | List exam templates (`isTemplate=true`), filtered by userId |
| `exam/fork-exam` | POST | Fork catalog template into user's exam; returns full `Exam` object |
| `exam/extract-from-edital` | POST | Extract exam structure from an uploaded edital via OpenAI (public_exam alternative to auto-config-by-name). Requires `pro`+, consumes `auto_config` quota. |
| `exam/auto-config` | POST/GET | POST creates an `AutoConfigJob` and returns `{ jobId }`; GET `?type=` fetches the user's active job for reconnect. Requires `pro`+, consumes 1 `auto_config` unit for the whole pipeline. |
| `exam/auto-config/identify` | POST | Cheap identify turn — `{ query, type, language }` → structured JSON matches. Requires `pro`+, does not itself consume `auto_config` quota (peeked via `checkAutoConfigAvailable`, not recorded). |
| `exam/auto-config/[jobId]` | GET/DELETE | Polling fallback for job status / cancel (best-effort — refunds the quota unit, doesn't abort an in-flight LLM call). |
| `exam/auto-config/[jobId]/stream` | GET | SSE: `progress` (`{ stage }`) / `done` (`{ exam }`) / `error` / `cancelled`. `maxDuration = 300`. |

Services: `exam.service.ts`, `exam-question.service.ts`, `exam-catalog.service.ts`, `quiz-generator.service.ts`, `auto-config-job.service.ts`.

### `generation-job/`

Async question generation with SSE progress streaming.

| Route | Method | Description |
|---|---|---|
| `generation-job` | POST | Create job (returns `{ jobId }` immediately) |
| `generation-job` | GET | Get active job for `?type=&refKey=` (reconnect on reload) |
| `generation-job/[jobId]` | GET | Polling fallback — current status + topics array |
| `generation-job/[jobId]` | DELETE | Cancel running job |
| `generation-job/[jobId]/stream` | GET | SSE stream: `progress`/`done`/`error` with `topics[]`. `maxDuration = 300`. |

Service: `features/services/generation-job.service.ts`.

### `mock-exams/`

Simulados based on saved questions. Each mock exam is a fixed question selection answered in separate attempts.

| Route | Method | Description |
|---|---|---|
| `mock-exams` | GET | List user's mock exams with attempts and best score |
| `mock-exams` | POST | Create mock exam (validates question availability) |
| `mock-exams?id={id}` | DELETE | Delete mock exam |
| `mock-exams/availability` | GET | Per-section question counts by source (library/unseen/wrong) for a given `examId` |
| `mock-exams/[id]` | GET | Full detail (questions + options + answers + explanations) |
| `mock-exams/[id]/answers` | POST | **Ensure answers** — generate missing `Answer` rows idempotently. Returns `{ generated: N }`. |
| `mock-exams/[id]/attempts` | POST | Start new attempt |
| `mock-exams/[id]/attempts/[attemptId]` | PATCH/GET | Finish attempt / Get result with score and breakdown |

Service: `app/api/mock-exams/mock-exam.service.ts` (co-located).

**Colunas do redesign:** `MockExam.durationMinutes` (null = livre) + `MockExam.questionSource` (`library`/`unseen`/`wrong`) + `MockExamAttempt.timedOut` + `MockExamAttemptAnswer.isCorrect` (backfilled uma vez via `prisma/dev/scripts/backfill-mock-exam-answer-correctness.ts`).

**Ensure-answers:** frontend calls `POST /[id]/answers` before every attempt. Without it, result page has no `correctOptions` and `/explanation` returns 404.

### `question-bank/`

| Route | Method | Description |
|---|---|---|
| `question-bank` | GET | Paginated + filterable list (search, source, type, topic, difficulty, hasAnswer) |
| `question-bank/topics` | GET | Distinct topics for filter select |
| `question-bank/sources` | GET | Distinct cert/exam names for filter select |

**Array params:** `paramsSerializer: { indexes: null }` in `lib/bff.api.ts` — arrays arrive without brackets (`difficulty=easy&difficulty=hard`). Route handler reads with `searchParams.getAll('difficulty')`. Do not remove the paramsSerializer.

### `admin/`

All routes verify `plan === 'admin'` via direct DB lookup. Service: `app/api/admin/admin.service.ts` (co-located).

| Route | Method | Description |
|---|---|---|
| `admin/overview` | GET | Aggregate KPIs + `tokensByPlan` |
| `admin/users` | GET | Paginated user list with token/cost columns |
| `admin/users/[id]` | PATCH | Update `plan`/`customQuotaOverride`. Writes to `AdminAuditLog`. |
| `admin/audit-log` | GET | Paginated admin action history |
| `admin/exchange-rate` | GET | Live USD/BRL from AwesomeAPI (1h ISR), fallback `USD_TO_BRL_FALLBACK` |
| `admin/catalog` | GET | List all catalog entries |
| `admin/catalog/[examId]` | PATCH | Promote exam to catalog template (`isTemplate = true`) |

**Critical:** `AdminService` can be called from server components directly. Do NOT use `features/connectors.ts` server-side — the axios client uses a relative `baseURL` and will fail.

### `marketing/`

Rotas públicas (sem auth). Service: `features/services/demo-catalog.service.ts`. Config: `config/exam-landing-pages.ts` (`EXAM_LANDING_PAGE_MAP`).

| Route | Method | Description |
|---|---|---|
| `marketing/demo/catalog` | GET | Lista exames elegíveis para a demo (pool com explicações) |
| `marketing/demo/quiz` | POST | Monta quiz a partir do pool, sem chamada à LLM |

**Rotas públicas (sem auth):** `auth.config.ts → publicPaths[]` — adicionar aqui qualquer nova rota não autenticada (ex: `/simulado`, `/api/marketing`). O middleware usa o callback `authorized` do NextAuth para bloquear o restante.

### Other routes

| Route | Method | Description |
|---|---|---|
| `ai/ai-chat` | POST | Streaming SSE chat. Requires `pro_ai`, `sprint`, `tester`, or `admin` (`AI_CHAT_ALLOWED_PLANS`). Metered and capped via `checkAndRecordAiChatMessage` — 300 msg/period on `pro_ai`/`sprint`. |
| `dashboard/stats` | GET | Dashboard metrics |
| `usage/history` | GET | Paginated usage log for current user |
| `usage/history/filters` | GET | Filter options for usage history page |
| `search` | GET | Global search across exams and questions |
| `cron/cleanup-stale-jobs` | GET | Marks stuck `running` jobs >30min as `error`. Protected by `CRON_SECRET`. Runs at `0 3 * * *`. |
| `webhooks/stripe` | POST | Handle Stripe subscription events — updates `user.plan`. |

---

## Redis (opcional) — `lib/redis.ts`

Camada de cache/coordenação sobre Upstash (REST/HTTP, sem pool TCP em serverless).

**Tudo é opcional.** Sem `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (ou os
`KV_REST_API_*` que a integração da Vercel injeta), cada função vira no-op e o chamador cai
no caminho que já existia. Um Redis fora do ar também degrada em vez de derrubar o request.

| Função | Comportamento sem Redis |
|---|---|
| `cacheGet` | `null` — quem chamou vai ao banco |
| `cacheSet` / `cacheDelete` | no-op silencioso |
| `claimOnce(key, ttl)` | `true` — o trabalho deduplicado **acontece** |

`claimOnce` devolver `true` sem Redis é deliberado: quem usa a trava para deduplicar precisa
processar quando não há trava, nunca pular.

### Usos

| Uso | Módulo | Nota |
|---|---|---|
| Snapshot de progresso de job (SSE) | `features/services/job-progress.service.ts` | O escritor publica a cada transição; o leitor cai no Postgres em cache miss. TTL de 30s limita a defasagem no único caminho ruim (publish que falhou). |
| Rate limit das rotas de LLM | `lib/rate-limit.ts` | Proteção de rajada, **separada** de `PLAN_LIMITS` — quota diz quanto, isto diz com que velocidade. Chamado como primeira linha do `try` de cada rota, antes de qualquer débito de quota. Erro sobe como `status: 429` + `code: 'rate_limited'` via `toApiErrorResponse`. |
| Idempotência do webhook Stripe | `app/api/webhooks/stripe/route.ts` | `claimOnce` por `event.id` (24h). A trava é **liberada no catch** — sem isso a reentrega do Stripe seria descartada como duplicata e o evento se perderia. |

**Autorização nunca vem do snapshot.** As rotas de stream continuam checando dono no Postgres
antes de ler o cache — as chaves são indexadas só por `jobId`.

---

## Service layer (`features/services/`)

| File | Responsibility |
|---|---|
| `openAI.service.ts` | `call(prompt, input)` via Responses API with `web_search` forced via `tool_choice: 'required'` when `webSearch: true` (default) — the tool being available doesn't mean the model uses it; forcing avoids it silently answering from training data. Returns `{ text, inputTokens, outputTokens }`. |
| `quota.service.ts` | `checkAndRecordQuestions(userId, count)` → `{ logId }`. Also enforces `create_exam`, `checkAndRecordAutoConfig(userId)` (per-period `autoConfigThisPeriod`, `PLAN_LIMITS[plan].autoConfigPerPeriod`), and `checkAndRecordAiChatMessage(userId)` (per-period `aiChatMessagesThisPeriod`, `PLAN_LIMITS[plan].aiChatMessagesPerPeriod`). `checkAutoConfigAvailable(userId)` is a read-only peek (no increment) used before the identify call. `rollbackQuota(logId)` refunds `questionsGeneratedThisPeriod`, `autoConfigThisPeriod`, or `aiChatMessagesThisPeriod` depending on the log's `action`. |
| `metrics.service.ts` | `createLog(userId, action, count = 1)` — `count: 0` tracks tokens without consuming a billable unit (used by the auto-config identify call). `recordStep(logId, step, tokens, durationMs)` (fire-and-forget) + `finalize(logId, ms)`. |
| `exam.service.ts` | Unified CRUD for Exam/Section/Topic (both types). |
| `exam-question.service.ts` | `saveAnswers`, `saveExplanations`. |
| `exam-catalog.service.ts` | `getTemplates(userId)`, `forkExam`, `promoteExam`, admin catalog entries. |
| `quiz-generator.service.ts` | Distribute questions across sections. |
| `question-bank.service.ts` | Unified question search across exam types. |
| `generation-job.service.ts` | Async batch generation — batches of 5 topics, per-topic status tracking. Publica o progresso no Redis a cada transição (ver seção Redis). |
| `job-progress.service.ts` | Snapshot de progresso de job para o SSE — `read*`/`publish*` para geração e auto-config, com fallback no Postgres. |
| `auto-config-job.service.ts` | Auto-config pipeline — `identifyExam` (cheap lookup) + `createAutoConfigJob`/`runAutoConfigJob`/`cancelAutoConfigJob` (research→review→format, one `AutoConfigJob` row, one `auto_config` unit). |
| `aiChat.service.ts` | Validate messages, select prompt, stream response — powers the `pro_ai` chat drawer only; unrelated to the auto-config job pipeline above. |
| `billing.service.ts` | `getBillingDetails(userId)` reads the Stripe customer/subscription/invoices into `BillingDetails` (current-period end lives on `subscription.items.data[0].current_period_end`, not the subscription root). `cancelSubscription(userId, reason?)` sets `cancel_at_period_end`. Optional bits (tax id, upcoming-invoice preview) fail soft to `null`. |
| `referral.service.ts` | `getStats(userId)`, `getOrCreateReferralCode(userId)` (lazy backfill), `activateIfEligible(userId)` — two-way bonus on real activation, capped per account. |

Co-located services (not in `features/services/`): auth services in `app/api/auth/`, mock exam in `app/api/mock-exams/`, admin in `app/api/admin/`.

---

## Lazy-init pattern (services with OpenAI)

Services used in unit tests must not call `new OpenAI()` at construction time (requires `OPENAI_API_KEY`):

```ts
private _openAIService: OpenAIService | null = null;
private get openAIService(): OpenAIService {
  this._openAIService ??= new OpenAIService();
  return this._openAIService;
}
```

---

## Tests

Unit tests for service logic in `tests/unit/api/services/`. Run `npm test` after modifying a covered service. Patterns documented in [`tests/CLAUDE.md`](../../tests/CLAUDE.md).
