# Design: `/dashboard` → "Início" — redesign per mockup "Workspace - Início"

**Data:** 2026-09-09
**Branch:** feature/dashboard-inicio-redesign (a partir de `main`)
**Status:** Aprovado (design em chat + decisões de escopo confirmadas pelo usuário)
**Fonte:** Claude Design project `7cf07948-8e2e-4c75-87a4-6192707d4b69`, arquivo `Workspace - Início.dc.html` (+ `support.js`, que é só o runtime DC — não influi na implementação)

---

## 1. Contexto

`/dashboard` hoje é uma tela de **analytics de desempenho**: `PerformanceHeader` + `ReadinessGauge` ("em breve"), `KpiRibbon` (4 KPIs, dois marcados "em breve"), `FocusAreasSection`, `ScoreTrendSection` (sparkline), `RecentSessionsSection`, `DomainBreakdownSection`. Tudo alimentado por um único `GET /api/dashboard/stats` → `DashboardStats` (`totalSimuladosCompleted`, `bestScore`, `recentSessions`, `scoreTrend`, `domainBreakdown`).

O mockup "Início" não é um restyle disso — é outra página: um **hub de ação** para a home do workspace. Seções:

| Seção do mockup | Dado necessário | Situação hoje |
|---|---|---|
| Saudação + frase-resumo + botão "Nova certificação" | nome, contagens | parcial (saudação existe) |
| 4 KPIs: sequência · questões na semana · acerto médio · simulados (+ "1 em aberto") | streak, contagem semanal + delta, acerto médio + delta, simulados em aberto | quase tudo novo |
| "Continuar de onde parou" — retomar simulado pausado | última tentativa não-finalizada + respondidas/total | novo |
| "Provas em andamento" — exames com preparo % + acerto % | readiness por exame + acerto | preparo não existe (era o gauge "em breve") |
| "Onde você mais erra" — domínios fracos, últimas 2 semanas, com volume | acerto por domínio + volume, com janela de tempo | estende `domainBreakdown` |
| "Ações rápidas" — 4 links com contagens | tamanho do banco, contagem de erradas em aberto | links existem, contagens novas |
| "Atividade" — feed de eventos de 7 dias | log unificado de atividade (tentativas / geração / rascunhos) | não existe tabela de eventos — precisa ser sintetizado |
| "Créditos de questões" — barra de uso + renovação + indicação | `useUsageContext` + referral | disponível no client |

## 2. Objetivo

Substituir a página inteira pelo hub "Início" do mockup, com **todos os cards alimentados por dado real** (decisão do usuário: "Completo — tudo real, inclusive readiness"). O readiness ("preparo") é uma heurística documentada; a "Atividade" é sintetizada de tabelas existentes. **Sem migration** — nenhuma coluna nova.

Decisões de escopo confirmadas:
- **Escopo backend:** Completo — reescrita de `DashboardService`, readiness real, feed sintetizado.
- **Analytics atual:** deletar por inteiro (o mockup é a nova página).
- **Fórmula de readiness:** reusar a de `/exams` (cobertura de conteúdo) via helper compartilhado — um "Preparo" só no produto (ver §4.0).
- **"Provas em andamento":** exames com atividade, menos preparado primeiro, limite 5.

## 3. Contrato de dados — `shared/types/index.ts`

Removidos: `DashboardStats`, `DashboardRecentSession`, `DashboardScoreTrendPoint`, `DashboardDomainStat` (só o dashboard consome — confirmado por grep: `dashboard.service.ts`, `connectors.ts`, `page.tsx`, os dois arquivos de teste).

Adicionados:

