# Dashboard "Início" Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/dashboard` performance-analytics page with the action-oriented "Início" home hub from the Claude Design mockup, every card backed by real data, no schema migration.

**Architecture:** One `GET /api/dashboard/stats` returns a new `DashboardHome` shape assembled by a rewritten `DashboardService` (6 parallel reads → in-memory aggregation). The per-exam "Preparo" number reuses `/exams`' coverage formula via a new shared `lib/exam/readiness.ts` helper. The page is a `'use client'` component that fetches once and passes slices to eight presentational cards; the eleven old dashboard components and four old `Dashboard*` types are deleted.

**Tech Stack:** Next.js 15 App Router, React 18, TypeScript, Prisma 6 (SQLite dev / Postgres prod), HeroUI, Tailwind CSS 4, FontAwesome, Vitest (unit), Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-09-09-dashboard-inicio-redesign-design.md` — read it alongside this plan; §4 (backend logic), §5 (components + visual translation) and §6 (i18n keys) carry detail this plan references.

## Global Constraints

- **No Prisma schema changes.** No new dependencies. No new state-management libs.
- **No code comments** unless they document a hidden invariant or non-obvious workaround (project rule; the readiness `score`-is-raw-count note qualifies).
- **Components:** named exports only; `readonly` props interfaces; `'use client'` on interactive components; no barrel `index.ts`; UI from HeroUI; buttons only via `buttonStyles.*` from `config/constants/buttonStyles.ts` (never `color=` on `<Button>`, never `variant="ghost|solid|shadow"`, icon-only needs `isIconOnly` + `size="sm"` + `aria-label`).
- **Cards:** `bg-content1 rounded-xl border border-default-200 dark:border-transparent` — borderless in dark, 1px edge in light. No gradients, no glassmorphism, no colored shadows, no hover lifts. Semantic tokens only, never hard-coded hex.
- **i18n:** every user-facing string via `t('key')`; add to `public/messages/en.properties` AND `pt.properties` keeping the two files line-aligned; pt uses unicode escapes (`ã` → `ã`). Default language `pt`.
- **Imports:** absolute `@/` alias, never relative `../..` across directories.
- **Absolute imports for exam config etc.:** `@/lib/exam/readiness`, `@/shared/types`.
- **Lint:** never `npm run lint` (it is `eslint --fix` with no path, rewrites the repo). Use `npx eslint <file>`.
- **Never run `npm run build`** while a dev server is running (corrupts the shared `.next` cache).
- **Commit trailer:** end every commit message with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. Commit type prefixes: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`. One line ≤ 72 chars + blank line + trailer.
- **Branch:** `feature/dashboard-inicio-redesign` (already created from `main`).

---

## File Structure

**Create:**
- `lib/exam/readiness.ts` — pure `computeExamReadiness(sections, questions): number` (content-coverage %).
- `tests/unit/lib/exam-readiness.test.ts` — unit tests for the helper.
- `app/(workspace)/dashboard/components/HomeHeader.tsx` — date kicker + greeting + summary + "Nova certificação" button (owns the `ExamTypePickerModal` open state).
- `app/(workspace)/dashboard/components/kpi/HomeKpiGrid.tsx` — 4 `StatCard`s.
- `app/(workspace)/dashboard/components/resume/ResumeCard.tsx` — "Continuar de onde parou" (renders nothing when `resume` is null and not loading).
- `app/(workspace)/dashboard/components/exams/ExamsInProgressCard.tsx` + `exams/ExamProgressRow.tsx`.
- `app/(workspace)/dashboard/components/weak/WeakDomainsCard.tsx` + `weak/WeakDomainRow.tsx`.
- `app/(workspace)/dashboard/components/actions/QuickActionsCard.tsx`.
- `app/(workspace)/dashboard/components/activity/ActivityCard.tsx` + `activity/ActivityRow.tsx`.
- `app/(workspace)/dashboard/components/credits/CreditsCard.tsx` — consumes `useUsageContext()`.

**Modify:**
- `features/services/exam/exam.service.ts` — `deriveReadinessAndStatus` calls the new helper.
- `shared/types/index.ts` — remove `DashboardStats`/`DashboardRecentSession`/`DashboardScoreTrendPoint`/`DashboardDomainStat`; add `DashboardHome` + 5 sub-interfaces.
- `features/connectors.ts` — `getDashboardStats(): Promise<DashboardHome>`.
- `app/api/dashboard/stats/dashboard.service.ts` — full rewrite.
- `tests/unit/api/services/dashboard.service.test.ts` — full rewrite.
- `app/(workspace)/dashboard/page.tsx` — full rewrite.
- `app/(workspace)/dashboard/loading.tsx` — reshape skeleton.
- `public/messages/en.properties` + `public/messages/pt.properties` — add `dashboard.home.*`, remove dead `dashboard.*` keys.
- `tests/e2e/tests/dashboard.spec.ts` — full rewrite.
- `tests/e2e/support/selectors.ts` — swap dashboard `TID` entries.
- `tests/e2e/global-setup.ts` — relative seed dates in `seedCompletedMockExamAttempt`.

**Delete:**
- `app/(workspace)/dashboard/components/header/PerformanceHeader.tsx`
- `app/(workspace)/dashboard/components/header/ReadinessGauge.tsx`
- `app/(workspace)/dashboard/components/kpi/KpiRibbon.tsx`
- `app/(workspace)/dashboard/components/kpi/KpiCard.tsx`
- `app/(workspace)/dashboard/components/focus/FocusAreasSection.tsx`
- `app/(workspace)/dashboard/components/focus/FocusAreaCard.tsx`
- `app/(workspace)/dashboard/components/ScoreTrendSection.tsx`
- `app/(workspace)/dashboard/components/sessions/RecentSessionsSection.tsx`
- `app/(workspace)/dashboard/components/sessions/SessionRow.tsx`
- `app/(workspace)/dashboard/components/domains/DomainBreakdownSection.tsx`
- `app/(workspace)/dashboard/components/domains/DomainRow.tsx`

`shared/components/ui/StatCard.tsx` and `shared/lib/scoreTone.ts` **stay** (other consumers).

---

## Task 1: Shared readiness helper

**Files:**
- Create: `lib/exam/readiness.ts`
- Create: `tests/unit/lib/exam-readiness.test.ts`
- Modify: `features/services/exam/exam.service.ts` (`deriveReadinessAndStatus`, ~lines 837-875; import near line 2)

**Interfaces:**
- Produces: `computeExamReadiness(sections: readonly ReadinessSection[], questions: readonly ReadinessQuestion[]): number` where
  `ReadinessSection = { readonly id: string; readonly topics: readonly { readonly id: string }[] }` and
  `ReadinessQuestion = { readonly sectionId: string | null; readonly topicId: string | null }`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/lib/exam-readiness.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { computeExamReadiness } from '@/lib/exam/readiness';

describe('computeExamReadiness', () => {
  it('returns 0 when the exam has no sections', () => {
    expect(computeExamReadiness([], [])).toBe(0);
  });

  it('uses topic coverage when sections have topics', () => {
    const sections = [
      { id: 's1', topics: [{ id: 't1' }, { id: 't2' }] },
      { id: 's2', topics: [{ id: 't3' }, { id: 't4' }] },
    ];
    const questions = [
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's2', topicId: 't3' },
    ];
    expect(computeExamReadiness(sections, questions)).toBe(50);
  });

  it('rounds topic coverage to the nearest percent', () => {
    const sections = [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }, { id: 't3' }] }];
    const questions = [{ sectionId: 's1', topicId: 't1' }];
    expect(computeExamReadiness(sections, questions)).toBe(33);
  });

  it('falls back to section coverage when no section has topics', () => {
    const sections = [
      { id: 's1', topics: [] },
      { id: 's2', topics: [] },
      { id: 's3', topics: [] },
      { id: 's4', topics: [] },
    ];
    const questions = [{ sectionId: 's1', topicId: null }];
    expect(computeExamReadiness(sections, questions)).toBe(25);
  });

  it('counts a topic once regardless of how many questions cover it', () => {
    const sections = [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }] }];
    const questions = [
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's1', topicId: 't1' },
      { sectionId: 's1', topicId: 't1' },
    ];
    expect(computeExamReadiness(sections, questions)).toBe(50);
  });
});
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `npx vitest run tests/unit/lib/exam-readiness.test.ts`
Expected: FAIL — `Cannot find module '@/lib/exam/readiness'`.

- [ ] **Step 3: Create the helper**

Create `lib/exam/readiness.ts`:

```ts
interface ReadinessSection {
  readonly id: string;
  readonly topics: readonly { readonly id: string }[];
}

interface ReadinessQuestion {
  readonly sectionId: string | null;
  readonly topicId: string | null;
}

export function computeExamReadiness(
  sections: readonly ReadinessSection[],
  questions: readonly ReadinessQuestion[],
): number {
  if (sections.length === 0) return 0;

  const topics = sections.flatMap((section) => section.topics);

  if (topics.length > 0) {
    const covered = topics.filter((topic) => questions.some((q) => q.topicId === topic.id)).length;
    return Math.round((covered / topics.length) * 100);
  }

  const covered = sections.filter((section) => questions.some((q) => q.sectionId === section.id)).length;
  return Math.round((covered / sections.length) * 100);
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `npx vitest run tests/unit/lib/exam-readiness.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Refactor `exam.service.ts` to use the helper**

In `features/services/exam/exam.service.ts`, add the import next to the other `@/lib/exam` import (~line 2):

```ts
import { computeExamReadiness } from '@/lib/exam/readiness';
```

Replace the inline `readinessPercent` computation inside `deriveReadinessAndStatus` (the `const readinessPercent = allTopics.length > 0 ? Math.round(...) : Math.round(...)` block, ~lines 846-857) with:

```ts
    const readinessPercent = computeExamReadiness(exam.sections, examQuestionsForExam);
```

Delete the now-unused `const allTopics = exam.sections.flatMap((s) => s.topics);` line directly above it. Leave the `if (exam.sections.length === 0) { return { readinessPercent: 0, status: 'draft', ... }; }` guard and everything below (`passingScore` / `status` logic) untouched.

- [ ] **Step 6: Run the exam service tests, verify still green**

Run: `npx vitest run tests/unit/api/services/exam.service.test.ts`
Expected: PASS — no test file edits; the readiness behaviour is unchanged.

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add lib/exam/readiness.ts tests/unit/lib/exam-readiness.test.ts features/services/exam/exam.service.ts
git commit -m "refactor: extract computeExamReadiness into lib/exam/readiness

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: New `DashboardHome` types (additive)

**Files:**
- Modify: `shared/types/index.ts` (Dashboard block, ~lines 641-667)

**Interfaces:**
- Consumes: `ExamType` (already exported from this file, line 24).
- Produces: `DashboardHome`, `DashboardKpis`, `DashboardResume`, `DashboardExamProgress`, `DashboardWeakDomain`, `DashboardActivityItem` — exact shapes below. Tasks 3-6 depend on these.

