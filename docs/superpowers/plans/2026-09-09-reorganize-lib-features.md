# Reorganização `lib/` / `features/` / raiz — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganizar `lib/`, `features/services/` e a raiz em pastas de domínio, fundir arquivos minúsculos e remover código morto — sem nenhuma mudança de comportamento.

**Architecture:** Refatoração puramente mecânica. Cada task move/funde um cluster de arquivos com `git mv`, reescreve os caminhos de import em todo o repo com um codemod `perl -pi -e`, e verifica com `tsc --noEmit` + suíte de testes (que devem permanecer 100% verdes). Um branch, seis commits lógicos.

**Tech Stack:** TypeScript, Next.js 15 App Router, Vitest, ESLint. Alias `@/*` → raiz do projeto (`tsconfig.json`).

**Spec:** `docs/superpowers/specs/2026-09-09-reorganize-lib-features-design.md`

## Global Constraints

- **Branch:** `refactor/reorganize-lib-features` (já criada, já contém o commit do spec).
- **Sem comentários novos** em nenhum arquivo (padrão do projeto). Comentários de "invariante escondida" já existentes nos arquivos movidos/fundidos são **preservados na íntegra**.
- **Imports sempre com alias `@/`** — nunca relativo `../..` para cross-directory. Dentro de uma mesma pasta nova, import de irmão também via `@/` (padrão do projeto).
- **Nomes:** services mantêm sufixo `.service.ts`; hooks `.hook.ts`; nada de barrel `index.ts` em pastas de componente (não se aplica a `lib/`).
- **Verificação obrigatória antes de cada commit:**
  - `npx tsc --noEmit` → **exit 0, zero erros**
  - `npm test` → **todos verdes** (baseline: 59 arquivos / 725 testes; após Task 1: 58 arquivos / ~715 testes — o número exato cai junto com o teste do quiz-generator, o que importa é 0 falhas)
  - `npx eslint <arquivos-tocados>` → zero erros. **Nunca** `npm run lint` (é `eslint --fix` global, reescreve o projeto inteiro).
- **Nunca** rodar `npm run build` nesta máquina (corrompe o cache do `npm run dev` do usuário). A checagem de build final é responsabilidade do usuário ou roda em worktree isolado.
- `git mv` sempre que possível (preserva histórico). Para fusões N→1: `git mv` do arquivo-âncora para o nome final, concatenar o corpo dos demais, `git rm` os demais.
- Codemod roda sobre **todos** os `*.ts` e `*.tsx` versionados: `app/`, `features/`, `shared/`, `config/`, `lib/`, `tests/`, `scripts/`, `prisma/`, `auth.ts`, `middleware.ts`.

---

## Baseline (rodar uma vez antes de começar)

- [ ] **Step 1: Confirmar árvore limpa e baseline verde**

```bash
git branch --show-current   # deve imprimir: refactor/reorganize-lib-features
git status --porcelain      # só .vscode/settings.json (deixar quieto)
npx tsc --noEmit ; echo "tsc: $?"          # esperado: tsc: 0
npm test 2>&1 | tail -5                     # esperado: 59 passed / 725 passed
```

---

## Task 1: Remover código morto

**Files:**
- Delete: `features/services/quiz-generator.service.ts`
- Delete: `tests/unit/api/services/quiz-generator.service.test.ts`
- Delete: `config/promptSchemas/` (pasta inteira: `answer_schema.json`, `publicExamAnswerSchema.json`, `publicExamQuestionSchema.json`, `questionSchema.json`, `questionSchema copy.json`)
- Delete: `dev.db` (raiz — arquivo de 0 bytes, versionado)

**Interfaces:**
- Consumes: nada.
- Produces: nada. `parseNumber` deixa de ter um importador (era usado só por `quiz-generator.service.ts` fora dos services de exam).

**Contexto / evidência:** `quiz-generator.service.ts` só é referenciado pelo próprio teste; o `distributeQuestions` usado em produção é outra cópia em `app/(workspace)/simulados/components/create/simuladoFormState.ts`. `config/promptSchemas/*.json` não tem nenhuma referência no código (schemas vivem inline nos prompts `.ts`). `dev.db` da raiz é órfão — o DB real de dev é `prisma/dev.db`.

- [ ] **Step 1: Confirmar que nada referencia os alvos**

```bash
grep -rnE "quiz-generator|QuizGeneratorService" app features prisma scripts --include='*.ts' | grep -vE "quiz-generator\.service\.(ts|test\.ts)"
grep -rnE "promptSchemas|answer_schema|questionSchema" app features config scripts --include='*.ts' --include='*.tsx'
```
Expected: **nenhuma linha** em ambos. (`grep -E` — o `grep` do macOS não faz `\|` como alternância.)

- [ ] **Step 2: Remover os arquivos**

```bash
git rm features/services/quiz-generator.service.ts tests/unit/api/services/quiz-generator.service.test.ts
git rm -r config/promptSchemas
git rm dev.db
```

