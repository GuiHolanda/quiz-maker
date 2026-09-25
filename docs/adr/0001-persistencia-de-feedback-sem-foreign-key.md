# ADR-0001 — Persistência de feedback em tabelas sem FK, com snapshot

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect) · **Aprovação de schema:** Guilherme Holanda (2026-09-25,
  "aprovado criar models novos; não alterar models existentes")
- **Relacionadas:** SDD §[Modelo de dados](../sdd/feedback-e-comunicacao.md#modelo-de-dados)

## Contexto

A Fase 1 precisa persistir dois tipos de registro: o **reporte de uma questão** (`QuestionReport`) e o
**feedback geral** (`Feedback`). O reporte referencia `ExamQuestion.id` (`Int`, autoincrement) e `User.id`
(`String`, cuid).

Restrições:

- [CLAUDE.md](../../CLAUDE.md): alterar o schema Prisma exige aprovação explícita. Foram aprovados **models
  novos**; alterar models existentes **não** foi aprovado.
- O Prisma exige campo de relação **nos dois lados**. Declarar `question ExamQuestion @relation(...)` obrigaria
  a adicionar `reports QuestionReport[]` dentro de `ExamQuestion` (erro P1012) — uma alteração de model existente.
- Adicionar a FK só no SQL não resolve: `prisma migrate dev` a detecta como drift e pede reset do banco.
- Um reporte sobre uma questão que o usuário depois apagou continua sendo sinal válido ("a questão era tão ruim
  que ele apagou").
- Schemas dev (SQLite) e prod (PostgreSQL) são mantidos à mão em paralelo; SQLite não suporta enum no Prisma.

## Decisão

1. **Colunas escalares puras, sem `@relation`**, exatamente como o precedente `AdminAuditLog`. `examQuestionId` e
   `userId` são apenas valores.
2. **Snapshot no insert**, lido do banco pelo service (nunca do client):
   `QuestionReport.{questionText, examName, sectionName, topicName}` e `Feedback.{email, plan}`. O registro é
   auto-suficiente: o e-mail ao time e a futura tela de triagem não dependem de join.
3. **`String` no lugar de enum** para `reason`, `category`, `surface` e `status`; a whitelist é validada no
   service (SDD §[Decisões de design](../sdd/feedback-e-comunicacao.md#decisões-de-design), D-11).
4. **PK cuid** (`String @id @default(cuid())`) — mantém o SQL dev/prod quase idêntico e evita `AUTOINCREMENT`,
   que o teste de migrations rejeita em prod.
5. **Nulabilidade de `userId` diverge de propósito:**
   - `QuestionReport.userId` **não-nulável.** Em PostgreSQL, `NULL`s são distintos num índice único: um `userId`
     nulável quebraria em silêncio o dedupe `@@unique([userId, examQuestionId])`
     (SDD, [RN-11](../sdd/feedback-e-comunicacao.md#regras-de-negócio)). Além disso, só se reporta questão
     dentro do workspace autenticado.
   - `Feedback.userId` **nulável.** Páginas públicas de marketing são um uso futuro declarado. Tornar a coluna
     nulável depois custaria caro: `DROP NOT NULL` em prod mais rebuild completo da tabela no SQLite (`PRAGMA
     defer_foreign_keys` + tabela nova + `INSERT SELECT` + `DROP` + `RENAME`). Hoje custa um `?`. Nulável **não**
     abre POST anônimo: a rota segue atrás de `auth()`.
6. **Campos de triagem já na primeira migration:** `status`, `resolutionNote`, `resolvedAt`, `notifiedAt`,
   `updatedAt`. O F3 (inbox admin) não exige nova migration.
7. **Uma única migration pareada** (`add_feedback_tables`) para as duas tabelas: o ritual de pareamento dev/prod
   é a parte cara e fazê-lo duas vezes dobra o risco.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| FK + `@relation`, alterando `ExamQuestion` e `User` | Viola a restrição de schema aprovada e acopla o ciclo de vida do reporte ao da questão |
| FK só no SQL da migration | Drift permanente: `migrate dev` pede reset |
| Um único model polimórfico `Feedback` com `kind` | O dedupe único `(userId, examQuestionId)` precisaria de índice parcial, que o Prisma não modela e o SQLite/PostgreSQL não tratam do mesmo jeito; `examQuestionId` viraria nulável e reintroduziria o problema dos `NULL` |
| Serviço externo (Canny, Typeform) | Dado fora do banco, sem o contexto/snapshot da questão, e mais uma integração e um segredo |
| Enum Prisma para `reason`/`category` | SQLite não suporta enum no Prisma |

## Consequências

**Positivas**
- Nenhum model existente é tocado; questões ou usuários apagados não são bloqueados nem levam reportes junto.
- O registro é legível sem joins (e-mail, triagem, auditoria).

**Custos**
- **Sem integridade referencial:** um reporte pode apontar para uma questão que não existe mais. Aceito — o
  snapshot torna isso inofensivo.
- **Sem cascade:** qualquer rotina futura de exclusão de conta ou atendimento a pedido LGPD **deve** apagar (ou
  anonimizar) `Feedback` e `QuestionReport` por `userId` explicitamente. Hoje não existe exclusão de conta no
  produto. Registrado como regra RN-29 no SDD.
- `tests/e2e/support/db-cleanup.ts` precisa apagar as duas tabelas explicitamente; com o índice único, resíduo
  da primeira rodada de E2E faz a segunda receber 409.
- Os dois arquivos de schema e as duas pastas de migration continuam sendo mantidos à mão.

**Risco**
- Dados pessoais (e-mail, texto livre) em tabelas sem cascade. Mitigado pela RN-29 e pelo item de revisão da
  política de privacidade listado no SDD.

## Revisitar quando

- O time aprovar alterar `ExamQuestion` para moderação (SDD, [Q-01](../sdd/feedback-e-comunicacao.md#questões-em-aberto)): avaliar
  se vale adicionar a relação nessa mesma mudança.
- Existir fluxo de exclusão de conta: o apagamento de `Feedback` e `QuestionReport` entra nele.
