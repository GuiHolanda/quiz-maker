# Backend Structure — `app/api/`

## Overview

All API routes live under `app/api/` following Next.js App Router conventions (one `route.ts` per folder). Routes are grouped by domain. Business logic lives in `features/services/` — route handlers only validate the session, delegate to a service, and return a `NextResponse`.

---

## Domain groups

### `auth/`

Authentication flows. Services stay co-located here (not in `features/services/`) because they are not shared with other domains.

| Route | Method | Description |
|---|---|---|
| `auth/[...nextauth]` | — | NextAuth.js catch-all |
| `auth/register` | POST | Register new user (bcrypt, duplicate check) |
| `auth/forgot-password` | POST | Send password-reset email via Resend |
| `auth/reset-password` | POST | Validate token and update password |

---

### `billing/`

Stripe integration and quota tracking. Service: `features/services/quota.service.ts`.

| Route | Method | Description |
|---|---|---|
| `billing/checkout` | GET | Create Stripe checkout session, returns `{ url }` |
| `billing/portal` | GET | Create Stripe customer portal URL, returns `{ url }` |
| `billing/usage` | GET | Returns current quota usage (`UsageStats`) |

---

### `certification/`

Everything related to professional certification exam preparation (any domain: IT, finance, engineering, healthcare, law, and others).

| Route | Method | Description |
|---|---|---|
| `certification/certifications` | GET | List user's certifications with topics |
| `certification/save-certification` | POST | Create new certification |
| `certification/save-certification` | PUT | Add topic to certification |
| `certification/save-certification` | PATCH | Update certification or topic metadata |
| `certification/save-certification` | DELETE | Delete certification or topic (`?certificationKey=` or `?topicId=`) |
| `certification/question-generator` | GET | Generate questions via OpenAI (web search) for a topic |
| `certification/save-questions` | POST | Persist generated questions to DB |
| `certification/get-answers` | POST | Generate and save correct answers via OpenAI |
| `certification/questions/[questionId]/explanation` | GET | Generate and cache per-option explanations for a question |
| `certification/quiz-generator` | GET | Fetch stored questions distributed across topics for a quiz |
| `certification/browse-questions/questions` | GET | Paginated list of stored questions (filterable by cert + topic) |
| `certification/browse-questions/questions` | DELETE | Delete a stored question (ownership check) |
| `certification/browse-questions/summary` | GET | Question counts grouped by certification and topic |

Services: `features/services/certification.service.ts`, `features/services/question.service.ts` (`CertificationQuestionService`), `features/services/quiz-generator.service.ts`, `features/services/browse.service.ts` (`BrowseQuestionsService`, `BrowseSummaryService`).

---

### `public-exam/`

Everything related to Brazilian public-sector competitive exams (concursos públicos).

| Route | Method | Description |
|---|---|---|
| `public-exam/public-exams` | GET | List user's public exams (with exam board + subjects + topics) |
| `public-exam/exam-boards` | GET | List all exam boards |
| `public-exam/exam-boards` | POST | Create or upsert an exam board |
| `public-exam/save-public-exam` | POST | Create new public exam |
| `public-exam/save-public-exam` | PUT | Add subject or topic |
| `public-exam/save-public-exam` | PATCH | Update exam, subject, or topic metadata |
| `public-exam/save-public-exam` | DELETE | Delete public exam, subject, or topic (`?examId=`, `?subjectId=`, or `?topicId=`) |
| `public-exam/question-generator` | GET | Generate questions via OpenAI + web search for a subject/topic |
| `public-exam/save-questions` | POST | Persist generated questions to DB |
| `public-exam/get-answers` | POST | Generate and save answers/explanations via OpenAI |
| `public-exam/browse-questions/questions` | GET | Paginated list of stored public-exam questions |
| `public-exam/browse-questions/questions` | DELETE | Delete a stored question (ownership check) |
| `public-exam/browse-questions/summary` | GET | Question counts grouped by exam and subject |

Services: `features/services/public-exam.service.ts`, `features/services/question.service.ts` (`PublicExamQuestionService`), `features/services/browse.service.ts` (`PublicExamBrowseQuestionsService`, `PublicExamBrowseSummaryService`).

---

### `certification-simulados/`

