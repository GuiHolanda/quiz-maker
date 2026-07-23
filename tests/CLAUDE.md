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

### Ferramenta

Playwright 1.x — Chromium headless, servidor `next dev` iniciado automaticamente.

### Scripts

```bash
# Headless (padrão)
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e

# Interface gráfica — ver cada step em tempo real
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npm run e2e:ui

# Com browser visível
DATABASE_URL="file:/caminho/absoluto/prisma/dev.db" npx playwright test --headed

# Spec individual
DATABASE_URL="..." npx playwright test certification-flow

# Ver relatório do último run
npx playwright show-report
```

### Estrutura

```
tests/e2e/
  auth/
    storageState.json        ← sessão salva (gitignored)
  fixtures/
    auth.fixture.ts          ← estende o test base com mocks das rotas OpenAI
    mock-data.ts             ← questões estáticas retornadas pelos mocks
  tests/
    certification-flow.spec.ts          ← jornada completa de certificações (6 steps)
    public-exam-flow.spec.ts            ← jornada completa de concursos (6 steps)
    question-bank-flow.spec.ts          ← banco de questões: geração, filtros, deleção
    simulados-full-exam-job.spec.ts     ← Prova Completa: toggle → gerar → SSE → done → notificação + cancelar
    simulados-management.spec.ts        ← deleção de simulado + histórico de tentativas/resultado
  global-setup.ts            ← cria usuário tester, login UI, salva sessão
  global-teardown.ts         ← deleta todos os dados do usuário E2E
```

### Setup local obrigatório

1. Criar `.env.test` na raiz do projeto (gitignored):

```
E2E_USER_EMAIL=e2e-test@certifiqueai.test
E2E_USER_PASSWORD=E2ePassword123!
```

2. Instalar browsers:

```bash
npx playwright install chromium
```

### Como funciona

- **`globalSetup`**: cria/reseta usuário `tester` (sem limite de quota) no banco dev, faz login pela UI, salva `storageState.json`. Todos os testes partem autenticados sem re-login.
- **Mocks OpenAI**: `auth.fixture.ts` intercepta `/api/certification/question-generator`, `/api/public-exam/question-generator` e endpoints `answers` via `page.route()` — retorna questões estáticas, sem custo de API.
- **`globalTeardown`**: deleta todos os dados do usuário E2E em ordem FK-safe após o suite.
- **DATABASE_URL**: `globalSetup`, `globalTeardown` e `next dev` precisam usar o mesmo banco. Passe caminho absoluto.
- **Idempotência**: `globalSetup` limpa dados de runs anteriores antes de criar novos — pode rodar múltiplas vezes sem acumular dados.

### Jornadas cobertas

**`certification-flow.spec.ts`** e **`public-exam-flow.spec.ts`** — 6 steps cada:

1. Configurar (cert ou concurso) via wizard
2. Gerar questões (mockado) → selecionar todas → salvar
3. Criar simulado em `/simulados` (rota unificada) — inclui clique no type picker para selecionar o tipo correto
4. Responder todas as questões → finalizar
5. Analisar resultado (score, breakdown, %)
6. Iniciar nova tentativa → cancelar → voltar para `/simulados`

**`simulados-management.spec.ts`** — 2 testes independentes de gestão:

1. **Deleção**: cria simulado → navega para `/simulados` → trash icon → modal de confirmação → verifica que o count de cards diminuiu
2. **Histórico / resultado**: cria simulado → inicia tentativa → captura `attemptId` da URL → navega diretamente para `/resultado/` → verifica score e breakdown

> **Nota sobre mocks de `finishAttempt`:** o PATCH `.../attempts/:id` é interceptado pelo fixture e retorna `{}` sem persistir no banco. Por isso o fluxo de histórico (`isAnswered = true` na lista) **não é testável via mock** — o teste de histórico bypassa o modal e navega diretamente para a URL de resultado com o ID real capturado.

