# CI/CD Pipeline — Migration Gate Design

**Data:** 2026-07-22

---

## Objetivo

Garantir que toda migration de produção seja aplicada e validada **antes** do merge para `main`, impedindo que código novo chegue ao Vercel sem o schema correspondente no banco.

## Problema resolvido

`prisma migrate deploy` no Build Command da Vercel falha quando o servidor de build não tem acesso de rede ao banco prod (`db.prisma.io:5432`). Além disso, colocar migrations no build cria race conditions e remove supervisão humana de uma operação destrutiva.

## Arquitetura

```
PR aberto
  → unit-tests (tsc + vitest)
  → e2e-tests (Playwright)
  → migrate-prod (prisma migrate deploy contra banco prod)
      ↓ se passa → merge liberado
      ↓ se falha → PR bloqueado (admin pode bypass)
  → merge para main
  → Vercel build (apenas prisma:generate:prod + next build)
```

## Seção 1: GitHub Actions — job `migrate-prod`

Novo job em `.github/workflows/ci.yml` que roda após `e2e-tests`, apenas em PRs para `main`:

```yaml
migrate-prod:
  name: Apply Prod Migrations
  runs-on: ubuntu-latest
  needs: e2e-tests
  if: github.event_name == 'pull_request'

  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
    - run: npm install
    - name: Generate Prisma client (prod)
      run: npm run prisma:generate:prod
    - name: Apply prod migrations
      run: npm run prisma:migrate:prod
      env:
        DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

## Seção 2: Build Command na Vercel

**Antes:**
```
npm run prisma:generate:prod && npm run prisma:migrate:prod && npm run build
```

**Depois:**
```
npm run prisma:generate:prod && npm run build
```

Configurar em: Vercel Dashboard → Project → Settings → General → Build Command.

## Seção 3: Branch Protection no GitHub

Em **github.com/GuiHolanda/quiz-maker → Settings → Branches → Add rule → `main`**:

- [x] Require status checks to pass before merging
  - Adicionar: `Apply Prod Migrations`
- [x] Allow specified actors to bypass required pull requests
  - Adicionar o owner como bypass actor (override manual para emergências)

## Seção 4: Secret no GitHub

Em **github.com/GuiHolanda/quiz-maker → Settings → Secrets and variables → Actions → New repository secret**:

- Name: `PROD_DATABASE_URL`
- Value: o valor de `DATABASE_URL_PROD` do `.env` local

## Comportamento em cada cenário

| Cenário | Resultado |
|---|---|
| PR sem migration nova | `migrate deploy` é idempotente — passa instantaneamente |
| PR com migration válida | Migration aplicada, status verde, merge liberado |
| PR com SQL inválido | Migration falha, PR bloqueado, dev corrige |
| Banco inacessível | Migration falha, admin pode fazer bypass |
| Push direto para `main` (sem PR) | Job `migrate-prod` não roda (condição `if: github.event_name == 'pull_request'`) — não bloqueia hotfix |

## Fora de escopo

- Rollback automático de migrations — migrations aplicadas manualmente se necessário
- Ambientes de staging — sem banco de staging configurado atualmente
