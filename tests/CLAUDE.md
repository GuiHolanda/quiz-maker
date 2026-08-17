# Tests — Context

```
tests/
  unit/          ← Vitest — lógica de negócio (services, sem browser)
  e2e/           ← Playwright — jornadas completas do usuário (com browser)
```

---

## Testes Unitários (`tests/unit/`)

Vitest 4.x — Node puro. `npm test` (CI-safe), `npm run test:watch`, `npm run test:coverage`.

### Estrutura

```
tests/unit/api/
  __mocks__/prisma.ts        ← deep-mock global do Prisma (carregado via setupFiles)
  schema-drift.test.ts       ← detecta divergência entre schema prod e banco dev
  services/*.service.test.ts ← um arquivo por service
```

### Padrões de mock

```ts
// Constructor injection
const service = new MyService(prismaMock as any);

// Prisma no módulo (injetado automaticamente)
const service = new MyService();

// $transaction callback
prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));

// $transaction array (batch form)
prismaMock.$transaction.mockResolvedValue([undefined, undefined]);

// Dependência externa
vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }));
```

### O que testar / não testar

**Testar:** lógica de negócio em `.service.ts`, caminhos de erro com `status` correto (`rejects.toMatchObject({ status: 403 })`), efeitos colaterais críticos (desnormalização, cláusula `OR` com fallback legacy).

**Não testar:** streaming OpenAI, webhooks Stripe, route handlers, componentes React.

### Cobertura atual

| Arquivo de teste | O que cobre |
|---|---|
| `exam.service.test.ts` | CRUD Exam/Section/Topic; propagação `updatedAt`; snapshot em rename |
| `exam-question.service.test.ts` | `saveAnswers` (upsert idempotente), `saveExplanations`, embaralhamento das alternativas ao persistir, gravação do formato e guarda de labels semânticos |
| `shuffle-options.test.ts` | Permutação de alternativas — preserva labels e textos, quebra o viés posicional |
| `question-formats.test.ts` | Registry de formatos — labels, teto de corretas, flag semântica, default por banca |
| `validate-ai-questions.test.ts` | `validateAiQuestions` — checagens estruturais, teto de `correctCount`, conjunto de labels do formato |
| `question-format-prompts.test.ts` | Prompts derivam regra, template, skeleton JSON e labels do gabarito a partir do formato |
| `quota.service.test.ts` | Verificação e registro; `create_exam` vs `maxExams`; `getUsage` dual |
| `quiz-generator.service.test.ts` | Distribuição de questões por seção |
| `register.service.test.ts` | Registro de usuário |
| `reset-password.service.test.ts` | Reset de senha |
| `mock-exam.service.test.ts` | Simulados — disponibilidade, score, breakdown, ensureAnswers, sorteio uniforme das questões |
| `api-error.test.ts` | Todos os ramos de `toApiErrorResponse` |

---

## Testes E2E (`tests/e2e/`)

Playwright 1.x — Chromium headless, `next dev` iniciado automaticamente. Documentação completa em **[tests/e2e/README.md](e2e/README.md)**.

### Scripts

```bash
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e        # headless
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e:ui     # interface gráfica
DATABASE_URL="..." npx playwright test full-journey                    # spec individual
npx playwright show-report
```

### Setup local

1. Criar `.env.test` na raiz: `E2E_USER_EMAIL` + `E2E_USER_PASSWORD`
2. `npx playwright install chromium`

### Como funciona

- **`globalSetup`**: cria/reseta usuário `tester`, seeda cert + concurso (tópico/matéria + 3 questões via Prisma), faz login pela UI, salva `storageState.json`. Idempotente via `cleanupUserData`.
- **Mocks OpenAI:** `auth.fixture.ts` intercepta `question-generator`, `answers`, finish-attempt e resultado — payloads estáticos de `mock-data.ts`, sem custo de API real.
- **Seleção:** `data-testid` (não labels i18n). Catálogo `TID` em `support/selectors.ts` é a fonte única — cada `data-testid` no componente casa com um valor de `TID`.
- **DATABASE_URL:** `globalSetup`, `globalTeardown` e `next dev` precisam usar o mesmo banco (caminho absoluto).

### Como adicionar um novo spec

1. Adicionar `data-testid` ao componente + entrada em `TID` (`support/selectors.ts`).
2. Criar helper em `support/flows.ts` ou mock em `support/mocks.ts` se necessário.
3. Criar `tests/e2e/tests/<nome>.spec.ts`, importar de `../fixtures/auth.fixture`, usar `authedPage`. Para ambas as verticais: iterar `for (const domain of ALL_DOMAINS)`.
4. Se seedar novo model, estender `support/db-cleanup.ts` (ordem FK importa).

### Cobertura (20 testes, 6 specs)

| Spec | Cobre |
|---|---|
| `full-journey` (×2) | gerar → salvar → simulado → responder → resultado → tentar novamente |
| `generation-errors` (×2) | quota 403; abort de rede → toast de erro |
| `sse-reconnect` (×2) | cancelar job; restaura `running`/`awaiting_review` após reload |
| `wizard-validation` (×2) | discard de draft; guard de título vazio |
| `question-bank` | seed via API → verificar → buscar → deletar; empty state |
| `empty-states` | empty state de simulados e certificações |

### Notas técnicas — HeroUI

**Radio + submit:** input tem `opacity: 0.0001`, submit é pressable react-aria. Use `dispatchEvent('click')` em ambos:
```typescript
await group.locator('input').first().dispatchEvent('click');
await group.locator('xpath=ancestor::form').first().locator(tid(TID.answerSubmitBtn)).dispatchEvent('click');
```
Não use `.click({ force: true })`, `.check({ force: true })` ou `page.mouse.click()` com boundingBox.

**SSE:** `route.fulfill` não suporta streaming. `support/fake-eventsource.ts` sobrescreve `window.EventSource` via `addInitScript`. O app escuta via `addEventListener('awaiting_review', …)` — não `onmessage`.

**i18n:** UI padrão é PT-BR. Prefira `data-testid`; quando precisar de texto, use regex bilíngue.

### CI

`.github/workflows/e2e.yml` — trigger: push para `main`. Secrets: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXTAUTH_SECRET`. Em falha, relatório HTML salvo como artifact.