This task is additive — the four old `Dashboard*` interfaces stay until Task 6 so the app keeps compiling.

- [ ] **Step 1: Add the new interfaces**

In `shared/types/index.ts`, immediately after the existing `DashboardStats` interface (ends ~line 667), add:

```ts
export interface DashboardKpis {
  readonly streakDays: number;
  readonly questionsThisWeek: number;
  readonly questionsWeekDelta: number;
  readonly avgAccuracy: number | null;
  readonly avgAccuracyDelta: number | null;
  readonly simuladosTotal: number;
  readonly simuladosOpen: number;
}

export interface DashboardResume {
  readonly mockExamId: number;
  readonly attemptId: number;
  readonly simuladoName: string;
  readonly examName: string;
  readonly examBoardName: string | null;
  readonly totalQuestions: number;
  readonly answeredQuestions: number;
  readonly durationMinutes: number | null;
  readonly startedAt: string;
}

export interface DashboardExamProgress {
  readonly examId: string;
  readonly name: string;
  readonly type: ExamType;
  readonly boardName: string | null;
  readonly keyLabel: string | null;
  readonly readiness: number;
  readonly accuracy: number | null;
}

export interface DashboardWeakDomain {
  readonly sectionName: string;
  readonly accuracy: number;
  readonly questionVolume: number;
}

export type DashboardActivityKind =
  | 'simulado_finished'
  | 'questions_generated'
  | 'exam_created'
  | 'auto_config_done';

export interface DashboardActivityItem {
  readonly kind: DashboardActivityKind;
  readonly at: string;
  readonly params: {
    readonly name?: string;
    readonly score?: number;
    readonly count?: number;
  };
}

export interface DashboardHome {
  readonly kpis: DashboardKpis;
  readonly resume: DashboardResume | null;
  readonly examsInProgress: DashboardExamProgress[];
  readonly weakDomains: DashboardWeakDomain[];
  readonly quickActions: {
    readonly bankCount: number;
    readonly wrongOpenCount: number;
  };
  readonly activity: DashboardActivityItem[];
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (purely additive).

- [ ] **Step 3: Commit**

```bash
git add shared/types/index.ts
git commit -m "feat: add DashboardHome types for the início hub

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: Rewrite `DashboardService`

**Files:**
- Modify: `app/api/dashboard/stats/dashboard.service.ts` (full rewrite)
- Modify: `tests/unit/api/services/dashboard.service.test.ts` (full rewrite)

**Interfaces:**
- Consumes: `computeExamReadiness` (Task 1); `DashboardHome` and sub-types (Task 2).
- Produces: `DashboardService.getStats(userId: string): Promise<DashboardHome>` — consumed by the route handler (unchanged) and Task 6's page.

**Context the implementer needs:**
- `MockExamAttempt.score` is a **raw correct-answer count**, not a percent (`app/api/mock-exams/mock-exam.service.ts:582` does `score += 1`; `:716` normalizes `score / totalQuestions * 100`). Every accuracy number here divides by `mockExam._count.questions`.
- The current service treats `score` as a percent — that is a latent bug being removed, do not carry it over.
- `prismaMock` is a `mockDeep` global auto-injected via `vi.mock('@/lib/prisma')` (`tests/unit/api/__mocks__/prisma.ts`); `new DashboardService()` picks it up. Each Prisma model is read exactly once, so tests stub with `prismaMock.<model>.findMany.mockResolvedValue(...)` / `.count.mockResolvedValue(...)`.
- Timezone for day bucketing: `America/Sao_Paulo`. `new Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TZ }).format(date)` → `"2026-09-09"`.

- [ ] **Step 1: Write the failing tests**

Replace the entire contents of `tests/unit/api/services/dashboard.service.test.ts` with:

```ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { prismaMock } from '../__mocks__/prisma';
import { DashboardService } from '@/app/api/dashboard/stats/dashboard.service';

const NOW = new Date('2026-09-09T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

function attempt(overrides: Partial<{
  id: number;
  mockExamId: number;
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  name: string | null;
  examId: string;
  examName: string;
  boardName: string | null;
  durationMinutes: number | null;
  questionCount: number;
  answerCount: number;
}> = {}) {
  const o = {
    id: 1, mockExamId: 1, startedAt: daysAgo(1), finishedAt: daysAgo(1), score: 8,
    name: 'Simulado 1', examId: 'exam-1', examName: 'AWS SAA', boardName: null,
    durationMinutes: 60, questionCount: 10, answerCount: 10, ...overrides,
  };
  return {
    id: o.id, mockExamId: o.mockExamId, startedAt: o.startedAt, finishedAt: o.finishedAt, score: o.score,
    mockExam: {
      name: o.name, examId: o.examId, durationMinutes: o.durationMinutes,
      _count: { questions: o.questionCount },
      exam: { name: o.examName, examBoard: o.boardName ? { name: o.boardName } : null },
    },
    _count: { answers: o.answerCount },
  };
}

function sectionAnswer(examQuestionId: number, sectionName: string, isCorrect: boolean, finishedAt: Date | null) {
  return {
    isCorrect,
    attempt: { finishedAt },
    mockExamQuestion: { examQuestionId, examQuestion: { sectionName } },
  };
}

function setup(opts: {
  attempts?: ReturnType<typeof attempt>[];
  usageLogs?: { action: string; count: number; refName: string | null; createdAt: Date }[];
  exams?: any[];
  questions?: { examId: string | null; sectionId: string | null; topicId: string | null }[];
  sectionAnswers?: ReturnType<typeof sectionAnswer>[];
  autoConfigJobs?: { seedName: string; updatedAt: Date }[];
  mockExamCount?: number;
} = {}) {
  prismaMock.mockExamAttempt.findMany.mockResolvedValue((opts.attempts ?? []) as any);
  prismaMock.usageLog.findMany.mockResolvedValue((opts.usageLogs ?? []) as any);
  prismaMock.exam.findMany.mockResolvedValue((opts.exams ?? []) as any);
  prismaMock.examQuestion.findMany.mockResolvedValue((opts.questions ?? []) as any);
  prismaMock.mockExamAttemptAnswer.findMany.mockResolvedValue((opts.sectionAnswers ?? []) as any);
  prismaMock.autoConfigJob.findMany.mockResolvedValue((opts.autoConfigJobs ?? []) as any);
  prismaMock.mockExam.count.mockResolvedValue(opts.mockExamCount ?? 0);
}

describe('DashboardService.getStats', () => {
  let service: DashboardService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    service = new DashboardService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns a fully-zeroed shape for a user with no data', async () => {
    setup();
    const home = await service.getStats('u1');
    expect(home).toEqual({
      kpis: {
        streakDays: 0, questionsThisWeek: 0, questionsWeekDelta: 0,
        avgAccuracy: null, avgAccuracyDelta: null, simuladosTotal: 0, simuladosOpen: 0,
      },
      resume: null,
      examsInProgress: [],
      weakDomains: [],
      quickActions: { bankCount: 0, wrongOpenCount: 0 },
      activity: [],
    });
  });

  it('counts a consecutive-day streak ending today from mixed activity sources', async () => {
    setup({
      attempts: [attempt({ finishedAt: NOW })],
      usageLogs: [
        { action: 'generate_questions', count: 5, refName: 'x', createdAt: daysAgo(1) },
        { action: 'generate_explanation', count: 1, refName: null, createdAt: daysAgo(2) },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.streakDays).toBe(3);
  });

  it('starts the streak from yesterday when today has no activity, and breaks on a gap', async () => {
    setup({
      usageLogs: [
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(1) },
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(2) },
        { action: 'generate_questions', count: 1, refName: null, createdAt: daysAgo(5) },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.streakDays).toBe(2);
  });

  it('sums answered questions in the 7-day window and the week-over-week delta', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(2), answerCount: 20 }),
        attempt({ id: 2, finishedAt: daysAgo(6), answerCount: 15 }),
        attempt({ id: 3, finishedAt: daysAgo(10), answerCount: 12 }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.questionsThisWeek).toBe(35);
    expect(home.kpis.questionsWeekDelta).toBe(23);
  });

  it('normalizes score to a percent for avgAccuracy and returns a null delta when the prior window is empty', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(3), score: 8, questionCount: 10 }),
        attempt({ id: 2, finishedAt: daysAgo(3), score: 6, questionCount: 10 }),
        attempt({ id: 3, finishedAt: daysAgo(200), score: 5, questionCount: 10 }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.avgAccuracy).toBe(70);
    expect(home.kpis.avgAccuracyDelta).toBeNull();
  });

  it('computes avgAccuracyDelta against the prior 30-day window', async () => {
    setup({
      attempts: [
        attempt({ id: 1, finishedAt: daysAgo(5), score: 9, questionCount: 10 }),
        attempt({ id: 2, finishedAt: daysAgo(40), score: 6, questionCount: 10 }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.avgAccuracy).toBe(90);
    expect(home.kpis.avgAccuracyDelta).toBe(30);
  });

  it('picks the most recently started unfinished attempt as resume', async () => {
    setup({
      attempts: [
        attempt({ id: 10, mockExamId: 3, finishedAt: null, startedAt: daysAgo(1), answerCount: 12, questionCount: 40, name: 'Simulado 04', examName: 'CPA-20', boardName: 'ANBIMA', durationMinutes: 150 }),
        attempt({ id: 11, mockExamId: 4, finishedAt: null, startedAt: daysAgo(3) }),
        attempt({ id: 12, mockExamId: 5, finishedAt: daysAgo(2) }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.resume).toEqual({
      mockExamId: 3, attemptId: 10, simuladoName: 'Simulado 04', examName: 'CPA-20',
      examBoardName: 'ANBIMA', totalQuestions: 40, answeredQuestions: 12,
      durationMinutes: 150, startedAt: daysAgo(1).toISOString(),
    });
  });

  it('builds examsInProgress from coverage, filters no-activity exams, sorts least-ready first', async () => {
    setup({
      exams: [
        { id: 'e1', name: 'Ready-ish', type: 'certification', key: 'K1', role: null, year: null, createdAt: daysAgo(40), examBoard: { name: 'B1' }, sections: [{ id: 's1', topics: [{ id: 't1' }, { id: 't2' }] }] },
        { id: 'e2', name: 'Barely started', type: 'public_exam', key: null, role: 'Analista', year: 2026, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's2', topics: [{ id: 't3' }, { id: 't4' }] }] },
        { id: 'e3', name: 'No activity', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(40), examBoard: null, sections: [{ id: 's3', topics: [{ id: 't5' }] }] },
      ],
      questions: [
        { examId: 'e1', sectionId: 's1', topicId: 't1' },
        { examId: 'e1', sectionId: 's1', topicId: 't2' },
        { examId: 'e2', sectionId: 's2', topicId: 't3' },
      ],
      attempts: [attempt({ id: 1, mockExamId: 1, examId: 'e1', finishedAt: daysAgo(2), score: 7, questionCount: 10 })],
    });
    const home = await service.getStats('u1');
    expect(home.examsInProgress.map((e) => e.name)).toEqual(['Barely started', 'Ready-ish']);
    expect(home.examsInProgress[0]).toMatchObject({ examId: 'e2', readiness: 50, accuracy: null, boardName: null, keyLabel: 'Analista' });
    expect(home.examsInProgress[1]).toMatchObject({ examId: 'e1', readiness: 100, accuracy: 70, boardName: 'B1', keyLabel: 'K1' });
  });

  it('windows weakDomains to 14 days, drops sections under 5 answers, sorts worst first', async () => {
    const answers = [
      ...Array.from({ length: 6 }, (_, i) => sectionAnswer(i + 1, 'Fundos', i < 2, daysAgo(3))),
      ...Array.from({ length: 8 }, (_, i) => sectionAnswer(i + 100, 'Ética', i < 6, daysAgo(5))),
      ...Array.from({ length: 6 }, (_, i) => sectionAnswer(i + 200, 'Stale', false, daysAgo(30))),
      sectionAnswer(999, 'Thin', false, daysAgo(1)),
    ];
    setup({ sectionAnswers: answers });
    const home = await service.getStats('u1');
    expect(home.weakDomains).toEqual([
      { sectionName: 'Fundos', accuracy: 33, questionVolume: 6 },
      { sectionName: 'Ética', accuracy: 75, questionVolume: 8 },
    ]);
  });

  it('counts wrongOpenCount as questions wrong and never later right', async () => {
    setup({
      sectionAnswers: [
        sectionAnswer(1, 'A', false, daysAgo(2)),
        sectionAnswer(1, 'A', true, daysAgo(1)),
        sectionAnswer(2, 'A', false, daysAgo(2)),
        sectionAnswer(3, 'B', true, daysAgo(2)),
      ],
      questions: [
        { examId: 'e1', sectionId: 's1', topicId: null },
        { examId: null, sectionId: null, topicId: null },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.quickActions).toEqual({ bankCount: 2, wrongOpenCount: 1 });
  });

  it('merges activity from four sources, newest first, capped at six', async () => {
    setup({
      attempts: [attempt({ id: 1, finishedAt: daysAgo(1), score: 8, questionCount: 10, name: 'Sim A', examName: 'Exam A' })],
      usageLogs: [
        { action: 'generate_questions', count: 30, refName: 'AWS MLA', createdAt: daysAgo(2) },
        { action: 'generate_explanation', count: 1, refName: null, createdAt: daysAgo(2) },
      ],
      autoConfigJobs: [{ seedName: 'TRT 4', updatedAt: daysAgo(3) }],
      exams: [
        { id: 'e1', name: 'Novo Exame', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(4), examBoard: null, sections: [] },
        { id: 'e2', name: 'Antigo', type: 'certification', key: null, role: null, year: null, createdAt: daysAgo(30), examBoard: null, sections: [] },
      ],
    });
    const home = await service.getStats('u1');
    expect(home.activity.map((a) => a.kind)).toEqual([
      'simulado_finished', 'questions_generated', 'auto_config_done', 'exam_created',
    ]);
    expect(home.activity[0]).toEqual({
      kind: 'simulado_finished', at: daysAgo(1).toISOString(), params: { name: 'Sim A', score: 80 },
    });
    expect(home.activity[1].params).toEqual({ count: 30, name: 'AWS MLA' });
  });

  it('reports simuladosTotal from the mock-exam count and simuladosOpen from unfinished attempts', async () => {
    setup({
      mockExamCount: 11,
      attempts: [
        attempt({ id: 1, finishedAt: null }),
        attempt({ id: 2, finishedAt: daysAgo(2) }),
      ],
    });
    const home = await service.getStats('u1');
    expect(home.kpis.simuladosTotal).toBe(11);
    expect(home.kpis.simuladosOpen).toBe(1);
  });
});
```

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run tests/unit/api/services/dashboard.service.test.ts`
Expected: FAIL — the current service returns `DashboardStats`, so `home` shape assertions fail (and `prismaMock.usageLog.findMany` etc. are undefined-mock calls returning `undefined`).

- [ ] **Step 3: Rewrite the service**

Replace the entire contents of `app/api/dashboard/stats/dashboard.service.ts` with:

```ts
import { prisma } from '@/lib/prisma';
import { computeExamReadiness } from '@/lib/exam/readiness';
import type {
  DashboardActivityItem,
  DashboardExamProgress,
  DashboardHome,
  DashboardKpis,
  DashboardResume,
  DashboardWeakDomain,
} from '@/shared/types';

