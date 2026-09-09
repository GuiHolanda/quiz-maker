# Reorganização: `lib/`, `features/`, raiz — design

**Data:** 2026-09-09
**Branch:** `refactor/reorganize-lib-features`
**Tipo:** refatoração estrutural (sem mudança de comportamento)

---

## Objetivo

Organizar melhor as pastas `lib/`, `features/` e a raiz do projeto. Eliminar
arquivos isolados minúsculos, agrupar lógica de domínio dispersa, e fixar uma
regra clara de "onde mora o quê" entre `lib/`, `shared/` e `config/`.

**Não-objetivos:** mudar comportamento, mexer no schema Prisma, tocar em `app/`
além de atualizar caminhos de import, reorganizar `config/` (fora `promptSchemas/`
morto), separar o service layer de dentro de `features/`.

---

## 1. Regras de fronteira

| Pasta | O que mora aqui | Teste de uma linha |
|---|---|---|
| **`lib/`** | Blocos de construção agnósticos de framework: clientes de plataforma (`prisma`, `redis`), lógica de domínio pura (matemática de prova, parsing de edital, parsing de i18n), helpers cross-cutting (`api-error`, `utm`). Agrupados por **domínio** em subpastas. | "É um utilitário ou cliente **sem JSX**. Organizado pelo domínio que serve, não por onde roda." |
| **`shared/`** | A camada **React/UI** cross-cutting: `components/`, `lib/` (helpers de UI: `notify`, `scoreTone`, `planLabel`), `types/`, `styles/`. | "Precisa de React, ou é um tipo compartilhado." |
| **`config/`** | **Valores estáticos + acessadores finos** sobre eles: metadados do site, fontes, dados de landing page, formatos de questão, prompts. | "Dado que muda raramente." |
| **`features/`** | **Estado de domínio client-side** (`providers/`, `reducers/`, `hooks/`, `connectors.ts`) **+ o service layer de backend** (`services/`, agrupado por domínio). | Inalterado em espírito — só sub-organizado. |

**Consequência:** `shared/utils.ts` (`parseNumber`, `toSafeString`, `normalizeName`,
`looseKey` — todos não-UI, 4 importadores, todos server-side) **sai de `shared/`**.
`shared/lib/` fica onde está (é genuinamente UI: toasts, classes de tom, labels de plano).

---

## 2. `lib/` — layout alvo

24 arquivos planos → primitivas de infra na raiz + subpastas de domínio + fusões.

### 2.1 Ficam na raiz de `lib/` (sem alteração, sem reescrita de import)

```
lib/prisma.ts          (55 importadores — o cliente do DB)
lib/redis.ts
lib/rate-limit.ts      (depende de redis)
lib/api-error.ts       (36 importadores — o formatador de resposta de erro)
lib/bff.api.ts         (HTTP client-side)
lib/limit-error.ts     (parser de 429 client-side)
lib/auth-plan-sync.ts  (usado só por auth.ts; 1-arquivo não justifica lib/auth/)
```

### 2.2 Fusões e movimentos

| De | Para | Observação |
|---|---|---|
| `lib/edital-classifier.ts` | `lib/edital/rules.ts` | fundido |
| `lib/edital-domains.ts` | `lib/edital/rules.ts` | fundido |
| `lib/edital-reference.ts` | `lib/edital/rules.ts` | fundido (~230L juntos) |
| `lib/edital-fetch.ts` | `lib/edital/fetch.ts` | separado — faz I/O de rede |
| `lib/exam-blueprint.ts` | `lib/exam/blueprint.ts` | prefixo redundante removido |
| `lib/exam-draft-validation.ts` | `lib/exam/draft-validation.ts` | prefixo redundante removido |
| `lib/largest-remainder.ts` | `lib/exam/distribution.ts` | fundido com shuffle-options |
| `lib/shuffle-options.ts` | `lib/exam/distribution.ts` | fundido (~87L juntos) |
| `lib/detect-question-language.ts` | `lib/exam/question-language.ts` | |
| `lib/llm-response.ts` | `lib/llm/response.ts` | |
| `lib/load-messages.ts` | `lib/i18n/messages.ts` | fundido com i18n-utils |
| `lib/i18n-utils.ts` | `lib/i18n/messages.ts` | fundido (`hasMessages`, 3L) |
| `lib/properties-parser.ts` | `lib/i18n/properties-parser.ts` | move — mantém arquivo próprio (25L, propósito distinto) |
| `lib/seo.ts` + `lib/json-ld.ts` | `lib/seo.ts` | fundido (`alternatesFor` + `jsonLd`, 20L) |
| `lib/utm.ts` | `lib/growth/utm.ts` | |
| `lib/referral-code.ts` | `lib/growth/referral-code.ts` | |
| `shared/utils.ts` → `normalizeName`, `looseKey` | `lib/exam/normalize.ts` | os 4 importadores são services de exam |
| `shared/utils.ts` → `parseNumber`, `toSafeString` | `lib/value.ts` | genéricos; `shared/utils.ts` é deletado |