```ts
export interface DashboardHome {
  kpis: DashboardKpis;
  resume: DashboardResume | null;
  examsInProgress: DashboardExamProgress[];   // <= 5, menos preparado primeiro
  weakDomains: DashboardWeakDomain[];          // <= 4, ultimos 14d, volume >= 5
  quickActions: { bankCount: number; wrongOpenCount: number };
  activity: DashboardActivityItem[];           // <= 6, ultimos 7d, mais novo primeiro
}

export interface DashboardKpis {
  streakDays: number;
  questionsThisWeek: number;
  questionsWeekDelta: number;                  // vs 7d anteriores
  avgAccuracy: number | null;                  // ultimos 30d, 0-100
  avgAccuracyDelta: number | null;             // vs 30d anteriores, em pontos
  simuladosTotal: number;
  simuladosOpen: number;
}

export interface DashboardResume {
  mockExamId: number;
  attemptId: number;
  simuladoName: string;
  examName: string;
  examBoardName: string | null;
  totalQuestions: number;
  answeredQuestions: number;
  durationMinutes: number | null;
  startedAt: string;                           // ISO — para "pausado há X"
}

export interface DashboardExamProgress {
  examId: string;
  name: string;
  type: ExamType;
  boardName: string | null;
  keyLabel: string | null;                     // key ?? role ?? String(year) ?? null
  readiness: number;                           // 0-100
  accuracy: number | null;                     // 0-100
}

export interface DashboardWeakDomain {
  sectionName: string;
  accuracy: number;                            // 0-100
  questionVolume: number;                      // respostas na janela
}

export interface DashboardActivityItem {
  kind: 'simulado_finished' | 'questions_generated' | 'exam_created' | 'auto_config_done';
  at: string;                                  // ISO
  params: { name?: string; score?: number; count?: number };
}
```

Texto de "Atividade" e da frase-resumo é **montado no client** via `t()` — o service não tem o idioma do usuário. `connectors.ts` `getDashboardStats()` passa a devolver `DashboardHome`.

## 4. Backend

### 4.0 Helper compartilhado de readiness — `lib/exam/readiness.ts` (novo)

`ExamService.deriveReadinessAndStatus` (`features/services/exam/exam.service.ts:846-857`) calcula "preparo" como **cobertura de conteúdo**: `% de tópicos que têm ≥ 1 questão gerada` (ou `% de seções`, quando o exame não tem tópicos). Decisão do usuário: o dashboard reusa **exatamente** esse número — um "Preparo" só no produto inteiro.

Extrair a expressão inline para uma função pura:

```ts
// lib/exam/readiness.ts
interface ReadinessSection { readonly id: string; readonly topics: readonly { readonly id: string }[]; }
interface ReadinessQuestion { readonly sectionId: string | null; readonly topicId: string | null; }

export function computeExamReadiness(
  sections: readonly ReadinessSection[],
  questions: readonly ReadinessQuestion[],
): number {
  if (sections.length === 0) return 0;
  const topics = sections.flatMap((s) => s.topics);
  if (topics.length > 0) {
    const covered = topics.filter((t) => questions.some((q) => q.topicId === t.id)).length;
    return Math.round((covered / topics.length) * 100);
  }
  const covered = sections.filter((s) => questions.some((q) => q.sectionId === s.id)).length;
  return Math.round((covered / sections.length) * 100);
}
```

`exam.service.ts` passa a chamar `computeExamReadiness(exam.sections, examQuestionsForExam)` no lugar do bloco inline; o resto de `deriveReadinessAndStatus` (status/completed) não muda. Os testes de `exam.service.test.ts` que cobrem readiness continuam passando sem edição.

### 4.1 `dashboard.service.ts` — reescrita completa

`getStats(userId): Promise<DashboardHome>` — um `Promise.all` de leituras, depois agregação em memória (mesmo padrão do `computeDomainBreakdown` atual). Route handler **não muda**.

**Constante:** `DASHBOARD_TZ = 'America/Sao_Paulo'` no topo do arquivo (regra desta métrica, não config de app).

**`MockExamAttempt.score` é contagem crua de acertos**, não percentual (`mock-exam.service.ts:582` faz `score += 1`; `:716` normaliza por `score / totalQuestions * 100`). Todo cálculo de acerto no dashboard **normaliza** por `mockExam._count.questions`: `accuracyPct(attempt) = round(attempt.score / totalQuestions * 100)` (ignora `totalQuestions === 0`). O código antigo tratava `score` como percentual — não copiar esse comportamento.

