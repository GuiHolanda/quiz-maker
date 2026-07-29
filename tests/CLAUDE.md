# Tests — Context

Esta pasta contém todos os testes do CertifiqueAI, organizados em dois escopos independentes.

```
tests/
  unit/          ← Vitest — lógica de negócio (services, sem browser)
  e2e/           ← Playwright — jornadas completas do usuário (com browser)
```

---

## Testes Unitários (`tests/unit/`)

### Ferramenta

Vitest 4.x — ambiente Node puro, sem browser.

### Scripts

```bash
npm test                 # roda todos os testes (CI-safe)
npm run test:watch       # modo watch
npm run test:coverage    # com relatório de cobertura
```

### Estrutura

```
tests/unit/
  api/
    __mocks__/
      prisma.ts              ← deep-mock global do Prisma (carregado via setupFiles)
    schema-drift.test.ts     ← detecta divergência entre schema prod e banco dev
    services/
      *.service.test.ts      ← um arquivo por service
```

### Padrões

**Mock do Prisma — services com constructor injection:**
```ts
import { prismaMock } from '../__mocks__/prisma';
const service = new MyService(prismaMock as any);
```

**Mock do Prisma — services com prisma no módulo:**
```ts
import { prismaMock } from '../__mocks__/prisma';
const service = new MyService(); // usa prismaMock automaticamente via setupFiles
```

**Mock de `$transaction` callback:**
```ts
prismaMock.$transaction.mockImplementation(async (fn) => fn(prismaMock));
```

**Mock de `$transaction` array:**
```ts
prismaMock.$transaction.mockResolvedValue([undefined, undefined]);
```

### O que testar

- Lógica de negócio em `.service.ts` — validações, guards de ownership, cálculos
- Caminhos de erro com `status` correto (`rejects.toMatchObject({ status: 403 })`)
- Efeitos colaterais críticos (desnormalização, soft-deletes, etc.)

### O que NÃO testar

- Serviços externos com streaming (OpenAI, edital extractor)
- Webhooks Stripe
- Route handlers (integração — próxima iteração)
- Componentes React

---

## Testes E2E (`tests/e2e/`)

Playwright 1.x — Chromium headless, `next dev` iniciado automaticamente. Documentação completa (arquitetura da camada `support/`, catálogo de test-ids, tabela specs→cobertura, notas técnicas, como adicionar cenário) vive em **[tests/e2e/README.md](e2e/README.md)** — a fonte de verdade. Resumo abaixo.

### Scripts

```bash
# Headless (padrão)
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e

# Interface gráfica — ver cada step em tempo real
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e:ui

# Com browser visível
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npx playwright test --headed

# Spec individual
DATABASE_URL="..." npx playwright test full-journey

# Ver relatório do último run
npx playwright show-report
```

### Estrutura

```
tests/e2e/
  auth/storageState.json     ← sessão salva (gitignored)
  fixtures/                  ← auth.fixture.ts (mocks fixos) + mock-data.ts (payloads)
  support/                   ← camada de helpers (constants, db-cleanup, selectors,
                               journey-config, fake-eventsource, mocks, flows)
  tests/                     ← 6 specs por capacidade (ver README, 20 testes no total)
  global-setup.ts            ← seed user + dados, login UI, salva sessão
  global-teardown.ts         ← deleta todos os dados do usuário E2E (FK-safe)
```

### Setup local obrigatório

1. Criar `.env.test` na raiz (gitignored):

```
E2E_USER_EMAIL=e2e-test@certifiqueai.test
E2E_USER_PASSWORD=E2ePassword123!
```

2. Instalar o browser: `npx playwright install chromium`

### Como funciona

- **`globalSetup`**: cria/reseta usuário `tester`, seeda uma certificação + um concurso (com tópico/matéria e 3 questões via Prisma), faz login pela UI, salva `storageState.json`. Idempotente — limpa runs anteriores via `cleanupUserData`.
- **Mocks OpenAI/resultado**: `auth.fixture.ts` intercepta `question-generator`, `answers`, finish-attempt (PATCH) e resultado (GET) — payloads estáticos de `mock-data.ts`, sem custo de API.
- **Seleção por `data-testid`**: estratégia primária de seletor (não labels i18n). O catálogo `TID` em `support/selectors.ts` é a fonte única; cada `data-testid` no componente casa com um valor de `TID`. HeroUI encaminha `data-testid` via react-aria `filterDOMProps`.
- **`globalTeardown`**: deleta todos os dados do usuário E2E em ordem FK-safe via `cleanupUserData` (`support/db-cleanup.ts`, compartilhado com o setup).
- **DATABASE_URL**: `globalSetup`, `globalTeardown` e `next dev` precisam usar o mesmo banco. Passe o caminho absoluto.

### Como adicionar um novo spec

1. Adicionar `data-testid` ao componente + entrada correspondente em `TID` (`support/selectors.ts`).
2. Adicionar/estender um helper em `support/flows.ts` (interação reutilizável) ou um mock em `support/mocks.ts` (comportamento de servidor).
3. Criar `tests/e2e/tests/<nome>.spec.ts`, importar `{ test, expect }` de `../fixtures/auth.fixture`, usar `authedPage`. Cenário que vale para ambas as verticais: iterar `for (const domain of ALL_DOMAINS)`.
4. Dados do usuário E2E são limpos automaticamente pelo `globalTeardown`. Se seedar um novo model, estender `support/db-cleanup.ts` (ordem FK importa).

### Notas técnicas — HeroUI

**Radio + submit do Form:** o input tem `opacity: 0.0001` e o submit é um pressable react-aria. `.click()` não funciona em nenhum dos dois — `.click()` no submit seleciona o radio mas não dispara o submit do `<Form>`, e a resposta nunca é salva. Use `dispatchEvent('click')` em ambos:
```typescript
await group.locator('input').first().dispatchEvent('click');
const submit = group.locator('xpath=ancestor::form').first().locator(tid(TID.answerSubmitBtn));
await submit.dispatchEvent('click');
```
Não usar: `.click({ force: true })`, `.check({ force: true })`, `page.mouse.click()` com boundingBox.

**Select/Combobox:** o trigger é `button[data-slot="trigger"]`. Abrir → esperar a opção visível → clicar.

**SSE em testes:** `route.fulfill` não suporta streaming. `support/fake-eventsource.ts` sobrescreve `window.EventSource` via `addInitScript`. O app escuta via `addEventListener('awaiting_review', …)` (não `onmessage`); o fake dispara um `MessageEvent('awaiting_review', …)` em ~100ms. `NeverDoneEventSource` conecta mas nunca emite (para testes de cancelar/reconectar).

**i18n:** a UI padrão é PT-BR. Prefira `data-testid`; quando precisar de texto, use regex cobrindo ambos os idiomas (`/Finalizar Simulado|Finish Exam/i`).

### CI

`.github/workflows/e2e.yml` — trigger: push para `main`. Secrets: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXTAUTH_SECRET`. Em falha, relatório HTML salvo como artifact (`playwright-report/`).