const DASHBOARD_TZ = 'America/Sao_Paulo';
const DAY = 24 * 60 * 60 * 1000;
const ACTIVITY_LIMIT = 6;
const EXAMS_LIMIT = 5;
const WEAK_DOMAIN_LIMIT = 4;
const WEAK_DOMAIN_MIN_VOLUME = 5;

const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: DASHBOARD_TZ });
const localDay = (date: Date): string => dayFormatter.format(date);

function accuracyPct(score: number | null, totalQuestions: number): number | null {
  if (score === null || totalQuestions <= 0) return null;
  return Math.round((score / totalQuestions) * 100);
}

type AttemptRow = {
  id: number;
  startedAt: Date;
  finishedAt: Date | null;
  score: number | null;
  mockExamId: number;
  mockExam: {
    name: string | null;
    examId: string;
    durationMinutes: number | null;
    _count: { questions: number };
    exam: { name: string; examBoard: { name: string } | null };
  };
  _count: { answers: number };
};

type UsageLogRow = { action: string; count: number; refName: string | null; createdAt: Date };

type ExamRow = {
  id: string;
  name: string;
  type: string;
  key: string | null;
  role: string | null;
  year: number | null;
  createdAt: Date;
  examBoard: { name: string } | null;
  sections: { id: string; topics: { id: string }[] }[];
};

type QuestionRow = { examId: string | null; sectionId: string | null; topicId: string | null };

type SectionAnswerRow = {
  isCorrect: boolean;
  attempt: { finishedAt: Date | null };
  mockExamQuestion: { examQuestionId: number; examQuestion: { sectionName: string } };
};

type AutoConfigRow = { seedName: string; updatedAt: Date };

