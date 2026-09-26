# Roadmap — Assinatura e Cobrança

> Última atualização: 2026-09-26 · Tópico: como o usuário compra, troca e confirma um plano pago.
>
> **Design e decisões:** [SDD](../sdd/assinatura-e-cobranca.md) (regras de negócio `RN-xx`, contratos, decisões
> `D-xx`). Nenhuma ADR neste tópico.

## Índice

- [Status geral](#status-geral)
- [Contexto e diagnóstico](#contexto-e-diagnóstico)
- [C1 — Reconciliação do retorno do Stripe](#c1--reconciliação-do-retorno-do-stripe)
- [Riscos abertos](#riscos-abertos)
- [Convenções e registro de mudanças](#convenções-e-registro-de-mudanças)

---

## Status geral

| Frente | Esforço | Status | Progresso |
|---|---|---|---|
| C1 — Reconciliação do retorno do Stripe | M | Concluído | 9/9 |
| Riscos abertos | — | Em aberto | 0/2 |

---

## Contexto e diagnóstico

A tela `/billing` confirma uma compra ou troca de plano lendo o banco até o webhook do Stripe gravar. Antes desta
frente, a confirmação dependia só do plano, o que gerava quatro problemas:

- Quando o webhook chegava antes do redirect, a tela esperava 30 s e mostrava "Verificação pendente" para uma
  compra que já tinha dado certo.
- Um assinante Pro que estourava o limite era mandado ao checkout do próprio Pro: nascia uma segunda assinatura, e
  a tela confirmava na hora, antes do webhook.
- Toda visita ao portal fazia ~21 leituras em 30 s, e um webhook atrasado deixava o plano antigo sem aviso.
- Os parâmetros de retorno ficavam na URL, e cada reload repetia o toast de sucesso.

---

## C1 — Reconciliação do retorno do Stripe

**Status:** Concluído · **Depende de:** — · **Branch:** `fix/billing-upgrade-reconcile`

- [x] **C1.1** Checkout responde 409 para assinante (RN-01)
- [x] **C1.2** Modal de limite: assinante vai ao portal; próximo plano com limite maior; topo sem oferta de upgrade (RN-02)
- [x] **C1.3** `session_id` no `success_url` e `GET /api/billing/checkout/status` (RN-03)
- [x] **C1.4** Fallback pelo plano da URL para sessões antigas (RN-04)
- [x] **C1.5** `SubscriptionInfo.plan` e retorno do portal comparado com o Stripe (RN-05)
- [x] **C1.6** Toast pelo plano confirmado, com o `t` do render atual (RN-06)
- [x] **C1.7** URL limpa ao confirmar; timeout e erro mostram "Verificação pendente" com retry (RN-07)
- [x] **C1.8** Testes unitários citando RN-02 a RN-06
- [x] **C1.9** E2E `billing-reconcile` (×6) citando RN-03, RN-04, RN-06 e RN-07

---

## Riscos abertos

- [ ] **Pagamento assíncrono.** Se o Checkout aceitar boleto, o webhook ativa o plano antes do pagamento
  compensar (SDD [Q-01](../sdd/assinatura-e-cobranca.md#questões-em-aberto)).
- [ ] **Webhook do portal acima de 30 s.** O usuário depende do botão "Verificar agora"; não há nova tentativa
  em segundo plano (SDD [Q-02](../sdd/assinatura-e-cobranca.md#questões-em-aberto)).

---

## Convenções e registro de mudanças

Mesmas convenções de [feedback-e-comunicacao](feedback-e-comunicacao.md#convenções-e-registro-de-mudanças):
checkboxes `- [ ]`/`- [x]`, e a tabela de status geral é derivada deles e atualizada no mesmo commit.

| Data | Mudança |
|---|---|
| 2026-09-26 | Documento criado com a frente C1 concluída na branch `fix/billing-upgrade-reconcile` |
