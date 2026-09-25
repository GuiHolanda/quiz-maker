# ADR-0006 — Um reporte por usuário por questão, com reabertura

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect) · **Aprovada:** Guilherme Holanda, no plano do roadmap (2026-09-25)
- **Relacionadas:** [ADR-0002](0002-persistencia-de-feedback-sem-foreign-key.md) · SDD §[RN-11](../sdd/feedback-e-comunicacao.md#regras-de-negócio)

## Contexto

Um usuário pode reportar a mesma questão várias vezes — por engano, por insistência, ou porque reencontrou o
erro. Cada reporte gera um e-mail ao time ([ADR-0003](0003-notificar-o-time-por-email-por-evento.md)) e uma
linha na futura fila de triagem. Por outro lado, uma questão **corrigida** pode voltar a estar errada, e o
usuário deve poder reportá-la de novo.

Um aviso de que a questão "já foi reportada" precisa ser distinguível de um erro genérico no client.

## Decisão

1. **Um reporte por par (usuário, questão),** garantido no **banco** por `@@unique([userId, examQuestionId])` —
   não só na aplicação.
2. **Status ativos** = `open`, `triaged`, `accepted`. Reportar de novo enquanto ativo → **409** com
   `body.code = 'already_reported'`. Nenhum e-mail é reenviado.
3. **Status terminais** = `rejected`, `fixed`. Reportar de novo **reabre** o mesmo registro: `status = 'open'`,
   motivo, comentário, `surface`, `mockExamAttemptId` e snapshot atualizados, `resolvedAt`, `resolutionNote` e
   `notifiedAt` zerados. Resposta **200** (em vez de 201) e o e-mail é reenviado, marcado como "reaberto".
4. **Corrida** (dois envios simultâneos): o segundo `INSERT` falha com `P2002`; o service o trata como
   `already_reported` (409 com `code`), não como o 409 genérico de `toApiErrorResponse`.
5. **O feedback geral não tem dedupe** — dois feedbacks seguidos são dois pensamentos diferentes. O rate limit é
   o único freio.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Vários reportes por par | Polui a fila e duplica e-mails; um usuário "votaria" várias vezes na mesma questão |
| Unique sem reabertura | O usuário nunca mais poderia reportar uma questão que foi corrigida e quebrou de novo |
| Contador `reportCount` na questão | Exige alterar `ExamQuestion` ([ADR-0007](0007-moderacao-de-questoes-adiada.md)) |
| Tabela de eventos com histórico | Complexidade sem demanda com 5 usuários |

## Consequências

**Positivas**
- Cada linha ativa é "um usuário distinto reportando esta questão": a contagem de usuários distintos por questão
  é um `COUNT`, sem coluna extra.
- Dedupe à prova de corrida, porque vive no banco.

**Custos**
- Reabrir **sobrescreve** o motivo e o comentário anteriores: o histórico de reaberturas se perde. Aceito.
- O client precisa ramificar por `code === 'already_reported'` em vez de exibir a mensagem do servidor.

## Revisitar quando

- O time precisar auditar o histórico de reaberturas (F3/F5): avaliar uma tabela de eventos.
- Reportes de usuários diferentes sobre a mesma questão precisarem ser agrupados na triagem.