**Leituras (`Promise.all`):**

- `A` = `mockExamAttempt.findMany({ where: { userId }, select: { startedAt, finishedAt, score, mockExamId, mockExam: { select: { name, durationMinutes, _count: { select: { questions } }, exam: { select: { name, examBoard: { select: { name } } } } } }, _count: { select: { answers } } } })` — **uma** leitura de todas as tentativas do usuário.
- `U` = `usageLog.findMany({ where: { userId, createdAt: { gte: now - 60d } }, select: { action, count, refName, createdAt } })`.
- `E` = `exam.findMany({ where: { userId, isTemplate: false }, select: { id, name, type, key, role, year, updatedAt, examBoard: { select: { name } }, sections: { select: { id, topics: { select: { id } } } } } })`.
- `Q` = `examQuestion.findMany({ where: { userId }, select: { examId, sectionId, topicId } })`.
- `S` = respostas de tentativa por seção, para `weakDomains` e `wrongOpenCount`:
  `mockExamAttemptAnswer.findMany({ where: { attempt: { userId } }, select: { isCorrect, mockExamQuestion: { select: { examQuestionId, examQuestion: { select: { examId, sectionName } } }, }, attempt: { select: { finishedAt } } } })`.
- `AC` = `autoConfigJob.findMany({ where: { userId, status: 'done', updatedAt: { gte: now - 7d } }, select: { seedName, updatedAt }, orderBy: { updatedAt: 'desc' }, take: 5 })`.

### 4.2 KPIs (de `A` e `U`)

Datas locais: converter `Date` → `YYYY-MM-DD` no `DASHBOARD_TZ` via `Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TZ })`.

| Campo | Lógica |
|---|---|
| `streakDays` | conjunto de datas locais distintas de `{ A.finishedAt não-nulo } ∪ { U.createdAt }`. A partir de hoje (local), conta dias consecutivos para trás enquanto a data estiver no conjunto; se hoje não está mas ontem está, começa de ontem; senão `0` |
| `questionsThisWeek` | `Σ A._count.answers` sobre `A` com `finishedAt ∈ [now-7d, now]` |
| `questionsWeekDelta` | `questionsThisWeek − (Σ answers sobre finishedAt ∈ [now-14d, now-7d])` |
| `avgAccuracy` | média de `accuracyPct(a)` sobre `A` com `finishedAt ∈ [now-30d, now]` e `_count.questions > 0`; `null` se a janela estiver vazia |
| `avgAccuracyDelta` | `round(avgAccuracy − avgAccuracyPrev)` onde `prev` é a mesma média em `[now-60d, now-30d]`; `null` se qualquer das duas janelas estiver vazia |
| `simuladosTotal` | `new Set(A.map(a => a.mockExamId)).size` |
| `simuladosOpen` | `A.filter(a => a.finishedAt == null).length` |

### 4.3 `resume` (de `A`)

`A` filtrado para `finishedAt == null`, `sort` por `startedAt` desc, primeiro. `null` se nenhum. Map:
`{ mockExamId, attemptId: a.id, simuladoName: mockExam.name ?? mockExam.exam.name, examName: mockExam.exam.name, examBoardName: mockExam.exam.examBoard?.name ?? null, totalQuestions: mockExam._count.questions, answeredQuestions: a._count.answers, durationMinutes: mockExam.durationMinutes, startedAt: a.startedAt.toISOString() }`.

> `A` precisa incluir `id` no select (adicionar) — a linha acima usa `a.id` como `attemptId`.

### 4.4 `examsInProgress` (de `E`, `Q`, `A`)