**`question-bank-flow.spec.ts`** — 1 jornada: geração de questões → verificação no banco → filtros → busca → deleção.

**`simulados-full-exam-job.spec.ts`** — 3 testes (dependem de `certification-flow` e `public-exam-flow` rodarem antes — arquivo nomeado com prefixo `simulados-` para garantir ordem alfabética correta):

1. **Cert — happy path**: seleciona cert → toggle Full Exam → tabela de distribuição → clica "Gerar Prova Completa" → InlineAlert verde (done) → badge no sino → dropdown com notificação
2. **Cert — cancelar**: gera com stream que nunca termina → botão Cancelar aparece → clica → InlineAlert some → `DELETE /api/full-exam-job/:id` chamado
3. **Concurso — happy path + CTA**: mesmo fluxo para public exam → CTA "Criar simulado" leva para `/simulados` com aba Concurso pré-selecionada (`aria-pressed="true"`)

> **Nota sobre SSE em testes:** Playwright's `route.fulfill` não suporta streaming incremental — o browser EventSource precisa de uma conexão HTTP persistente real. A solução é usar `page.addInitScript` para sobrescrever o `EventSource` global com uma implementação fake que dispara eventos `done` sincroniamente em 100ms. O `NeverDoneEventSource` (usado no teste de cancelar) nunca dispara eventos, validando que o cancelamento funciona independentemente do estado do stream.

> **Nota sobre notificações acumuladas:** os testes de notificação usam `.first()` nos locators de título e CTA porque runs anteriores podem ter deixado notificações no localStorage do usuário E2E. O `globalTeardown` limpa o banco mas não o localStorage — `.first()` garante que o teste não falhe por strict mode com múltiplos elementos.

### Como adicionar um novo spec

1. Criar `tests/e2e/tests/<nome>.spec.ts`
2. Importar o fixture: `import { test, expect } from '../fixtures/auth.fixture'`
3. Usar `authedPage` como page: `async ({ authedPage: page }) => { ... }`
4. Para mocks adicionais além dos já configurados no fixture, usar `page.route()` no próprio spec
5. Dados criados pelo usuário E2E (`e2e-test@certifiqueai.test`) são limpos automaticamente pelo `globalTeardown`

### Notas técnicas — HeroUI

**Radio:** o input é `opacity: 0.0001`. Única abordagem que funciona:
```typescript
await group.locator('input').first().dispatchEvent('click');
```
Não usar: `.click({ force: true })`, `.check({ force: true })`, `page.mouse.click()` com boundingBox.

**Select/Combobox:** o trigger é `button[data-slot="trigger"]`:
```typescript
await page.getByRole('button', { name: /label/i }).click();
await expect(page.getByRole('option', { name: /opção/i })).toBeVisible({ timeout: 8_000 });
await page.getByRole('option', { name: /opção/i }).click();
```

**i18n:** a UI padrão é PT-BR. Use regex cobrindo ambos os idiomas:
```typescript
page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i })
```

**`data-testid` em componentes de lista:** elementos cujo `aria-label` ou texto não é único (ex.: múltiplos cards com o mesmo label) usam `data-testid` para escopo preciso nos testes:

| `data-testid` | Componente | Uso |
|---|---|---|
| `simulado-card` | `SimuladosListTab` — cada card da lista | `page.locator('[data-testid="simulado-card"]', { hasText: '...' })` |
| `type-option-certification` | `NewSimuladoTab` — botão Certificação | `page.getByTestId('type-option-certification')` |
| `type-option-concurso` | `NewSimuladoTab` — botão Concurso | `page.getByTestId('type-option-concurso')` |

Ao adicionar novos componentes de lista ou pickers com múltiplos itens ambíguos, adicionar `data-testid` preventivamente.

### CI

`.github/workflows/e2e.yml` — trigger: push para `main`.

Secrets: `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `NEXTAUTH_SECRET`.

Em falha, relatório HTML salvo como artifact (`playwright-report/`).
