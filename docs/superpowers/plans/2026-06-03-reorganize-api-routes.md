# Reorganizar pastas de `app/api/` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar a pasta `app/api/generator/` e redistribuir suas 11 rotas para `app/api/certification/` e `app/api/public-exam/`, de acordo com o domínio de cada endpoint.

**Architecture:** Cada `route.ts` é movido fisicamente para o novo caminho. Nenhuma lógica muda — apenas o endereço no filesystem e as constantes de URL no frontend. O Next.js App Router resolve rotas por pasta, então mover as pastas é suficiente.

**Tech Stack:** Next.js 15 App Router, TypeScript

---

## Mapeamento de arquivos

### Rotas a mover (11 `route.ts`)

| Origem | Destino |
|---|---|
| `app/api/generator/question-generator/route.ts` | `app/api/certification/question-generator/route.ts` |
| `app/api/generator/save-questions/route.ts` | `app/api/certification/save-questions/route.ts` |
| `app/api/generator/get-anwers/route.ts` | `app/api/certification/get-answers/route.ts` |
| `app/api/generator/quiz-generator/route.ts` | `app/api/certification/quiz-generator/route.ts` |
| `app/api/generator/browse-questions/questions/route.ts` | `app/api/certification/browse-questions/questions/route.ts` |
| `app/api/generator/browse-questions/summary/route.ts` | `app/api/certification/browse-questions/summary/route.ts` |
| `app/api/generator/public-exam-question-generator/route.ts` | `app/api/public-exam/question-generator/route.ts` |
| `app/api/generator/save-public-exam-questions/route.ts` | `app/api/public-exam/save-questions/route.ts` |
| `app/api/generator/get-public-exam-answers/route.ts` | `app/api/public-exam/get-answers/route.ts` |
| `app/api/generator/browse-public-exam-questions/questions/route.ts` | `app/api/public-exam/browse-questions/questions/route.ts` |
| `app/api/generator/browse-public-exam-questions/summary/route.ts` | `app/api/public-exam/browse-questions/summary/route.ts` |

### Constantes a atualizar

**Arquivo:** `config/constants/index.ts`

| Constante | Valor atual | Valor novo |
|---|---|---|
| `OPENAI_POST_URL` | `/generator/question-generator` | `/certification/question-generator` |
| `SAVE_QUESTIONS_URL` | `/generator/save-questions` | `/certification/save-questions` |
| `QUIZ_GENERATOR_URL` | `/generator/quiz-generator` | `/certification/quiz-generator` |
| `BROWSE_SUMMARY_URL` | `/generator/browse-questions/summary` | `/certification/browse-questions/summary` |
| `BROWSE_QUESTIONS_URL` | `/generator/browse-questions/questions` | `/certification/browse-questions/questions` |
| `PUBLIC_EXAM_GENERATOR_URL` | `/generator/public-exam-question-generator` | `/public-exam/question-generator` |
| `SAVE_PUBLIC_EXAM_QUESTIONS_URL` | `/generator/save-public-exam-questions` | `/public-exam/save-questions` |
| `GET_PUBLIC_EXAM_ANSWERS_URL` | `/generator/get-public-exam-answers` | `/public-exam/get-answers` |
| `BROWSE_PUBLIC_EXAM_SUMMARY_URL` | `/generator/browse-public-exam-questions/summary` | `/public-exam/browse-questions/summary` |
| `BROWSE_PUBLIC_EXAM_QUESTIONS_URL` | `/generator/browse-public-exam-questions/questions` | `/public-exam/browse-questions/questions` |

Nota: `get-anwers` não tem constante em `config/constants/index.ts` nem conector em `features/connectors.ts` — o endpoint é chamado apenas internamente por outros routes no servidor. Não requer atualização de constante.

---

## Task 1: Mover rotas de certification

**Files:**
- Create: `app/api/certification/question-generator/route.ts`
- Create: `app/api/certification/save-questions/route.ts`
- Create: `app/api/certification/get-answers/route.ts`
- Create: `app/api/certification/quiz-generator/route.ts`
- Create: `app/api/certification/browse-questions/questions/route.ts`
- Create: `app/api/certification/browse-questions/summary/route.ts`
- Delete: `app/api/generator/question-generator/route.ts`
- Delete: `app/api/generator/save-questions/route.ts`
- Delete: `app/api/generator/get-anwers/route.ts`
- Delete: `app/api/generator/quiz-generator/route.ts`
- Delete: `app/api/generator/browse-questions/questions/route.ts`
- Delete: `app/api/generator/browse-questions/summary/route.ts`

- [ ] **Step 1: Criar novas pastas e mover os 6 route.ts de certification**

```bash
mkdir -p app/api/certification/question-generator
mkdir -p app/api/certification/save-questions
mkdir -p app/api/certification/get-answers
mkdir -p app/api/certification/quiz-generator
mkdir -p app/api/certification/browse-questions/questions
mkdir -p app/api/certification/browse-questions/summary

cp app/api/generator/question-generator/route.ts app/api/certification/question-generator/route.ts
cp app/api/generator/save-questions/route.ts app/api/certification/save-questions/route.ts
cp app/api/generator/get-anwers/route.ts app/api/certification/get-answers/route.ts
cp app/api/generator/quiz-generator/route.ts app/api/certification/quiz-generator/route.ts
cp app/api/generator/browse-questions/questions/route.ts app/api/certification/browse-questions/questions/route.ts
cp app/api/generator/browse-questions/summary/route.ts app/api/certification/browse-questions/summary/route.ts
```