Para cada exame em `E`:
- `qs` = `Q.filter(q => q.examId === exam.id)`. **Filtra**: mantém só exames com `qs.length > 0` **ou** `A.some(a => a.mockExam` … pertence a esse exame`)` — isto é, `A` precisa expor `examId` (via `mockExam.exam` não; usar `mockExam.examId` — **adicionar `examId` ao select de `mockExam` em `A`**).
- `readiness = computeExamReadiness(exam.sections, qs)` (§4.0).
- `accuracy` = média de `accuracyPct(a)` sobre as tentativas finalizadas (`finishedAt != null`, `_count.questions > 0`) cujo `mockExam.examId === exam.id`; `null` se nenhuma.
- `boardName = exam.examBoard?.name ?? null`; `keyLabel = exam.key ?? exam.role ?? (exam.year ? String(exam.year) : null)`.
- Ordena por `readiness` asc (menos preparado no topo). `slice(0, 5)`.

### 4.5 `weakDomains` (de `S`)

`S` filtrado para `attempt.finishedAt ∈ [now-14d, now]`, agrupado por `mockExamQuestion.examQuestion.sectionName`:
- `accuracy = round(corretas / total * 100)`
- `questionVolume = total`
- mantém só seções com `questionVolume >= 5` (evita um domínio de 1 questão a 0% dominar o card)
- ordena `accuracy` asc, `slice(0, 4)`

### 4.6 `quickActions` (de `Q` e `S`)

| Campo | Lógica |
|---|---|
| `bankCount` | `Q.length` (todas as questões do usuário, com ou sem `examId`) |
| `wrongOpenCount` | agrupa **todo** `S` (sem janela) por `mockExamQuestion.examQuestionId`; conta grupos com `alguma isCorrect === false` **e** `nenhuma isCorrect === true`. Aproximação documentada — "em aberto" = errou e nunca acertou desde então |

### 4.7 `activity` (de `A`, `U`, `AC`, `E`)

Monta os 4 tipos, cada um nos últimos 7 dias, `take 5` cada; concatena; `sort` por `at` desc; `slice(0, 6)`:

| `kind` | Fonte | `at` | `params` |
|---|---|---|---|
| `simulado_finished` | `A` com `finishedAt ∈ [now-7d, now]` | `finishedAt` | `{ name: mockExam.name ?? mockExam.exam.name, score: accuracyPct(a) }` |
| `questions_generated` | `U` com `action === 'generate_questions'` e `createdAt ∈ [now-7d, now]` | `createdAt` | `{ count: u.count, name: u.refName ?? undefined }` |
| `auto_config_done` | `AC` (já filtrado a 7d na query) | `updatedAt` | `{ name: seedName }` |
| `exam_created` | `E` com `updatedAt`… → usar `exam.createdAt`; **adicionar `createdAt` ao select de `E`**; filtro `createdAt ∈ [now-7d, now]` | `createdAt` | `{ name: exam.name }` |

(O mockup também tem "questões marcadas para revisão" — não existe feature de bookmark; omitido.)

### 4.8 Performance

6 leituras num único `Promise.all` (hoje são 5). As tentativas (`A`) e as respostas por seção (`S`) são lidas **uma vez cada** e reaproveitadas entre KPIs / resume / examsInProgress / activity (A) e weakDomains / quickActions (S). Índices existentes cobrem tudo: `MockExamAttempt@@index([userId, finishedAt])`, `MockExamAttemptAnswer@@index([attemptId])`, `ExamQuestion@@index([userId])`, `UsageLog@@index([userId, createdAt])`, `AutoConfigJob@@index([userId])`. `S` faz nested-select em `mockExamQuestion → examQuestion` — mesmo shape do `computeDomainBreakdown` atual, que já roda em produção. Sinalizar no review mesmo assim.

## 5. Frontend — `app/(workspace)/dashboard/`

### 5.1 `page.tsx`

Mantém `'use client'` + `<PageHeader>` + `useEffect(() => getDashboardStats().then(setHome).catch(() => setHome(EMPTY_HOME)))`. `EMPTY_HOME` é uma constante local no `page.tsx` (KPIs zerados, `resume: null`, arrays vazios) — mesmo papel do `EMPTY_STATS` atual. Um estado `home: DashboardHome | null`, passado em fatias para cada card. Cada card renderiza seu próprio skeleton (`SkeletonListLoader`) quando a fatia é `null` e `EmptyState` quando vazia.