export class DashboardService {
  async getStats(userId: string): Promise<DashboardHome> {
    const now = Date.now();

    const [attempts, usageLogs, exams, questions, sectionAnswers, autoConfigJobs, simuladosTotal] =
      await Promise.all([
        prisma.mockExamAttempt.findMany({
          where: { userId },
          select: {
            id: true,
            startedAt: true,
            finishedAt: true,
            score: true,
            mockExamId: true,
            mockExam: {
              select: {
                name: true,
                examId: true,
                durationMinutes: true,
                _count: { select: { questions: true } },
                exam: { select: { name: true, examBoard: { select: { name: true } } } },
              },
            },
            _count: { select: { answers: true } },
          },
        }) as Promise<AttemptRow[]>,
        prisma.usageLog.findMany({
          where: { userId, createdAt: { gte: new Date(now - 60 * DAY) } },
          select: { action: true, count: true, refName: true, createdAt: true },
        }) as Promise<UsageLogRow[]>,
        prisma.exam.findMany({
          where: { userId, isTemplate: false },
          select: {
            id: true,
            name: true,
            type: true,
            key: true,
            role: true,
            year: true,
            createdAt: true,
            examBoard: { select: { name: true } },
            sections: { select: { id: true, topics: { select: { id: true } } } },
          },
        }) as Promise<ExamRow[]>,
        prisma.examQuestion.findMany({
          where: { userId },
          select: { examId: true, sectionId: true, topicId: true },
        }) as Promise<QuestionRow[]>,
        prisma.mockExamAttemptAnswer.findMany({
          where: { attempt: { userId } },
          select: {
            isCorrect: true,
            attempt: { select: { finishedAt: true } },
            mockExamQuestion: {
              select: { examQuestionId: true, examQuestion: { select: { sectionName: true } } },
            },
          },
        }) as Promise<SectionAnswerRow[]>,
        prisma.autoConfigJob.findMany({
          where: { userId, status: 'done', updatedAt: { gte: new Date(now - 7 * DAY) } },
          select: { seedName: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }) as Promise<AutoConfigRow[]>,
        prisma.mockExam.count({ where: { userId } }),
      ]);

    return {
      kpis: this.computeKpis(attempts, usageLogs, simuladosTotal, now),
      resume: this.computeResume(attempts),
      examsInProgress: this.computeExamsInProgress(exams, questions, attempts),
      weakDomains: this.computeWeakDomains(sectionAnswers, now),
      quickActions: {
        bankCount: questions.length,
        wrongOpenCount: this.computeWrongOpenCount(sectionAnswers),
      },
      activity: this.computeActivity(attempts, usageLogs, autoConfigJobs, exams, now),
    };
  }

  private computeKpis(
    attempts: AttemptRow[],
    usageLogs: UsageLogRow[],
    simuladosTotal: number,
    now: number,
  ): DashboardKpis {
    const activeDays = new Set<string>();
    for (const attempt of attempts) {
      if (attempt.finishedAt) activeDays.add(localDay(attempt.finishedAt));
    }
    for (const log of usageLogs) activeDays.add(localDay(log.createdAt));

    const cursor = new Date(now);
    if (!activeDays.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
    let streakDays = 0;
    while (activeDays.has(localDay(cursor))) {
      streakDays += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const finishedIn = (from: number, to: number) =>
      attempts.filter(
        (a) => a.finishedAt !== null && a.finishedAt.getTime() >= from && a.finishedAt.getTime() < to,
      );

    const answersIn = (from: number, to: number) =>
      finishedIn(from, to).reduce((sum, a) => sum + a._count.answers, 0);

    const questionsThisWeek = answersIn(now - 7 * DAY, now + 1);
    const questionsWeekDelta = questionsThisWeek - answersIn(now - 14 * DAY, now - 7 * DAY);

    const avgIn = (from: number, to: number): number | null => {
      const pcts = finishedIn(from, to)
        .map((a) => accuracyPct(a.score, a.mockExam._count.questions))
        .filter((p): p is number => p !== null);
      if (pcts.length === 0) return null;
      return Math.round(pcts.reduce((sum, p) => sum + p, 0) / pcts.length);
    };

    const avgAccuracy = avgIn(now - 30 * DAY, now + 1);
    const avgAccuracyPrev = avgIn(now - 60 * DAY, now - 30 * DAY);
    const avgAccuracyDelta =
      avgAccuracy !== null && avgAccuracyPrev !== null ? avgAccuracy - avgAccuracyPrev : null;

    return {
      streakDays,
      questionsThisWeek,
      questionsWeekDelta,
      avgAccuracy,
      avgAccuracyDelta,
      simuladosTotal,
      simuladosOpen: attempts.filter((a) => a.finishedAt === null).length,
    };
  }

  private computeResume(attempts: AttemptRow[]): DashboardResume | null {
    const open = attempts
      .filter((a) => a.finishedAt === null)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

    if (!open) return null;

    return {
      mockExamId: open.mockExamId,
      attemptId: open.id,
      simuladoName: open.mockExam.name ?? open.mockExam.exam.name,
      examName: open.mockExam.exam.name,
      examBoardName: open.mockExam.exam.examBoard?.name ?? null,
      totalQuestions: open.mockExam._count.questions,
      answeredQuestions: open._count.answers,
      durationMinutes: open.mockExam.durationMinutes,
      startedAt: open.startedAt.toISOString(),
    };
  }

  private computeExamsInProgress(
    exams: ExamRow[],
    questions: QuestionRow[],
    attempts: AttemptRow[],
  ): DashboardExamProgress[] {
    const finishedByExam = new Map<string, number[]>();
    const attemptExamIds = new Set<string>();
    for (const attempt of attempts) {
      attemptExamIds.add(attempt.mockExam.examId);
      const pct = accuracyPct(attempt.score, attempt.mockExam._count.questions);
      if (attempt.finishedAt !== null && pct !== null) {
        const list = finishedByExam.get(attempt.mockExam.examId) ?? [];
        list.push(pct);
        finishedByExam.set(attempt.mockExam.examId, list);
      }
    }

    return exams
      .filter((exam) => questions.some((q) => q.examId === exam.id) || attemptExamIds.has(exam.id))
      .map((exam) => {
        const examQuestions = questions.filter((q) => q.examId === exam.id);
        const finishedPcts = finishedByExam.get(exam.id) ?? [];
        return {
          examId: exam.id,
          name: exam.name,
          type: exam.type as DashboardExamProgress['type'],
          boardName: exam.examBoard?.name ?? null,
          keyLabel: exam.key ?? exam.role ?? (exam.year !== null ? String(exam.year) : null),
          readiness: computeExamReadiness(exam.sections, examQuestions),
          accuracy: finishedPcts.length
            ? Math.round(finishedPcts.reduce((sum, p) => sum + p, 0) / finishedPcts.length)
            : null,
        };
      })
      .sort((a, b) => a.readiness - b.readiness)
      .slice(0, EXAMS_LIMIT);
  }

  private computeWeakDomains(sectionAnswers: SectionAnswerRow[], now: number): DashboardWeakDomain[] {
    const cutoff = now - 14 * DAY;
    const bySection = new Map<string, { correct: number; total: number }>();

    for (const answer of sectionAnswers) {
      const finishedAt = answer.attempt.finishedAt;
      if (finishedAt === null || finishedAt.getTime() < cutoff) continue;
      const section = answer.mockExamQuestion.examQuestion.sectionName;
      const current = bySection.get(section) ?? { correct: 0, total: 0 };
      current.correct += answer.isCorrect ? 1 : 0;
      current.total += 1;
      bySection.set(section, current);
    }

    return Array.from(bySection.entries())
      .map(([sectionName, { correct, total }]) => ({
        sectionName,
        accuracy: Math.round((correct / total) * 100),
        questionVolume: total,
      }))
      .filter((domain) => domain.questionVolume >= WEAK_DOMAIN_MIN_VOLUME)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, WEAK_DOMAIN_LIMIT);
  }

  private computeWrongOpenCount(sectionAnswers: SectionAnswerRow[]): number {
    const byQuestion = new Map<number, { wrong: boolean; right: boolean }>();
    for (const answer of sectionAnswers) {
      const id = answer.mockExamQuestion.examQuestionId;
      const current = byQuestion.get(id) ?? { wrong: false, right: false };
      if (answer.isCorrect) current.right = true;
      else current.wrong = true;
      byQuestion.set(id, current);
    }

    let count = 0;
    for (const entry of byQuestion.values()) {
      if (entry.wrong && !entry.right) count += 1;
    }
    return count;
  }

  private computeActivity(
    attempts: AttemptRow[],
    usageLogs: UsageLogRow[],
    autoConfigJobs: AutoConfigRow[],
    exams: ExamRow[],
    now: number,
  ): DashboardActivityItem[] {
    const since = now - 7 * DAY;
    const items: DashboardActivityItem[] = [];

    for (const attempt of attempts) {
      if (attempt.finishedAt === null || attempt.finishedAt.getTime() < since) continue;
      items.push({
        kind: 'simulado_finished',
        at: attempt.finishedAt.toISOString(),
        params: {
          name: attempt.mockExam.name ?? attempt.mockExam.exam.name,
          score: accuracyPct(attempt.score, attempt.mockExam._count.questions) ?? 0,
        },
      });
    }

    for (const log of usageLogs) {
      if (log.action !== 'generate_questions' || log.createdAt.getTime() < since) continue;
      items.push({
        kind: 'questions_generated',
        at: log.createdAt.toISOString(),
        params: { count: log.count, name: log.refName ?? undefined },
      });
    }

    for (const job of autoConfigJobs) {
      items.push({
        kind: 'auto_config_done',
        at: job.updatedAt.toISOString(),
        params: { name: job.seedName },
      });
    }

    for (const exam of exams) {
      if (exam.createdAt.getTime() < since) continue;
      items.push({
        kind: 'exam_created',
        at: exam.createdAt.toISOString(),
        params: { name: exam.name },
      });
    }

    return items.sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, ACTIVITY_LIMIT);
  }
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run tests/unit/api/services/dashboard.service.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. (The route handler `app/api/dashboard/stats/route.ts` needs no change — it calls `service.getStats` and `NextResponse.json`s the result.)

- [ ] **Step 6: Run the full unit suite**

Run: `npm test`
Expected: PASS. Only the two touched test files changed behaviour.

- [ ] **Step 7: Commit**

```bash
git add app/api/dashboard/stats/dashboard.service.ts tests/unit/api/services/dashboard.service.test.ts
git commit -m "feat: rewrite dashboard service for the início home hub

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

> After this task the app compiles but `/dashboard` renders wrong at runtime (old page reads `stats.recentSessions` etc. from a `DashboardHome` payload) and `tests/e2e/tests/dashboard.spec.ts` is red. Task 6 fixes both. This is the one intermediate broken state in the plan.

---

## Task 4: i18n keys

**Files:**
- Modify: `public/messages/en.properties` (Dashboard block, ~line 711)
- Modify: `public/messages/pt.properties` (Dashboard block, ~line 710)

**Interfaces:**
- Produces: `dashboard.home.*` keys consumed by Task 6's components.

Additive only — the old `dashboard.*` keys stay (still used by not-yet-deleted components). Both files must stay line-aligned: add the same keys in the same order at the same position in each file.

- [ ] **Step 1: Add the `dashboard.home.*` block to `en.properties`**

In `public/messages/en.properties`, immediately after `dashboard.comingSoon=Coming soon` (line 750), add:

```properties
dashboard.home.dateFormatWeekday=weekday
dashboard.home.newCert=New certification
dashboard.home.summaryExams={count} exams in progress
dashboard.home.summaryWrong={count} questions to review
dashboard.home.summaryResume={name} is half-finished
dashboard.home.summaryEmpty=Set up a certification and start practicing.
dashboard.home.kpiStreak=Streak
dashboard.home.kpiStreakUnit=days in a row
dashboard.home.kpiStreakZero=no streak yet
dashboard.home.kpiQuestionsWeek=Questions this week
dashboard.home.kpiQuestionsWeekDelta={delta} vs. last week
dashboard.home.kpiAvgAccuracy=Average accuracy
dashboard.home.kpiAvgAccuracyDelta={delta} pts
dashboard.home.kpiSimulados=Simulados
dashboard.home.kpiSimuladosOpen={count} open
dashboard.home.resumeKicker=PICK UP WHERE YOU LEFT OFF
dashboard.home.resumeCta=Resume simulado
dashboard.home.resumeProgress={answered} of {total} questions answered
dashboard.home.resumeMeta={board} · {total} questions · {duration} min
dashboard.home.resumeMetaNoDuration={board} · {total} questions
dashboard.home.examsTitle=Exams in progress
dashboard.home.examsSeeAll=See all
dashboard.home.examsReadiness=readiness {value}%
dashboard.home.examsEmpty=No exams in progress
dashboard.home.examsEmptyDescription=Create a certification to start tracking your prep.
dashboard.home.weakTitle=Where you miss the most
dashboard.home.weakSubtitle=Lowest-scoring domains over the last two weeks.
dashboard.home.weakTrainCta=Train weak spots
dashboard.home.weakVolume={count} questions
dashboard.home.weakEmpty=Not enough data yet
dashboard.home.weakEmptyDescription=Answer more simulado questions to see your weak domains.
dashboard.home.actionsTitle=Quick actions
dashboard.home.actionGenerate=Generate questions
dashboard.home.actionGenerateNote=From an exam blueprint
dashboard.home.actionSimulado=Create simulado
dashboard.home.actionSimuladoNote=Pick domains, time and cut-off
dashboard.home.actionBank=Question bank
dashboard.home.actionBankNote={count} questions
dashboard.home.actionReview=Review mistakes
dashboard.home.actionReviewNote={count} still open
dashboard.home.activityTitle=Activity
dashboard.home.activityWindow=7 DAYS
dashboard.home.activitySimuladoFinished={name} finished with {score}% accuracy.
dashboard.home.activityQuestionsGenerated={count} questions generated for {name}.
dashboard.home.activityQuestionsGeneratedNoName={count} questions generated.
dashboard.home.activityExamCreated={name} added to your exams.
dashboard.home.activityAutoConfigDone=Auto-config finished for {name}.
dashboard.home.activityEmpty=Nothing here yet
dashboard.home.activityEmptyDescription=Your simulados, generations and new exams show up here.
dashboard.home.creditsKicker=QUESTION CREDITS
dashboard.home.creditsUnlimited=Unlimited
dashboard.home.creditsRenew=Renews on {date}.
dashboard.home.creditsReferralNote=Refer a friend and earn bonus questions.
dashboard.home.creditsPlans=View plans
dashboard.home.creditsReferral=Refer and earn
```

- [ ] **Step 2: Add the same block to `pt.properties` (unicode-escaped)**

In `public/messages/pt.properties`, immediately after `dashboard.comingSoon=Em breve`, add:

```properties
dashboard.home.dateFormatWeekday=weekday
dashboard.home.newCert=Nova certificação
dashboard.home.summaryExams={count} provas em andamento
dashboard.home.summaryWrong={count} questões para revisar
dashboard.home.summaryResume={name} ficou pela metade
dashboard.home.summaryEmpty=Configure uma certificação e comece a praticar.
dashboard.home.kpiStreak=Sequência
dashboard.home.kpiStreakUnit=dias seguidos
dashboard.home.kpiStreakZero=sem sequência ainda
dashboard.home.kpiQuestionsWeek=Questões na semana
dashboard.home.kpiQuestionsWeekDelta={delta} vs. semana anterior
dashboard.home.kpiAvgAccuracy=Acerto médio
dashboard.home.kpiAvgAccuracyDelta={delta} pts
dashboard.home.kpiSimulados=Simulados
dashboard.home.kpiSimuladosOpen={count} em aberto
dashboard.home.resumeKicker=CONTINUAR DE ONDE PAROU
dashboard.home.resumeCta=Retomar simulado
dashboard.home.resumeProgress={answered} de {total} questões respondidas
dashboard.home.resumeMeta={board} · {total} questões · {duration} min
dashboard.home.resumeMetaNoDuration={board} · {total} questões
dashboard.home.examsTitle=Provas em andamento
dashboard.home.examsSeeAll=Ver todas
dashboard.home.examsReadiness=preparo {value}%
dashboard.home.examsEmpty=Nenhuma prova em andamento
dashboard.home.examsEmptyDescription=Crie uma certificação para acompanhar seu preparo.
dashboard.home.weakTitle=Onde você mais erra
dashboard.home.weakSubtitle=Domínios com menor acerto nas últimas duas semanas.
dashboard.home.weakTrainCta=Treinar fraquezas
dashboard.home.weakVolume={count} questões
dashboard.home.weakEmpty=Dados insuficientes ainda
dashboard.home.weakEmptyDescription=Responda mais questões de simulado para ver seus domínios fracos.
dashboard.home.actionsTitle=Ações rápidas
dashboard.home.actionGenerate=Gerar questões
dashboard.home.actionGenerateNote=A partir do edital de uma prova
dashboard.home.actionSimulado=Criar simulado
dashboard.home.actionSimuladoNote=Escolha domínios, tempo e corte
dashboard.home.actionBank=Banco de questões
dashboard.home.actionBankNote={count} questões
dashboard.home.actionReview=Revisar erros
dashboard.home.actionReviewNote={count} em aberto
dashboard.home.activityTitle=Atividade
dashboard.home.activityWindow=7 DIAS
dashboard.home.activitySimuladoFinished={name} finalizado com {score}% de acerto.
dashboard.home.activityQuestionsGenerated={count} questões geradas para {name}.
dashboard.home.activityQuestionsGeneratedNoName={count} questões geradas.
dashboard.home.activityExamCreated={name} adicionado aos seus exames.
dashboard.home.activityAutoConfigDone=Configuração automática concluída para {name}.
dashboard.home.activityEmpty=Nada por aqui ainda
dashboard.home.activityEmptyDescription=Seus simulados, gerações e novos exames aparecem aqui.
dashboard.home.creditsKicker=CRÉDITOS DE QUESTÕES
dashboard.home.creditsUnlimited=Ilimitado
dashboard.home.creditsRenew=Renova em {date}.
dashboard.home.creditsReferralNote=Indique um amigo e ganhe questões extras.
dashboard.home.creditsPlans=Ver planos
dashboard.home.creditsReferral=Indicar e ganhar
```

- [ ] **Step 3: Verify key parity**

Run: `npx vitest run tests/unit/lib/i18n-prefixes.test.ts tests/unit/lib/i18n.test.ts`
Expected: PASS (these assert en/pt key-set parity).

- [ ] **Step 4: Commit**

```bash
git add public/messages/en.properties public/messages/pt.properties
git commit -m "feat: add dashboard.home i18n keys for the início hub

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: Build the "Início" components

**Files:**
- Create: all 12 component files listed in File Structure.

**Interfaces:**
- Consumes: `DashboardHome` slices (Task 2); `useTranslation`, `useUsageContext`, `RelativeDate`, `EmptyState`, `SkeletonListLoader`, `StatCard`, `CardHeading`, `buttonStyles`, `scoreToneText`/`scoreToneBg`, `ExamTypePickerModal`.
- Produces: named component exports wired by Task 6:
  - `HomeHeader({ summaryExams: number; summaryWrong: number; resumeName: string | null; loading: boolean })`
  - `HomeKpiGrid({ kpis: DashboardKpis | null })`
  - `ResumeCard({ resume: DashboardResume | null; loading: boolean })`
  - `ExamsInProgressCard({ exams: DashboardExamProgress[] | null })`
  - `WeakDomainsCard({ domains: DashboardWeakDomain[] | null })`
  - `QuickActionsCard({ counts: DashboardHome['quickActions'] | null })`
  - `ActivityCard({ items: DashboardActivityItem[] | null })`
  - `CreditsCard()` — no props, reads `useUsageContext`.

No unit tests — Vitest is node-only in this repo (no jsdom / testing-library); components are covered by Task 6's Playwright spec. Verification for this task is `tsc` + `eslint` + a dev-server render.

- [ ] **Step 1: `HomeHeader.tsx`**

Create `app/(workspace)/dashboard/components/HomeHeader.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { ExamTypePickerModal } from '@/app/(workspace)/exams/components/ExamTypePickerModal';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { ExamType } from '@/shared/types';

interface HomeHeaderProps {
  readonly summaryExams: number;
  readonly summaryWrong: number;
  readonly resumeName: string | null;
  readonly loading: boolean;
}

export function HomeHeader({ summaryExams, summaryWrong, resumeName, loading }: HomeHeaderProps) {
  const { data: session } = useSession();
  const { t, language } = useTranslation();
  const router = useRouter();
  const [hour, setHour] = useState(0);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  useEffect(() => {
    setHour(new Date().getHours());
  }, []);

  const first = session?.user?.name?.split(' ')[0] ?? '';
  const greetingKey =
    hour < 12 ? 'dashboard.greeting.morning' : hour < 18 ? 'dashboard.greeting.afternoon' : 'dashboard.greeting.evening';
  const greeting = `${t(greetingKey)}${first ? `, ${first}` : ''}.`;

  const dateLabel = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
    .format(new Date())
    .toUpperCase();

  const summary = loading
    ? ''
    : summaryExams === 0 && summaryWrong === 0
      ? t('dashboard.home.summaryEmpty')
      : [
          summaryExams > 0 ? t('dashboard.home.summaryExams', { count: summaryExams }) : null,
          summaryWrong > 0 ? t('dashboard.home.summaryWrong', { count: summaryWrong }) : null,
          resumeName ? t('dashboard.home.summaryResume', { name: resumeName }) : null,
        ]
          .filter(Boolean)
          .join(' · ');

  const handleConfirmType = (type: ExamType) => {
    setIsPickerOpen(false);
    router.push(`/exams/new?type=${type}`);
  };

  return (
    <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-divider pb-6">
      <div className="min-w-0">
        <p className="font-mono text-xs text-default-400 tracking-wide">{dateLabel}</p>
        <h1 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-2 text-sm text-default-500 max-w-xl text-pretty min-h-[1.25rem]">{summary}</p>
      </div>
      <Button
        className={buttonStyles.primary}
        startContent={<FontAwesomeIcon className="text-xs" icon={faPlus} />}
        onPress={() => setIsPickerOpen(true)}
      >
        {t('dashboard.home.newCert')}
      </Button>
      <ExamTypePickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} onConfirm={handleConfirmType} />
    </section>
  );
}
```

- [ ] **Step 2: `kpi/HomeKpiGrid.tsx`**

Create `app/(workspace)/dashboard/components/kpi/HomeKpiGrid.tsx`:

```tsx
'use client';

import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faFileLines, faFire, faPercent } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import { StatCard } from '@/shared/components/ui/StatCard';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardKpis } from '@/shared/types';

interface HomeKpiGridProps {
  readonly kpis: DashboardKpis | null;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function HomeKpiGrid({ kpis }: HomeKpiGridProps) {
  const { t } = useTranslation();

  const iconBox = (icon: IconDefinition, className: string): ReactNode => (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-content2">
      <FontAwesomeIcon className={`text-xs ${className}`} icon={icon} />
    </div>
  );

  const value = (v: ReactNode): ReactNode => <span className="font-mono">{v}</span>;

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4" data-testid="dashboard-kpis">
      <StatCard
        icon={iconBox(faFire, 'text-primary')}
        label={t('dashboard.home.kpiStreak')}
        value={value(kpis ? kpis.streakDays : '–')}
        detail={kpis && kpis.streakDays > 0 ? t('dashboard.home.kpiStreakUnit') : t('dashboard.home.kpiStreakZero')}
      />
      <StatCard
        icon={iconBox(faCircleCheck, 'text-success')}
        label={t('dashboard.home.kpiQuestionsWeek')}
        value={value(kpis ? kpis.questionsThisWeek : '–')}
        detail={kpis ? t('dashboard.home.kpiQuestionsWeekDelta', { delta: signed(kpis.questionsWeekDelta) }) : ' '}
      />
      <StatCard
        icon={iconBox(faPercent, 'text-primary')}
        label={t('dashboard.home.kpiAvgAccuracy')}
        valueClassName={
          kpis && kpis.avgAccuracy !== null
            ? `font-mono font-bold text-2xl leading-none ${scoreToneText(kpis.avgAccuracy)}`
            : 'font-mono font-bold text-2xl leading-none text-foreground'
        }
        value={kpis && kpis.avgAccuracy !== null ? `${kpis.avgAccuracy}%` : '–'}
        detail={
          kpis && kpis.avgAccuracyDelta !== null
            ? t('dashboard.home.kpiAvgAccuracyDelta', { delta: signed(kpis.avgAccuracyDelta) })
            : ' '
        }
      />
      <StatCard
        icon={iconBox(faFileLines, 'text-default-400')}
        label={t('dashboard.home.kpiSimulados')}
        value={value(kpis ? kpis.simuladosTotal : '–')}
        detail={kpis ? t('dashboard.home.kpiSimuladosOpen', { count: kpis.simuladosOpen }) : ' '}
      />
    </div>
  );
}
```

- [ ] **Step 3: `resume/ResumeCard.tsx`**

Create `app/(workspace)/dashboard/components/resume/ResumeCard.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@heroui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faPlay } from '@fortawesome/free-solid-svg-icons';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardResume } from '@/shared/types';

interface ResumeCardProps {
  readonly resume: DashboardResume | null;
  readonly loading: boolean;
}

export function ResumeCard({ resume, loading }: ResumeCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (loading) {
    return <SkeletonListLoader count={1} height="h-40" />;
  }

  if (!resume) return null;

  const pct = resume.totalQuestions > 0 ? Math.round((resume.answeredQuestions / resume.totalQuestions) * 100) : 0;
  const board = resume.examBoardName ?? resume.examName;
  const meta =
    resume.durationMinutes !== null
      ? t('dashboard.home.resumeMeta', { board, total: resume.totalQuestions, duration: resume.durationMinutes })
      : t('dashboard.home.resumeMetaNoDuration', { board, total: resume.totalQuestions });

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-resume"
    >
      <p className="flex items-center gap-2 font-mono text-xs text-primary tracking-wide">
        <FontAwesomeIcon className="text-[11px]" icon={faPlay} />
        {t('dashboard.home.resumeKicker')}
      </p>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-bold tracking-tight text-foreground">{resume.simuladoName}</p>
          <p className="mt-1 font-mono text-xs text-default-400">{meta}</p>
          <p className="mt-1 text-xs text-default-500">
            <RelativeDate date={resume.startedAt} />
          </p>
        </div>
        <Button
          className={buttonStyles.primary}
          endContent={<FontAwesomeIcon className="text-xs" icon={faArrowRight} />}
          onPress={() => router.push(`/simulados/${resume.mockExamId}/tentativa/${resume.attemptId}`)}
        >
          {t('dashboard.home.resumeCta')}
        </Button>
      </div>

      <div className="mt-4 h-2 rounded-full bg-background overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-default-500">
        <span>{t('dashboard.home.resumeProgress', { answered: resume.answeredQuestions, total: resume.totalQuestions })}</span>
        <span className="font-mono">{pct}%</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: `exams/ExamProgressRow.tsx` then `exams/ExamsInProgressCard.tsx`**

Create `app/(workspace)/dashboard/components/exams/ExamProgressRow.tsx`:

```tsx
'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardExamProgress } from '@/shared/types';

interface ExamProgressRowProps {
  readonly exam: DashboardExamProgress;
}

export function ExamProgressRow({ exam }: ExamProgressRowProps) {
  const { t } = useTranslation();
  const meta = [exam.boardName, exam.keyLabel].filter(Boolean).join(' · ');

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_120px_52px] items-center gap-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{exam.name}</p>
        {meta && <p className="mt-0.5 truncate font-mono text-xs text-default-400">{meta}</p>}
      </div>
      <div>
        <div className="h-1.5 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${exam.readiness}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-default-500">{t('dashboard.home.examsReadiness', { value: exam.readiness })}</p>
      </div>
      <span
        className={`text-right font-mono text-sm ${exam.accuracy !== null ? scoreToneText(exam.accuracy) : 'text-default-400'}`}
      >
        {exam.accuracy !== null ? `${exam.accuracy}%` : '–'}
      </span>
    </div>
  );
}
```

Create `app/(workspace)/dashboard/components/exams/ExamsInProgressCard.tsx`:

```tsx
'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardExamProgress } from '@/shared/types';