- [ ] **Step 2: Deletar as pastas de origem de certification**

```bash
rm -rf app/api/generator/question-generator
rm -rf app/api/generator/save-questions
rm -rf app/api/generator/get-anwers
rm -rf app/api/generator/quiz-generator
rm -rf app/api/generator/browse-questions
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move certification generator routes to certification/ group"
```

---

## Task 2: Mover rotas de public-exam

**Files:**
- Create: `app/api/public-exam/question-generator/route.ts`
- Create: `app/api/public-exam/save-questions/route.ts`
- Create: `app/api/public-exam/get-answers/route.ts`
- Create: `app/api/public-exam/browse-questions/questions/route.ts`
- Create: `app/api/public-exam/browse-questions/summary/route.ts`
- Delete: `app/api/generator/public-exam-question-generator/route.ts`
- Delete: `app/api/generator/save-public-exam-questions/route.ts`
- Delete: `app/api/generator/get-public-exam-answers/route.ts`
- Delete: `app/api/generator/browse-public-exam-questions/questions/route.ts`
- Delete: `app/api/generator/browse-public-exam-questions/summary/route.ts`

- [ ] **Step 1: Criar novas pastas e mover os 5 route.ts de public-exam**

```bash
mkdir -p app/api/public-exam/question-generator
mkdir -p app/api/public-exam/save-questions
mkdir -p app/api/public-exam/get-answers
mkdir -p app/api/public-exam/browse-questions/questions
mkdir -p app/api/public-exam/browse-questions/summary

cp app/api/generator/public-exam-question-generator/route.ts app/api/public-exam/question-generator/route.ts
cp app/api/generator/save-public-exam-questions/route.ts app/api/public-exam/save-questions/route.ts
cp app/api/generator/get-public-exam-answers/route.ts app/api/public-exam/get-answers/route.ts
cp app/api/generator/browse-public-exam-questions/questions/route.ts app/api/public-exam/browse-questions/questions/route.ts
cp app/api/generator/browse-public-exam-questions/summary/route.ts app/api/public-exam/browse-questions/summary/route.ts
```

- [ ] **Step 2: Deletar as pastas de origem de public-exam e a pasta generator/ restante**

```bash
rm -rf app/api/generator
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: move public-exam generator routes to public-exam/ group, remove generator/ folder"
```

---

## Task 3: Atualizar constantes de URL

**Files:**
- Modify: `config/constants/index.ts`

- [ ] **Step 1: Atualizar as 10 constantes no arquivo**

Em `config/constants/index.ts`, substituir:

```typescript
// Antes
export const OPENAI_POST_URL = "/generator/question-generator";
export const SAVE_QUESTIONS_URL = "/generator/save-questions";
export const QUIZ_GENERATOR_URL = "/generator/quiz-generator";
// ...
export const BROWSE_SUMMARY_URL = '/generator/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/generator/browse-questions/questions';
export const PUBLIC_EXAM_GENERATOR_URL = '/generator/public-exam-question-generator';
export const SAVE_PUBLIC_EXAM_QUESTIONS_URL = '/generator/save-public-exam-questions';
export const GET_PUBLIC_EXAM_ANSWERS_URL = '/generator/get-public-exam-answers';
export const BROWSE_PUBLIC_EXAM_SUMMARY_URL = '/generator/browse-public-exam-questions/summary';
export const BROWSE_PUBLIC_EXAM_QUESTIONS_URL = '/generator/browse-public-exam-questions/questions';

// Depois
export const OPENAI_POST_URL = "/certification/question-generator";
export const SAVE_QUESTIONS_URL = "/certification/save-questions";
export const QUIZ_GENERATOR_URL = "/certification/quiz-generator";
// ...
export const BROWSE_SUMMARY_URL = '/certification/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/certification/browse-questions/questions';
export const PUBLIC_EXAM_GENERATOR_URL = '/public-exam/question-generator';
export const SAVE_PUBLIC_EXAM_QUESTIONS_URL = '/public-exam/save-questions';
export const GET_PUBLIC_EXAM_ANSWERS_URL = '/public-exam/get-answers';
export const BROWSE_PUBLIC_EXAM_SUMMARY_URL = '/public-exam/browse-questions/summary';
export const BROWSE_PUBLIC_EXAM_QUESTIONS_URL = '/public-exam/browse-questions/questions';
```

- [ ] **Step 2: Verificar que não há nenhuma referência ao prefixo `/generator/` no codebase**

```bash
grep -r "/generator/" app/ features/ config/ --include="*.ts" --include="*.tsx"
```

Esperado: sem resultado (zero linhas).

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Commit**

```bash
git add config/constants/index.ts
git commit -m "refactor: update API URL constants to reflect new route structure"
```