- [ ] **Step 3: Verificar**

```bash
npx tsc --noEmit ; echo "tsc: $?"     # esperado: 0
npm test 2>&1 | tail -5               # esperado: 58 passed / 715 passed
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove dead quiz-generator service, promptSchemas, dev.db"
```

---

## Task 2: Agrupar `lib/` em pastas de domínio + fusões

**Files:**
- Create dir + file: `lib/edital/rules.ts` ← fusão de `lib/edital-classifier.ts` + `lib/edital-domains.ts` + `lib/edital-reference.ts`
- Move: `lib/edital-fetch.ts` → `lib/edital/fetch.ts`
- Move: `lib/exam-blueprint.ts` → `lib/exam/blueprint.ts`
- Move: `lib/exam-draft-validation.ts` → `lib/exam/draft-validation.ts`
- Create + file: `lib/exam/distribution.ts` ← fusão de `lib/largest-remainder.ts` + `lib/shuffle-options.ts`
- Move: `lib/detect-question-language.ts` → `lib/exam/question-language.ts`
- Create + file: `lib/i18n/messages.ts` ← fusão de `lib/load-messages.ts` + `lib/i18n-utils.ts`
- Move: `lib/properties-parser.ts` → `lib/i18n/properties-parser.ts`
- Move: `lib/llm-response.ts` → `lib/llm/response.ts`
- Edit + file: `lib/seo.ts` ← absorve `lib/json-ld.ts` (que é removido)
- Move: `lib/utm.ts` → `lib/growth/utm.ts`
- Move: `lib/referral-code.ts` → `lib/growth/referral-code.ts`
- Modify (codemod, ~40 arquivos): qualquer `*.ts`/`*.tsx` que importe um dos caminhos acima — **inclui `auth.ts`** (importa `@/lib/referral-code` e `@/lib/utm`, ambos movem para `lib/growth/`)
- Modify manual (dedup de import): `app/(workspace)/exams/new/useExamSeed.hook.ts`, `features/services/auto-config-job.service.ts` (edital ×2→1); `app/(marketing)/(focused-cta)/simulado/[exam-slug]/page.tsx`, `app/(marketing)/(site)/page.tsx`, `app/(marketing)/(site)/pricing/page.tsx`, `app/(marketing)/(site)/simulado/page.tsx` (seo+json-ld →1); `features/services/demo-catalog.service.ts` (largest-remainder+shuffle-options →1)

> Nota: nesta task os services ainda estão nos caminhos planos (`features/services/auto-config-job.service.ts` etc.) — a Task 4 é quem os move para subpastas.

**Ficam intocados na raiz de `lib/`:** `prisma.ts`, `redis.ts`, `rate-limit.ts`, `api-error.ts`, `bff.api.ts`, `limit-error.ts`, `auth-plan-sync.ts`. `lib/rate-limit.ts` importa `@/lib/redis` — permanece válido (redis não se move).

**Interfaces:**
- `lib/edital/rules.ts` produz: `classifyEditalUrl(url: string): EditalDocumentKind`, `classifyEditalDomain(url: string): EditalDomainClass`, `resolveAllowedDomains(examBoard: string | null): string[]`, `compactEditalReference(editalKey: string | null, year: number | null): string | null`, `parseEditalReference(raw: string): { editalKey: string | null; year: number | null }`, e re-exporta os tipos `EditalDocumentKind`, `EditalDomainClass` de `@/shared/types`.
- `lib/edital/fetch.ts` produz: `fetchEditalPdf(url: string): Promise<File>`.
- `lib/exam/blueprint.ts` produz: `normalizeCase`, `stripNumbering`, `splitTopics`, `validateExamBlueprint(data: unknown, type: ExamType): ParsedExamBlueprint`, + interfaces `ExamBlueprintTopic`, `ExamBlueprintExam`, `ExamBlueprintPayload`, `ParsedExamBlueprint`.
- `lib/exam/draft-validation.ts` produz: `getExamDraftValidation(draft: Exam): ExamDraftValidation`, `getDistributionSumTone(sum: number): DistributionSumTone`, `DISTRIBUTION_SUM_TONE_CLASS`, tipos `ExamDraftFieldId`, `ExamDraftValidation`, `DistributionSumTone`.
- `lib/exam/distribution.ts` produz: `distributeByWeight(slots: readonly WeightedSlot[], total: number): Record<string, number>`, `shuffleOptionTexts(options: Record<string, string>, random?: () => number): Record<string, string>`, `shuffleItems<T>(items: readonly T[], random?: () => number): T[]`, interface `WeightedSlot`.
- `lib/exam/question-language.ts` produz: `detectQuestionLanguage(text: string): DetectedLanguage`, tipo `DetectedLanguage`.
- `lib/i18n/messages.ts` produz: `loadAllMessages(): Promise<Record<string,string>>`, `loadMessagesForPrefixes(prefixes: readonly string[]): Promise<Record<string,string>>`, `hasMessages(messages?: Record<string,string>): boolean`.
- `lib/i18n/properties-parser.ts` produz: `parseProperties(raw: string): Record<string, string>`.
- `lib/llm/response.ts` produz: `extractJson(raw: string): string`, `sanitizeLlmError(...)`, tipo `LlmErrorType`, interface `SanitizeLlmErrorMessages`.
- `lib/seo.ts` produz: `alternatesFor(path: string): { canonical: string; languages: Record<string, string> }` **e** `jsonLd(schema: unknown): string`.
- `lib/growth/utm.ts` produz: `extractUtmParams`, `buildUtmCookieValue`, `parseUtmCookie`, `captureUtmFromUrl`, `readUtmCookie`, interface `UtmAttribution`.
- `lib/growth/referral-code.ts` produz: `generateUniqueReferralCode(isTaken: (code: string) => Promise<boolean>): Promise<string>`.