import { ExamProgressRow } from './ExamProgressRow';

interface ExamsInProgressCardProps {
  readonly exams: DashboardExamProgress[] | null;
}

export function ExamsInProgressCard({ exams }: ExamsInProgressCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-exams-progress"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-foreground">{t('dashboard.home.examsTitle')}</p>
        <NextLink className="flex items-center gap-1.5 text-sm font-semibold text-primary" href="/exams">
          {t('dashboard.home.examsSeeAll')}
          <FontAwesomeIcon className="text-[11px]" icon={faArrowRight} />
        </NextLink>
      </div>

      <div className="mt-2">
        {exams === null ? (
          <div className="pt-3">
            <SkeletonListLoader count={3} height="h-12" />
          </div>
        ) : exams.length === 0 ? (
          <EmptyState
            title={t('dashboard.home.examsEmpty')}
            description={t('dashboard.home.examsEmptyDescription')}
            action={{ label: t('dashboard.home.newCert'), href: '/exams' }}
          />
        ) : (
          <div className="divide-y divide-divider">
            {exams.map((exam) => (
              <ExamProgressRow key={exam.examId} exam={exam} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: `weak/WeakDomainRow.tsx` then `weak/WeakDomainsCard.tsx`**

Create `app/(workspace)/dashboard/components/weak/WeakDomainRow.tsx`:

```tsx
'use client';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import { scoreToneBg, scoreToneText } from '@/shared/lib/scoreTone';
import type { DashboardWeakDomain } from '@/shared/types';

interface WeakDomainRowProps {
  readonly domain: DashboardWeakDomain;
}

export function WeakDomainRow({ domain }: WeakDomainRowProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-3">
      <span className="w-44 shrink-0 truncate text-sm text-default-600">{domain.sectionName}</span>
      <div className="h-1.5 flex-1 min-w-[60px] rounded-full bg-background overflow-hidden">
        <div className={`h-full rounded-full ${scoreToneBg(domain.accuracy)}`} style={{ width: `${domain.accuracy}%` }} />
      </div>
      <span className={`w-10 shrink-0 text-right font-mono text-sm ${scoreToneText(domain.accuracy)}`}>
        {domain.accuracy}%
      </span>
      <span className="w-24 shrink-0 text-right text-xs text-default-400">
        {t('dashboard.home.weakVolume', { count: domain.questionVolume })}
      </span>
    </div>
  );
}
```

Create `app/(workspace)/dashboard/components/weak/WeakDomainsCard.tsx`:

```tsx
'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBullseye } from '@fortawesome/free-solid-svg-icons';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardWeakDomain } from '@/shared/types';

import { WeakDomainRow } from './WeakDomainRow';

interface WeakDomainsCardProps {
  readonly domains: DashboardWeakDomain[] | null;
}

export function WeakDomainsCard({ domains }: WeakDomainsCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-weak-domains"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-foreground">{t('dashboard.home.weakTitle')}</p>
          <p className="mt-0.5 text-xs text-default-500 text-pretty">{t('dashboard.home.weakSubtitle')}</p>
        </div>
        <NextLink
          className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`}
          href="/simulados"
        >
          <FontAwesomeIcon className="text-xs" icon={faBullseye} />
          {t('dashboard.home.weakTrainCta')}
        </NextLink>
      </div>

      <div className="mt-5">
        {domains === null ? (
          <SkeletonListLoader count={4} height="h-6" />
        ) : domains.length === 0 ? (
          <EmptyState
            title={t('dashboard.home.weakEmpty')}
            description={t('dashboard.home.weakEmptyDescription')}
          />
        ) : (
          <div className="flex flex-col gap-3">
            {domains.map((domain) => (
              <WeakDomainRow key={domain.sectionName} domain={domain} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

> `buttonStyles.secondarySm` gives the bordered-secondary look at `h-8 px-3 text-xs` with no `px-8` to fight. It sets `border-*` colors but not the `border` width (HeroUI's `variant="bordered"` normally adds that), so append `border` explicitly since this is a `NextLink`, not a HeroUI `<Button>`.

- [ ] **Step 6: `actions/QuickActionsCard.tsx`**

Create `app/(workspace)/dashboard/components/actions/QuickActionsCard.tsx`:

```tsx
'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faLayerGroup, faPenRuler, faRotateLeft, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardHome } from '@/shared/types';

interface QuickActionsCardProps {
  readonly counts: DashboardHome['quickActions'] | null;
}

export function QuickActionsCard({ counts }: QuickActionsCardProps) {
  const { t } = useTranslation();

  const actions: { icon: IconDefinition; label: string; note: string; href: string }[] = [
    {
      icon: faWandMagicSparkles,
      label: t('dashboard.home.actionGenerate'),
      note: t('dashboard.home.actionGenerateNote'),
      href: '/questions',
    },
    {
      icon: faPenRuler,
      label: t('dashboard.home.actionSimulado'),
      note: t('dashboard.home.actionSimuladoNote'),
      href: '/simulados',
    },
    {
      icon: faLayerGroup,
      label: t('dashboard.home.actionBank'),
      note: t('dashboard.home.actionBankNote', { count: counts ? counts.bankCount : 0 }),
      href: '/question-bank',
    },
    {
      icon: faRotateLeft,
      label: t('dashboard.home.actionReview'),
      note: t('dashboard.home.actionReviewNote', { count: counts ? counts.wrongOpenCount : 0 }),
      href: '/question-bank',
    },
  ];

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-quick-actions"
    >
      <p className="text-sm font-bold text-foreground">{t('dashboard.home.actionsTitle')}</p>
      <div className="mt-4 flex flex-col gap-2">
        {actions.map((action) => (
          <NextLink
            key={action.label}
            href={action.href}
            className="flex items-center gap-3 rounded-lg bg-background border border-default-200 dark:border-transparent p-3 transition-colors hover:bg-content2"
          >
            <FontAwesomeIcon className="text-sm text-primary shrink-0" icon={action.icon} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{action.label}</span>
              <span className="block mt-0.5 text-xs text-default-500">{action.note}</span>
            </span>
          </NextLink>
        ))}
      </div>
    </div>
  );
}
```


- [ ] **Step 7: `activity/ActivityRow.tsx` then `activity/ActivityCard.tsx`**

Create `app/(workspace)/dashboard/components/activity/ActivityRow.tsx`:

```tsx
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCircleCheck, faFileCirclePlus, faSliders, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';

import { RelativeDate } from '@/shared/components/ui/RelativeDate';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardActivityItem } from '@/shared/types';

interface ActivityRowProps {
  readonly item: DashboardActivityItem;
}

const ICONS: Record<DashboardActivityItem['kind'], { icon: IconDefinition; tone: string }> = {
  simulado_finished: { icon: faCircleCheck, tone: 'text-success' },
  questions_generated: { icon: faWandMagicSparkles, tone: 'text-primary' },
  auto_config_done: { icon: faSliders, tone: 'text-primary' },
  exam_created: { icon: faFileCirclePlus, tone: 'text-default-400' },
};

type Translate = (key: string, params?: Record<string, string | number>) => string;

function textFor(item: DashboardActivityItem, t: Translate): string {
  const name = item.params.name ?? '';
  const count = item.params.count ?? 0;

  if (item.kind === 'simulado_finished') {
    return t('dashboard.home.activitySimuladoFinished', { name, score: item.params.score ?? 0 });
  }
  if (item.kind === 'questions_generated') {
    return item.params.name
      ? t('dashboard.home.activityQuestionsGenerated', { count, name })
      : t('dashboard.home.activityQuestionsGeneratedNoName', { count });
  }
  if (item.kind === 'auto_config_done') {
    return t('dashboard.home.activityAutoConfigDone', { name });
  }
  return t('dashboard.home.activityExamCreated', { name });
}

export function ActivityRow({ item }: ActivityRowProps) {
  const { t } = useTranslation();
  const { icon, tone } = ICONS[item.kind];

  return (
    <div className="flex gap-3">
      <div className={`shrink-0 w-7 h-7 rounded-lg bg-content2 flex items-center justify-center ${tone}`}>
        <FontAwesomeIcon className="text-xs" icon={icon} />
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm leading-snug text-default-600 text-pretty">{textFor(item, t)}</p>
        <p className="mt-0.5 text-xs text-default-400">
          <RelativeDate date={item.at} />
        </p>
      </div>
    </div>
  );
}
```

Create `app/(workspace)/dashboard/components/activity/ActivityCard.tsx`:

```tsx
'use client';

import { EmptyState } from '@/shared/components/ui/EmptyState';
import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { DashboardActivityItem } from '@/shared/types';

import { ActivityRow } from './ActivityRow';

interface ActivityCardProps {
  readonly items: DashboardActivityItem[] | null;
}

export function ActivityCard({ items }: ActivityCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-activity"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground">{t('dashboard.home.activityTitle')}</p>
        <span className="font-mono text-xs text-default-400 tracking-wide">{t('dashboard.home.activityWindow')}</span>
      </div>

      <div className="mt-5">
        {items === null ? (
          <SkeletonListLoader count={4} height="h-10" />
        ) : items.length === 0 ? (
          <EmptyState
            title={t('dashboard.home.activityEmpty')}
            description={t('dashboard.home.activityEmptyDescription')}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {items.map((item, i) => (
              <ActivityRow key={`${item.kind}-${item.at}-${i}`} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```


- [ ] **Step 8: `credits/CreditsCard.tsx`**

Create `app/(workspace)/dashboard/components/credits/CreditsCard.tsx`:

```tsx
'use client';

import NextLink from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleArrowUp, faGift } from '@fortawesome/free-solid-svg-icons';

import { SkeletonListLoader } from '@/shared/components/ui/SkeletonListLoader';
import { buttonStyles } from '@/config/constants/buttonStyles';
import { useUsageContext } from '@/features/hooks/useUsageContext.hook';
import { useTranslation } from '@/features/hooks/useTranslation.hook';
import type { UsageStats } from '@/shared/types';

export function CreditsCard() {
  const { t, language } = useTranslation();
  const { usage } = useUsageContext();

  const unlimited = usage?.questionsLimit === -1;
  const pct =
    usage && !unlimited ? Math.min(100, Math.round((usage.questionsUsed / usage.questionsLimit) * 100)) : 0;

  let renewLabel = '';
  if (usage) {
    const renewDate = new Date(usage.periodStartDate);
    renewDate.setDate(renewDate.getDate() + 30);
    renewLabel = renewDate.toLocaleDateString(language === 'en' ? 'en-US' : 'pt-BR');
  }

  return (
    <div
      className="bg-content1 rounded-xl border border-default-200 dark:border-transparent p-6"
      data-testid="dashboard-credits"
    >
      {!usage ? (
        <SkeletonListLoader count={1} height="h-28" />
      ) : (
        <CreditsBody pct={pct} renewLabel={renewLabel} t={t} unlimited={unlimited} usage={usage} />
      )}
    </div>
  );
}

interface CreditsBodyProps {
  readonly usage: UsageStats;
  readonly unlimited: boolean;
  readonly pct: number;
  readonly renewLabel: string;
  readonly t: (key: string, params?: Record<string, string | number>) => string;
}

function CreditsBody({ usage, unlimited, pct, renewLabel, t }: CreditsBodyProps) {
  return (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-mono text-xs text-default-400 tracking-wide">{t('dashboard.home.creditsKicker')}</p>
        <span className="font-mono text-sm text-foreground">
          {unlimited ? t('dashboard.home.creditsUnlimited') : `${usage.questionsUsed} / ${usage.questionsLimit}`}
        </span>
      </div>

      {!unlimited && (
        <div className="mt-3 h-2 rounded-full bg-background overflow-hidden">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="mt-3 text-xs text-default-500 text-pretty">
        {t('dashboard.home.creditsRenew', { date: renewLabel })} {t('dashboard.home.creditsReferralNote')}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <NextLink className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`} href="/billing">
          <FontAwesomeIcon className="text-xs" icon={faCircleArrowUp} />
          {t('dashboard.home.creditsPlans')}
        </NextLink>
        <NextLink className={`${buttonStyles.secondarySm} inline-flex items-center gap-2 border`} href="/billing">
          <FontAwesomeIcon className="text-xs" icon={faGift} />
          {t('dashboard.home.creditsReferral')}
        </NextLink>
      </div>
    </>
  );
}
```

> `useUsageContext()` can briefly return `{ usage: null }`; the card keeps its `data-testid="dashboard-credits"` wrapper in both states so the e2e locator resolves immediately.

- [ ] **Step 9: Format, typecheck and lint the new files**

Run: `npx prettier --write "app/(workspace)/dashboard/components/**/*.tsx"`

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx eslint --fix "app/(workspace)/dashboard/components/**/*.tsx"`
Expected: clean (no warnings/errors). `--fix` with an explicit path is safe — the danger the project warns about is `npm run lint` (no path, rewrites the whole repo).

- [ ] **Step 10: Commit**

```bash
git add "app/(workspace)/dashboard/components/HomeHeader.tsx" \
  "app/(workspace)/dashboard/components/kpi/HomeKpiGrid.tsx" \
  "app/(workspace)/dashboard/components/resume" \
  "app/(workspace)/dashboard/components/exams" \
  "app/(workspace)/dashboard/components/weak" \
  "app/(workspace)/dashboard/components/actions" \
  "app/(workspace)/dashboard/components/activity" \
  "app/(workspace)/dashboard/components/credits"
git commit -m "feat: build início dashboard cards

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: Page cutover + delete the old dashboard

**Files:**
- Modify: `app/(workspace)/dashboard/page.tsx` (full rewrite)
- Modify: `app/(workspace)/dashboard/loading.tsx` (reshape)
- Modify: `features/connectors.ts` (`getDashboardStats` return type)
- Modify: `shared/types/index.ts` (remove the 4 old interfaces)
- Modify: `public/messages/en.properties` + `pt.properties` (remove dead keys)
- Delete: the 11 old component files listed in File Structure.

**Interfaces:**
- Consumes: all Task 5 components; `DashboardHome` (Task 2); `getDashboardStats` (this task).

- [ ] **Step 1: Update the connector**

In `features/connectors.ts`, change the import `DashboardStats` → `DashboardHome` in the type-import block (~line 66) and rewrite the function (~lines 411-414):

```ts
export async function getDashboardStats(): Promise<DashboardHome> {
  const { data } = await api.get<DashboardHome>(DASHBOARD_STATS_URL);
  return data;
}
```

- [ ] **Step 2: Rewrite `page.tsx`**

Replace the entire contents of `app/(workspace)/dashboard/page.tsx` with:

```tsx
'use client';

import { useEffect, useState } from 'react';

import { HomeHeader } from './components/HomeHeader';
import { HomeKpiGrid } from './components/kpi/HomeKpiGrid';
import { ResumeCard } from './components/resume/ResumeCard';
import { ExamsInProgressCard } from './components/exams/ExamsInProgressCard';
import { WeakDomainsCard } from './components/weak/WeakDomainsCard';
import { QuickActionsCard } from './components/actions/QuickActionsCard';
import { ActivityCard } from './components/activity/ActivityCard';
import { CreditsCard } from './components/credits/CreditsCard';

import { PageHeader } from '@/shared/components/ui/PageHeader';
import { getDashboardStats } from '@/features/connectors';
import type { DashboardHome } from '@/shared/types';

const EMPTY_HOME: DashboardHome = {
  kpis: {
    streakDays: 0,
    questionsThisWeek: 0,
    questionsWeekDelta: 0,
    avgAccuracy: null,
    avgAccuracyDelta: null,
    simuladosTotal: 0,
    simuladosOpen: 0,
  },
  resume: null,
  examsInProgress: [],
  weakDomains: [],
  quickActions: { bankCount: 0, wrongOpenCount: 0 },
  activity: [],
};

export default function DashboardPage() {
  const [home, setHome] = useState<DashboardHome | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setHome)
      .catch(() => setHome(EMPTY_HOME));
  }, []);

  return (
    <PageHeader>
      <div className="space-y-6" data-testid="dashboard-root">
        <HomeHeader
          loading={home === null}
          resumeName={home?.resume?.simuladoName ?? null}
          summaryExams={home?.examsInProgress.length ?? 0}
          summaryWrong={home?.quickActions.wrongOpenCount ?? 0}
        />

        <HomeKpiGrid kpis={home?.kpis ?? null} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4 items-start">
          <div className="grid gap-4">
            <ResumeCard loading={home === null} resume={home?.resume ?? null} />
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
  );
}
```

- [ ] **Step 3: Reshape `loading.tsx`**

Replace the contents of `app/(workspace)/dashboard/loading.tsx` with:

```tsx
'use client';

import { Skeleton } from '@heroui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className="app-bg">
      <div className="w-full px-6 md:px-12 py-6 md:py-12">
        <div className="space-y-6" aria-hidden>
          <Skeleton className="h-20 w-full rounded-xl" />

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-4">
            <div className="grid gap-4">
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
            <div className="grid gap-4">
              <Skeleton className="h-56 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Delete the old components**

```bash
git rm "app/(workspace)/dashboard/components/header/PerformanceHeader.tsx" \
  "app/(workspace)/dashboard/components/header/ReadinessGauge.tsx" \
  "app/(workspace)/dashboard/components/kpi/KpiRibbon.tsx" \
  "app/(workspace)/dashboard/components/kpi/KpiCard.tsx" \
  "app/(workspace)/dashboard/components/focus/FocusAreasSection.tsx" \
  "app/(workspace)/dashboard/components/focus/FocusAreaCard.tsx" \
  "app/(workspace)/dashboard/components/ScoreTrendSection.tsx" \
  "app/(workspace)/dashboard/components/sessions/RecentSessionsSection.tsx" \
  "app/(workspace)/dashboard/components/sessions/SessionRow.tsx" \
  "app/(workspace)/dashboard/components/domains/DomainBreakdownSection.tsx" \
  "app/(workspace)/dashboard/components/domains/DomainRow.tsx"
```

- [ ] **Step 5: Remove the old types**

In `shared/types/index.ts`, delete the four interfaces `DashboardRecentSession`, `DashboardScoreTrendPoint`, `DashboardDomainStat`, `DashboardStats` (the block just before the new `DashboardKpis`, ~lines 641-667). Keep everything from `DashboardKpis` onward.

- [ ] **Step 6: Remove dead i18n keys**

From **both** `public/messages/en.properties` and `public/messages/pt.properties`, delete these keys (keep the two files aligned — remove the same lines from each):

```
dashboard.onTrack
dashboard.weakAreasNote
dashboard.quickPractice
dashboard.examReadiness
dashboard.projectedScore
dashboard.peerRank
dashboard.studyStreak
dashboard.studyStreakBest
dashboard.questionsMastered
dashboard.questionsMasteredDetail
dashboard.focusAreas
dashboard.focusAreasSubtitle
dashboard.studyNow
dashboard.accuracy
dashboard.masteryProgress
dashboard.recentSessions
dashboard.recentSessionsSubtitle
dashboard.domainBreakdown
dashboard.domainBreakdownSubtitle
dashboard.simuladosCompleted
dashboard.simuladosCompletedDetail
dashboard.bestScore
dashboard.bestScoreDetail
dashboard.noRecentSessions
dashboard.noRecentSessionsDescription
dashboard.scoreTrend
dashboard.noScoreTrend
dashboard.noScoreTrendDescription
dashboard.noDomainBreakdown
dashboard.noDomainBreakdownDescription
dashboard.noFocusAreas
dashboard.noFocusAreasDescription
dashboard.noFocusAreasYet
dashboard.noFocusAreasYetDescription
```

Keep `dashboard.greeting.morning/afternoon/evening` (used by `HomeHeader`), `dashboard.mockExam` (verify with `grep -rn "dashboard.mockExam" app shared features` — if unused after this task, remove it too), and `dashboard.comingSoon` (verify the same way).

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors. If `tsc` reports an unused/broken import anywhere referencing a deleted `Dashboard*` type or component, that file was missed — re-check File Structure.

- [ ] **Step 8: Format + lint**

Run: `npx prettier --write "app/(workspace)/dashboard/**/*.tsx" app/api/dashboard/stats/dashboard.service.ts features/connectors.ts shared/types/index.ts lib/exam/readiness.ts`
Run: `npx eslint --fix "app/(workspace)/dashboard/**/*.tsx" app/api/dashboard/stats/dashboard.service.ts features/connectors.ts shared/types/index.ts lib/exam/readiness.ts`
Expected: clean.

- [ ] **Step 9: Verify the i18n parity + full unit suite**

Run: `npm test`
Expected: PASS — including `i18n-prefixes` / `i18n` parity tests after the key removals.

- [ ] **Step 10: Render the page**

Use the `run` skill (or `npm run dev` if no server is already running — never `npm run build` alongside a running dev server) and open `/dashboard` logged in as a seeded user. Confirm: header + 4 KPIs + two-column layout; cards show data or their empty states; no console errors; dark and light both render (toggle via the workspace header). Capture a screenshot for the review.

- [ ] **Step 11: Commit**

```bash
git add -A "app/(workspace)/dashboard" features/connectors.ts shared/types/index.ts public/messages
git commit -m "feat: replace dashboard with the início home hub

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 7: E2E spec rewrite

**Files:**
- Modify: `tests/e2e/support/selectors.ts` (`TID`, ~lines 115-121)
- Modify: `tests/e2e/global-setup.ts` (`seedCompletedMockExamAttempt`, ~lines 151-152)
- Modify: `tests/e2e/tests/dashboard.spec.ts` (full rewrite)

**Interfaces:**
- Consumes: the `data-testid`s emitted by Task 5/6 components (`dashboard-root`, `dashboard-kpis`, `dashboard-resume`, `dashboard-exams-progress`, `dashboard-weak-domains`, `dashboard-quick-actions`, `dashboard-activity`, `dashboard-credits`, `empty-state`).

- [ ] **Step 1: Update the `TID` catalog**

In `tests/e2e/support/selectors.ts`, replace the dashboard block (lines 115-121):

```ts
  // Dashboard (/dashboard)
  dashboardRoot: 'dashboard-root',
  dashboardKpis: 'dashboard-kpis',
  dashboardResume: 'dashboard-resume',
  dashboardExamsProgress: 'dashboard-exams-progress',
  dashboardWeakDomains: 'dashboard-weak-domains',
  dashboardQuickActions: 'dashboard-quick-actions',
  dashboardActivity: 'dashboard-activity',
  dashboardCredits: 'dashboard-credits',
```

Then run `grep -rn "dashboardKpiRibbon\|dashboardFocusAreas\|dashboardRecentSessions\|dashboardSessionRow\|dashboardDomainBreakdown" tests/` and confirm the only remaining hits are the ones you are about to rewrite in `dashboard.spec.ts` (Step 3).

- [ ] **Step 2: Make the seed dates relative and fix the raw score**

In `tests/e2e/global-setup.ts`, inside `seedCompletedMockExamAttempt`, replace:

```ts
  const startedAt = new Date('2024-06-01T10:00:00Z');
  const finishedAt = new Date('2024-06-01T10:30:00Z');
```

with:

```ts
  const finishedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
  const startedAt = new Date(finishedAt.getTime() - 30 * 60 * 1000);
```

Then, in the same `prisma.mockExamAttempt.create` call, change `score: 67` to `score: 2`.

`MockExamAttempt.score` is a raw correct-answer count (`mock-exam.service.ts:582`), and this attempt answers 2 of 3 questions correctly. The old value `67` only made sense to the deleted dashboard, which mis-read `score` as a percent. The new service normalizes `score / mockExam._count.questions * 100` → `2 / 3 * 100 ≈ 67%`. `dashboard.spec.ts` is the only reader of this attempt.

- [ ] **Step 3: Rewrite `dashboard.spec.ts`**

Replace the entire contents of `tests/e2e/tests/dashboard.spec.ts` with:

```ts
import { test, expect } from '../fixtures/auth.fixture';
import { tid, TID } from '../support/selectors';

const EMPTY_HOME = {
  kpis: {
    streakDays: 0,
    questionsThisWeek: 0,
    questionsWeekDelta: 0,
    avgAccuracy: null,
    avgAccuracyDelta: null,
    simuladosTotal: 0,
    simuladosOpen: 0,
  },
  resume: null,
  examsInProgress: [],
  weakDomains: [],
  quickActions: { bankCount: 0, wrongOpenCount: 0 },
  activity: [],
};

test.describe('dashboard', () => {
  test('renders the início hub with data from the seeded attempt', async ({ authedPage: page }) => {
    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRoot))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardKpis))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardExamsProgress))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardQuickActions))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardActivity))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardCredits))).toBeVisible();

    // Seeded finished attempt (3 days ago) shows up in the activity feed.
    await expect(page.locator(tid(TID.dashboardActivity)).locator(tid(TID.emptyState))).toHaveCount(0);

    // No unfinished attempt is seeded, so the resume card is not rendered.
    await expect(page.locator(tid(TID.dashboardResume))).toHaveCount(0);

    // Seeded exams (cert + concurso) have saved questions, so they list here.
    await expect(page.locator(tid(TID.dashboardExamsProgress)).locator(tid(TID.emptyState))).toHaveCount(0);
  });

  test('shows empty states across the hub when the user has no data', async ({ authedPage: page }) => {
    await page.route('**/api/dashboard/stats', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(EMPTY_HOME) });
      } else {
        route.continue();
      }
    });

    await page.goto('/dashboard');

    await expect(page.locator(tid(TID.dashboardRoot))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardResume))).toHaveCount(0);
    await expect(page.locator(tid(TID.dashboardExamsProgress)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardWeakDomains)).locator(tid(TID.emptyState))).toBeVisible();
    await expect(page.locator(tid(TID.dashboardActivity)).locator(tid(TID.emptyState))).toBeVisible();
  });
});
```

- [ ] **Step 4: Run the dashboard e2e spec**

Run: `DATABASE_URL="file:$(pwd)/prisma/dev.db" npx playwright test dashboard`
Expected: PASS (2 tests). If `globalSetup` needs to re-seed, that is automatic.

- [ ] **Step 5: Run the full e2e suite to check for fallout**

Run: `DATABASE_URL="file:$(pwd)/prisma/dev.db" npm run e2e`
Expected: PASS. The seed-date change only affects `dashboard.spec.ts` (confirmed: it is the only reader of that attempt).

- [ ] **Step 6: Commit**

```bash
git add tests/e2e/tests/dashboard.spec.ts tests/e2e/support/selectors.ts tests/e2e/global-setup.ts
git commit -m "test: rewrite dashboard e2e for the início layout

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Final verification (before opening the PR)