```
<PageHeader>
  <div data-testid="dashboard-root" className="space-y-6">
    <HomeHeader summary={...} onNewCert={...} />
    <HomeKpiGrid kpis={home?.kpis ?? null} />
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
      <div className="grid gap-4">
        <ResumeCard resume={home?.resume ?? null} loading={home === null} />
        <ExamsInProgressCard exams={home?.examsInProgress ?? null} />
        <WeakDomainsCard domains={home?.weakDomains ?? null} />
      </div>
      <div className="grid gap-4">
        <QuickActionsCard counts={home?.quickActions ?? null} />
        <ActivityCard items={home?.activity ?? null} />
        <CreditsCard />
      </div>
    </div>
  </div>
</PageHeader>
```

### 5.2 Componentes novos (todos `app/(workspace)/dashboard/components/`)

| Arquivo | Papel |
|---|---|
| `HomeHeader.tsx` | kicker de data (`font-mono`), saudação (lógica atual `dashboard.greeting.*` + hora em effect), frase-resumo paramétrica, botão "Nova certificação" |
| `kpi/HomeKpiGrid.tsx` | grid `repeat(auto-fit,minmax(200px,1fr))` de 4 `StatCard` (streak, questões/semana, acerto médio, simulados) |
| `resume/ResumeCard.tsx` | card "Continuar de onde parou" — escondido inteiro quando `resume === null` |
| `exams/ExamsInProgressCard.tsx` + `exams/ExamProgressRow.tsx` | lista de provas com barra de preparo + % de acerto |
| `weak/WeakDomainsCard.tsx` + `weak/WeakDomainRow.tsx` | domínios fracos: nome + barra + % + volume |
| `actions/QuickActionsCard.tsx` | 4 links (grid), com contagens |
| `activity/ActivityCard.tsx` + `activity/ActivityRow.tsx` | feed: badge de ícone + texto via `t()` + `RelativeDate` |
| `credits/CreditsCard.tsx` | `useUsageContext()` — barra de uso + renovação + CTAs |

`loading.tsx` — skeleton remodelado (header + 4 KPI + duas colunas).

### 5.3 Componentes deletados

`components/header/PerformanceHeader.tsx`, `components/header/ReadinessGauge.tsx`, `components/kpi/KpiRibbon.tsx`, `components/kpi/KpiCard.tsx`, `components/focus/FocusAreasSection.tsx`, `components/focus/FocusAreaCard.tsx`, `components/ScoreTrendSection.tsx`, `components/sessions/RecentSessionsSection.tsx`, `components/sessions/SessionRow.tsx`, `components/domains/DomainBreakdownSection.tsx`, `components/domains/DomainRow.tsx`.

`StatCard` (`shared/components/ui/StatCard.tsx`) **fica** — 5 outros consumidores.

### 5.4 Tradução visual do mockup (hex navy → tokens; ref `app/CLAUDE.md` + memória `claude-design-mcp`)

- **Cards:** `bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6` (ou `p-5` nas listas) — **sem borda no dark**, inclusive o card "Continuar de onde parou" (o acento `#22406e` do mockup vira o kicker `text-primary` + CTA `buttonStyles.primary`, sem ring nem borda colorida).
- `#e07820`→`primary`; `#4fb894`/`#e2756b`→ `scoreToneBg`/`scoreToneText` de `shared/lib/scoreTone` (limiares já são 70/50); `#4d87bc`→`text-navy-400`; `#6a9fc8`→`text-default-500`; `#c6d6e6`→`text-foreground`/`text-default-600`.
- Valores numéricos → `font-mono` (Fira Code, `--font-mono`).
- Barras de progresso → `div` simples: trilho `bg-background`, preenchimento `bg-primary` ou tom por score; **sem gradiente**.
- Kickers (`CONTINUAR DE ONDE PAROU`, `CRÉDITOS DE QUESTÕES`, `7 DIAS`) → `font-mono text-xs text-default-400 uppercase tracking-widest` (exceção "section kicker" permitida).
- Ícones lucide → FontAwesome: `faPlus`, `faFire`, `faCircleCheck`, `faPercent`, `faFileLines`, `faPlay`, `faArrowRight`, `faBullseye`, `faWandMagicSparkles`, `faLayerGroup`, `faRotateLeft`, `faFileCirclePlus`, `faCircleArrowUp`, `faGift`.
- Botões só via `buttonStyles`: "Nova certificação" / "Retomar simulado" → `primary`; "Treinar fraquezas" / "Ver planos" / "Indicar e ganhar" → `secondary` (`variant="bordered"`); "Ver todas" → link puro (`text-primary text-sm font-semibold` + `faArrowRight`). Nada de `color=` em `<Button>`; icon-only com `isIconOnly` + `size="sm"` + `aria-label`.

