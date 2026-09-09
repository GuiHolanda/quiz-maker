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
- **Fórmula de readiness:** prontidão por seção ponderada (ver §4).
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

## 4. Backend — `app/api/dashboard/stats/dashboard.service.ts` (reescrita completa)

`getStats(userId): Promise<DashboardHome>` — um bloco `Promise.all`, agregação em memória (mesmo padrão do `computeDomainBreakdown` atual). Route handler **não muda** (`valida sessão → service → NextResponse.json`, erro por `toApiErrorResponse`).

Timezone para todo bucketing por dia: **`America/Sao_Paulo`** — nova constante `DASHBOARD_TZ` no topo do service (não é config de app, é regra desta métrica).

### 4.1 KPIs

| Campo | Fonte | Lógica |
|---|---|---|
| `streakDays` | `MockExamAttempt.finishedAt` (userId, não-nulo) + `UsageLog.createdAt` (userId, qualquer `action`) | conjunto de datas locais distintas (TZ acima) → conta dias consecutivos para trás a partir de hoje; se hoje não tem atividade, começa de ontem; sem atividade nenhuma → `0` |
| `questionsThisWeek` | `MockExamAttempt` finalizadas em `[agora-7d, agora]`, `Σ _count.answers` | `MockExamAttemptAnswer` não tem timestamp — a janela vem do `finishedAt` da tentativa |
| `questionsWeekDelta` | mesmo, janela `[agora-14d, agora-7d]` | `thisWeek - prior` |
| `avgAccuracy` | `mockExamAttempt.aggregate({ _avg: { score }, where: finalizada em [agora-30d, agora] })` | `null` quando a janela não tem tentativa |
| `avgAccuracyDelta` | mesmo, janela `[agora-60d, agora-30d]` | `null` se qualquer das duas janelas estiver vazia; senão `round(atual - anterior)` |
| `simuladosTotal` | `mockExam.count({ userId })` | |
| `simuladosOpen` | `mockExamAttempt.count({ userId, finishedAt: null })` | |

### 4.2 `resume`

`mockExamAttempt.findFirst({ where: { userId, finishedAt: null }, orderBy: { startedAt: 'desc' }, include: { mockExam: { select: { name, durationMinutes, _count: { questions }, exam: { select: { name, examBoard: { select: { name } } } } } }, _count: { select: { answers } } } })`.

`null` se não houver tentativa aberta. `simuladoName = mockExam.name ?? exam.name`. `answeredQuestions = _count.answers`, `totalQuestions = mockExam._count.questions`.

### 4.3 `examsInProgress`

1. `exam.findMany({ where: { userId, isTemplate: false }, select: { id, name, type, key, role, year, examBoard: { select: { name } }, sections: { select: { name, minQuestions } } } })`.
2. `examQuestion.groupBy({ by: ['examId', 'sectionName'], where: { userId, examId: { in: examIds } }, _count: { _all: true } })` — questões salvas por seção.
3. Respostas de tentativa do usuário, com `examId` e `sectionName`: `mockExamAttemptAnswer.findMany({ where: { attempt: { userId } }, select: { isCorrect, mockExamQuestion: { select: { examQuestion: { select: { examId, sectionName } } } } } })` — sem janela de tempo (readiness é acumulado).
4. Por exame:
   - Filtra: mantém exames com `≥ 1` questão salva **ou** `≥ 1` resposta de tentativa.
   - **Readiness (prontidão por seção ponderada):**
     ```
     answered(s)  = respostas de tentativa nessa (examId, sectionName)
     accuracy(s)  = corretas(s) / answered(s)   (0 se answered(s) === 0)
     sectionReadiness(s) = min(1, answered(s) / 10) * min(1, accuracy(s) / 0.70)
     weight(s)    = s.minQuestions               // inteiro 0-100
     readiness    = round( 100 * Σ(weight(s) * sectionReadiness(s)) / Σ weight(s) )
     ```
     Se `Σ weight(s) === 0` (todas as seções com `minQuestions` 0), usa peso igual para todas. Exame sem seções → `readiness = 0`.
   - `accuracy` (nível card) = `corretas / total` de todas as respostas de tentativa daquele exame, acumulado; `null` se nunca teve tentativa.
   - `keyLabel = key ?? role ?? (year ? String(year) : null)`.
5. Ordena por `readiness` ascendente (menos preparado no topo = mais acionável). `take 5`.

### 4.4 `weakDomains`

Respostas de tentativa onde `attempt.finishedAt` está nos últimos 14 dias, agrupadas por `sectionName` (mesmo join do `computeDomainBreakdown` atual + filtro de `finishedAt`):
- `accuracy = round(corretas / total * 100)`
- `questionVolume = total`
- mantém só seções com `questionVolume >= 5` (evita um domínio de 1 questão a 0% dominar o card)
- ordena `accuracy` ascendente, `take 4`

### 4.5 `quickActions`

| Campo | Fonte |
|---|---|
| `bankCount` | `examQuestion.count({ where: { userId } })` |
| `wrongOpenCount` | questões distintas com `≥ 1` resposta errada e `0` respostas certas do usuário. Cálculo: sobre as mesmas respostas do §4.3.3 (ou uma query dedicada `mockExamAttemptAnswer.findMany({ where: { attempt: { userId } }, select: { isCorrect, mockExamQuestion: { select: { examQuestionId } } } })`), agrupa por `examQuestionId`; conta os grupos com `algumaErrada && nenhumaCerta`. **Aproximação documentada** — "em aberto" = nunca acertou desde então. |

