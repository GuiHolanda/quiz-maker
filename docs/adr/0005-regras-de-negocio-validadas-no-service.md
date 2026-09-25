# ADR-0005 — Regras de negócio validadas no service, handler fino

- **Status:** Aceita
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect), dentro do escopo aprovado do roadmap
- **Relacionadas:** SDD §[Regras de negócio](../sdd/feedback-e-comunicacao.md#regras-de-negócio)

## Contexto

[CLAUDE.md](../../CLAUDE.md) descreve o handler como *"validate → call service → return"*, e
[tests/CLAUDE.md](../../tests/CLAUDE.md) diz para **não** testar route handlers. Juntas, essas duas regras
deixam a validação no handler **sem teste**.

Há uma armadilha concreta: `ExamQuestion.id` é `Int`. Um `"12"` (string) no corpo atravessa o handler e chega ao
Prisma, que lança `PrismaClientValidationError` — e `toApiErrorResponse` o converte em **500** em vez de 400.
Não há biblioteca de validação de schema no projeto (sem zod, yup ou similar).

## Decisão

1. O **handler** faz apenas: `auth()` → 401; `enforceRateLimit` → 429; parse do JSON (falha → 400); chamada ao
   service; `catch` → `logApiError` + `toApiErrorResponse`. O `after()` do e-mail fica **no handler**, fora do
   service.
2. O **service** valida tudo que é regra de negócio: whitelists (`reason`, `surface`, `category`), tipos
   (`Number.isInteger`), tamanhos, trim, visibilidade da questão. Erros de regra são
   `Object.assign(new Error(msg), { status })`, com `body: { code }` quando o client precisa distinguir
   (`already_reported`).
3. O service recebe o `PrismaClient` **por construtor**
   (`constructor(prismaClient: PrismaClient = defaultPrisma as unknown as PrismaClient)`), o padrão de
   `app/api/search/search.service.ts`, para ser testado com o mock global do Prisma.
4. **Não** se introduz biblioteca de schema para isso.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Validar no handler | Não é testável pela regra do projeto; e repete o problema do `"12"` |
| Introduzir zod | Nova dependência sem precedente no projeto, para duas rotas com 6 campos |
| Testar o handler com `NextRequest` simulado | Contraria a regra explícita de `tests/CLAUDE.md` |

## Consequências

**Positivas**
- Toda regra de negócio (RN-04 a RN-18) é coberta por teste unitário do service com o Prisma mockado.
- O handler fica trivial o bastante para dispensar teste.

**Custos**
- Divergência do texto literal de CLAUDE.md ("validate → call service"): o handler valida só a **estrutura**
  (JSON legível), não o conteúdo. Registrada aqui para não parecer esquecimento.
- Validação manual em vez de schema declarativo: mais verbosa; aceitável para 6 campos.

## Revisitar quando

- O projeto adotar uma biblioteca de validação de schema por outro motivo: migrar estes services para ela.
- Uma terceira rota de feedback com payload maior aparecer.