### 5.5 Comportamentos

- **HomeHeader → "Nova certificação":** reusa `ExamTypePickerModal` (`isOpen`/`onClose`/`onConfirm`) de `app/(workspace)/exams/components/`; `onConfirm(type) → router.push('/exams/new?type=' + type)` (idêntico a `exams/page.tsx`). Estado local `useState(false)` para o modal.
- **Frase-resumo:** `t('dashboard.home.summary', { exams: examsInProgress.length, wrong: quickActions.wrongOpenCount })` + cláusula opcional `t('dashboard.home.summaryResume', { name: resume.simuladoName })` concatenada quando `resume` existe. Enquanto `home === null`, some com a frase (ou mostra um placeholder curto).
- **ResumeCard:** `null` → card não renderiza. CTA → `router.push('/simulados/' + mockExamId + '/tentativa/' + attemptId)` (mesma rota que `useSimuladoActions.handleStart` usa para `openAttemptId`). Progresso = `answeredQuestions / totalQuestions`; pct exibido `font-mono`. "pausado há X" via `RelativeDate` sobre `startedAt`.
- **ExamsInProgressCard:** "Ver todas" → `/exams`. Linha: nome, meta `boardName · keyLabel` (junta com `·`, ignora nulos), barra de preparo (`bg-primary`), % de acerto à direita com `scoreToneText` (`—` se `accuracy === null`). Vazio → `EmptyState` com ação "Nova certificação" (abre o mesmo modal).
- **WeakDomainsCard:** "Treinar fraquezas" → `/simulados`. Linha: nome (trunca), barra por tom, `pct` `font-mono`, volume (`t('dashboard.home.weakVolume', { count })`). Vazio (nenhum domínio com volume ≥ 5) → `EmptyState`.
- **QuickActionsCard:** 4 links —
  1. Gerar questões → `/questions` (nota estática)
  2. Criar simulado → `/simulados` (nota estática)
  3. Banco de questões → `/question-bank` (`t('dashboard.home.actionBankNote', { count: bankCount })`)
  4. Revisar erros → `/question-bank` (`t('dashboard.home.actionReviewNote', { count: wrongOpenCount })`)
- **ActivityCard:** linha = badge de ícone (cor por `kind`: finished→success, generated→primary, auto_config→primary, created→default) + `t('dashboard.home.activity.' + kind, params)` + `RelativeDate` sobre `at`. Vazio → `EmptyState`.
- **CreditsCard:** `useUsageContext()`. Barra `questionsUsed / questionsLimit`; se `questionsLimit === -1` esconde a barra e mostra `t('dashboard.home.creditsUnlimited')`. Renovação = `periodStartDate + 30d` formatada (mesmo cálculo de `UsageBadge`/`BillingOverview`). "Ver planos" → `/billing`; "Indicar e ganhar" → `/billing`.

## 6. i18n

Bloco novo `dashboard.home.*` em `public/messages/en.properties` **e** `pt.properties`, mantendo os dois arquivos alinhados linha a linha (memória `i18n-dead-key-analysis`). Chaves:

