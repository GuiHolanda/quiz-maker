# E2E Tests — Context

Esta pasta contém os testes end-to-end do CertifiqueAI usando Playwright.

## Arquitetura

```
e2e/
  auth/
    storageState.json      ← sessão salva pelo globalSetup (gitignored)
  fixtures/
    auth.fixture.ts        ← estende o test base com mock das rotas OpenAI
    mock-data.ts           ← constantes e arrays de questões estáticas
  tests/
    certification-flow.spec.ts
    public-exam-flow.spec.ts
  global-setup.ts          ← cria usuário tester, login UI, salva sessão
  global-teardown.ts       ← deleta todos os dados do usuário E2E
```

## Regras desta pasta

- **Nunca commitar `storageState.json`** — já está no `.gitignore`. Contém cookies de sessão.
- **Nunca commitar `.env.test`** — já está no `.gitignore`. Contém credenciais do usuário E2E.
- **Um único usuário de teste**: `e2e-test@certifiqueai.test`, plano `tester` (sem limite de quota). Criado pelo `globalSetup`, nunca manualmente.
- **Idempotência**: o `globalSetup` limpa dados do run anterior antes de criar novos. Os testes podem ser rodados múltiplas vezes sem acumular dados.
- **DATABASE_URL**: o `globalSetup`, `globalTeardown` e o `webServer` (`next dev`) precisam usar o mesmo banco. Passe o caminho absoluto ao rodar os testes:
  ```bash
  DATABASE_URL="file:/path/absoluto/para/prisma/dev.db" npm run e2e
  ```

## Como adicionar um novo spec

1. Criar `e2e/tests/<nome>.spec.ts`
2. Importar o fixture: `import { test, expect } from '../fixtures/auth.fixture'`
3. Usar `authedPage` como page: `async ({ authedPage: page }) => { ... }`
4. Mocks de OpenAI já estão aplicados no fixture para certification e public-exam. Para outros endpoints, adicionar `page.route()` no próprio spec.
5. Se o spec criar dados persistentes (certificações, questões, simulados), garantir que o `globalTeardown` os limpa — todos os dados criados com o userId do usuário E2E já são cobertos.

## Interação com HeroUI Radio

O Radio do HeroUI v2 usa um `<input type="radio">` com `opacity: 0.0001`. A única abordagem que funciona com Playwright é:

```typescript
await group.locator('input').first().dispatchEvent('click');
```

Não usar: `.click({ force: true })`, `.check({ force: true })`, `page.mouse.click()` com boundingBox.

## Interação com HeroUI Select/Combobox

O Select do HeroUI renderiza um `button[data-slot="trigger"]`. Para clicar e selecionar uma opção:

```typescript
await page.getByRole('button', { name: /label do select/i }).click();
await expect(page.getByRole('option', { name: /opção/i })).toBeVisible({ timeout: 8_000 });
await page.getByRole('option', { name: /opção/i }).click();
```

## i18n nos seletores

A UI padrão é Português (pt-BR). Use regex que cubra ambos os idiomas:

```typescript
page.getByRole('button', { name: /Finalizar Simulado|Finish Exam/i })
page.getByRole('tab', { name: /Meus Simulados|My Mock Exams/i })
```

## CI

O workflow `.github/workflows/e2e.yml` roda em push para `main`. Secrets necessários:
- `E2E_USER_EMAIL`
- `E2E_USER_PASSWORD`
- `NEXTAUTH_SECRET`

Em falha, o relatório HTML é salvo como artifact (`playwright-report/`).
