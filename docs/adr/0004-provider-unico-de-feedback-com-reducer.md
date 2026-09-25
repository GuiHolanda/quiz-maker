# ADR-0004 — Estado de feedback em um provider único com reducer

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect), dentro do escopo aprovado do roadmap
- **Relacionadas:** SDD §[Frontend](../sdd/feedback-e-comunicacao.md#frontend)

## Contexto

O reporte de questão é acionado por **três** superfícies que não compartilham componente
(`QuestionBankCard`, `AttemptQuestionPanel`, `ReviewQuestionRow`) e o widget de feedback por **dois** gatilhos
(header e `SidebarNav`). Cada gatilho, isolado, precisaria de estado do modal, `isBusy`, chamada HTTP, toast e
tratamento de erro — cinco cópias do mesmo fluxo.

O projeto já resolve "um modal, vários gatilhos" com `LimitModalProvider`
(`features/providers/limit-modal.provider.tsx`) e prescreve, em [CLAUDE.md](../../CLAUDE.md), *Context + Reducer*
com **um provider por domínio**. Não há teste de componente React (vitest é `environment: 'node'`, sem jsdom):
lógica só é testável se estiver em módulo puro.

## Decisão

1. **Um `FeedbackProvider`** (domínio "feedback"), montado uma vez em `app/(workspace)/layout.tsx`, dentro do
   `LimitModalProvider`. É dono do estado, da submissão (via `features/connectors.ts`) e dos toasts.
2. **`feedbackReducer` puro** (`features/reducers/feedback.reducer.ts`) com o estado
   `{ reportTarget, isFeedbackOpen, isBusy }`. Regras: um diálogo por vez; abrir e fechar são ignorados enquanto
   `isBusy`; falha mantém o diálogo aberto; sucesso reinicia o estado.
3. **Os gatilhos são finos:** `ReportQuestionButton` e `FeedbackButton` só chamam `openQuestionReport(target)` /
   `openFeedback()`. As três superfícies **não ganham estado novo** (apenas `AttemptQuestionPanel` recebe a prop
   `attemptId`).
4. **Os modais são apresentacionais** (recebem `isOpen`, `isLoading`, `onSubmit` e `onClose` por props) e são
   renderizados **uma vez, pelo próprio provider** — como `LimitReachedModal` dentro do `LimitModalProvider`.
   Nenhum modal lê o contexto, o que evita import circular entre provider e modal. Os modais são entregues em
   F1 e F2; a Fase 0 entrega o provider sem modais.
5. **Erros do envio são chaves i18n**, escolhidas por uma função pura `resolveFeedbackError(err, kind)`
   (`lib/feedback-error.ts`). A mensagem do servidor não é exibida: a mensagem de 429 de `lib/rate-limit.ts` é
   português fixo e apareceria para usuário em inglês.
6. **Contexto com valor padrão inerte** (no-ops), como `LimitModalContext`: um gatilho renderizado fora do
   provider não quebra.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| `useState` + modal em cada superfície | Triplica estado, handler, `notify` e busy; cada bug se corrige em cinco lugares |
| Cada botão renderiza o próprio modal | N modais no DOM e N cópias do submit |
| Estado no layout via `useState` | Foge do padrão Context + Reducer e não é testável em node |
| Biblioteca de estado (Zustand etc.) | Proibido por CLAUDE.md |

## Consequências

**Positivas**
- Fluxo de submissão em um lugar só; regras do reducer e do mapeador de erros testáveis em node.
- Adicionar uma quarta superfície custa um botão de poucas linhas.

**Custos**
- O provider é montado em toda página do workspace, mesmo quando ninguém reporta nada (custo desprezível: um
  `useReducer`).
- Gatilhos fora de `(workspace)` (marketing) não funcionariam: o contexto padrão é inerte.
- Divergência consciente de "`setIsBusy(false)` só no `catch`" de CLAUDE.md: o sucesso reinicia o estado por
  meio do reducer, que também zera `isBusy`.

## Revisitar quando

- O feedback for exposto em páginas de marketing (exige provider próprio nessa árvore).
- Um terceiro tipo de diálogo de feedback aparecer (ex.: CSAT do F4): avaliar generalizar o estado para uma união
  discriminada de diálogos.