### 2.3 Resultado

```
lib/
  prisma.ts  redis.ts  rate-limit.ts  api-error.ts
  bff.api.ts  limit-error.ts  auth-plan-sync.ts
  seo.ts          ← + json-ld
  value.ts        ← de shared/utils.ts
  edital/
    rules.ts      ← classifier + domains + reference
    fetch.ts
  exam/
    blueprint.ts
    draft-validation.ts
    distribution.ts        ← largest-remainder + shuffle-options
    question-language.ts   ← detect-question-language
    normalize.ts           ← de shared/utils.ts
  i18n/
    messages.ts            ← load-messages + i18n-utils
    properties-parser.ts
  llm/
    response.ts
  growth/
    utm.ts
    referral-code.ts
```

---

## 3. `features/services/` — layout alvo

17 arquivos planos → 4 pastas de domínio + 2 arquivos genuinamente standalone.
**Move-only:** nenhum arquivo é renomeado (a pasta já dá o agrupamento); exceção
única: `openAI.service.ts` → `openai.service.ts` (consistência de casing, 4
importadores). Fusões nos services ficam fora do escopo — são grandes e o risco
não compensa.

| De `features/services/` | Para |
|---|---|
| `exam.service.ts` | `exam/exam.service.ts` |
| `exam-catalog.service.ts` | `exam/exam-catalog.service.ts` |
| `exam-question.service.ts` | `exam/exam-question.service.ts` |
| `question-bank.service.ts` | `exam/question-bank.service.ts` |
| `browse.service.ts` | `exam/browse.service.ts` |
| `generation-job.service.ts` | `generation/generation-job.service.ts` |
| `job-progress.service.ts` | `generation/job-progress.service.ts` |
| `openAI.service.ts` | `generation/openai.service.ts` |
| `auto-config-job.service.ts` | `auto-config/auto-config-job.service.ts` |
| `edital-extractor.service.ts` | `auto-config/edital-extractor.service.ts` |
| `billing.service.ts` | `billing/billing.service.ts` |
| `quota.service.ts` | `billing/quota.service.ts` |
| `referral.service.ts` | `billing/referral.service.ts` |
| `metrics.service.ts` | `billing/metrics.service.ts` |
| `email.service.ts` | *(inalterado — standalone)* |
| `demo-catalog.service.ts` | *(inalterado — standalone)* |
| `quiz-generator.service.ts` | **DELETADO** (ver §5) |

**Regra de atribuição:** cada service vai para a pasta do domínio ao qual mais
pertence, mesmo que outros domínios o importem. Imports cross-folder dentro de
`features/services/` são aceitáveis — é tudo uma camada só. (`quota`, `metrics`,
`job-progress`, `openai` são usados por 2+ domínios; ficam no domínio primário.)

`features/connectors.ts`, `features/hooks/`, `features/providers/`,
`features/reducers/` — inalterados.

---

## 4. Raiz do projeto

Margem real é pequena — quase tudo na raiz é obrigatório por Next.js/ferramentas
(`next.config.js`, `tailwind.config.mjs`, `postcss.config.js`, `vitest.config.ts`,
`playwright.config.ts`, `eslint.config.mjs`, `middleware.ts`).

| De | Para | Observação |
|---|---|---|
| `global.d.ts` | `types/global.d.ts` | coberto por `**/*.ts` no tsconfig `include`; nova pasta `types/` na raiz |
| `dev.db` | **DELETADO** | 0 bytes, versionado; o DB real é `prisma/dev.db` |

`auth.ts` + `auth.config.ts` **ficam na raiz** — convenção NextAuth v5;
`auth.config.ts` é o split edge-safe importado pelo `middleware.ts`, não pode
ser fundido em `auth.ts`.

---

## 5. Código morto removido (aprovado)

| Item | Evidência |
|---|---|
| `features/services/quiz-generator.service.ts` + `tests/unit/api/services/quiz-generator.service.test.ts` | Só o próprio teste referencia. O `distributeQuestions` usado de verdade é outra cópia em `app/(workspace)/simulados/components/create/simuladoFormState.ts`. |
| `config/promptSchemas/` (5 JSONs, incl. `questionSchema copy.json`) | Zero referências no código — schemas agora vivem inline nos prompts `.ts`. |
| `dev.db` (raiz) | 0 bytes, versionado, órfão. |

---

## 6. Mecânica da migração

**Um branch, uma PR, commits lógicos.** Reorg puramente mecânica; `tsc` pega
qualquer import quebrado imediatamente, então faseamento em múltiplas PRs só
adicionaria cerimônia sem segurança.

### Passos

1. **`git mv`** cada arquivo para o destino (preserva histórico). Para fusões:
   `git mv` do maior para o nome final, depois concatenar os menores e `git rm`.