- [ ] **Step 1: Criar as pastas e mover os arquivos "move puro" com `git mv`**

```bash
mkdir -p lib/edital lib/exam lib/i18n lib/llm lib/growth
git mv lib/edital-fetch.ts            lib/edital/fetch.ts
git mv lib/exam-blueprint.ts          lib/exam/blueprint.ts
git mv lib/exam-draft-validation.ts   lib/exam/draft-validation.ts
git mv lib/detect-question-language.ts lib/exam/question-language.ts
git mv lib/properties-parser.ts       lib/i18n/properties-parser.ts
git mv lib/llm-response.ts            lib/llm/response.ts
git mv lib/utm.ts                     lib/growth/utm.ts
git mv lib/referral-code.ts           lib/growth/referral-code.ts
```

- [ ] **Step 2: Fundir os 3 arquivos de edital em `lib/edital/rules.ts`**

```bash
git mv lib/edital-classifier.ts lib/edital/rules.ts
```

Depois, editar `lib/edital/rules.ts`:
1. Na primeira linha de import, trocar `import type { EditalDocumentKind } from '@/shared/types';` por `import type { EditalDocumentKind, EditalDomainClass } from '@/shared/types';` e `export type { EditalDocumentKind };` por `export type { EditalDocumentKind, EditalDomainClass };`.
2. Anexar ao fim do arquivo **todo o corpo** de `lib/edital-domains.ts` **exceto** as duas primeiras linhas de import/export de tipo (`import type { EditalDomainClass } ...` e `export type { EditalDomainClass };`) — preservando o bloco de comentário-cabeçalho de `edital-domains.ts`.
3. Anexar ao fim **todo o corpo** de `lib/edital-reference.ts` (não tem imports) — preservando seus comentários.
4. Conferir que não há colisão de nome entre `const` privados dos três arquivos (`OFFICIAL_ORG_SUFFIXES`, `BANCA_DOMAINS`, `EDITAL_NUMBER`, e os patterns de annex do classifier). Se houver, renomear o do arquivo anexado.

```bash
git rm lib/edital-domains.ts lib/edital-reference.ts
```

- [ ] **Step 3: Fundir `largest-remainder` + `shuffle-options` em `lib/exam/distribution.ts`**

```bash
git mv lib/largest-remainder.ts lib/exam/distribution.ts
```

Anexar ao fim de `lib/exam/distribution.ts` o conteúdo integral de `lib/shuffle-options.ts` (sem imports; preservar os comentários de invariante). Sem colisão de nomes (`WeightedSlot`/`distributeByWeight` vs `shuffleOptionTexts`/`shuffleItems`).

```bash
git rm lib/shuffle-options.ts
```

- [ ] **Step 4: Fundir `load-messages` + `i18n-utils` em `lib/i18n/messages.ts`**

```bash
git mv lib/load-messages.ts lib/i18n/messages.ts
```

Editar `lib/i18n/messages.ts`:
1. Trocar `import { parseProperties } from '@/lib/properties-parser';` por `import { parseProperties } from '@/lib/i18n/properties-parser';`.
2. Anexar ao fim a função de `lib/i18n-utils.ts`:

```ts
export function hasMessages(messages?: Record<string, string>): boolean {
  return !!messages && Object.keys(messages).length > 0;
}
```

```bash
git rm lib/i18n-utils.ts
```

- [ ] **Step 5: Absorver `json-ld` em `lib/seo.ts`**

Anexar ao fim de `lib/seo.ts` o conteúdo de `lib/json-ld.ts` (preservando o comentário de segurança sobre `</script>`):

```ts
// JSON.stringify does not escape "<", so a value containing "</script>" would close the
// tag and turn structured data into an injection point. Today every schema is built from
// repo-controlled constants and the bundled .properties file, so nothing is reachable by
// an attacker — this keeps that true if a schema ever draws on the database.
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}
```

