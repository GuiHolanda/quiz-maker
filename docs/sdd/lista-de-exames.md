# SDD — Lista de Exames

| | |
|---|---|
| **Tópico** | A página `/exams` (Meus exames): o que cada card mostra e como o usuário decide o próximo passo |
| **Status** | Ativo · Preparo (P1) implementado, aguardando aceite |
| **Versão** | 1.1 (2026-09-26) |
| **Autor** | Claude · **Aprovação de escopo:** Guilherme Holanda |
| **Roadmap** | [lista-de-exames](../roadmap/lista-de-exames.md) |
| **ADRs** | Nenhuma |

## Índice

1. [Objetivo e escopo](#objetivo-e-escopo)
2. [Glossário](#glossário)
3. [Regras de negócio](#regras-de-negócio)
4. [Contratos](#contratos)
5. [Backend](#backend)
6. [Frontend](#frontend)
7. [Estratégia de testes](#estratégia-de-testes)
8. [Decisões de design](#decisões-de-design)
9. [Questões em aberto](#questões-em-aberto)
10. [Histórico de revisões](#histórico-de-revisões)

---

## Objetivo e escopo

A barra **PREPARO** do card de exame ficava em 0% na maioria dos casos e o usuário não entendia o que ela media.

**Diagnóstico (banco de dev, 2026-09-26)**

- A fórmula antiga media a cobertura por **tópico** sempre que o exame tinha tópicos: a % de tópicos com pelo menos
  uma questão salva. Só que a geração salva a questão na **seção**. O prompt de certificação nunca devolve `topic`,
  e o de concurso só devolve quando o usuário escolhe um subtópico. De 551 questões ligadas a um exame, 551 tinham
  `sectionId` e **3** tinham `topicId`: todo exame com tópicos ficava em 0%, mesmo com 83 questões em todas as
  matérias.
- Mesmo corrigida para seção, a cobertura saturava: uma questão por seção já dava 100%, e um clique em "Prova
  Completa" levava a 100% sem responder nada.
- O painel de domínios expandido tinha o rótulo "PREPARO", mas desenhava `section.minQuestions`, que é o **peso** da
  seção no edital.
- A nota de corte e o acerto não entravam no cálculo, embora seja isso que "preparo" sugere.

**Dentro do escopo:** o cálculo do preparo, o bloco PREPARO do card, o painel de domínios, a ordenação "Preparo" da
lista e o bloco "Provas em andamento" do dashboard (que usa o mesmo cálculo).

**Fora do escopo:** mudar o schema Prisma; gerar questões por tópico; contar respostas fora de simulados (ver
[Q-02](#questões-em-aberto)); a estatística "acerto" do card, que continua sendo a média histórica
([D-07](#decisões-de-design)).

---

## Glossário

| Termo | Significado |
|---|---|
| **Preparo** | Nota projetada do usuário na prova, pelo peso do edital ([RN-01](#regras-de-negócio)) |
| **Domínio** | Uma `ExamSection`: matéria do concurso ou domínio da certificação |
| **Peso do domínio** | `maxQuestions` (inteiro 0–100), o mesmo peso do simulado oficial e da geração de questões |
| **Meta do domínio** | Quantas questões do domínio cabem numa prova inteira ([RN-04](#regras-de-negócio)) |
| **Banco coberto** | Soma, por domínio, das questões no banco limitadas à meta ([RN-06](#regras-de-negócio)) |
| **Fase** | `no_sections`, `building_bank`, `ready_to_measure` ou `measured` ([RN-05](#regras-de-negócio)) |
| **Domínio não testado** | Domínio sem nenhuma resposta de simulado na janela ([RN-03](#regras-de-negócio)) |

---

## Regras de negócio

Os ids são **estáveis**: nunca renumerar. Testes citam o id no título (`it('RN-05: …')`). Uma regra removida vira
`RN-nn (removida)`.

### Cálculo

| Id | Regra | Onde é imposta |
|---|---|---|
| RN-01 | Preparo = soma de (peso × acerto) de cada domínio ÷ soma dos pesos, arredondado. Domínio não testado entra com acerto **0** | `computeExamReadiness` ([lib/exam.ts](../../lib/exam.ts)) |
| RN-02 | Peso do domínio = `maxQuestions`, o mesmo do simulado oficial e da geração de questões. Se todos os pesos forem 0, os domínios pesam igual | `blueprintWeights` ([lib/exam.ts](../../lib/exam.ts)) |
| RN-03 | O acerto de um domínio usa só as **30 respostas mais recentes** do domínio, vindas de tentativas **finalizadas e não expiradas** (`timedOut = false`). Respostas da mesma tentativa têm a mesma data; o empate é desfeito pela resposta mais nova (`id` maior). Uma questão pertence ao domínio pelo `sectionId` ou, sem `sectionId`, quando `examName` e `sectionName` casam com o nome do exame e do domínio, como no sorteio do simulado. O banco por domínio e o total "questões no banco" do card seguem a mesma regra. Resposta cuja questão não pertence a nenhum domínio do edital é ignorada | Query do service + `examReadiness` / `groupByExam` |
| RN-04 | Meta do domínio = `totalQuestions` distribuído pelos pesos com o método do maior resto, na ordem do edital (`id` crescente). O simulado oficial usa a mesma função: com o banco em `ready_to_measure`, o simulado oficial sempre tem questões suficientes em cada domínio | `blueprintDistribution`, usada pelo preparo e por `distributeQuestions` do simulado |
| RN-05 | Fase: sem domínios → `no_sections`; com pelo menos uma resposta em algum domínio → `measured`; senão, todos os domínios com banco ≥ meta → `ready_to_measure`; senão → `building_bank` | `computeExamReadiness` |
| RN-06 | O banco coberto conta, por domínio, no máximo a meta: questões sobrando num domínio não compensam a falta em outro | `computeExamReadiness` |

### Apresentação

| Id | Regra | Onde é imposta |
|---|---|---|
| RN-07 | Tom do preparo e do acerto por domínio, relativo à nota de corte: na nota ou acima → verde; até 10 pontos abaixo → amarelo; mais abaixo → vermelho. Sem nota de corte, usa a escala fixa 70/50 do `scoreTone`. A barra do preparo medido tem um marcador na nota de corte | `readinessTone` / `readinessBar` ([shared/lib/examReadiness.ts](../../shared/lib/examReadiness.ts)) |
| RN-08 | Nota abaixo da barra, em ordem de prioridade: exame concluído → texto de concluído; sem domínios → pede para montar o edital; montando o banco → "Gere mais N questões…" + link **Gerar questões**; pronto → "Faça um simulado…" + link **Criar simulado**; medido com domínios não testados → "N domínios sem simulado contam como 0%" (domínio sem peso no edital não conta); abaixo do corte → "Faltam N pontos para a nota de corte", com N arredondado para cima (a nota de corte pode ter casas decimais); na nota ou acima → confirma; sem nota de corte → explica a projeção. Nunca exibe "—" | `readinessNote` ([examReadinessNote.ts](../../app/(workspace)/exams/components/list/examReadinessNote.ts)) |
| RN-09 | Ordenação "Preparo" da lista: primeiro os medidos (maior preparo primeiro), depois os não medidos (maior banco coberto ÷ meta primeiro), por último os sem domínios | `compareReadinessAscending` invertido, em `filterAndSortExams` |
| RN-10 | "Provas em andamento" do dashboard ordena do menos pronto para o mais pronto: sem domínios, não medidos (menor progresso do banco primeiro), medidos (menor preparo primeiro) | `compareReadinessAscending` em `DashboardService` |

---

## Contratos

Nenhuma rota nova. Mudam os payloads de duas rotas existentes.

**`GET /api/exam/exams`** (`ExamService.getExams`): `Exam.readinessPercent: number` sai e entra
`Exam.readiness: ExamReadiness`.

**`GET /api/dashboard/stats`** (`DashboardService.getStats`): em `examsInProgress[]`, `readiness` passa de `number` para
`ExamReadiness` e entra `passingScore: number | null`.

```ts
type ExamReadinessPhase = 'no_sections' | 'building_bank' | 'ready_to_measure' | 'measured';

interface SectionReadiness {
  sectionId: string;
  questionCount: number;          // questões do usuário no domínio, sem teto
  targetCount: number;            // meta do domínio (RN-04)
  accuracyPercent: number | null; // null = não testado
}

interface ExamReadiness {
  phase: ExamReadinessPhase;
  projectedPercent: number | null; // só em 'measured'
  coveredQuestions: number;        // RN-06
  targetQuestions: number;
  sections: SectionReadiness[];
}
```

---

## Backend

- `computeExamReadiness` ([lib/exam.ts](../../lib/exam.ts)) é pura e roda no servidor. `compareReadinessAscending`,
  no mesmo arquivo, é importada pelo servidor (dashboard) e pelo cliente (lista); por isso fica em `lib/`.
- Os dois services montam o preparo pelas mesmas funções de `lib/exam.ts`: `groupByExam` distribui questões e
  respostas entre os exames numa passada só (pelo `examId` ou, sem `sectionId`, pelo nome do exame), e `examReadiness`
  resolve o domínio de cada uma (RN-03) antes de chamar `computeExamReadiness`.
- `ExamService.getExams` ganha uma terceira consulta em paralelo: `mockExamAttemptAnswer.findMany` filtrada por
  `attempt: { userId, finishedAt: { not: null }, timedOut: false }`. As questões e as respostas vêm dos exames listados
  pelo `examId` ou, sem `sectionId`, pelo `examName` (RN-03). As seções vêm na ordem do edital (`orderBy: { id: 'asc' }`,
  RN-04). Status (`draft`/`active`/`completed`) não mudou; `deriveReadinessAndStatus` virou `deriveStatus`.
- `DashboardService` não ganha consulta: reaproveita `sectionAnswers`, que passa a trazer o `id` da resposta e
  `examId`, `sectionId`, `examName` e `sectionName` da questão, e descarta as respostas de tentativas expiradas antes do
  cálculo (a consulta traz as expiradas porque "questões erradas em aberto" as usa). A consulta de exames passa a trazer
  `totalQuestions`, `passingScore` e o nome e o peso das seções, na ordem do edital.
- O custo de `getExams` ainda cresce com o histórico: a consulta traz todas as respostas de simulados finalizados dos
  exames listados, embora o cálculo use no máximo 30 por domínio. Limitar por domínio exigiria SQL cru com window
  function; fica para quando o volume pedir.

---

## Frontend

| Arquivo | Papel |
|---|---|
| `components/list/ExamCardReadiness.tsx` | Bloco PREPARO do card: valor, barra, nota e link de ação |
| `components/list/examReadinessNote.ts` | Lógica pura da nota (RN-08) |
| `components/list/examCardActions.ts` | Rota, rótulo e ícone de "Gerar questões" e "Criar simulado", usados pelo link de ação do bloco PREPARO e pelo menu do card |
| `components/list/ExamCardDomainsPanel.tsx` | Por domínio: acerto (ou "não testado") e banco coberto/meta. Deixou de mostrar o peso do edital |
| `shared/lib/examReadiness.ts` | Tom (RN-07) e barra, usados pelo card, pelo painel e pelo dashboard |
| `shared/components/ui/ProgressTrack.tsx` | Nova prop `markerPercent` para o marcador da nota de corte, centrado no valor e contido na trilha |
| `dashboard/components/exams/ExamProgressRow.tsx` | Mesmas fases, em versão compacta; sem domínios mostra "sem domínios" |

**Estados do bloco PREPARO**

| Fase | Valor à direita | Barra | Nota + ação |
|---|---|---|---|
| `no_sections` | nenhum | vazia | pede para montar o edital |
| `building_bank` | `18/40 questões` | banco coberto ÷ meta, arredondado para baixo (só enche com o banco completo), `bg-primary` | "Gere mais 22 questões…" + **Gerar questões** |
| `ready_to_measure` | `Pronto para medir` | cheia, `bg-primary` | "Faça um simulado…" + **Criar simulado** |
| `measured` | `54%` no tom (RN-07) | preparo no tom + marcador no corte | ver RN-08 |

A cor `bg-primary` separa o progresso do banco (rumo a uma meta) do preparo medido (uma nota, com as cores de tom).

**Preparo sempre atual.** O `ExamsProvider` é montado por página (`/exams`, `/exams/new`, `/exams/catalog`, edição,
geração, simulados), não no layout raiz. Cada visita a `/exams` monta um provider novo, que busca `getExams`: depois
de gerar questões, fazer simulado, criar, copiar do catálogo ou editar um exame, a lista abre com o preparo atual. Um
exame criado entra pelo `addExam` do provider da página de criação, que não mostra a lista. Mover o provider para o
layout raiz deixaria o preparo velho entre páginas; o E2E "reopening the list through the sidebar" pega essa regressão.

---

## Estratégia de testes

| Arquivo | Cobre |
|---|---|
| `tests/unit/lib/exam-readiness.test.ts` | RN-01 a RN-06 (incluindo o empate de data e as questões sem `sectionId` casadas pelo nome), `blueprintDistribution`, `groupByExam` e o comparador (RN-09) |
| `tests/unit/features/simuladoFormState.test.ts` | RN-04: o simulado oficial pede exatamente as metas do preparo |
| `tests/unit/api/services/exam.service.test.ts` | RN-01, RN-03 (filtro das queries e questões casadas pelo nome), RN-04 (ordem das seções) e RN-05 via `getExams` |
| `tests/unit/api/services/dashboard.service.test.ts` | RN-10, RN-03 (questões casadas pelo nome), RN-04 (ordem das seções) e o descarte de respostas expiradas |
| `tests/unit/features/examsListFilters.test.ts` | RN-09 na ordenação da lista |
| `tests/unit/shared/examReadiness.test.ts` | RN-07 e a barra de cada fase |
| `tests/unit/features/examReadinessNote.test.ts` | RN-08, incluindo as chaves de singular, a nota de corte com casas decimais e o domínio sem peso |
| `tests/e2e/tests/exams-list-unified.spec.ts` | RN-08 no navegador: sem simulado, o card mostra o banco e o link de gerar questões; o painel lista um domínio por linha. RN-03: respostas a questões antigas, casadas pelo nome, medem o exame. Reabrir a lista pela sidebar mostra o banco que cresceu em outra página |

Componentes React não têm teste unitário (o vitest roda em node): foram verificados no Playwright, nos temas claro e
escuro, com um exame semeado em cada fase.

---

## Decisões de design

| Id | Decisão | Por quê |
|---|---|---|
| D-01 | Preparo = nota projetada pelo edital | Cobertura do banco satura rápido e não mede preparo; duas barras (cobertura + desempenho) pesariam o card, e o problema original era clareza. Descartadas: só cobertura; duas barras |
| D-02 | Granularidade de domínio, não de tópico | As questões quase nunca têm `topicId` (3 de 551). Medir por tópico exigiria mudar os prompts e a persistência primeiro |
| D-03 | Domínio não testado conta como 0 | Um domínio nunca praticado é risco real na prova. Descartado: ignorar e renormalizar os pesos, que daria 90% a quem só treinou um domínio de 10% do edital |
| D-04 | Janela das 30 respostas mais recentes por domínio | Deixa o preparo subir quando o usuário melhora, em vez de ficar preso a tentativas antigas. Descartados: todas as respostas (nunca se recupera) e janela de 14 dias como `weakDomains` (zera quem pausou duas semanas) |
| D-05 | Tentativas expiradas (`timedOut`) ficam de fora | Mesmo critério do "acerto" do card e do dashboard |
| D-06 | Sem simulado, o bloco mostra o próximo passo com um progresso real, em vez de "—" | Pedido explícito: "—" não diz nada. O progresso do banco dá uma meta concreta e o link leva direto à ação |
| D-07 | A estatística "acerto" do card continua sendo a média histórica dos simulados | O preparo difere dela por ponderar pelo edital e punir lacunas; a nota abaixo da barra explica a diferença. Rever se confundir |
| D-08 | Links de ação só em `building_bank` e `ready_to_measure` | Nos estados medidos a nota já aponta o problema, e o menu do card tem as ações. Evita um link em todo card |
| D-09 | Preparo e simulado oficial usam a mesma distribuição (`blueprintDistribution`, peso `maxQuestions`); a geração já distribuía pelo mesmo peso | Com o preparo pelo ponto médio e o simulado pelo máximo, o card dizia "Pronto para medir" e o simulado oficial recusava com 422 por falta de questões num domínio. Descartados: nota pelo ponto médio e meta pelo máximo (duas ponderações no mesmo card) e tudo pelo ponto médio (muda o simulado e a geração) |
| D-10 | Questões sem `sectionId` entram no preparo pelo nome do exame e do domínio, como no simulado | O simulado já sorteia essas questões; ignorá-las fazia o card pedir para gerar questões que o usuário já tinha, gastando cota. Descartados: deixar de fora até medir em produção, e um backfill de `examId`/`sectionId` (migração de dados, fora do escopo) |
---

## Questões em aberto

| Id | Questão | Dono | Bloqueia |
|---|---|---|---|
| Q-01 | Concursos com nota mínima por matéria: hoje só existe a nota de corte geral. Modelar exigiria schema | Guilherme | — |
| Q-02 | Respostas fora de simulado (prática no banco de questões) não são persistidas, então não entram no preparo | Guilherme | — |
| Q-03 | Preparo por tópico depende de a geração gravar `topicId` (D-02) | Guilherme | — |

---

## Histórico de revisões

| Versão | Data | Mudança |
|---|---|---|
| 1.0 | 2026-09-26 | Versão inicial: preparo como nota projetada (P1) |
| 1.1 | 2026-09-26 | Ajustes da revisão do PR #103: peso pelo `maxQuestions` e distribuição compartilhada com o simulado (RN-02, RN-04, D-09); questões sem `sectionId` casadas pelo nome e empate de data (RN-03, D-10); nota com corte decimal e domínio sem peso (RN-08); registro de que o preparo não fica velho entre páginas (provider por página) |
