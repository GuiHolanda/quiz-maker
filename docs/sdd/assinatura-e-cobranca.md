# SDD — Assinatura e Cobrança

| | |
|---|---|
| **Tópico** | Como o usuário compra, troca e confirma um plano pago, e como a tela de cobrança acompanha o Stripe |
| **Status** | Ativo · Reconciliação de retorno e bloqueio de checkout implementados, unitário e E2E verdes |
| **Versão** | 1.0 (2026-09-26) |
| **Autor** | Claude (Solution Architect) · **Aprovação de escopo:** Guilherme Holanda |
| **Roadmap** | [assinatura-e-cobranca](../roadmap/assinatura-e-cobranca.md) |
| **ADRs** | Nenhuma: nenhuma decisão deste tópico passou nos três critérios do [README](../adr/README.md) |

## Índice

1. [Objetivo e escopo](#objetivo-e-escopo)
2. [Glossário](#glossário)
3. [Regras de negócio](#regras-de-negócio)
4. [Contratos de API](#contratos-de-api)
5. [Frontend](#frontend)
6. [Estratégia de testes](#estratégia-de-testes)
7. [Decisões de design](#decisões-de-design)
8. [Questões em aberto](#questões-em-aberto)
9. [Histórico de revisões](#histórico-de-revisões)

---

## Objetivo e escopo

O plano do usuário só muda quando o webhook do Stripe grava no banco, e o webhook chega em momentos diferentes em
relação ao redirect de volta para `/billing`: às vezes antes, às vezes segundos depois. Este documento especifica
como a tela de cobrança confirma a mudança sem mentir para o usuário, e como o produto impede que um assinante crie
uma segunda assinatura.

**Dentro do escopo**

- Retorno do checkout (`/billing?upgraded=true…`) e do portal (`/billing?synced=1…`).
- Bloqueio de checkout para quem já tem assinatura.
- Destino do botão de upgrade do modal de limite.

**Fora do escopo**

| Item | Onde está |
|---|---|
| Preços e limites por plano (`PLAN_LIMITS`) | `config/constants/index.ts` e tabela *Plans and Quotas* do `CLAUDE.md` |
| Ciclo de vida da assinatura no webhook (updated/deleted, reset de período) | `app/api/webhooks/stripe/route.ts` |
| Pagamento assíncrono (boleto) | [Q-01](#questões-em-aberto) |

---

## Glossário

| Termo | Significado |
|---|---|
| **Reconcile** | Verificação que o `BillingOverview` faz ao voltar do Stripe até o banco refletir a compra ou a troca |
| **Retorno do checkout** | `success_url` do Checkout: `?upgraded=true&plan=<produto>&session_id=<id da sessão>` |
| **Retorno do portal** | `return_url` do Customer Portal: `?synced=1&from=<plano antes do portal>` |
| **Plano do Stripe** | `BillingDetails.subscription.plan`: o plano que o preço da assinatura concede, como o webhook vai gravá-lo |
| **Assinante** | Usuário com `stripeSubscriptionId` no banco (o webhook zera o campo quando a assinatura é apagada) |

---

## Regras de negócio

Os ids são **estáveis**: nunca renumerar. Testes citam o id no título (`it('RN-03: …')`). Uma regra removida vira
`RN-nn (removida)`.

### Compra e troca de plano

| Id | Regra | Onde é imposta |
|---|---|---|
| RN-01 | Assinante não inicia checkout: `GET /api/billing/checkout` responde **409** e a troca de plano passa pelo portal. Vale também para o Sprint, porque o webhook do Sprint sobrescreveria o plano enquanto a assinatura continua cobrando | `billing/checkout/route.ts` |
| RN-02 | O modal de limite sugere o plano seguinte com limite maior: free → Pro, Pro → Pro AI. Pro AI e Sprint estão no topo: o modal troca o texto e não oferece upgrade. Assinante (Pro/Pro AI com cliente no Stripe) vai para o portal, nunca para o checkout | `upgradeTargetFor` (`shared/lib/limitError.ts`) + `LimitReachedModal` |

### Retorno do Stripe

| Id | Regra | Onde é imposta |
|---|---|---|
| RN-03 | Retorno do checkout **com** `session_id`: a compra só é confirmada quando o banco reflete **aquela** sessão. Assinatura: `stripeSubscriptionId` igual à assinatura da sessão. Sprint: `plan = 'sprint'` e `sprintExpiresAt` a partir de `created` da sessão + 90 dias. Sessão de outro usuário ou inexistente → **404**, e a tela mostra "Verificação pendente". O plano da URL não é usado | `BillingService.isCheckoutProcessed` + `BillingOverview` |
| RN-04 | Retorno do checkout **sem** `session_id` (URL anterior a RN-03): confirmado quando o plano no banco é igual a `plan` da URL; sem `plan`, quando difere do plano anterior | `isPlanReconciled` |
| RN-05 | Retorno do portal: o reconcile compara o plano do banco com o plano do Stripe (`free` se a assinatura está cancelada) e só faz polling enquanto os dois diferem. Sem assinatura para comparar, encerra na primeira leitura | `resolveReconcileTarget` + `BillingService.getBillingDetails` |
| RN-06 | Depois de confirmado: checkout → toast "Plano X ativado!" com o plano atual; portal → "Plano atualizado" só se o teto de questões subir; visita ao portal sem mudança de plano → nada (sem refresh de sessão nem toast) | `resolveSettledToast` + `BillingOverview` |
| RN-07 | Confirmado, os parâmetros de retorno saem da URL, e um reload não repete o reconcile. Em timeout (20 leituras a cada 1,5 s) ou erro de leitura, a tela mostra "Verificação pendente" com "Verificar agora" e os parâmetros ficam na URL | `BillingOverview` |

---

## Contratos de API

| Rota | Método | Contrato |
|---|---|---|
| `billing/checkout` | GET | `?product=pro\|pro_ai\|sprint&period=monthly\|yearly` → `{ url }`. **409** para assinante (RN-01). `success_url` carrega `session_id={CHECKOUT_SESSION_ID}`, que o Stripe substitui |
| `billing/checkout/status` | GET | `?session_id=` → `{ processed: boolean }` (RN-03). **400** sem `session_id`; **404** para sessão inexistente ou de outro usuário; outra falha do Stripe → **500** |
| `billing/portal` | GET | → `{ url }`. `return_url` carrega `from=<plano atual>`. **404** sem `stripeCustomerId` |
| `billing/subscription` | GET | `BillingDetails`; `subscription.plan` é o plano do Stripe (RN-05) |

---

## Frontend

`BillingOverview` lê os parâmetros de retorno **uma vez**, no primeiro render, para que limpar a URL (RN-07) não
reinicie o fluxo.

1. Lê o uso (`/billing/usage`) e os detalhes (`/billing/subscription`) antes de qualquer polling, para a página já
   mostrar pagamento, faturas e o CTA correto do `PlanSwitcher`.
2. Decide o critério: sessão do checkout (RN-03), plano da URL (RN-04) ou plano do Stripe (RN-05).
3. Se ainda não confirmou, mostra o banner ("Confirmando seu upgrade…" no checkout, "Aplicando a mudança de plano…"
   no portal) e repete a leitura.
4. Confirmado: limpa a URL, atualiza sessão e contadores e dispara o toast (RN-06). O toast é disparado por um
   effect, com o `t` do render atual, e não pelo `t` capturado quando o fluxo começou.

---

## Estratégia de testes

Vitest `environment: 'node'`: componentes React não são testados em unitário. A decisão fica em módulo puro e o
JSX é verificado por E2E.

| Arquivo | Cobre |
|---|---|
| `tests/unit/shared/limitError.test.ts` | RN-02 |
| `tests/unit/api/services/billing.service.test.ts` | RN-03 (dono, sessão inexistente, falha do Stripe, assinatura, Sprint novo e antigo), RN-05 (plano do Stripe, cancelada → `free`) |
| `tests/unit/billing-reconcile.test.ts` | RN-04, RN-05, RN-06 |
| `tests/e2e/tests/billing-reconcile.spec.ts` | RN-03 (sessão alheia não é confirmada pelo plano), RN-04, RN-06, RN-07 |

RN-01 não tem teste automatizado: route handlers não são testados em unitário (`tests/CLAUDE.md`) e o usuário do
E2E não tem assinatura.

---

## Decisões de design

| Id | Decisão | Por quê |
|---|---|---|
| D-01 | Confirmar o checkout pela sessão (`session_id`), não pelo plano | O plano não distingue "já tinha esse plano" de "acabou de comprar", nem aceita URL adulterada ou salva. A sessão identifica a compra exata. Descartado: continuar só com a heurística de plano |
| D-02 | Bloquear checkout de assinante no servidor (RN-01) além de corrigir o modal | O modal não era o único caminho: o `PlanSwitcher` oferece checkout enquanto os detalhes carregam. Só o servidor garante que não nasce uma segunda assinatura |
| D-03 | No portal, comparar com o plano do Stripe em vez de fazer polling até o plano mudar | O portal não devolve id de sessão. Comparar com o Stripe elimina ~21 leituras por visita sem mudança e distingue "sem mudança" de "webhook a caminho". Descartado: polling silencioso de 30 s |
| D-04 | Manter RN-04 como fallback | Sessões de checkout criadas antes do deploy voltam sem `session_id` |

---

## Questões em aberto

| Id | Questão | Dono | Bloqueia |
|---|---|---|---|
| Q-01 | Com pagamento assíncrono (boleto), `checkout.session.completed` chega com `payment_status = 'unpaid'` e o webhook já ativa o plano. O Checkout aceita boleto hoje? | Guilherme | — |
| Q-02 | Webhook do portal com atraso acima de 30 s depende do "Verificar agora"; não há nova tentativa em segundo plano | Guilherme | — |

---

## Histórico de revisões

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 2026-09-26 | Versão inicial: RN-01 a RN-07 (bloqueio de checkout, modal de limite, reconcile de checkout e portal) |