```bash
git rm lib/json-ld.ts
```

- [ ] **Step 6: Rodar o codemod de imports**

**Todos** os imports `@/` no repo usam aspas simples (verificado: 0 imports com aspas duplas), então cada padrão casa o especificador seguido de `'` — sem risco de casar prefixo de um caminho maior. Rodar (aspas duplas no `-e`, `'` literal dentro):

```bash
perl -pi -e "
  s{\@/lib/edital-classifier'}{\@/lib/edital/rules'}g;
  s{\@/lib/edital-domains'}{\@/lib/edital/rules'}g;
  s{\@/lib/edital-reference'}{\@/lib/edital/rules'}g;
  s{\@/lib/edital-fetch'}{\@/lib/edital/fetch'}g;
  s{\@/lib/exam-blueprint'}{\@/lib/exam/blueprint'}g;
  s{\@/lib/exam-draft-validation'}{\@/lib/exam/draft-validation'}g;
  s{\@/lib/largest-remainder'}{\@/lib/exam/distribution'}g;
  s{\@/lib/shuffle-options'}{\@/lib/exam/distribution'}g;
  s{\@/lib/detect-question-language'}{\@/lib/exam/question-language'}g;
  s{\@/lib/llm-response'}{\@/lib/llm/response'}g;
  s{\@/lib/load-messages'}{\@/lib/i18n/messages'}g;
  s{\@/lib/i18n-utils'}{\@/lib/i18n/messages'}g;
  s{\@/lib/properties-parser'}{\@/lib/i18n/properties-parser'}g;
  s{\@/lib/json-ld'}{\@/lib/seo'}g;
  s{\@/lib/utm'}{\@/lib/growth/utm'}g;
  s{\@/lib/referral-code'}{\@/lib/growth/referral-code'}g;
" $(git ls-files '*.ts' '*.tsx')
```

(`\@` em string shell de aspas duplas fica `\@`; perl lê `\@` como `@` literal. Sem nomes de arquivo `.ts`/`.tsx` com espaço neste repo, então `$(git ls-files ...)` sem aspas é seguro.)

- [ ] **Step 7: Dedup manual de linhas de import duplicadas**

Após o codemod, estes 7 arquivos têm 2+ linhas `import ... from '@/lib/...'` apontando pro mesmo módulo novo. Fundir cada grupo numa linha só:

| Arquivo | Fundir imports de |
|---|---|
| `app/(workspace)/exams/new/useExamSeed.hook.ts` | `@/lib/edital/rules` (×3) |
| `features/services/auto-config-job.service.ts` | `@/lib/edital/rules` (×2) |
| `app/(marketing)/(focused-cta)/simulado/[exam-slug]/page.tsx` | `@/lib/seo` (×2) |
| `app/(marketing)/(site)/page.tsx` | `@/lib/seo` (×2) |
| `app/(marketing)/(site)/pricing/page.tsx` | `@/lib/seo` (×2) |
| `app/(marketing)/(site)/simulado/page.tsx` | `@/lib/seo` (×2) |
| `features/services/demo-catalog.service.ts` | `@/lib/exam/distribution` (×2) |

Exemplo (`useExamSeed.hook.ts`): trocar
```ts
import { classifyEditalUrl } from '@/lib/edital/rules';
import { classifyEditalDomain } from '@/lib/edital/rules';
import { parseEditalReference } from '@/lib/edital/rules';
```
por
```ts
import { classifyEditalUrl, classifyEditalDomain, parseEditalReference } from '@/lib/edital/rules';
```
(nomes exatos: verificar o que cada arquivo realmente usa.)

- [ ] **Step 8: Verificar**

```bash
grep -rnE "@/lib/(edital-classifier|edital-domains|edital-reference|edital-fetch|exam-blueprint|exam-draft-validation|largest-remainder|shuffle-options|detect-question-language|llm-response|load-messages|i18n-utils|properties-parser|json-ld|utm|referral-code)'" $(git ls-files '*.ts' '*.tsx')
```
Expected: **nenhuma linha** (só sobra `@/lib/i18n/properties-parser`, `@/lib/growth/utm` etc.).

```bash
npx tsc --noEmit ; echo "tsc: $?"    # esperado: 0
npm test 2>&1 | tail -5              # esperado: 58 passed / 715 passed
npx eslint lib/edital lib/exam lib/i18n lib/llm lib/growth lib/seo.ts
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor: group lib/ into domain folders"
```

---

## Task 3: Mover `shared/utils.ts` para `lib/`

**Files:**
- Create: `lib/value.ts` ← `parseNumber`, `toSafeString` de `shared/utils.ts`
- Create: `lib/exam/normalize.ts` ← `normalizeName`, `looseKey` de `shared/utils.ts`
- Delete: `shared/utils.ts`
- Modify (codemod): os 3 arquivos que importam `@/shared/utils` (após Task 1, `quiz-generator.service.ts` já não existe): `app/api/mock-exams/mock-exam.service.ts`, `features/services/exam.service.ts` (após Task 4: `features/services/exam/exam.service.ts` — mas esta task roda **antes** da Task 4), `features/services/exam-question.service.ts`

