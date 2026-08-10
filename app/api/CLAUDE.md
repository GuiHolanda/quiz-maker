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

Service: `features/services/quota.service.ts`.

| Route | Method | Description |
|---|---|---|
| `billing/checkout` | GET | Create Stripe checkout session, returns `{ url }` |
| `billing/portal` | GET | Create Stripe customer portal URL, returns `{ url }` |
| `billing/usage` | GET | Returns current quota usage (`UsageStats`) |

### `exam/`

Unified domain for `ExamType: 'certification' | 'public_exam'`.

| Route | Method | Description |
|---|---|---|
| `exam/exams` | GET | List user's exams (filtered by `?type=`) |
| `exam/save-exam` | POST/PUT/PATCH/DELETE | Create exam; add section; update exam/section/topic; delete |
| `exam/providers` | GET | List all providers |
| `exam/exam-boards` | GET/POST | List / create exam boards |
| `exam/save-questions` | POST | Persist generated questions to DB |
| `exam/questions/[questionId]/explanation` | GET | Generate and cache per-option explanation |
| `exam/browse-questions/questions` | GET/DELETE | Paginated list + delete (ownership check) |
| `exam/browse-questions/summary` | GET | Question counts grouped by exam/section |
| `exam/catalog` | GET | List exam templates (`isTemplate=true`), filtered by userId |
| `exam/fork-exam` | POST | Fork catalog template into user's exam; returns full `Exam` object |
| `exam/extract-from-edital` | POST | Extract exam structure from uploaded edital via OpenAI |

Services: `exam.service.ts`, `exam-question.service.ts`, `exam-catalog.service.ts`, `quiz-generator.service.ts`.

### `generation-job/`

Async question generation with SSE progress streaming.

| Route | Method | Description |
|---|---|---|
| `generation-job` | POST | Create job (returns `{ jobId }` immediately) |
| `generation-job` | GET | Get active job for `?type=&refKey=` (reconnect on reload) |
| `generation-job/[jobId]` | GET | Polling fallback — current status + topics array |
| `generation-job/[jobId]` | DELETE | Cancel running job |
| `generation-job/[jobId]/stream` | GET | SSE stream: `progress`/`done`/`error` with `topics[]`. `maxDuration = 300`. |
| `generation-job/[jobId]/save` | POST | Persist approved questions from completed job |

Service: `features/services/generation-job.service.ts`.

### `mock-exams/`

Simulados based on saved questions. Each mock exam is a fixed question selection answered in separate attempts.

| Route | Method | Description |
|---|---|---|
| `mock-exams` | GET | List user's mock exams with attempts and best score |
| `mock-exams` | POST | Create mock exam (validates question availability) |
| `mock-exams?id={id}` | DELETE | Delete mock exam |
| `mock-exams/[id]` | GET | Full detail (questions + options + answers + explanations) |
| `mock-exams/[id]/answers` | POST | **Ensure answers** — generate missing `Answer` rows idempotently. Returns `{ generated: N }`. |
| `mock-exams/[id]/attempts` | POST | Start new attempt |
| `mock-exams/[id]/attempts/[attemptId]` | PATCH/GET | Finish attempt / Get result with score and breakdown |

Service: `app/api/mock-exams/mock-exam.service.ts` (co-located).

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

### Other routes

| Route | Method | Description |
|---|---|---|
| `ai/ai-chat` | POST | Streaming SSE chat. Requires `pro_ai`, `tester`, or `admin`. |
| `dashboard/stats` | GET | Dashboard metrics |
| `usage/history` | GET | Paginated usage log for current user |
| `usage/history/filters` | GET | Filter options for usage history page |
| `search` | GET | Global search across exams and questions |
| `cron/cleanup-stale-jobs` | GET | Marks stuck `running` jobs >30min as `error`. Protected by `CRON_SECRET`. Runs at `0 3 * * *`. |
| `webhooks/stripe` | POST | Handle Stripe subscription events — updates `user.plan`. |

---

## Service layer (`features/services/`)

| File | Responsibility |
|---|---|
| `openAI.service.ts` | `call(prompt, input)` via Responses API with `web_search_preview`. Returns `{ text, inputTokens, outputTokens }`. |
| `quota.service.ts` | `checkAndRecordQuestions(userId, count)` → `{ logId }`. Also enforces `create_exam`. |
| `metrics.service.ts` | `recordStep(logId, step, tokens, durationMs)` (fire-and-forget) + `finalize(logId, ms)`. |
| `exam.service.ts` | Unified CRUD for Exam/Section/Topic (both types). |
| `exam-question.service.ts` | `saveAnswers`, `saveExplanations`. |
| `exam-catalog.service.ts` | `getTemplates(userId)`, `forkExam`, `promoteExam`, admin catalog entries. |
| `quiz-generator.service.ts` | Distribute questions across sections. |
| `question-bank.service.ts` | Unified question search across exam types. |
| `generation-job.service.ts` | Async batch generation — batches of 5 topics, per-topic status tracking. |
| `aiChat.service.ts` | Validate messages, select prompt, stream response. |

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
