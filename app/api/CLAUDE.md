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

Services: `features/services/billing/quota.service.ts` (usage), `features/services/billing/billing.service.ts` (Stripe read-through + cancel), `features/services/billing/referral.service.ts` (referral stats).

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
| `exam/questions/[questionId]/explanation` | GET | Generate and cache per-option explanation |
| `exam/browse-questions/questions` | GET/DELETE | Paginated list + delete (ownership check) |
| `exam/catalog` | GET | List exam templates (`isTemplate=true`), filtered by userId |
| `exam/fork-exam` | POST | Fork catalog template into user's exam; returns full `Exam` object |
| `exam/extract-from-edital` | POST | Extract exam structure from an uploaded edital via OpenAI (public_exam alternative to auto-config-by-name). Requires `pro`+, consumes `auto_config` quota. |
| `exam/auto-config` | POST/GET | POST creates an `AutoConfigJob` and returns `{ jobId }`; GET `?type=` fetches the user's active job for reconnect. Requires `pro`+, consumes 1 `auto_config` unit for the whole pipeline. |
| `exam/auto-config/identify` | POST | Cheap identify turn — `{ query, type, language }` → structured JSON matches. Requires `pro`+, does not itself consume `auto_config` quota (peeked via `checkAutoConfigAvailable`, not recorded). |
| `exam/auto-config/[jobId]` | GET/DELETE | Polling fallback for job status / cancel (best-effort — refunds the quota unit, doesn't abort an in-flight LLM call). |
| `exam/auto-config/[jobId]/stream` | GET | SSE: `progress` (`{ stage }`) / `done` (`{ exam }`) / `error` / `cancelled`. `maxDuration = 300`. |

Services: `exam/exam.service.ts`, `exam/exam-question.service.ts`, `exam/exam-catalog.service.ts`, `auto-config/auto-config-job.service.ts`.

### `generation-job/`

Async question generation with SSE progress streaming.

| Route | Method | Description |
|---|---|---|
| `generation-job` | POST | Create job (returns `{ jobId }` immediately) |
| `generation-job` | GET | Get active job for `?type=&refKey=` (reconnect on reload) |
| `generation-job/[jobId]` | GET | Polling fallback — current status + topics array |
| `generation-job/[jobId]` | DELETE | Cancel running job |
| `generation-job/[jobId]/stream` | GET | SSE stream: `progress`/`done`/`error` with `topics[]`. `maxDuration = 300`. |

Service: `features/services/generation/generation-job.service.ts`.

### `mock-exams/`

Simulados based on saved questions. Each mock exam is a fixed question selection answered in separate attempts.

| Route | Method | Description |
|---|---|---|
| `mock-exams` | GET | List user's mock exams with attempts and best score |
| `mock-exams` | POST | Create mock exam (validates question availability) |
| `mock-exams?id={id}` | DELETE | Delete mock exam |
| `mock-exams/availability` | GET | Per-section question counts by source (library/unseen/wrong) for a given `examId` |
| `mock-exams/[id]` | GET | Full detail (questions + options + answers + explanations) |
| `mock-exams/[id]/answers` | POST | **Ensure answers** — generate missing `Answer` rows idempotently. Returns `{ generated, remaining }`; `502` when every batch fails. |
| `mock-exams/[id]/attempts` | POST | Start new attempt |
| `mock-exams/[id]/attempts/[attemptId]` | PATCH/GET/DELETE | Finish attempt (never calls the LLM) / Get result with score and breakdown / Discard open attempt |

Service: `app/api/mock-exams/mock-exam.service.ts` (co-located).

**Colunas do redesign:** `MockExam.durationMinutes` (null = livre) + `MockExam.questionSource` (`library`/`unseen`/`wrong`) + `MockExamAttempt.timedOut` + `MockExamAttemptAnswer.isCorrect` (backfilled uma vez via `prisma/dev/scripts/backfill-mock-exam-answer-correctness.ts`).

**Ensure-answers:** o gabarito só nasce em `ensureAnswers` — a geração salva perguntas e opções, nunca `Answer`. O frontend dispara `POST /[id]/answers` (fire-and-forget) ao iniciar a tentativa e a página de resultado repete a chamada, em até 3 rodadas, enquanto `remaining > 0`. Sem o gabarito o resultado não tem `correctOptions` e `/explanation` devolve 404.

`ensureAnswers` roda lotes de 10 questões (por seção + formato) com concorrência 4 e para de iniciar lotes aos 200s, para terminar antes do `maxDuration = 300` da rota. Um lote que falha (JSON inválido, timeout) é logado e não derruba os demais; só lança `502` se **todos** falharem. Entradas de gabarito com rótulo fora das opções ou quantidade diferente de `correctCount` são descartadas. Após salvar, as tentativas já finalizadas são recorrigidas (`isCorrect` + `score`).

`finishAttempt` **não chama o LLM**: corrige com o gabarito que existir (`missingAnswers` no log) e a página de resultado completa e recorrige depois. Nunca reintroduza uma chamada ao LLM no PATCH — ele não tem `maxDuration` próprio.

### `question-bank/`

| Route | Method | Description |
|---|---|---|
| `question-bank` | GET | Paginated + filterable list (search, source, type, topic, difficulty, hasAnswer) |
| `question-bank/topics` | GET | Distinct topics for filter select |
| `question-bank/sources` | GET | Distinct cert/exam names for filter select |

**Array params:** `paramsSerializer: { indexes: null }` in `features/connectors.ts` — arrays arrive without brackets (`difficulty=easy&difficulty=hard`). Route handler reads with `searchParams.getAll('difficulty')`. Do not remove the paramsSerializer.

### `feedback/`

**Phase 1 — `feedback/question-report` (F1) is implemented; `feedback` (F2) is still planned.** Business rules (`RN-xx`): [docs/sdd/feedback-e-comunicacao.md](../../docs/sdd/feedback-e-comunicacao.md). Decisions: [docs/adr/](../../docs/adr/README.md) 0001–0002, plus the SDD design decisions. Validation lives in the co-located services, not in the handlers (SDD D-11).

| Route | Method | Description |
|---|---|---|
| `feedback/question-report` | POST | Report a question (F1, implemented: `question-report.service.ts`). One report per user + question: an active one → `409 already_reported`; a `fixed`/`rejected` one is reopened (`200`). Rate limit `question_report` (8 / 5 min) |
| `feedback` | POST | General feedback (F2, planned). `plan`, `email` and `userAgent` are read server-side, never from the body. Rate limit `feedback_submit` (3 / 10 min) |

Both persist first, then email the team inside `after()` through `EmailService.sendInternalAlert`, which never throws and only sends when `FEEDBACK_INBOX_EMAIL` is set (ADR-0002). `QuestionReport` and `Feedback` have **no foreign keys** (ADR-0001): any account-deletion flow must delete them by `userId`.

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
| Snapshot de progresso de job (SSE) | `features/services/generation/job-progress.service.ts` | O escritor publica a cada transição; o leitor cai no Postgres em cache miss. TTL de 30s limita a defasagem no único caminho ruim (publish que falhou). |
| Rate limit das rotas de LLM | `lib/rate-limit.ts` | Proteção de rajada, **separada** de `PLAN_LIMITS` — quota diz quanto, isto diz com que velocidade. Chamado como primeira linha do `try` de cada rota, antes de qualquer débito de quota. Erro sobe como `status: 429` + `code: 'rate_limited'` via `toApiErrorResponse`. |
| Idempotência do webhook Stripe | `app/api/webhooks/stripe/route.ts` | `claimOnce` por `event.id` (24h). A trava é **liberada no catch** — sem isso a reentrega do Stripe seria descartada como duplicata e o evento se perderia. |

**Autorização nunca vem do snapshot.** As rotas de stream continuam checando dono no Postgres
antes de ler o cache — as chaves são indexadas só por `jobId`.

---

## Logs estruturados (`lib/logger.ts`)

Uma linha JSON por evento, no formato `{"level","event",...campos}` — a Vercel mostra cada linha como uma entrada pesquisável, com o nível vindo do stream (`console.info/warn/error`).

```ts
logger.info('mock_exam.finish.completed', { mockExamId, attemptId, userId, score, durationMs });
logApiError('mock_exam.finish.failed', err, { mockExamId, attemptId, userId });
```

- **Nome do evento:** `dominio.acao.resultado` em snake/dot (`mock_exam.answers.batch_failed`). É o que se busca no painel da Vercel.
- **`logApiError(event, err, context)`** (`lib/api-error.ts`) no `catch` das rotas, antes de `toApiErrorResponse`: status ≥ 500 vira `error`, o resto `warn`. Inclui `errorName`, `errorMessage` (truncada), `errorCode` (Prisma), `errorStatus`/`errorRequestId` (OpenAI) e as 4 primeiras linhas do stack.
- **Contexto mínimo:** ids (`userId`, `mockExamId`, `attemptId`), contagens e durações. Nunca logue respostas do usuário, e-mail, tokens ou o prompt do LLM.
- **`auth()` fica dentro do `try`** das rotas: um erro de banco na sessão precisa cair no log e virar JSON, não num 500 sem corpo.

Eventos de simulado: `mock_exam.finish.{completed,already_finished,failed,unauthorized,referral_failed}`, `mock_exam.answers.{started,batch_done,batch_failed,batch_invalid_entries,completed,failed,regraded,regrade_failed,request_failed,unauthorized,metrics_failed}`, `mock_exam.result.*`, `mock_exam.discard.*`. `batch_failed` traz `responseLength`/`responsePreview` quando o LLM devolveu algo que não é o JSON esperado.

---

## Service layer (`features/services/`)

| File | Responsibility |
|---|---|
| `generation/openai.service.ts` | `call(prompt, input)` via Responses API with `web_search` forced via `tool_choice: 'required'` when `webSearch: true` (default) — the tool being available doesn't mean the model uses it; forcing avoids it silently answering from training data. Returns `{ text, inputTokens, outputTokens }`. |
| `billing/quota.service.ts` | `checkAndRecordQuestions(userId, count)` → `{ logId }`. Also enforces `create_exam` and `checkAndRecordAutoConfig(userId)` (per-period `autoConfigThisPeriod`, `PLAN_LIMITS[plan].autoConfigPerPeriod`). `checkAutoConfigAvailable(userId)` is a read-only peek (no increment) used before the identify call. `rollbackQuota(logId)` refunds `questionsGeneratedThisPeriod` or `autoConfigThisPeriod` depending on the log's `action`. Also exports `syncTokenPlan(token, trigger)` — refreshes the JWT's plan from the DB (5 min TTL, sprint expiry), called by `auth.ts`. |
| `billing/metrics.service.ts` | `createLog(userId, action, count = 1)` — `count: 0` tracks tokens without consuming a billable unit (used by the auto-config identify call). `recordStep(logId, step, tokens, durationMs)` (fire-and-forget) + `finalize(logId, ms)`. |
| `exam/exam.service.ts` | Unified CRUD for Exam/Section/Topic (both types). |
| `exam/exam-question.service.ts` | `saveAnswers`, `saveExplanations`. |
| `exam/exam-catalog.service.ts` | `getTemplates(userId)`, `forkExam`, `promoteExam`, admin catalog entries. |
| `exam/question-bank.service.ts` | Unified question search across exam types. |
| `generation/generation-job.service.ts` | Async batch generation — batches of 5 topics, per-topic status tracking. Publica o progresso no Redis a cada transição (ver seção Redis). Exporta `detectQuestionLanguage(text)`, heurística que detecta a questão gerada no idioma errado. |
| `generation/job-progress.service.ts` | Snapshot de progresso de job para o SSE — `read*`/`publish*` para geração e auto-config, com fallback no Postgres. |
| `auto-config/auto-config-job.service.ts` | Auto-config pipeline — `identifyExam` (cheap lookup) + `createAutoConfigJob`/`runAutoConfigJob`/`cancelAutoConfigJob` (research→review→format, one `AutoConfigJob` row, one `auto_config` unit). |
| `billing/billing.service.ts` | `getBillingDetails(userId)` reads the Stripe customer/subscription/invoices into `BillingDetails` (current-period end lives on `subscription.items.data[0].current_period_end`, not the subscription root). `cancelSubscription(userId, reason?)` sets `cancel_at_period_end`. Optional bits (tax id, upcoming-invoice preview) fail soft to `null`. |
| `billing/referral.service.ts` | `getStats(userId)`, `getOrCreateReferralCode(userId)` (lazy backfill), `activateIfEligible(userId)` — two-way bonus on real activation, capped per account. Also exports `generateUniqueReferralCode(isTaken)`, used by register and `auth.ts`. |

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