> Esta task roda antes da Task 4, então os caminhos dos services ainda são os planos (`features/services/exam.service.ts`, `features/services/exam-question.service.ts`).

**Interfaces:**
- `lib/value.ts` produz: `parseNumber(value: string | null, fallback?: number | null): number | null`, `toSafeString(v: unknown): string`.
- `lib/exam/normalize.ts` produz: `normalizeName(s: string): string`, `looseKey(s: string): string`.

**Contexto:** `shared/utils.ts` contém 4 funções não-UI usadas só por services server-side. `normalizeName`/`looseKey` são normalização de nomes de prova/tópico (domínio exam). `parseNumber`/`toSafeString` são coerção genérica. Os comentários de invariante em `shared/utils.ts` (sobre NFC / `looseKey` "never persist") **são preservados** nos arquivos de destino.

- [ ] **Step 1: Criar `lib/value.ts`**

```ts
export function parseNumber(value: string | null, fallback: number | null = null) {
  if (value === null) return fallback;
  const n = Number(value);

  return Number.isFinite(n) ? n : fallback;
}

export function toSafeString(v: unknown) {
  if (typeof v === 'string') return v;
  if (v == null) return '';
  const json = JSON.stringify(v);

  return json || Object.prototype.toString.call(v);
}
```

> O comentário `// Prefer JSON when possible` do original **não** é mantido (comenta o QUE o código faz — proibido pelo padrão). Os comentários de invariante do `normalizeName`/`looseKey` (próximo step) **são** mantidos.

- [ ] **Step 2: Criar `lib/exam/normalize.ts`** — copiar de `shared/utils.ts` as funções `normalizeName` e `looseKey` **com seus blocos de comentário JSDoc de invariante intactos** (explicam por que NFC, por que nunca lowercase, por que `looseKey` nunca persiste — são exatamente o tipo de comentário que o padrão permite).

- [ ] **Step 3: Remover `shared/utils.ts`**

```bash
git rm shared/utils.ts
```

- [ ] **Step 4: Trocar os imports (3 arquivos, edição manual)**

Confirmar primeiro que a lista não cresceu:

```bash
grep -rn "@/shared/utils" $(git ls-files '*.ts' '*.tsx')
```
Esperado exatamente estes 3 (após Task 1):

| Arquivo | Linha atual | Trocar por |
|---|---|---|
| `features/services/exam-question.service.ts` | `import { toSafeString, normalizeName, looseKey } from '@/shared/utils';` | `import { toSafeString } from '@/lib/value';`<br>`import { normalizeName, looseKey } from '@/lib/exam/normalize';` |
| `features/services/exam.service.ts` | `import { normalizeName } from '@/shared/utils';` | `import { normalizeName } from '@/lib/exam/normalize';` |
| `app/api/mock-exams/mock-exam.service.ts` | `import { normalizeName, looseKey } from '@/shared/utils';` | `import { normalizeName, looseKey } from '@/lib/exam/normalize';` |

(Colocar a nova linha na posição alfabética correta do bloco de imports, conforme o ESLint `import/order` do projeto — rodar `npx eslint --fix` **apenas nesses 3 arquivos** se reclamar da ordem.)

- [ ] **Step 5: Verificar**

```bash
grep -rn "@/shared/utils" $(git ls-files '*.ts' '*.tsx')   # esperado: nada
npx tsc --noEmit ; echo "tsc: $?"                          # esperado: 0
npm test 2>&1 | tail -5                                    # esperado: 58 arquivos, 0 falhas
npx eslint lib/value.ts lib/exam/normalize.ts features/services/exam-question.service.ts features/services/exam.service.ts app/api/mock-exams/mock-exam.service.ts
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move shared/utils into lib"
```

---

## Task 4: Agrupar `features/services/` por domínio