### 4.6 `activity`

Quatro sub-queries, cada uma nos últimos 7 dias, `take ~5`, depois merge → ordena `at` desc → `take 6`:

| `kind` | Query | `at` | `params` |
|---|---|---|---|
| `simulado_finished` | `mockExamAttempt` finalizada, `include mockExam{ name, exam{ name } }` | `finishedAt` | `{ name: mockExam.name ?? exam.name, score }` |
| `questions_generated` | `usageLog` `action: 'generate_questions'` | `createdAt` | `{ count: usageLog.count, name: refName ?? undefined }` |
| `auto_config_done` | `autoConfigJob` `status: 'done'` | `updatedAt` | `{ name: seedName }` |
| `exam_created` | `exam` `{ userId, isTemplate: false }` | `createdAt` | `{ name }` |

(O mockup também tem "questões marcadas para revisão" — não existe feature de bookmark; omitido.)

### 4.7 Performance

~9 queries num único `Promise.all` (hoje são 5). Os dois `groupBy` / `findMany` grandes batem em índices existentes (`ExamQuestion@@index([userId])`, `MockExamAttemptAnswer@@index([attemptId])`, `MockExamAttempt@@index([userId, finishedAt])`). As respostas de tentativa são lidas uma vez e reaproveitadas entre §4.3, §4.4 e §4.5 (uma leitura, um select com `isCorrect` + `examQuestion.examId` + `sectionName` + `examQuestionId` + `attempt.finishedAt`). Aceitável; sinalizar no review.

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

Trava:
- **streak:** dias consecutivos; buraco quebra a sequência; hoje sem atividade começa de ontem; sem atividade → 0.
- **questionsWeekDelta:** soma na janela vs janela anterior.
- **avgAccuracy:** `null` quando a janela de 30d está vazia; delta `null` se qualquer janela vazia.
- **readiness (fórmula ponderada por seção):** multi-seção com pesos diferentes; fallback de peso igual quando `Σ minQuestions === 0`; exame sem seções → 0; `accuracy(s)` usa só respostas daquela seção/exame.
- **weakDomains:** janela de 14d aplicada; corte `volume >= 5`; ordenação ascendente por acerto; `take 4`.
- **activity:** merge das 4 fontes, ordenação `at` desc, `take 6`.
- **resume:** pega a tentativa aberta mais recente; `null` quando não há.
- **wrongOpenCount:** exclui questão que foi acertada depois.

Mock do Prisma via `prismaMock` (deep-mock global). As múltiplas leituras de `mockExamAttempt` se distinguem por `where`/`orderBy`/`take` no `mockImplementation` (padrão já usado no teste atual).

### 7.2 E2E — `tests/e2e/tests/dashboard.spec.ts` (reescrita)

Novos `data-testid` no `TID` de `tests/e2e/support/selectors.ts`: `dashboardKpis`, `dashboardResume`, `dashboardExamsProgress`, `dashboardWeakDomains`, `dashboardQuickActions`, `dashboardActivity`, `dashboardCredits` (e remover `dashboardKpiRibbon`, `dashboardFocusAreas`, `dashboardRecentSessions`, `dashboardDomainBreakdown`, `dashboardSessionRow` se não usados em outro spec).

O seed do `globalSetup` gera **uma tentativa finalizada** (score 67) e nenhuma aberta. Asserções:
- `dashboard-root`, `dashboard-kpis`, `dashboard-activity` visíveis; a atividade contém o item do simulado finalizado.
- `dashboard-resume` **ausente** (`await expect(locator).toHaveCount(0)`).
- `dashboard-exams-progress` e `dashboard-weak-domains` renderizam (com dado ou `EmptyState` — 14d cobre o seed).
- Teste de empty total: `page.route('**/api/dashboard/stats', …)` devolvendo um `DashboardHome` zerado → cada card mostra seu `EmptyState` / KPIs em `0`.

Sem novos models → `db-cleanup.ts` não muda.

### 7.3 Verificação antes do PR

`npm test` + `npx playwright test dashboard` + `npx tsc --noEmit` + `npx eslint` nos arquivos tocados (memória `npm-run-lint-is-eslint-fix`: nunca `npm run lint`).

## 8. Commits (fatias revisáveis)

1. `refactor: replace dashboard types with DashboardHome shape` — `shared/types` + `connectors.ts`
2. `feat: rewrite dashboard service for the início home hub` — `dashboard.service.ts` + unit tests
3. `feat: build início dashboard page and cards` — componentes + `page.tsx` + `loading.tsx` + i18n + testids; deleta os componentes antigos
4. `test: rewrite dashboard e2e for início layout` — `dashboard.spec.ts` + `selectors.ts`

## 9. Fora de escopo / follow-ups

- `Exam.plannedExamDate` (data real da prova + fator de tempo no readiness) — abrir issue; exige migration + campo no editor de exame.
- Feature de bookmark de questões ("marcadas para revisão" no mockup) — não existe; omitida.
- Página `/dashboard/analytics` separada preservando sparkline + tabela de domínio completa — descartada (usuário optou por deletar).
- Paginação / carregamento progressivo do feed de atividade — endpoint único por ora.
