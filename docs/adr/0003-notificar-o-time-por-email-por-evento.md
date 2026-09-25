# ADR-0003 — Notificar o time por e-mail por evento

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect) · **Aprovada:** Guilherme Holanda, no plano do roadmap (2026-09-25)
- **Relacionadas:** [ADR-0002](0002-persistencia-de-feedback-sem-foreign-key.md) · SDD §[Notificação ao time](../sdd/feedback-e-comunicacao.md#notificação-ao-time)

## Contexto

Sem a tela de inbox no admin (F3, fora da Fase 1), o único jeito de o time **saber** que um usuário reportou algo
é ser avisado. Hoje nenhum canal interno existe: o `EmailService` (Resend, `features/services/email.service.ts`)
só escreve para usuários, e não há Slack, Discord, Sentry nem webhooks de saída. O volume esperado é de 0 a 5
eventos por dia (5 usuários), e o valor de um feedback decai com a latência.

O `after()` do `next/server` já é usado em produção (`app/api/cron/cleanup-stale-jobs/route.ts`). O Resend já está
configurado (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`).

## Decisão

1. **Cada reporte e cada feedback dispara um e-mail ao time**, enviado dentro de `after()` na rota, **depois** de
   o registro estar persistido.
2. Método novo `EmailService.sendInternalAlert(input): Promise<boolean>` — `true` se enviou, `false` caso
   contrário. **Nunca lança.** Erro do Resend, exceção de rede ou variável ausente viram `logger.warn` e `false`.
   (Os 4 métodos existentes lançam; aqui isso seria errado: o registro já foi salvo, e um `throw` dentro de
   `after()` vira unhandled rejection.)
3. **Destinatário opt-in, sem fallback:** variável `FEEDBACK_INBOX_EMAIL`. Sem ela, nada é enviado. É isso que
   impede `next dev` e E2E de mandarem e-mail real (`.env.test` cai de volta no `.env`, que pode ter
   `RESEND_API_KEY`).
4. **Todo texto vindo do usuário é escapado** (`escapeHtml`) antes de entrar no HTML. Nenhum método atual do
   `EmailService` interpola texto livre. O **assunto nunca carrega texto livre**: só rótulos fixos.
5. A montagem do e-mail é uma **função pura** (`buildInternalAlert`) exportada do módulo, testável sem instanciar
   o `EmailService` (cujo construtor cria o cliente Resend).
6. **`notifiedAt`** recebe o instante do envio bem-sucedido; falha deixa `null`. É o gancho para um reenvio ou
   digest futuro sem nova migration.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Digest diário via cron | Mais infraestrutura (entrada em `vercel.json`, rota de cron com `CRON_SECRET`, controle de "já enviei"), latência de até 24 h e falha silenciosa: se o cron falha, o dia inteiro some |
| Webhook Slack/Discord | Nova integração e novo segredo para um time de uma pessoa que já vive no e-mail |
| Só persistir e consultar no banco | Ninguém olha o banco; o feedback vira buraco negro |
| Inbox admin já na Fase 1 (F3) | Fora do escopo aprovado da Fase 1; continua sendo o próximo passo do backlog |

## Consequências

**Positivas**
- Nenhuma infraestrutura nova; latência de segundos; reaproveita Resend, `after()` e o layout de e-mail existente.
- Falha do e-mail é visível no log do request e recuperável (`notifiedAt IS NULL`).

**Custos**
- Depende do Resend estar de pé. Mitigado: o registro é salvo antes; nada se perde.
- Se `FEEDBACK_INBOX_EMAIL` **não** for configurada na Vercel, o feedback fica salvo e **ninguém é avisado** (só
  há um `logger.warn`). Configurá-la faz parte do critério de aceite da Fase 0.
- Com volume maior, o e-mail por evento vira ruído.

## Revisitar quando

- O volume passar de ~10 eventos/dia, ou o F3 (inbox admin) entrar em produção: avaliar digest diário
  (selecionando `notifiedAt IS NULL` — sem nova migration) ou desligar o e-mail por evento.