**Files (todos `git mv`, sem edição de conteúdo):**
- `features/services/exam.service.ts` → `features/services/exam/exam.service.ts`
- `features/services/exam-catalog.service.ts` → `features/services/exam/exam-catalog.service.ts`
- `features/services/exam-question.service.ts` → `features/services/exam/exam-question.service.ts`
- `features/services/question-bank.service.ts` → `features/services/exam/question-bank.service.ts`
- `features/services/browse.service.ts` → `features/services/exam/browse.service.ts`
- `features/services/generation-job.service.ts` → `features/services/generation/generation-job.service.ts`
- `features/services/job-progress.service.ts` → `features/services/generation/job-progress.service.ts`
- `features/services/openAI.service.ts` → `features/services/generation/openai.service.ts` *(renomeado: casing)*
- `features/services/auto-config-job.service.ts` → `features/services/auto-config/auto-config-job.service.ts`
- `features/services/edital-extractor.service.ts` → `features/services/auto-config/edital-extractor.service.ts`
- `features/services/billing.service.ts` → `features/services/billing/billing.service.ts`
- `features/services/quota.service.ts` → `features/services/billing/quota.service.ts`
- `features/services/referral.service.ts` → `features/services/billing/referral.service.ts`
- `features/services/metrics.service.ts` → `features/services/billing/metrics.service.ts`
- **Ficam:** `features/services/email.service.ts`, `features/services/demo-catalog.service.ts` (standalone)
- Modify (codemod): todo `*.ts`/`*.tsx` que importa esses services — inclui `app/api/**/route.ts`, `app/api/mock-exams/mock-exam.service.ts`, `app/api/**/*.service.ts`, `prisma/dev/scripts/*.ts`, `tests/**`, e cross-imports entre os próprios services.

**Interfaces:** nomes de classe/função exportados **inalterados** (`ExamService`, `ExamCatalogService`, `GenerationJobService`, `AutoConfigJobService`, `BillingService`, `QuotaService`, `openAIService`, etc.) — só o caminho do módulo muda.

**Regra de atribuição:** cada service vai pra pasta do domínio a que mais pertence, mesmo que outros domínios o importem (imports cross-folder dentro de `features/services/` são aceitáveis).

- [ ] **Step 1: Criar pastas e mover**

```bash
mkdir -p features/services/exam features/services/generation features/services/auto-config features/services/billing
git mv features/services/exam.service.ts           features/services/exam/exam.service.ts
git mv features/services/exam-catalog.service.ts    features/services/exam/exam-catalog.service.ts
git mv features/services/exam-question.service.ts   features/services/exam/exam-question.service.ts
git mv features/services/question-bank.service.ts   features/services/exam/question-bank.service.ts
git mv features/services/browse.service.ts          features/services/exam/browse.service.ts
git mv features/services/generation-job.service.ts  features/services/generation/generation-job.service.ts
git mv features/services/job-progress.service.ts    features/services/generation/job-progress.service.ts
git mv features/services/openAI.service.ts          features/services/generation/openai.service.ts
git mv features/services/auto-config-job.service.ts features/services/auto-config/auto-config-job.service.ts
git mv features/services/edital-extractor.service.ts features/services/auto-config/edital-extractor.service.ts
git mv features/services/billing.service.ts         features/services/billing/billing.service.ts
git mv features/services/quota.service.ts           features/services/billing/quota.service.ts
git mv features/services/referral.service.ts        features/services/billing/referral.service.ts
git mv features/services/metrics.service.ts         features/services/billing/metrics.service.ts
```

- [ ] **Step 2: Codemod de imports**

```bash
perl -pi -e "
  s{\@/features/services/exam\.service'}{\@/features/services/exam/exam.service'}g;
  s{\@/features/services/exam-catalog\.service'}{\@/features/services/exam/exam-catalog.service'}g;
  s{\@/features/services/exam-question\.service'}{\@/features/services/exam/exam-question.service'}g;
  s{\@/features/services/question-bank\.service'}{\@/features/services/exam/question-bank.service'}g;
  s{\@/features/services/browse\.service'}{\@/features/services/exam/browse.service'}g;
  s{\@/features/services/generation-job\.service'}{\@/features/services/generation/generation-job.service'}g;
  s{\@/features/services/job-progress\.service'}{\@/features/services/generation/job-progress.service'}g;
  s{\@/features/services/openAI\.service'}{\@/features/services/generation/openai.service'}g;
  s{\@/features/services/auto-config-job\.service'}{\@/features/services/auto-config/auto-config-job.service'}g;
  s{\@/features/services/edital-extractor\.service'}{\@/features/services/auto-config/edital-extractor.service'}g;
  s{\@/features/services/billing\.service'}{\@/features/services/billing/billing.service'}g;
  s{\@/features/services/quota\.service'}{\@/features/services/billing/quota.service'}g;
  s{\@/features/services/referral\.service'}{\@/features/services/billing/referral.service'}g;
  s{\@/features/services/metrics\.service'}{\@/features/services/billing/metrics.service'}g;
" $(git ls-files '*.ts' '*.tsx')
```

> `email.service` e `demo-catalog.service` **não** entram no codemod (não se movem). Casar o `'` final + a âncora `@/features/services/` exata garante que `demo-catalog.service'` nunca casa com o padrão de `browse.service'` ou `exam-catalog.service'`.

- [ ] **Step 3: Verificar que nenhum caminho antigo sobrou**

```bash
grep -rnE "@/features/services/(exam\.service|exam-catalog\.service|exam-question\.service|question-bank\.service|browse\.service|generation-job\.service|job-progress\.service|openAI\.service|auto-config-job\.service|edital-extractor\.service|billing\.service|quota\.service|referral\.service|metrics\.service)'" $(git ls-files '*.ts' '*.tsx')
```
Expected: **nada**.