Simulados (mock exams) baseados em questões de certificação salvas pelo usuário. Cada simulado é uma seleção fixa de questões do banco, agrupadas por tópicos, que o usuário responde em tentativas separadas.

| Route | Method | Description |
|---|---|---|
| `certification-simulados` | GET | Lista simulados do usuário com tentativas e melhor pontuação |
| `certification-simulados` | POST | Cria simulado: valida disponibilidade de questões por tópico (consultando `Question.certificationTitle === certLabel`) e sorteia IDs |
| `certification-simulados?id={id}` | DELETE | Remove simulado do usuário |
| `certification-simulados/[id]` | GET | Detalhe completo do simulado (questões + opções + answer + explicações) |
| `certification-simulados/[id]/answers` | POST | **Garante gabarito**: busca questões do simulado sem `Answer`, agrupa por tópico, chama OpenAI em batches de 10, persiste `Answer` rows. Idempotente. Retorna `{ generated: N }`. |
| `certification-simulados/[id]/attempts` | POST | Inicia nova tentativa |
| `certification-simulados/[id]/attempts/[attemptId]` | PATCH | Finaliza tentativa (salva respostas + score) |
| `certification-simulados/[id]/attempts/[attemptId]` | GET | Resultado da tentativa: score, breakdown por tópico, respostas vs gabarito |

**Important — `certLabel` vs `certKey`:** simulados são criados com `certKey` (slug), mas `Question.certificationTitle` armazena o **label** humano da certificação (vindo do gerador da LLM). O service resolve o label via `prisma.certification.findFirst({ key: certKey })` antes de qualquer query em `Question`. Quebra esse contrato e a criação retorna 422 "Questões insuficientes" mesmo com questões existentes no banco.

**Fluxo de gabarito (ensure-answers):** o frontend chama `POST /[id]/answers` **antes** de iniciar a tentativa, garantindo que todas as questões do simulado tenham `Answer` no banco. Sem isso, a página de resultado fica sem `correctOptions` (cálculo de acerto quebra) e o endpoint `/explanation` retorna 404. A página de resultado também faz fallback chamando o endpoint quando detecta questões sem answer (cobre simulados antigos).

Service: `app/api/certification-simulados/certification-simulados.service.ts` (`CertificationSimuladosService`). Co-located, não compartilhado com client. Usa `OpenAIService` + `CertificationQuestionService` (lazy-init para não exigir `OPENAI_API_KEY` em testes unitários).

---

### `mock-exams/`

Simulados (mock exams) baseados em questões de concurso público salvas pelo usuário. Mesmo padrão de `certification-simulados/`, com grouping por **subject** ao invés de **topic**.

| Route | Method | Description |
|---|---|---|
| `mock-exams` | GET | Lista simulados do usuário |
| `mock-exams` | POST | Cria simulado: valida disponibilidade por matéria (com fallback FK + denormalized name match) |
| `mock-exams?id={id}` | DELETE | Remove simulado |
| `mock-exams/[id]` | GET | Detalhe completo do simulado |
| `mock-exams/[id]/answers` | POST | **Garante gabarito** — idêntico ao cert: questões sem `PublicExamAnswer` são agrupadas por subject, geradas via OpenAI em batches de 10, persistidas. Idempotente. Retorna `{ generated: N }`. |
| `mock-exams/[id]/attempts` | POST | Inicia nova tentativa |
| `mock-exams/[id]/attempts/[attemptId]` | PATCH | Finaliza tentativa |
| `mock-exams/[id]/attempts/[attemptId]` | GET | Resultado da tentativa com breakdown por matéria |

Service: `app/api/mock-exams/mock-exam.service.ts` (`MockExamService`). Mesmo padrão lazy-init de `OpenAIService` + `PublicExamQuestionService` do cert.

---

### `admin/`

Admin dashboard API. All routes verify `plan === 'admin'` via a direct DB lookup before executing. Business logic lives in the co-located `admin.service.ts`.

| Route | Method | Description |
|---|---|---|
| `admin/overview` | GET | Aggregate metrics: total users, by-plan breakdown, active subscriptions, total questions generated, avg usage % |
| `admin/users` | GET | Paginated user list with search, plan filter, subscriptionStatus filter |
| `admin/users/[id]` | PATCH | Update a user's `plan` and/or `customQuotaOverride` (-1 = ∞, null = remove override). Writes to `AdminAuditLog`. |
| `admin/audit-log` | GET | Paginated history of admin actions with admin/target user details |