- KPIs: `kpiStreak`, `kpiStreakUnit`, `kpiQuestionsWeek`, `kpiQuestionsWeekDelta` (`{delta} vs. semana anterior`), `kpiAvgAccuracy`, `kpiAvgAccuracyDelta` (`{delta} pts`), `kpiSimulados`, `kpiSimuladosOpen` (`{count} em aberto`)
- Header: `summary`, `summaryResume`, `newCert`, `dateKicker` (se precisar de formato próprio; senão `toLocaleDateString`)
- Resume: `resumeKicker`, `resumeCta`, `resumeProgress` (`{answered} de {total} questões respondidas`), `resumePaused`
- Provas: `examsInProgressTitle`, `examsInProgressSeeAll`, `examsReadiness`, `examsAccuracy`, `examsInProgressEmpty` + `...EmptyDescription`
- Domínios: `weakTitle`, `weakSubtitle`, `weakTrainCta`, `weakVolume` (`{count} questões`), `weakEmpty` + `...EmptyDescription`
- Ações: `actionsTitle`, `actionGenerate` + `...Note`, `actionSimulado` + `...Note`, `actionBank` + `actionBankNote`, `actionReview` + `actionReviewNote`
- Atividade: `activityTitle`, `activityWindow` (`7 DIAS`), `activity.simulado_finished` (`{name} finalizado com {score}% de acerto`), `activity.questions_generated` (`{count} questões geradas para {name}`), `activity.exam_created` (`{name} criado`), `activity.auto_config_done` (`Configuração de {name} concluída`), `activityEmpty` + `...EmptyDescription`
- Créditos: `creditsKicker`, `creditsLabel` (`{used} / {limit}`), `creditsUnlimited`, `creditsRenew` (`Renova em {date}`), `creditsPlans`, `creditsReferral`

Chaves mortas dos componentes deletados removidas dos dois arquivos **no mesmo commit** (`dashboard.examReadiness`, `.projectedScore`, `.peerRank`, `.studyStreak*`, `.questionsMastered*`, `.focusAreas*`, `.noFocusAreas*`, `.recentSessions*`, `.noRecentSessions*`, `.scoreTrend*`, `.noScoreTrend*`, `.domainBreakdown*`, `.noDomainBreakdown*`, `.simuladosCompleted*`, `.bestScore*`, `.masteryProgress`, `.accuracy`, `.studyNow`, `.onTrack`, `.weakAreasNote`, `.quickPractice` — verificar cada uma com o método da memória antes de apagar; `dashboard.greeting.*`, `dashboard.mockExam`, `dashboard.comingSoon` podem continuar em uso).

## 7. Testes

### 7.1 Unit — `tests/unit/api/services/dashboard.service.test.ts` (reescrita completa)

Trava em `dashboard.service.test.ts`:
- **streak:** dias consecutivos; buraco quebra a sequência; hoje sem atividade começa de ontem; sem atividade → 0.
- **questionsThisWeek/Delta:** soma de `_count.answers` na janela de 7d vs janela anterior.
- **avgAccuracy:** normaliza `score` por `_count.questions` (não trata como percentual); `null` quando a janela de 30d está vazia; delta `null` se qualquer janela vazia.
- **examsInProgress:** filtra exames sem atividade; ordena por `readiness` asc; `accuracy` normalizada e `null` sem tentativa; `slice(0,5)`.
- **weakDomains:** janela de 14d aplicada; corte `volume >= 5`; ordenação ascendente por acerto; `slice(0,4)`.
- **activity:** merge das 4 fontes, ordenação `at` desc, `slice(0,6)`; `score` do `simulado_finished` normalizado.
- **resume:** pega a tentativa aberta mais recente por `startedAt`; `null` quando não há.
- **wrongOpenCount:** exclui questão que foi acertada depois.

Trava em `lib/exam/readiness.test.ts` (novo): cobertura por tópicos; fallback para seções quando não há tópicos; exame sem seções → 0; arredondamento.

Trava em `exam.service.test.ts`: os testes de readiness existentes continuam passando após a extração (sem editar o teste).