- [ ] **Step 4: Verificar**

```bash
npx tsc --noEmit ; echo "tsc: $?"    # esperado: 0
npm test 2>&1 | tail -5              # esperado: 58 / 715
npx eslint features/services
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: group features/services by domain"
```

---

## Task 5: Mover `global.d.ts` para `types/`

**Files:**
- Move: `global.d.ts` → `types/global.d.ts`

**Contexto:** `global.d.ts` tem só a declaração ambiente de `*.css`. O `include` do `tsconfig.json` (`"**/*.ts"`) cobre `types/global.d.ts` automaticamente — não precisa editar tsconfig. Nenhum arquivo importa `global.d.ts` diretamente (é ambient). Confirmar que `grep -rn "global.d" --include='*.ts' --include='*.json'` não acha referência de path real (uma ocorrência em `prisma/dev/scripts/data/demo-pool-cloud.ts` deve ser inspecionada; se for só substring de `globalThis` ou comentário, ignorar).

- [ ] **Step 1: Confirmar ausência de referência de path**

```bash
grep -rn "['\"].*global\.d" $(git ls-files '*.ts' '*.tsx' '*.json' '*.mjs' '*.js')
```
Expected: nada (ou só falsos-positivos que não são import/path).

- [ ] **Step 2: Mover**

```bash
mkdir -p types
git mv global.d.ts types/global.d.ts
```

- [ ] **Step 3: Verificar**

```bash
npx tsc --noEmit ; echo "tsc: $?"    # esperado: 0 (a declaração de módulo *.css continua ativa)
npm test 2>&1 | tail -5              # esperado: 58 / 715
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move global.d.ts to types/"
```

---

## Task 6: Atualizar referências de caminho na documentação

**Files:**
- Modify: `CLAUDE.md`, `app/CLAUDE.md`, `app/api/CLAUDE.md`, `tests/CLAUDE.md`, `AGENTS.md`

**Contexto:** os `CLAUDE.md` citam caminhos que mudaram. Lista exata de edições abaixo (levantada com grep sobre os 5 arquivos). **Não** reescrever prosa além do path.

Menções que **NÃO** mudam (caminhos preservados): `lib/bff.api.ts` (CLAUDE.md:15,106; app/CLAUDE.md:169; app/api/CLAUDE.md:108; AGENTS.md:20), `lib/api-error.ts` (CLAUDE.md:86,89; app/api/CLAUDE.md:5; AGENTS.md:103), `lib/prisma.ts`.

- [ ] **Step 1: `CLAUDE.md` (raiz)**

- Linha ~107, tabela "HTTP timeouts": `features/services/openAI.service.ts` → `features/services/generation/openai.service.ts`
- Linha ~235, "Section percentage unit": remover a frase final `Exception: \`QuizGeneratorService.distributeQuestions\` divides internally (\`minQuestions / 100 * total\`).` — esse era o único código que fazia `/100` por seção e foi deletado na Task 1. `distributeByWeight` (`lib/exam/distribution.ts`) e `simuladoFormState.distributeQuestions` normalizam por soma-de-pesos, não por 100. A regra "integers 0–100, não multiplique/divida" permanece.

- [ ] **Step 2: `app/CLAUDE.md`**

- Linha ~164, bloco de árvore: `features/services/question-bank.service.ts` → `features/services/exam/question-bank.service.ts`

- [ ] **Step 3: `app/api/CLAUDE.md`**

- Linha ~32: `features/services/quota.service.ts` → `features/services/billing/quota.service.ts`; `features/services/billing.service.ts` → `features/services/billing/billing.service.ts`; `features/services/referral.service.ts` → `features/services/billing/referral.service.ts`
- Linha ~63: `Services: \`exam.service.ts\`, \`exam-question.service.ts\`, \`exam-catalog.service.ts\`, \`quiz-generator.service.ts\`, \`auto-config-job.service.ts\`.` → `Services: \`exam/exam.service.ts\`, \`exam/exam-question.service.ts\`, \`exam/exam-catalog.service.ts\`, \`auto-config/auto-config-job.service.ts\`.` (remove `quiz-generator.service.ts`)
- Linha ~77: `features/services/generation-job.service.ts` → `features/services/generation/generation-job.service.ts`
- Linha ~171, tabela: `features/services/job-progress.service.ts` → `features/services/generation/job-progress.service.ts`
- Tabela de service-map (~185–192): remover a linha `| \`quiz-generator.service.ts\` | Distribute questions across sections. |`. As demais linhas dessa tabela (`exam.service.ts`, `exam-question.service.ts`, `exam-catalog.service.ts`, `question-bank.service.ts`, `generation-job.service.ts`, `quota.service.ts`, `metrics.service.ts`) são rótulos curtos — atualizar cada um para o caminho novo (`exam/exam.service.ts`, `exam/exam-question.service.ts`, `exam/exam-catalog.service.ts`, `exam/question-bank.service.ts`, `generation/generation-job.service.ts`, `billing/quota.service.ts`, `billing/metrics.service.ts`) **se** estiverem escritos como path; se forem só o nome do arquivo em prosa, manter o nome do arquivo.

