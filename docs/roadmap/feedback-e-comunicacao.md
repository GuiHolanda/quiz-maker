# Roadmap — Feedback e Comunicação

> Última atualização: 2026-09-26 · Tópico: como os usuários falam com a gente e como a gente ouve.
>
> **Design e decisões:** [SDD](../sdd/feedback-e-comunicacao.md) (regras de negócio `RN-xx`, contratos, modelo de
> dados) · [ADRs](../adr/README.md) (0001 e 0002 cobrem este tópico).

## Índice

- [Status geral](#status-geral)
- [Contexto e diagnóstico](#contexto-e-diagnóstico)
- [Fase 0 — Infra compartilhada](#fase-0--infra-compartilhada)
- [F1 — Reportar questão](#f1--reportar-questão)
- [F2 — Widget de feedback global](#f2--widget-de-feedback-global)
- [Backlog](#backlog)
- [Convenções e registro de mudanças](#convenções-e-registro-de-mudanças)

---

## Status geral

| Frente | Fase | Esforço | Status | Progresso |
|---|---|---|---|---|
| Fase 0 — Infra compartilhada | 1 | M | Em andamento | 18/19 |
| F1 — Reportar questão | 1 | M | Em andamento | 22/23 |
| F2 — Widget de feedback global | 1 | M | Em andamento | 15/16 |
| Backlog (F3–F7) | 2+ | — | Não iniciado | 0/5 |
| Riscos abertos | — | — | Em aberto | 0/2 |

Ordem de execução: **Fase 0 → F1 → F2**. F1 vai antes de F2 porque valida a cadeia inteira (model → rota →
provider → modal → e-mail) numa superfície que já tem uma ação análoga (delete) e um modal análogo
(`ConfirmModal`), e porque com 5 usuários a qualidade das questões *é* o produto. F2 reaproveita ~80%.

---

## Contexto e diagnóstico

### Situação

A plataforma tem 5 usuários e **nenhum canal de feedback**. O único sinal coletado hoje é o motivo de
cancelamento em `app/(workspace)/billing/components/CancelSubscriptionPanel.tsx`, que vai para o Stripe: só se
ouve o usuário no momento em que ele está indo embora.

**O marketing já vende uma feature que não existe.** Duas seções prometem o botão de reportar questão:

- `homepage.quality.report.body` — *"Encontrou um erro? Reporte diretamente na questão."*
  (`app/(marketing)/components/home/QualitySection.tsx`)
- `landing.trust.report.desc` — *"Toda questão tem botão de reportar. Itens sinalizados saem de circulação até
  nova revisão."* (`app/(marketing)/components/exam-landing/ExamTrustSection.tsx`)

Com 5 usuários o gargalo não é volume, é **não perder sinal**. Um formulário genérico rende quase nada nessa
escala; o que rende é capturar no momento exato da fricção, com contexto anexado automaticamente.

### Decisões tomadas (2026-09-25)

| Decisão | Valor |
|---|---|
| Entrega desta rodada | Só o roadmap. Nenhum código, schema ou migration |
| Fase 1 | **F1** (reportar questão) + **F2** (widget de feedback global) |
| Schema Prisma | Aprovado criar models **novos**. **Não** aprovado alterar models existentes (inclusive `ExamQuestion`) |
| Localização | `docs/roadmap/` — um arquivo por tópico |

A aprovação de schema é exigida por [CLAUDE.md](../../CLAUDE.md) ("Do not modify the Prisma schema without
explicit approval"). Ela cobre `QuestionReport` e `Feedback` e nada além disso.

### Consequências que moldam o desenho

1. **Sem inbox admin na Fase 1, o canal de leitura é e-mail.** Novo método em
   [email.service.ts](../../features/services/email.service.ts) (Resend já funciona), destinatário na env
   `FEEDBACK_INBOX_EMAIL`, disparo por evento via `after()`. O inbox admin é o F3 do backlog.
2. **A promessa de "itens sinalizados saem de circulação até nova revisão" continua descoberta.** Ela exige um
   campo de moderação em `ExamQuestion`, que não foi aprovado. Ver [Riscos abertos](#riscos-abertos).
3. **Os models não podem ter FK.** O Prisma exige campo de relação nos dois lados: declarar
   `question ExamQuestion @relation(...)` obrigaria a adicionar `reports QuestionReport[]` dentro de
   `ExamQuestion` (erro P1012). Adicionar a FK só no SQL também não serve — `prisma migrate dev` detecta como
   drift e pede reset. Logo: **colunas escalares puras**, como o precedente `AdminAuditLog`
   ([schema.prisma](../../prisma/dev/schema.prisma), `model AdminAuditLog`). A perda de integridade
   referencial é compensada com **snapshot** dos campos relevantes no momento do insert.

### Métricas de sucesso

Com 5 usuários, taxas não significam nada. Métricas absolutas, revisadas ao fim do 1º mês:

- Nº de reports de questão recebidos (e quantos resultaram em correção)
- Nº de feedbacks por categoria (`bug` / `suggestion` / `praise` / `question`)
- Tempo até a primeira resposta do time a um feedback
- Nº de usuários distintos que usaram algum dos dois canais (de 5)

### Fora de escopo (YAGNI para esta escala)

Chat de suporte ao vivo · help center / base de conhecimento · NPS completo segmentado · Intercom / Crisp ·
fórum ou comunidade · roadmap público votável.

### Riscos abertos

- [ ] **Promessa de marketing sem cobertura.** "Itens sinalizados saem de circulação" exige um campo de status
  em `ExamQuestion` (alteração de model existente, sem aprovação). Decidir, antes do lançamento público,
  entre: (a) pedir aprovação e implementar depois da Fase 1, ou (b) ajustar o copy de
  `landing.trust.report.desc` para não prometer a retirada automática.
- [ ] **Sem inbox, o time depende de e-mail.** Se `FEEDBACK_INBOX_EMAIL` não estiver configurado na Vercel, o
  feedback fica salvo no banco mas **ninguém é avisado**. Configurar a env faz parte do aceite da Fase 0.

---

## Fase 0 — Infra compartilhada

**Status:** Em andamento · **Fase:** 1 · **Depende de:** nada

Tudo aqui precisa existir **antes** de qualquer UI. A ordem importa — os itens estão na sequência de execução.

### Documentação (pré-requisito)

- [x] **D.1** ADRs 0001 e 0002 em [docs/adr/](../adr/README.md)
- [x] **D.2** [SDD](../sdd/feedback-e-comunicacao.md) com regras de negócio, contratos e matriz de testes
- [x] **D.3** `.gitignore` deixa de ignorar `docs/roadmap/`, `docs/adr/` e `docs/sdd/` (ver [docs/adr/README.md](../adr/README.md))

### Checklist

- [x] **0.1 Models.** Adicionar `QuestionReport` e `Feedback` ao fim de `prisma/dev/schema.prisma` **e**
  `prisma/prod/schema.prisma` (campos no [SDD](../sdd/feedback-e-comunicacao.md#modelo-de-dados), incluindo
  `updatedAt`). Colunas escalares, **sem `@relation`**.
- [x] **0.2 Migration dev.** SQL gerado por `prisma migrate diff` e aplicado com `prisma migrate deploy` (mesma
  saída de `migrate dev`, sem prompt interativo), depois `npm run prisma:generate:dev`. **Uma** migration para os
  dois models — o ritual de pareamento é a parte cara; fazer duas vezes dobra o risco.
- [x] **0.3 Migration prod.** `prisma/prod/migrations/<ts+1s>_add_feedback_tables/migration.sql` com o **mesmo
  sufixo** da dev. SQL PostgreSQL gerado por `migrate diff` entre os datamodels, com o estilo da migration
  `20260901003406_add_generation_job_language` (cabeçalho comentado + `IF NOT EXISTS`).
- [x] **0.4 Validar schema e migrations.** `diff prisma/dev/schema.prisma prisma/prod/schema.prisma` deve mostrar
  **exatamente 2 hunks** (`1c1` e `6c6`); depois `npm run check:migrations` e `npm test`.
- [x] **0.5 i18n.** Adicionar **todas** as chaves `feedback.*` de F1 e F2 (listas nas seções abaixo) em
  `public/messages/pt.properties` e `en.properties` **primeiro**; só depois registrar `'feedback'` em
  `WORKSPACE_MESSAGE_PREFIXES` de [i18n-prefixes.ts](../../config/i18n-prefixes.ts).
- [x] **0.6 Rate limit.** Duas entradas em `RateLimitedAction` e `LIMITS` de
  [rate-limit.ts](../../lib/rate-limit.ts): `question_report: { requests: 8, window: '5 m' }` e
  `feedback_submit: { requests: 3, window: '10 m' }`.
- [x] **0.7 E-mail interno.** Em [email.service.ts](../../features/services/email.service.ts): `escapeHtml`,
  função pura `buildInternalAlert(input)` e `sendInternalAlert` (assinatura abaixo). Os wrappers
  `sendQuestionReportAlert` e `sendFeedbackAlert` ficam em F1/F2 (1.2 e 2.2): dependem do que cada service devolve.
- [x] **0.8 Env.** Documentar `FEEDBACK_INBOX_EMAIL` no bloco de env do [README.md](../../README.md) (junto de
  `RESEND_API_KEY`). **Não** definir em `.env.test`. A configuração na Vercel é ação do dono do produto e está no
  aceite abaixo.
- [x] **0.9 Provider.** `features/reducers/feedback.reducer.ts` (reducer puro e `resolveFeedbackError`), `features/providers/feedback.provider.tsx`,
  `features/hooks/useFeedback.hook.ts`, montados em
  `app/(workspace)/layout.tsx` dentro do `LimitModalProvider`. O provider já nasce com `openQuestionReport`,
  `openFeedback` e o envio (SDD D-10); **sem modais** — F1/F2 os renderizam. Molde:
  [limit-modal.provider.tsx](../../features/providers/limit-modal.provider.tsx) e
  [notifications.reducer.ts](../../features/reducers/notifications.reducer.ts).
- [x] **0.10 Constantes e tipos.** `config/constants/feedback.ts` (URLs, `QUESTION_REPORT_REASONS`,
  `FEEDBACK_CATEGORIES`, superfícies, status e tipos derivados; os limites de tamanho entram com o primeiro
  consumidor, em F1/F2), re-exportado por
  `config/constants/index.ts` como `generation-job.ts`. Payloads e resultados em `shared/types/index.ts`.
- [x] **0.11 Connectors.** `submitQuestionReport` e `submitFeedback` em
  [connectors.ts](../../features/connectors.ts) (nomes propostos).
- [x] **0.12 Suporte de E2E.** As duas tabelas em [db-cleanup.ts](../../tests/e2e/support/db-cleanup.ts). As
  entradas de [selectors.ts](../../tests/e2e/support/selectors.ts) entram com os componentes (1.10 e 2.8).
- [x] **0.13 Docs internas.** Seção `feedback/` na tabela de rotas de [app/api/CLAUDE.md](../../app/api/CLAUDE.md).
- [x] **0.14 Testes unitários da Fase 0.** `feedback.reducer.test.ts` (RN-23 e RN-25),
  `feedback-i18n.test.ts` (paridade pt/en), `rate-limit.test.ts` estendido (RN-02) e
  `email.service.test.ts` (RN-19 a RN-21; hoje `EmailService` não tem nenhum teste).

### Aceite da Fase 0

Código concluído e verificado (`tsc`, suíte unitária, `check:migrations` e smoke de E2E). Falta o que não é código:

- [ ] `FEEDBACK_INBOX_EMAIL` configurada na Vercel (Production) — **ação do dono do produto**. Sem ela nenhum
  e-mail chega ao time (RN-20)
- [x] Merge na `main` aplicou `add_feedback_tables` em produção (`Migrate Prod`, run `36164385545`, 2026-09-25)

### Canal de saída para o time: e-mail por evento (decisão)

Escolhido **e-mail por evento via `after()`**, não digest diário. Com 5 usuários o volume é 0–5/dia e o valor do
feedback decai com a latência; o digest é *mais* infraestrutura, não menos:

| | Por evento (escolhido) | Digest diário |
|---|---|---|
| Infra nova | Nenhuma (`after()` já é usado em `app/api/cron/cleanup-stale-jobs/route.ts`) | Entrada em `vercel.json`, rota de cron, guard de `CRON_SECRET`, estado "já enviei" |
| Latência | Segundos | Até 24 h |
| Falha | Visível no log do request; perde 1 item | Cron falha em silêncio → o dia inteiro some |

Os campos `notifiedAt` nos dois models deixam o upgrade aberto: quando o volume justificar, um
`GET /api/cron/feedback-digest` que seleciona `notifiedAt: null` entra no array `crons` de `vercel.json` **sem
nova migration**.

```ts
async sendInternalAlert(input: {
  subject: string;
  heading: string;
  rows: ReadonlyArray<{ label: string; value: string }>;
  body?: string;
}): Promise<boolean>
```

Três desvios **obrigatórios** em relação aos 4 métodos existentes de `EmailService`:

1. **Nunca lança** e devolve `true` só quando o Resend confirma (o chamador usa isso para `notifiedAt`). Os 4 atuais fazem `throw` no erro do Resend. Aqui o feedback já está persistido; derrubar a
   resposta do usuário porque nosso inbox caiu é errado, e dentro de `after()` um `throw` vira unhandled
   rejection. Loga com `logger.warn` e retorna.
2. **`escapeHtml` em `heading`, `rows[].value` e `body`.** Nenhum método atual interpola texto livre; aqui entra
   texto digitado pelo usuário num template HTML.
3. **Destinatário opt-in, sem fallback.** `if (!process.env.FEEDBACK_INBOX_EMAIL) { logger.warn(...); return; }`.
   É isso que impede dev, `next dev` e E2E de dispararem e-mail real.

### Diferenças de sintaxe entre as duas migrations

| | Dev (SQLite) | Prod (PostgreSQL) |
|---|---|---|
| Gerada por | `prisma migrate dev` | À mão |
| PK | `TEXT NOT NULL PRIMARY KEY` inline | Linha `CONSTRAINT "X_pkey" PRIMARY KEY ("id")` |
| Data/hora | `DATETIME` | `TIMESTAMP(3)` — `DATETIME` **falha** em `migration-completeness.test.ts` |
| Autoincremento | `AUTOINCREMENT` | Proibido pelo mesmo teste — por isso PK é cuid |
| Idempotência | Não usa | `IF NOT EXISTS` |
| Bloco de FK | Nenhum (sem relations) | Nenhum (sem relations) |

Como só criamos tabelas novas, `scripts/check-migrations.ts` (que caça `ADD COLUMN ... NOT NULL` sem `DEFAULT`)
passa trivialmente.

### Armadilhas deste repo

Todas verificadas no código durante a exploração.

| # | Armadilha |
|---|---|
| 1 | `prisma migrate dev` só escreve em `prisma/dev/migrations/`. O par prod é **manual**, com sufixo idêntico — [migration-completeness.test.ts](../../tests/unit/api/migration-completeness.test.ts) pareia por sufixo. Os timestamps dev/prod costumam diferir em 1 s; só o sufixo importa |
| 2 | Prod não aceita `DATETIME`, `AUTOINCREMENT` nem `PRAGMA` (assertivo no teste). Use `TIMESTAMP(3)` e cuid como PK |
| 3 | Os dois schemas são idênticos exceto 2 linhas (`generator client`/`prod_client`, `sqlite`/`postgresql`) e **nenhum teste verifica isso**. Esquecer o prod passa local e quebra o build da Vercel, que roda `prisma generate --schema=./prisma/prod/schema.prisma` |
| 4 | `schema-drift.test.ts` pula tabelas ausentes do `prisma/dev.db`. Adicionar os models ao schema sem rodar a migration dev passa em silêncio — rode `prisma:migrate:dev` no mesmo commit |
| 5 | Namespace i18n não registrado ⇒ `t('feedback.x')` renderiza a chave crua, sem erro de build nem de tsc. A **ordem importa**: chaves nos `.properties` antes do prefixo, senão [i18n-prefixes.test.ts](../../tests/unit/lib/i18n-prefixes.test.ts) falha ("todo prefixo declarado corresponde a chaves que existem") |
| 6 | `.properties`: 1543 linhas cada, mantidos alinhados linha a linha (nenhum teste verifica). **Use acento literal UTF-8**: 792 linhas usam literal contra 23 com `\u00xx`. O [CLAUDE.md](../../CLAUDE.md) manda usar escapes e está desatualizado nesse ponto |
| 7 | Sem FK não há cascade: `db-cleanup.ts` precisa deletar as duas tabelas explicitamente. Com `@@unique([userId, examQuestionId])`, resíduo da 1ª rodada de E2E faz a 2ª receber 409 — flakiness que parece bug de produto |
| 8 | `ExamQuestion.userId` é **nulável** (questões de pool/catálogo). A checagem de propriedade precisa aceitar `null`, senão as questões que mais recebem report ficam irreportáveis |
| 9 | `ExamQuestion.id` é `Int` autoincrement, não cuid. Um `"12"` string no body atravessa até o Prisma e vira `PrismaClientValidationError` → 500 em vez de 400. Validar com `Number.isInteger` no service |
| 10 | `rateLimitError()` em `lib/rate-limit.ts` monta mensagem **em português hardcoded**. O padrão `notify.error(err?.response?.data?.message ?? t(...))` mostra PT a usuário EN — ramificar por `code === 'rate_limited'` e usar `feedback.rateLimited*`. Idem para 409: ramificar por `code === 'already_reported'` |
| 11 | O rate limit é **fail-open sem Redis**: em dev e E2E (sem `UPSTASH_REDIS_REST_*`) nunca dispara. O caso 429 não é testável em E2E |
| 12 | `throw` dentro de `after()` vira unhandled rejection. `sendInternalAlert` nunca lança |
| 13 | `.env.test` cai de volta no `.env` para `DATABASE_URL`, que pode ter `RESEND_API_KEY`. O gate em `FEEDBACK_INBOX_EMAIL` (sem fallback) é o que evita e-mail real em E2E |
| 14 | `vercel.json` **não** é tocado na Fase 1. Sem cron novo — não adicionar "por via das dúvidas" |
| 15 | `docs` do repo divergem do código em pontos vizinhos (ex.: CLAUDE.md cita `FullExamJob` e "30min" no cron; hoje é `GenerationJob` e 10 min). Na dúvida, confie no código |

---

## F1 — Reportar questão

**Status:** Em andamento · **Fase:** 1 · **Depende de:** Fase 0

Botão de report em 3 superfícies, com modal de motivo pré-definido + comentário livre e contexto capturado
automaticamente. **Fecha a promessa do marketing** (parcialmente — ver [Riscos abertos](#riscos-abertos)).

### Model `QuestionReport`

Colunas escalares, **sem `@relation`** (ver [consequência 3](#consequências-que-moldam-o-desenho)).

| Campo | Tipo | Decisão |
|---|---|---|
| `id` | `String @id @default(cuid())` | cuid, não autoincrement — mantém o SQL dev/prod quase idêntico |
| `examQuestionId` | `Int` | Casa com `ExamQuestion.id`. Sem FK |
| `userId` | `String` | **Não-nulável.** Em PostgreSQL NULLs são distintos em índice único: nulável quebraria em silêncio o dedupe `@@unique([userId, examQuestionId])`. Não há caso anônimo para reportar questão |
| `reason` | `String` | Whitelist validada no service. `String` e não enum porque **SQLite não suporta enum no Prisma** |
| `comment` | `String?` | Livre, máx. 1000 chars, `trim()` no service |
| `questionText` | `String` | **Snapshot** lido do banco pelo service — nunca do client |
| `examName` | `String` | Snapshot (segue a denormalização que `ExamQuestion` já faz) |
| `sectionName` | `String?` | Snapshot |
| `topicName` | `String?` | Snapshot |
| `surface` | `String` | `question_bank` \| `attempt` \| `review` |
| `mockExamAttemptId` | `Int?` | Contexto das superfícies de simulado |
| `status` | `String @default("open")` | `open` \| `triaged` \| `accepted` \| `rejected` \| `fixed` — usado pelo F3 |
| `resolutionNote` | `String?` | Fase 2 |
| `resolvedAt` | `DateTime?` | Fase 2 |
| `notifiedAt` | `DateTime?` | Gancho: se o e-mail por evento falhar, fica `null` e um cron futuro varre sem nova migration |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | Reabrir (F1) não muda `createdAt`; a fila do F3 precisa da atividade mais recente |

Índices: `@@unique([userId, examQuestionId])` (dedupe no banco, não na aplicação),
`@@index([status, createdAt])` (fila de triagem do F3), `@@index([examQuestionId])`.

Os campos "Fase 2" e `updatedAt` entram já na migration da Fase 0 para não exigir uma segunda migration pareada.

**Razões (`reason`):** `wrong_answer_key` · `ambiguous_statement` · `out_of_scope` · `typo` ·
`duplicate_options` · `other`.

**Consequências da ausência de FK:** questão deletada → report vira órfão, mas o snapshot o torna
auto-suficiente (e o e-mail não precisa de join). Usuário deletado → idem. Um report sobre questão que o
usuário depois apagou continua sendo sinal válido.

### Rota e service

`POST /api/feedback/question-report` → `app/api/feedback/question-report/route.ts` +
`question-report.service.ts` (novos). Molde: [search/route.ts](../../app/api/search/route.ts).

Payload do client (mínimo — nada que o servidor possa descobrir):
`{ examQuestionId: number, reason: string, comment?: string, surface: string, mockExamAttemptId?: number }`.

Handler: `auth()` → 401 · `request.json().catch(() => null)` → 400 · `enforceRateLimit('question_report', userId)`
dentro do `try` · `service.create(...)` · `after(() => emailService.sendQuestionReportAlert(report))` **fora do
service** · `catch` → `logApiError` + `toApiErrorResponse`.

**Validação no service, não no handler:** `tests/CLAUDE.md` manda não testar route handlers, então validação no
handler é validação não testada. O service lança `Object.assign(new Error(msg), { status })`.

**Visibilidade da questão:** `question.userId === null` → permitido (pool/catálogo) · `=== userId` → permitido ·
caso contrário **404** (não 403, para não confirmar a existência de questão alheia).

**Dedupe** (`findUnique` na chave composta antes do create):

- status `open` / `triaged` / `accepted` → **409** com `body.code = 'already_reported'` (o `code` atravessa
  `quotaDetail()` em `lib/api-error.ts` e chega ao client; também evita e-mail duplicado)
- status `fixed` / `rejected` → **reabre** (volta a `open` com o novo motivo/comentário), retorna 200. Cobre
  "foi corrigida e quebrou de novo" sem enfraquecer o unique

Retorno: `201 { id, status: 'open', createdAt }`.

Construtor do service: `constructor(prismaClient: PrismaClient = defaultPrisma as unknown as PrismaClient)`,
copiado de `app/api/search/search.service.ts` (o cast é necessário porque `PrismaService extends PrismaClient`).

### Componentes

O precedente de "um modal, vários gatilhos" é o `LimitModalProvider`. Estado nos 3 pais triplicaria
`useState` + handler + `notify` + busy.

| Arquivo | Papel |
|---|---|
| `features/providers/feedback.provider.tsx` (Fase 0) | Provider único de F1 e F2. Expõe `openQuestionReport(ctx)`; dono de estado do alvo, `isBusy`, submit e `notify`. `setIsBusy(false)` só no `catch` |
| `shared/components/ui/ReportQuestionModal.tsx` e `ReportQuestionForm.tsx` (novos) | Modal apresentacional (`isOpen`, `isLoading`, `onSubmit(reason, comment)`, `onClose`); o formulário, com estado próprio, vive dentro do `ModalContent` e zera a cada abertura. HeroUI `Modal` + `RadioGroup` (`@heroui/radio`, SDD D-14) + `Textarea`; footer no formato de [ConfirmModal.tsx](../../shared/components/ui/ConfirmModal.tsx) |
| `shared/components/ui/ReportQuestionButton.tsx` (novo) | Gatilho. Props: `{ examQuestionId, surface, mockExamAttemptId? }`. Lê o contexto sozinho ⇒ as 3 superfícies **não ganham estado novo**. `isIconOnly` + `buttonStyles.iconOnly.neutral` (report não é destrutivo) + `faFlag` |

Superfícies:

| Superfície | Onde | Mudança |
|---|---|---|
| `app/(workspace)/question-bank/components/QuestionBankCard.tsx` | `renderActions()`, antes do botão de delete | Só o botão. Zero mudança em `QuestionBankContent.tsx` |
| `app/(workspace)/simulados/[id]/tentativa/[attemptId]/components/AttemptQuestionPanel.tsx` | Row de header da questão, à direita do contador "respondidas/abertas" | Uma prop nova `attemptId: number`, passada por `AttemptShell.tsx` (que já a tem) |
| `app/(workspace)/simulados/[id]/resultado/[attemptId]/components/ReviewQuestionRow.tsx` | Rodapé `border-t border-divider pt-3` → `flex items-center justify-between` | `question.examQuestionId` já está disponível |

### Chaves i18n (namespace `feedback`, nomes apenas)

`reportQuestion` · `reportQuestionAria` · `reportModalTitle` · `reportModalSubtitle` · `reasonLabel` ·
`reasonWrongAnswerKey` · `reasonAmbiguousStatement` · `reasonOutOfScope` · `reasonTypo` ·
`reasonDuplicateOptions` · `reasonOther` · `commentLabel` · `commentPlaceholder` · `commentHelper` ·
`commentTooLong` · `reasonRequired` · `submitReport` · `reportSuccessTitle` · `reportSuccessDescription` ·
`reportErrorTitle` · `reportErrorDescription` · `alreadyReportedTitle` · `alreadyReportedDescription` ·
`rateLimitedTitle` · `rateLimitedDescription`. Reaproveitar `common.cancel`.

### Checklist

- [x] **1.1** `question-report.service.ts` com validação, visibilidade, dedupe/reabertura e snapshot
- [x] **1.2** `route.ts` (handler + rate limit + `after()` do e-mail) e `EmailService.sendQuestionReportAlert`
- [x] **1.3** `ReportQuestionModal.tsx`
- [x] **1.4** `ReportQuestionButton.tsx`
- [x] **1.5** Integrar em `QuestionBankCard.tsx`
- [x] **1.6** Integrar em `AttemptQuestionPanel.tsx` + prop `attemptId` em `AttemptShell.tsx`
- [x] **1.7** Integrar em `ReviewQuestionRow.tsx`
- [x] **1.8** Conferir que abrir o modal na tentativa **não** dispara `useNavigationGuard` e que o cronômetro
  (`useAttemptDeadline`) segue correndo. Sem atalhos de teclado na tentativa e o guard só intercepta `<a>`, então o
  código não muda; a prova é o cenário 3 do E2E (1.11)
- [x] **1.9** Testes unitários — `tests/unit/api/services/question-report.service.test.ts` (56 casos; os 10 principais, abaixo)
- [x] **1.10** `data-testid` novos nos componentes e em `selectors.ts` (seção `// Feedback`)
- [x] **1.11** E2E em `tests/e2e/tests/feedback.spec.ts` (5 cenários, 5/5 em 2026-09-26)

**Casos unitários (1.9):**

- [x] 404 quando a questão não existe
- [x] 404 quando `question.userId` é de outro usuário
- [x] **Permite** quando `question.userId === null` (pool)
- [x] Grava snapshot vindo do banco, ignorando campos homônimos do payload
- [x] 409 com `body.code === 'already_reported'` quando já há report aberto
- [x] Reabre report `fixed`/`rejected` em vez de duplicar
- [x] `reason` fora da whitelist → `rejects.toMatchObject({ status: 400 })`
- [x] `comment` > 1000 → 400; `comment` é trimado
- [x] `examQuestionId` não-inteiro → 400
- [x] Retorno `{ id, status: 'open', createdAt }`

**`data-testid` (1.10):** `question-report-btn` · `question-report-modal` ·
`question-report-comment` · `question-report-submit-btn`. Os motivos não têm `data-testid`: são escolhidos por
`getByRole('radio', { name })`, como o repo faz com opções de lista.

**Cenários E2E (1.11):** question-bank → reportar → toast de sucesso · reenviar o mesmo report → toast
`alreadyReported` (valida o unique ponta a ponta) · resultado de simulado → expandir accordion → reportar.
O `Radio` do HeroUI tem input com `opacity: 0.0001`: usar `dispatchEvent('click')`, nunca `.click({ force: true })`.
Com Redis configurado (`KV_REST_API_URL` no `.env`) o limite `question_report` (8 por 5 min) **vale no dev**: o spec faz
no máximo 3 POSTs reais por execução, mas rodar várias vezes seguidas pode dar 429.

### Critérios de aceite

- Botão visível nas 3 superfícies; um report vira uma linha em `QuestionReport` com snapshot correto
- O time recebe o e-mail (verificado em produção uma vez, com `FEEDBACK_INBOX_EMAIL` configurada)
- Reportar duas vezes a mesma questão mostra o toast de "já reportada", não erro genérico
- Usuário EN vê todas as mensagens em inglês, inclusive no caso de 429
- Questão de pool/catálogo é reportável

### Aceite da F1

Código concluído; 56 testes unitários do service, 16 novos do e-mail e o smoke do service contra o SQLite real
passaram. Falta o que depende de você:

- [x] Reiniciar o `next dev` (o client Prisma em memória é anterior às tabelas) e rodar
  `feedback.spec.ts` até 5/5. Feito em 2026-09-26 com o servidor do próprio Playwright: 5/5
- [ ] Um reporte real em produção chega por e-mail em `FEEDBACK_INBOX_EMAIL` e `notifiedAt` é preenchido (RN-22)

### Decisão registrada

O modal **não** pausa o cronômetro da tentativa: reportar leva segundos e pausar abriria brecha de burla.

---

## F2 — Widget de feedback global

**Status:** Em andamento · **Fase:** 1 · **Depende de:** Fase 0 (e do `FeedbackProvider`, criado lá)

Ponto de entrada sempre visível abrindo um modal com categoria + texto livre + contexto automático
(rota, plano, navegador). É o canal para tudo que **não** é sobre uma questão específica.

### Model `Feedback`

| Campo | Tipo | Decisão |
|---|---|---|
| `id` | `String @id @default(cuid())` | |
| `userId` | `String?` | **Nulável** — justificativa abaixo |
| `email` | `String?` | Snapshot lido do banco. Permite responder sem join e sobrevive à deleção da conta |
| `plan` | `String?` | Snapshot (planos mudam; queremos o plano **no momento** do feedback) |
| `category` | `String` | `bug` \| `suggestion` \| `praise` \| `question` |
| `message` | `String` | Máx. 2000 chars |
| `route` | `String?` | `usePathname()` do client, truncado em 200 |
| `userAgent` | `String?` | **Lido no servidor** (`request.headers.get('user-agent')`), truncado em 300 |
| `locale` | `String?` | `language` do `useTranslation` |
| `status` | `String @default("open")` | Usado pelo F3 |
| `notifiedAt` | `DateTime?` | Mesmo gancho de F1 |
| `createdAt` | `DateTime @default(now())` | |
| `updatedAt` | `DateTime @updatedAt` | Reabrir (F1) não muda `createdAt`; a fila do F3 precisa da atividade mais recente |

Índices: `@@index([status, createdAt])`, `@@index([userId])`. Sem FK.

**Por que `userId` é nulável, ao contrário de `QuestionReport`:**

1. Páginas públicas de marketing são um uso futuro declarado. Tornar nulável depois custaria caro: além do
   `ALTER COLUMN ... DROP NOT NULL` em prod, o SQLite exige rebuild completo da tabela (`PRAGMA
   defer_foreign_keys` + `new_Feedback` + `INSERT SELECT` + `DROP` + `RENAME`, como em
   `20260901003405_add_generation_job_language`) **mais** o par prod à mão. Hoje custa um `?`.
2. Sem FK, `NOT NULL` não compra integridade — só uma asserção que a rota autenticada já garante.
3. Nulável **não** abre POST anônimo: a rota continua atrás de `auth()` e `auth.config.ts` **não** é estendido.
   Em `QuestionReport` o nulo quebraria o índice único; aqui não há dedupe.

`plan`, `email` e `userAgent` são descobertos **pelo servidor**. `session.user.plan` existe no client, mas é um
JWT que pode estar velho — o client não é fonte de verdade para nada disso.

### Rota e service

`POST /api/feedback` → `app/api/feedback/route.ts` + `feedback.service.ts` (novos). A pasta `feedback/` já
existe por causa de F1; o Next permite `route.ts` na pasta e em subpastas.

Payload: `{ category, message, route, locale }`. Validação no service: categoria na whitelist → 400 ·
`message.trim()` vazio → 400 · `message` > 2000 → 400. Rate limit: `enforceRateLimit('feedback_submit', userId)`.
Retorno: `201 { id }`.

**Sem dedupe** — dois feedbacks seguidos são dois pensamentos diferentes. O rate limit é o único freio.

### Gatilhos e o problema do mobile

O header do workspace é `hidden md:flex`; no mobile só existe `SidebarMobileTopBar`.

| Onde | Como |
|---|---|
| **Desktop** — `shared/components/ui/workspace-header/FeedbackButton.tsx` (novo), inserido em [WorkspaceHeader.tsx](../../shared/components/ui/workspace-header/WorkspaceHeader.tsx) **antes** do `NotificationsPopover` | Copia literalmente a classe do trigger do sino (`relative w-8 h-8 flex items-center justify-center border border-default-200 rounded-lg hover:border-default-300 transition-colors bg-content1`) com ícone `faCommentDots`. Colar a classe é o que garante alinhamento sem refatorar |
| **Desktop + mobile** — botão extra em [SidebarNav.tsx](../../shared/components/ui/sidebar/SidebarNav.tsx), depois do `NAV_GROUPS.map(...)` | Mesmo formato do bloco condicional de admin que já existe ali. `SidebarNav` é renderizado **tanto** no rail desktop **quanto** no drawer mobile ⇒ **um ponto de inserção cobre os dois breakpoints**. `onClick={() => { openFeedback(); onClose?.(); }}` — `onClose` já é prop e fecha o drawer |

**Descartadas:** replicar o header no `SidebarMobileTopBar` (duplica sino, popover e badge de uso) · item no
`UserDropdown` (o dropdown não existe no mobile) · mudar a interface `NavItem` (baseada em `href`/`NextLink`).

### Chaves i18n (namespace `feedback`, nomes apenas)

`widgetAria` · `widgetTitle` · `widgetSubtitle` · `categoryLabel` · `categoryBug` · `categorySuggestion` ·
`categoryPraise` · `categoryQuestion` · `categoryRequired` · `messageLabel` · `messagePlaceholder` · `messageHelper` · `messageRequired` ·
`messageTooLong` · `contextNotice` · `send` · `sendSuccessTitle` · `sendSuccessDescription` ·
`sendErrorTitle` · `sendErrorDescription`.

Mais `feedback.navLabel` (rótulo do botão em `SidebarNav`): o namespace é único, sem `nav.feedback` nem
`aria.sendFeedback`. `feedback.contextNotice` é transparência: avisa que rota, plano e navegador vão junto.

### Checklist

- [x] **2.1** `feedback.service.ts` com validação, snapshot de `plan`/`email` e truncamentos
- [x] **2.2** `route.ts` (handler + rate limit + `after()` do e-mail) e `EmailService.sendFeedbackAlert`
- [x] **2.3** `FeedbackModal.tsx` + `FeedbackForm.tsx` em `shared/components/ui/` (o formulário tem estado próprio, como o `ReportQuestionForm`; abertura e envio no `FeedbackProvider`)
- [x] **2.4** Renderizar o `FeedbackModal` no `FeedbackProvider` (o `openFeedback` já existe desde a 0.9)
- [x] **2.5** `FeedbackButton.tsx` no header (desktop)
- [x] **2.6** Botão em `SidebarNav.tsx` (desktop + mobile)
- [x] **2.7** Testes unitários — `tests/unit/api/services/feedback.service.test.ts` (38 casos; os principais, abaixo) e `buildFeedbackAlert`/`replyTo` em `email.service.test.ts`
- [x] **2.8** `data-testid` novos em `selectors.ts`
- [x] **2.9** E2E no mesmo `feedback.spec.ts`, incluindo caso mobile

**Casos unitários (2.7):**

- [x] Persiste categoria, mensagem, rota e locale
- [x] Snapshot de `plan` e `email` vem do banco, não do payload
- [x] `userId: null` é aceito (caminho anônimo futuro)
- [x] Categoria inválida → 400
- [x] Mensagem vazia ou só espaços → 400; > 2000 → 400
- [x] `userAgent` truncado em 300; `route` truncada em 200

**`data-testid` (2.8):** `feedback-widget-btn` · `feedback-sidebar-btn` · `feedback-modal` · `feedback-message` ·
`feedback-submit-btn`. As categorias não têm `data-testid`: são escolhidas por `getByRole('radio', { name })`, como os
motivos do F1 (SDD D-16).

**E2E (2.9):** header → modal → categoria `bug` + mensagem → submeter → toast, conferindo no banco `plan`, `email` e
`userAgent` preenchidos pelo servidor. Caso extra com viewport mobile (`page.setViewportSize({ width: 390, height: 844 })`)
abrindo o drawer e usando `feedback-sidebar-btn` — é o único jeito de provar que o `hidden md:flex` foi resolvido — com
o POST simulado. Mais o rascunho preservado ao clicar fora do modal (SDD D-17) e a chamada anônima recusada (307 do middleware, nada gravado). Com Redis no `.env` o limite `feedback_submit` (3 por 10 min) **vale no dev**: o
spec faz um único POST real por execução.

### Critérios de aceite

- Botão acessível no desktop (header) e no mobile (drawer)
- Um feedback vira uma linha em `Feedback` com `plan`, `email` e `userAgent` preenchidos pelo servidor
- O time recebe o e-mail com categoria, mensagem e contexto legíveis (e sem HTML injetado do texto do usuário)
- Mensagens do modal em PT e EN
- O e-mail do time tem "Responder" apontando para o usuário (SDD D-15)

### Aceite da F2

Código concluído; 38 testes unitários do service, 11 novos do e-mail e o E2E (4 cenários do F2, 9/9 no spec) passaram.
Falta o que depende de você:

- [ ] Um feedback real em produção chega em `FEEDBACK_INBOX_EMAIL`, com "Responder" apontando para o usuário, e
  `notifiedAt` é preenchido (RN-22, D-15)

---

## Backlog

Fora da Fase 1. Cada item tem um **gatilho de promoção**: o que precisa ser verdade para virar trabalho.

| ID | Feature | Esforço | Gatilho de promoção |
|---|---|---|---|
| F3 | Inbox de feedback no admin | M | Volume de e-mails passar de ~5/dia, ou o primeiro report que precise de triagem com histórico |
| F4 | CSAT pós-simulado | P | F1/F2 no ar **e** com resposta — não pedir opinião antes de ter canal de retorno |
| F5 | Fechar o loop (ack + "resolvido") | G | Primeiro usuário perguntar "e o meu report?" |
| F6 | Canal direto com o fundador | P | Nenhum — é operação e pode rodar já, em paralelo |
| F7 | Changelog in-app no sino | M | F5 concluído |

- [ ] **F3 — Inbox de feedback no admin.** `app/admin/feedback/page.tsx` copiando o padrão de
  `app/admin/audit-log/page.tsx` (`<table>` nativa, `Chip` por status, `PaginationControls`), `AdminNavLink` em
  `app/admin/layout.tsx`, `app/api/admin/feedback/route.ts`, método em `admin.service.ts`, connector. Inclui
  triagem de status de `QuestionReport` e `Feedback`. Aproveita a oportunidade para extrair o bloco de checagem
  de admin que hoje é copiado em 6 rotas. Pré-requisito do "sai de circulação" se for aprovado.
- [ ] **F4 — CSAT pós-simulado.** 3 emojis + campo opcional na tela `simulados/[id]/resultado/[attemptId]`,
  no `NextStepPanel`. Momento de alta intenção, atrito quase zero. Provável reuso de `Feedback` com
  `category: 'csat'` — **checar** se exige nova migration antes de prometer.
- [ ] **F5 — Fechar o loop.** E-mail de acusação ao usuário + notificação quando o report for resolvido.
  Exige **persistir notificações no servidor**: hoje `features/providers/notifications.provider.tsx` é
  `localStorage`-only, sem model nem rota (e o único emissor é `generationJobs.provider.tsx`). É o item mais
  caro do backlog, e é o que faz o usuário voltar a reportar.
- [ ] **F6 — Canal direto.** Link "fale com o fundador" (e-mail/WhatsApp) e e-mail no D+3 do cadastro pedindo
  uma conversa de 15 min. Com 5 usuários é o de maior ROI e é mais operação do que feature.
- [ ] **F7 — Changelog in-app.** Reusa o sino (`NotificationsPopover`) para anunciar "você pediu, a gente fez".
  Só faz sentido depois de F5, que dá o mecanismo de notificação server-driven.

---

## Convenções e registro de mudanças

- Tarefas são checkboxes markdown: `- [ ]` pendente, `- [x]` feito. Renderiza no GitHub e é diffável.
- Cada frente abre com `**Status:** … · **Fase:** … · **Depende de:** …`.
- Status possíveis: `Não iniciado` · `Em andamento` · `Bloqueado` · `Concluído`.
- O progresso conta **todos** os checkboxes de cada seção, inclusive os casos de teste aninhados. A tabela de [Status geral](#status-geral) é **derivada** deles. Quem fecha uma tarefa atualiza os dois
  lugares no mesmo commit; a tabela existe só para dar o panorama sem rolar o arquivo.
- Um tópico novo (qualidade das questões, monetização, onboarding…) vira `docs/roadmap/<topico>.md`. Quando
  existirem 3 arquivos, criar um `README.md` como índice.
- Decisões viram ADR em `docs/adr/` e regras de negócio ficam no SDD do tópico em `docs/sdd/` (critérios em
  [docs/adr/README.md](../adr/README.md)). Não se edita ADR aceita: escreve-se uma nova que a substitui.
- Cada frente vira uma branch `feature/<kebab-case>` e passa por um plano de implementação próprio antes de
  qualquer código.

| Data | Mudança |
|---|---|
| 2026-09-25 | Documento criado. Fase 1 = Fase 0 + F1 + F2. Schema aprovado apenas para models novos |
| 2026-09-25 | ADRs 0001–0007 e SDD escritos. Refinamentos de design (SDD §Decisões de design): `updatedAt` nos models; `sendInternalAlert` devolve `boolean`; wrappers de e-mail em F1/F2; seletores E2E com os componentes; namespace único `feedback`; provider baseado em reducer, já com `openFeedback` na Fase 0 |
| 2026-09-25 | Fase 0 implementada na branch `feature/feedback-infra` (models e migrations, i18n, constantes, reducer, provider, resolvedor de erro, `sendInternalAlert`, rate limit). Aguarda o aceite acima |
| 2026-09-25 | ADRs cortadas de 7 para 2 (persistência sem FK e e-mail por evento). O porquê das demais está no SDD (D-10 a D-13); o risco da moderação segue em "Riscos abertos" |
| 2026-09-26 | E2E da F1 fechado (5/5). F2 implementada na branch `feature/feedback-widget`; Q-04 resolvida (`replyTo` no alerta de feedback, SDD D-15); categoria obrigatória com a chave nova `feedback.categoryRequired` (D-16); modal não fecha com clique fora (D-17); limite da mensagem visível (`feedback.messageHelper`) |