Service: `app/api/admin/admin.service.ts` (`AdminService`).

**Important:** The `AdminService` can also be called directly from server components (e.g. `app/admin/overview/page.tsx`). Do NOT use `features/connectors.ts` in server components — the axios client uses a relative `baseURL` and will fail server-side.

---

| Route | Method | Description |
|---|---|---|
| `ai/ai-chat` | POST | Streaming SSE chat powered by OpenAI with web search. Returns `text/event-stream`. Requires plan `pro_ai`, `tester`, or `admin` — returns 403 otherwise. |

Service: `features/services/aiChat.service.ts`.

---

### `webhooks/`

| Route | Method | Description |
|---|---|---|
| `webhooks/stripe` | POST | Handle Stripe subscription events (`checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`). Updates `user.plan` in DB. Differentiates `pro` vs `pro_ai` by price ID (`STRIPE_PRICE_ID_PRO_AI_MONTHLY/YEARLY`). |

---

## Service layer (`features/services/`)

Route handlers never contain business logic — they delegate to services.

| File | Responsibility |
|---|---|
| `openAI.service.ts` | OpenAI client wrapper — single `call(prompt, input)` method using Responses API with `web_search_preview` |
| `quota.service.ts` | Check and record usage quota per user per period. Supports `customQuotaOverride` (sentinel `-1` = ∞). Actions: `generate_questions`, `create_certification`, `create_public_exam`. |
| `certification.service.ts` | CRUD for certifications and topics |
| `public-exam.service.ts` | CRUD for public exams, subjects, and topics |
| `question.service.ts` | `validateAiQuestions` (shared), `CertificationQuestionService` (with `saveExplanations`), `PublicExamQuestionService` |
| `browse.service.ts` | `BrowseQuestionsService`, `PublicExamBrowseQuestionsService`, `BrowseSummaryService`, `PublicExamBrowseSummaryService` |
| `quiz-generator.service.ts` | Parse params, distribute questions across topics, fetch stored questions |
| `aiChat.service.ts` | Validate chat messages, select prompt, stream OpenAI response |

Admin service is co-located in `app/api/admin/admin.service.ts` (not in `features/services/`) because it is not shared with client code.

Auth services (`register.service.ts`, `forgot-password.service.ts`, `reset-password.service.ts`) remain co-located in `app/api/auth/` and are not shared.

Simulado services (`app/api/certification-simulados/certification-simulados.service.ts`, `app/api/mock-exams/mock-exam.service.ts`) também são co-located. Ambos seguem o mesmo contrato `ensureAnswers(id, userId)` para garantir gabarito antes da tentativa — método idempotente que só gera para questões sem `Answer`.

---

## Conventions

- Route handler pattern: `auth check → quota check (if needed) → service call → NextResponse.json()`
- Error shape: `{ error, message }` with `status: err.status || 500`
- All imports use `@/` absolute paths — no relative `../../` across directories
- No barrel `index.ts` files

---

## Testes

Os services da camada de negócio têm cobertura de testes unitários em `tests/api/services/`. Ao modificar um service coberto, rodar `npm test` para garantir que não há regressão.

Services cobertos: `quota`, `certification`, `public-exam`, `quiz-generator`, `register`, `reset-password`, `mock-exam`, `certification-simulados`.

**Lazy init no constructor:** services que instanciam `OpenAIService` ou outros services pesados devem usar **getters com lazy init** (instância criada na primeira leitura), nunca `private readonly x = new X()` na class field. `new OpenAI()` exige `OPENAI_API_KEY` no boot e quebra os testes unitários (que rodam sem env vars). Padrão usado em `CertificationSimuladosService` e `MockExamService`:

```ts
private openAIServiceInstance: OpenAIService | null = null;

private get openAIService(): OpenAIService {
  this.openAIServiceInstance ??= new OpenAIService();
  return this.openAIServiceInstance;
}
```

Padrões de mock (Prisma, `$transaction`, dependências externas) estão documentados na seção **Testes Unitários** do `CLAUDE.md` raiz.
