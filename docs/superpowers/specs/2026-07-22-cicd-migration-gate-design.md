# CI/CD Pipeline — Migration Gate Design

**Data:** 2026-07-22
**Revisão:** 2026-07-22 (v2 — migration sequencial ao deploy, Vercel auto-deploy desabilitado)

---

## Objetivo

Garantir que toda migration de produção seja aplicada **antes** do deploy da Vercel, de forma sequencial e controlada — sem race condition entre migration e build.

## Problema resolvido

1. `prisma migrate deploy` no Build Command da Vercel falha quando o servidor de build não tem acesso de rede ao banco (`db.prisma.io:5432`)
2. Vercel auto-deploy e GitHub Actions correm em paralelo — sem garantia de ordem
3. Migration em PR pode ser aplicada mesmo que o PR seja fechado sem merge

## Arquitetura

```
Pull Request para main
  → unit-tests (tsc + vitest, inclui migration-completeness)
  → e2e-tests (Playwright com banco dev)
  [banco prod nunca é tocado em PRs]

Push para main (após merge)
  → unit-tests
  → e2e-tests
  → migrate-and-deploy (sequencial):
      1. prisma migrate deploy → banco prod
      2. curl VERCEL_DEPLOY_HOOK → Vercel build
```

## Seção 1: GitHub Actions — `ci.yml`

Três jobs:

| Job | Trigger | O que faz |
|---|---|---|
| `unit-tests` | PR + push main | tsc + vitest (inclui migration-completeness) |
| `e2e-tests` | PR + push main | Playwright contra banco SQLite dev |
| `migrate-and-deploy` | push main apenas | migrate deploy → Vercel deploy hook |

O job `migrate-and-deploy` usa a condição:
```yaml
if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

Isso garante que o banco prod nunca é tocado em PRs.

## Seção 2: Vercel — desabilitar auto-deploy

**Vercel Dashboard → Project → Settings → Git → "Auto-assign Production Domain"**:
- Desabilitar deploy automático em push para a branch de produção

O deploy passa a ser controlado exclusivamente pelo GitHub Actions via Deploy Hook.

## Seção 3: Vercel Deploy Hook

**Vercel Dashboard → Project → Settings → Git → Deploy Hooks**:
- Criar hook chamado `github-actions-deploy` apontando para `main`
- Copiar a URL gerada

**GitHub → Settings → Secrets → Actions → New secret**:
- Name: `VERCEL_DEPLOY_HOOK`
- Value: URL do hook

## Seção 4: Build Command na Vercel

**Vercel Dashboard → Project → Settings → General → Build Command**:
```
npm run prisma:generate:prod && npm run build
```

Sem `migrate:prod` — a migration já foi aplicada pelo Actions antes do deploy ser acionado.

## Seção 5: Secrets necessários no GitHub Actions

| Secret | Descrição |
|---|---|
| `PROD_DATABASE_URL` | Connection string do banco PostgreSQL de produção |
| `VERCEL_DEPLOY_HOOK` | URL do Deploy Hook da Vercel |
| `E2E_USER_EMAIL` | Email do usuário E2E (já existe) |
| `E2E_USER_PASSWORD` | Senha do usuário E2E (já existe) |
| `NEXTAUTH_SECRET` | Secret do NextAuth (já existe) |

## Comportamento em cada cenário

| Cenário | Resultado |
|---|---|
| PR aberto/atualizado | unit + e2e rodam; banco prod intocado |
| PR fechado sem merge | banco prod intocado |
| Merge para main | migration → deploy (sequencial, garantido) |
| Migration falha | deploy não é acionado; banco prod em estado consistente |
| Banco inacessível | migration falha; deploy não acionado; admin corrige e re-roda |
| Push direto para main (hotfix) | migration + deploy rodam normalmente |

## Fora de escopo

- Rollback automático de migrations
- Ambientes de staging
- Notificações de falha (Slack, email)