2. **Codemod de imports** — script único em `scripts/` (throwaway, não commitado)
   com o mapa old→new explícito, rodando find/replace sobre todo `**/*.ts` e
   `**/*.tsx` do repo (inclui `app/`, `tests/`, `prisma/dev/scripts/`,
   `scripts/`). ~80 arquivos tocados no total (35 em `tests/`).
3. **Reescrever os arquivos fundidos** — juntar os corpos, dedup de imports,
   ajustar re-exports. Sem comentários (padrão do projeto).
4. **Remover código morto** (§5).
5. **Atualizar docs** que citam caminhos: `CLAUDE.md`, `app/CLAUDE.md`,
   `app/api/CLAUDE.md`, `tests/CLAUDE.md`, `AGENTS.md`.

### Commits propostos

| # | Escopo |
|---|---|
| 1 | `refactor: group lib/ into domain folders` — moves + fusões + imports de `lib/*` |
| 2 | `refactor: move shared/utils into lib` — `lib/value.ts` + `lib/exam/normalize.ts`, delete `shared/utils.ts` |
| 3 | `refactor: group features/services by domain` — moves + imports |
| 4 | `chore: remove dead quiz-generator service, promptSchemas, dev.db` |
| 5 | `refactor: move global.d.ts to types/` |
| 6 | `docs: update path references after reorg` |

### Verificação (gate antes de cada commit e no fim)

```bash
npx tsc --noEmit          # zero erros — pega todo import quebrado
npx eslint <arquivos>     # nos arquivos tocados (nunca `npm run lint` — é --fix global)
npm test                  # suíte unitária completa verde
```

`next build` **não** roda aqui (corrompe o cache do `npm run dev` do usuário —
ver memória `next-build-clobbers-dev-cache`). Pedir ao usuário para confirmar que
o dev server está parado e rodar `npm run build` como checagem final, ou rodar em
worktree isolado.

### Mapa old→new de import (referência para o codemod)

```
@/lib/edital-classifier        → @/lib/edital/rules
@/lib/edital-domains           → @/lib/edital/rules
@/lib/edital-reference         → @/lib/edital/rules
@/lib/edital-fetch             → @/lib/edital/fetch
@/lib/exam-blueprint           → @/lib/exam/blueprint
@/lib/exam-draft-validation    → @/lib/exam/draft-validation
@/lib/largest-remainder        → @/lib/exam/distribution
@/lib/shuffle-options          → @/lib/exam/distribution
@/lib/detect-question-language → @/lib/exam/question-language
@/lib/llm-response             → @/lib/llm/response
@/lib/load-messages            → @/lib/i18n/messages
@/lib/i18n-utils               → @/lib/i18n/messages
@/lib/properties-parser        → @/lib/i18n/properties-parser
@/lib/json-ld                  → @/lib/seo
@/lib/utm                      → @/lib/growth/utm
@/lib/referral-code            → @/lib/growth/referral-code
@/shared/utils (normalizeName, looseKey) → @/lib/exam/normalize
@/shared/utils (parseNumber, toSafeString) → @/lib/value
@/features/services/exam.service            → @/features/services/exam/exam.service
@/features/services/exam-catalog.service    → @/features/services/exam/exam-catalog.service
@/features/services/exam-question.service   → @/features/services/exam/exam-question.service
@/features/services/question-bank.service   → @/features/services/exam/question-bank.service
@/features/services/browse.service          → @/features/services/exam/browse.service
@/features/services/generation-job.service  → @/features/services/generation/generation-job.service
@/features/services/job-progress.service    → @/features/services/generation/job-progress.service
@/features/services/openAI.service          → @/features/services/generation/openai.service
@/features/services/auto-config-job.service → @/features/services/auto-config/auto-config-job.service
@/features/services/edital-extractor.service→ @/features/services/auto-config/edital-extractor.service
@/features/services/billing.service         → @/features/services/billing/billing.service
@/features/services/quota.service           → @/features/services/billing/quota.service
@/features/services/referral.service        → @/features/services/billing/referral.service
@/features/services/metrics.service         → @/features/services/billing/metrics.service
```

---

## 7. Riscos

| Risco | Mitigação |
|---|---|
| Import quebrado passa despercebido | `tsc --noEmit` é exaustivo; roda antes de cada commit |
| `shared/utils.ts` tem importador não mapeado | grep confirmou 4 importadores; codemod cobre todos os `.ts`/`.tsx` |
| Fusão de edital muda semântica | fusão é só concatenação de módulos independentes; sem reescrita de lógica |
| Docs desatualizadas viram fonte de confusão | commit 6 dedicado; grep final por caminhos antigos em `*.md` |
| `git mv` + edição no mesmo arquivo quebra rastreio de histórico | `git mv` puro primeiro, editar em commit seguinte quando possível |
