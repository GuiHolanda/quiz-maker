# ADR-0007 — Moderação de questões adiada: a Fase 1 não altera `ExamQuestion`

- **Status:** Aceita — **com decisão pendente do dono do produto** (ver Consequências)
- **Data:** 2026-09-25
- **Proposta por:** Claude (Solution Architect) · **Decisão de escopo:** Guilherme Holanda (aprovou criar models
  novos e **não** aprovou o campo de moderação em `ExamQuestion`, 2026-09-25)
- **Relacionadas:** [ADR-0002](0002-persistencia-de-feedback-sem-foreign-key.md) · roadmap §[Riscos abertos](../roadmap/feedback-e-comunicacao.md#riscos-abertos)

## Contexto

O marketing já promete duas coisas que dependem de moderação:

- `landing.trust.report.desc`: *"Toda questão tem botão de reportar. Itens sinalizados saem de circulação até
  nova revisão."* (`app/(marketing)/components/exam-landing/ExamTrustSection.tsx`)
- `homepage.quality.report.body`: *"Encontrou um erro? Reporte diretamente na questão. O feedback alimenta a
  melhoria contínua do pipeline de geração."* (`app/(marketing)/components/home/QualitySection.tsx`)

"Sair de circulação" exige um estado de moderação **na questão** (`ExamQuestion`) e um filtro em **todo** lugar
que lista ou sorteia questões: banco de questões, criação de simulado, disponibilidade por seção, pool
compartilhado e demo pública. É uma alteração de model existente e ampla — e o schema só foi aprovado para models
novos.

## Decisão

1. **A Fase 1 não altera `ExamQuestion`.** Reportar apenas **registra** e **avisa o time**; a questão continua
   circulando.
2. A retirada de circulação fica no backlog, atrelada ao **F3** (inbox admin, onde o time decide se um reporte
   procede). Exigirá **nova aprovação de schema** e **uma ADR própria** que a substitua ou complemente.
3. O `QuestionReport` já nasce com `status` (`open`, `triaged`, `accepted`, `rejected`, `fixed`) para que a
   triagem futura não precise de migration.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Adicionar `moderationStatus` a `ExamQuestion` já na Fase 1 | Não aprovado; muda dezenas de consultas; um reporte falso poderia esconder uma questão boa antes de haver alguém para triar |
| Tabela lateral de "questões bloqueadas" + filtro | Mesmo alcance de consultas, sem relação — e ainda exige o filtro em todos os pontos |
| Ajustar o copy do marketing agora | Decisão de produto/marketing do dono; fora do escopo desta entrega técnica |

## Consequências

**Positivas**
- A Fase 1 fica pequena e sem risco de esconder questões por reportes indevidos.
- O sinal começa a ser coletado imediatamente.

**Negativas / risco aberto**
- **A promessa "saem de circulação até nova revisão" fica sem cobertura** enquanto o F3 não existir. O produto
  promete mais do que faz.

**Decisão pendente do dono do produto, antes do lançamento público:**
- (a) aprovar o campo de moderação e priorizar o F3; **ou**
- (b) ajustar `landing.trust.report.desc` para não prometer a retirada automática.

## Revisitar quando

- Antes do lançamento público (a promessa deixa de ser inofensiva com usuários que não são o círculo próximo).
- Quando o primeiro reporte procedente chegar.