- [ ] **Step 4: `tests/CLAUDE.md`**

- Linha ~60, tabela de cobertura: remover a linha `| \`quiz-generator.service.test.ts\` | Distribuição de questões por seção |` (teste deletado na Task 1). Conferir se há um "coverage map" / contagem de arquivos de teste no topo do arquivo que precise decrementar.

- [ ] **Step 5: `AGENTS.md`** — nenhuma edição de path necessária (só cita `@/lib/bff.api` e `lib/api-error.ts`, ambos preservados). Confirmar com o grep do Step 6.

- [ ] **Step 6: Verificar**

```bash
grep -rnE "features/services/openAI|features/services/(exam|billing|quota|referral|metrics|generation-job|auto-config-job|edital-extractor|job-progress)\.service|config/promptSchemas|lib/(edital-classifier|edital-domains|edital-reference|edital-fetch|json-ld|largest-remainder|shuffle-options|detect-question-language|llm-response|load-messages|i18n-utils|properties-parser)|shared/utils\.ts|quiz-generator" CLAUDE.md app/CLAUDE.md app/api/CLAUDE.md tests/CLAUDE.md AGENTS.md
```
Expected: **nada**.

```bash
npx tsc --noEmit ; echo "tsc: $?"   # esperado: 0 (docs não afetam tsc, mas confirma que a árvore segue limpa)
npm test 2>&1 | tail -5             # esperado: 58 arquivos, 0 falhas
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "docs: update path references after reorg"
```

---

## Fechamento

- [ ] **Step 1: Verificação final completa**

```bash
npx tsc --noEmit ; echo "tsc: $?"          # 0
npm test 2>&1 | tail -5                     # 58 arquivos, 0 falhas
npx eslint lib features shared app types    # zero erros
git log --oneline main..HEAD                # spec + plan + 6 commits de task
```

- [ ] **Step 2: Grep global de sanidade** — nenhum caminho antigo sobrou em lugar nenhum:

```bash
grep -rnE "@/(lib/(edital-classifier|edital-domains|edital-reference|edital-fetch|exam-blueprint|exam-draft-validation|largest-remainder|shuffle-options|detect-question-language|llm-response|load-messages|i18n-utils|properties-parser|json-ld)|shared/utils|features/services/(exam|exam-catalog|exam-question|question-bank|browse|generation-job|job-progress|openAI|auto-config-job|edital-extractor|billing|quota|referral|metrics)\.service)'" $(git ls-files '*.ts' '*.tsx')
```
Expected: **nada**.

- [ ] **Step 3: Build check** — pedir ao usuário para rodar `npm run build` (com o `npm run dev` dele parado) **ou** rodar num worktree isolado. Não rodar direto nesta árvore.

- [ ] **Step 4:** Seguir `superpowers:finishing-a-development-branch` para decidir a integração (uma PR `refactor/reorganize-lib-features` → `main`, ou squash conforme o fluxo do projeto).

---

## Self-Review (preenchido na escrita do plano)

**Cobertura do spec:**
- §1 regras de fronteira → materializadas nas Tasks 2/3 (lib recebe o que é não-UI; shared/utils sai).
- §2 layout `lib/` → Task 2 (+ Task 3 para `normalize`/`value`). Todos os 24 arquivos originais endereçados.
- §3 layout `features/services/` → Task 4. Todos os 17 endereçados (14 movidos, 2 ficam, 1 deletado na Task 1).
- §4 raiz → Task 5 (`global.d.ts`) + Task 1 (`dev.db`). `auth.ts`/`auth.config.ts` explicitamente intocados.
- §5 código morto → Task 1 (quiz-generator + promptSchemas + dev.db).
- §6 mecânica (1 branch, 6 commits, codemod, gates) → refletida na estrutura das tasks e nos Global Constraints.
- §7 riscos → mitigações embutidas (grep de verificação pós-codemod em toda task, `tsc` antes de cada commit).

**Placeholder scan:** sem "TBD"/"TODO"/"etc." acionável pendente. Conteúdo dos merges pequenos (seo, i18n, value) está literal no plano; merges maiores (edital rules, distribution) têm procedimento exato + nota de colisão de nomes.

**Consistência de tipos:** os nomes em "Interfaces" batem com os exports reais verificados no código (`classifyEditalUrl`, `distributeByWeight`, `shuffleItems`, `loadAllMessages`, `hasMessages`, `alternatesFor`, `jsonLd`, `parseNumber`, `normalizeName`, ...). Services mantêm nomes de classe; só paths mudam.