Mock do Prisma via `prismaMock` (deep-mock global). As múltiplas leituras de `mockExamAttempt`/`mockExamAttemptAnswer`/`exam`/`examQuestion`/`usageLog`/`autoConfigJob` se distinguem pelo model (`prismaMock.<model>.findMany.mockResolvedValue(...)`) — cada model tem uma leitura só.

### 7.2 E2E — `tests/e2e/tests/dashboard.spec.ts` (reescrita)

Novos `data-testid` no `TID` de `tests/e2e/support/selectors.ts`: `dashboardKpis`, `dashboardResume`, `dashboardExamsProgress`, `dashboardWeakDomains`, `dashboardQuickActions`, `dashboardActivity`, `dashboardCredits` (e remover `dashboardKpiRibbon`, `dashboardFocusAreas`, `dashboardRecentSessions`, `dashboardDomainBreakdown`, `dashboardSessionRow` se não usados em outro spec).

**Ajuste no seed** (`tests/e2e/global-setup.ts`, `seedCompletedMockExamAttempt`): as datas hardcoded `2024-06-01` deixam a tentativa fora de todas as janelas (7d/14d/30d) das métricas novas — o card de atividade e os KPIs ficariam vazios. Trocar por datas relativas:
```ts
const finishedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);        // 3 dias atrás
const startedAt = new Date(finishedAt.getTime() - 30 * 60 * 1000);
```
`dashboard.spec.ts` é o único consumidor dessa tentativa (grep confirmado) — mudança segura.

Asserções (seed = 1 tentativa finalizada 3 dias atrás, 2/3 corretas, nenhuma aberta):
- `dashboard-root`, `dashboard-kpis`, `dashboard-activity`, `dashboard-quick-actions`, `dashboard-credits` visíveis.
- `dashboard-activity` contém 1 item de simulado finalizado (dentro de 7d).
- `dashboard-resume` **ausente** (`await expect(page.locator(tid(TID.dashboardResume))).toHaveCount(0)`).
- `dashboard-exams-progress` renderiza com ≥ 1 linha (cert + concurso semeados têm questões).
- `dashboard-weak-domains` renderiza (só 3 respostas na seção < corte de 5 → `EmptyState` dentro do card; asserção aceita card visível).
- Teste de empty total: `page.route('**/api/dashboard/stats', route => route.fulfill({ status: 200, body: JSON.stringify(EMPTY_HOME) }))` → cada card mostra `EmptyState` / KPIs em `0`, `dashboard-resume` ausente. `EMPTY_HOME` inline no spec.

Sem novos models → `db-cleanup.ts` não muda.

### 7.3 Verificação antes do PR

`npm test` + `npx playwright test dashboard` + `npx tsc --noEmit` + `npx eslint` nos arquivos tocados (memória `npm-run-lint-is-eslint-fix`: nunca `npm run lint`).

## 8. Commits (fatias revisáveis)

1. `refactor: extract computeExamReadiness into lib/exam/readiness` — `lib/exam/readiness.ts` + teste; `exam.service.ts` passa a chamar o helper
2. `refactor: replace dashboard types with DashboardHome shape` — `shared/types` + `connectors.ts`
3. `feat: rewrite dashboard service for the início home hub` — `dashboard.service.ts` + unit tests
4. `feat: build início dashboard page and cards` — componentes + `page.tsx` + `loading.tsx` + i18n + testids; deleta os componentes antigos
5. `test: rewrite dashboard e2e for início layout` — `dashboard.spec.ts` + `selectors.ts` + `global-setup.ts`

## 9. Fora de escopo / follow-ups

- `Exam.plannedExamDate` (data real da prova + fator de tempo no readiness) — abrir issue; exige migration + campo no editor de exame.
- Feature de bookmark de questões ("marcadas para revisão" no mockup) — não existe; omitida.
- Página `/dashboard/analytics` separada preservando sparkline + tabela de domínio completa — descartada (usuário optou por deletar).
- Paginação / carregamento progressivo do feed de atividade — endpoint único por ora.