- [ ] `npx tsc --noEmit` — clean
- [ ] `npm test` — all unit suites pass
- [ ] `npx eslint "app/(workspace)/dashboard/**/*.tsx" "app/api/dashboard/**/*.ts" lib/exam/readiness.ts features/services/exam/exam.service.ts features/connectors.ts shared/types/index.ts` — clean
- [ ] `DATABASE_URL="file:$(pwd)/prisma/dev.db" npm run e2e` — passes
- [ ] `/dashboard` verified in the running app, light + dark, logged in
- [ ] `git log --oneline main..HEAD` shows 7 focused commits
- [ ] Open PR against `main`; body ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

---

## Self-Review

**Spec coverage:**
- §3 types → Task 2 (add), Task 6 Step 5 (remove old). ✓
- §4.0 shared readiness helper → Task 1. ✓
- §4.1 service reads (A/U/E/Q/S/AC) → Task 3 Step 3; `simuladosTotal` via `mockExam.count` added as the 7th read (spec §4.2 refined — the mock-exam count, not `Set(attempt.mockExamId)`). ✓
- §4.2 KPIs (streak/week/avg/simulados) → Task 3 `computeKpis` + tests. ✓
- §4.3 resume → Task 3 `computeResume` + test. ✓
- §4.4 examsInProgress → Task 3 `computeExamsInProgress` + test. ✓
- §4.5 weakDomains → Task 3 `computeWeakDomains` + test. ✓
- §4.6 quickActions → Task 3 `computeWrongOpenCount` + `questions.length` + test. ✓
- §4.7 activity → Task 3 `computeActivity` + test. ✓
- §5.1 page → Task 6 Step 2. §5.2 components → Task 5. §5.3 deletions → Task 6 Step 4. ✓
- §5.4 visual translation → applied in Task 5 component classNames (tokens, `font-mono`, borderless dark, `buttonStyles`, FA icons). ✓
- §5.5 behaviors (modal, resume route, links, empty states, credits) → Task 5 components. ✓
- §6 i18n add + dead-key removal → Task 4 (add) + Task 6 Step 6 (remove). ✓
- §7.1 unit tests → Task 1 + Task 3. §7.2 e2e + seed + selectors → Task 7. ✓
- §8 commits → 7 commits, matches (Task 5 splits the "components" commit from the "cutover" commit for reviewability). ✓

**Placeholder scan:** All FontAwesome icons used (`faFire`, `faCircleCheck`, `faPercent`, `faFileLines`, `faPlay`, `faArrowRight`, `faBullseye`, `faWandMagicSparkles`, `faLayerGroup`, `faPenRuler`, `faRotateLeft`, `faFileCirclePlus`, `faSliders`, `faCircleArrowUp`, `faGift`, `faPlus`) verified present in the installed `@fortawesome/free-solid-svg-icons`. `dashboard.mockExam` / `dashboard.comingSoon` removal is gated on a stated `grep`. No "TBD"/"handle edge cases"/"similar to". ✓

**Type consistency:**
- `computeExamReadiness(sections, questions)` — same signature in Task 1 (def), Task 3 (`app/api/dashboard/stats/dashboard.service.ts` call with `exam.sections` / `examQuestions`), Task 1 Step 5 (`exam.service.ts` call). ✓
- `DashboardHome` field names (`kpis`, `resume`, `examsInProgress`, `weakDomains`, `quickActions`, `activity`) identical across Task 2 type, Task 3 return, Task 6 `EMPTY_HOME`, Task 7 `EMPTY_HOME`. ✓
- `DashboardExamProgress` uses `boardName` / `keyLabel` / `readiness` / `accuracy` in the type (Task 2), the service (Task 3), and `ExamProgressRow` (Task 5). ✓
- `DashboardActivityItem.kind` union values match between the type (Task 2), the service literals (Task 3), and `ActivityRow`'s `ICONS` map + `textFor` switch (Task 5). ✓
- `data-testid` strings: `dashboard-kpis`/`-resume`/`-exams-progress`/`-weak-domains`/`-quick-actions`/`-activity`/`-credits` identical between Task 5/6 components and Task 7 `TID`. ✓
- `getDashboardStats` return type `Promise<DashboardHome>` — Task 6 Step 1, consumed in Task 6 Step 2. ✓
