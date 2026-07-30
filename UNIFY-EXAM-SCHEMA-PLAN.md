# Unify Certification + PublicExam into `Exam` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapse the two mirrored entity families (`Certification*` and `PublicExam*`) into a single polymorphic `Exam` schema discriminated by `type`, and unify every layer above it (types, services, routes, providers, components, prompts, quota).

**Architecture:** One `Exam` table with `type: "certification" | "public_exam"`, two rich reference tables (`Provider`, `ExamBoard`) reached by nullable FKs, an identical `Exam → ExamSection → ExamTopic?` hierarchy for both types, and one unified `MockExam*` simulado family joined by FK. Quota enforcement uses a single `maxExams` counter; display stays split by type. Since there is **no production data to preserve**, the migration is a clean `DROP + CREATE`.

**Tech Stack:** Next.js 15 (App Router), Prisma 6 (SQLite dev / LibSQL prod), TypeScript strict, HeroUI, Vitest, Playwright.

**Reference spec:** `docs/superpowers/specs/2026-07-29-unify-exam-schema-design.md`

**Branch:** `feature/unify-exam-schema` (already created; the spec is committed here).

---

## Ground rules for the implementing engineer

- **This is a big-bang schema swap with no data migration.** Do not write data-copy SQL. The dev DB is reseeded; the prod DB is `DROP + CREATE`.
- **`ExamSection.minQuestions/maxQuestions` are integers 0–100 (percent).** Never multiply/divide by 100 except inside `QuizGeneratorService.distributeQuestions`. (CLAUDE.md → "Topic / subject percentage unit")
- **Every API catch block uses `toApiErrorResponse(err)`** from `lib/api-error.ts`. Never build `{ error, message }` by hand.
- **Named exports only, `readonly` props, `'use client'` on interactive components, no barrel `index.ts` in component dirs.** (CLAUDE.md → Code Patterns)
- **Run tests after each phase:** `npm test` (unit) must pass before moving on. E2E is Phase 10.
- **Commit per task**, grouped by layer, one-line message (`<type>: <desc>`, ≤72 chars, no body).
- The work is ordered so each phase compiles and tests green before the next. Do not skip ahead — later phases import symbols defined in earlier ones.

---

## File Structure (what gets created / deleted / rewritten)

**Prisma (Phase 1)**
- Rewrite: `prisma/dev/schema.prisma`, `prisma/prod/schema.prisma`
- Create: one dev migration folder, one prod migration folder
- Rewrite: `prisma/dev/scripts/seed.ts`

**Types + constants + connectors (Phase 2)**
- Rewrite: `shared/types/index.ts` (Exam union types), `config/constants/index.ts` (PLAN_LIMITS, URLs, initial states), `features/connectors.ts` (type-parameterized fns)

**Services (Phase 3)**
- Create: `features/services/exam.service.ts`, `features/services/exam-question.service.ts`
- Rewrite: `features/services/quota.service.ts`, `features/services/mock-exam.service.ts`, `features/services/generation-job.service.ts`, `features/services/browse.service.ts`, `features/services/question-bank.service.ts`, `features/services/metrics.service.ts`, `features/services/quiz-generator.service.ts`
- Delete: `features/services/certification.service.ts`, `features/services/public-exam.service.ts`, `features/services/question.service.ts`

**Routes (Phase 4)** — collapse the `certification/*` and `public-exam/*` pairs into `exam/*` parameterized by `type`; unify the two simulado route trees into `mock-exams/*`. (full list in Task 4.x)

**Providers / reducers (Phase 5)**
- Create: `features/providers/exams.provider.tsx`, `features/reducers/exams.reducer.ts`; `features/providers/mockExams.provider.tsx` (rewritten)
- Delete: `certifications.provider.tsx`, `publicExams.provider.tsx`, `certSimulados.provider.tsx`, and their reducers, plus orphaned `root.reducer.ts`

**Prompts (Phase 6)** — keep both families; add a `type`-keyed dispatch table in `config/prompts/index.ts`.

**Components (Phase 7)** — unify wizard steps, sections table, draft card.

**Quota UI + admin (Phase 8)** — `UsageStats` dual shape, sidebar/header/admin counters.

**Tests (Phase 9)** + **Docs (Phase 10)**.

---

# Phase 1 — Schema + migration + seed

### Task 1.1: Rewrite the dev Prisma schema

**Files:**
- Modify: `prisma/dev/schema.prisma` (replace all models from `Certification` through `CertificationSimuladoAttemptAnswer`; keep `User`, `Account`, `Session`, `VerificationToken`, `UsageLog`, `UsageLogStep`, `AdminAuditLog`, `GenerationJob`, `GenerationJobTopic`)

- [ ] **Step 1: Update the `User` model relations**

In `prisma/dev/schema.prisma`, replace these relation lines inside `model User`:

```prisma
  certifications Certification[]
  questions      Question[]
  publicExams         PublicExam[]
  publicExamQuestions PublicExamQuestion[]
  usageLogs      UsageLog[]
  mockExams      MockExam[]
  mockAttempts   MockExamAttempt[]
  certSimulados        CertificationSimulado[]
  certSimuladoAttempts CertificationSimuladoAttempt[]
  generationJobs       GenerationJob[]
```

with:

```prisma
  exams          Exam[]
  examQuestions  ExamQuestion[]
  usageLogs      UsageLog[]
  mockExams      MockExam[]
  mockAttempts   MockExamAttempt[]
  generationJobs GenerationJob[]
```

- [ ] **Step 2: Delete the old entity models**

Delete every model from `model Certification {` through the end of `model CertificationSimuladoAttemptAnswer {` (i.e. `Certification`, `CertificationTopic`, `Question`, `Option`, `Answer`, `Explanation`, `ExamBoard`, `PublicExam`, `PublicExamSubject`, `PublicExamTopic`, `PublicExamQuestion`, `PublicExamOption`, `PublicExamAnswer`, `PublicExamExplanation`, `MockExam`, `MockExamSubjectConfig`, `MockExamQuestion`, `MockExamAttempt`, `MockExamAttemptAnswer`, `CertificationSimulado`, `CertificationSimuladoTopicConfig`, `CertificationSimuladoQuestion`, `CertificationSimuladoAttempt`, `CertificationSimuladoAttemptAnswer`). Leave `UsageLog`, `UsageLogStep`, `AdminAuditLog`, `GenerationJob`, `GenerationJobTopic` untouched.

- [ ] **Step 3: Add the unified models**

Paste the full unified model block (from spec §3) where the deleted models were:

```prisma
model Provider {
  id       String @id @default(cuid())
  name     String @unique
  fullName String?
  logoUrl  String?
  exams    Exam[]
}

model ExamBoard {
  id       String @id @default(cuid())
  name     String @unique
  fullName String?
  exams    Exam[]
}

model Exam {
  id                  String         @id @default(cuid())
  type                String
  name                String
  role                String?
  year                Int?
  totalQuestions      Int
  examDurationMinutes Int?
  passingScore        Float?
  providerId          String?
  examBoardId         String?
  userId              String?
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt
  provider            Provider?      @relation(fields: [providerId], references: [id])
  examBoard           ExamBoard?     @relation(fields: [examBoardId], references: [id])
  user                User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  sections            ExamSection[]
  questions           ExamQuestion[]
  mockExams           MockExam[]

  @@unique([userId, type, name, year])
}

model ExamSection {
  id           String         @id @default(cuid())
  name         String
  minQuestions Int
  maxQuestions Int
  examId       String
  exam         Exam           @relation(fields: [examId], references: [id], onDelete: Cascade)
  topics       ExamTopic[]
  questions    ExamQuestion[]

  @@unique([examId, name])
}

model ExamTopic {
  id        String         @id @default(cuid())
  name      String
  sectionId String
  section   ExamSection    @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  questions ExamQuestion[]

  @@unique([sectionId, name])
}

model ExamQuestion {
  id           Int          @id @default(autoincrement())
  text         String
  correctCount Int
  difficulty   String
  examName     String
  sectionName  String
  topicName    String?
  examId       String?
  sectionId    String?
  topicId      String?
  userId       String?
  createdAt    DateTime     @default(now())
  options      ExamOption[]
  answer       ExamAnswer?
  exam         Exam?        @relation(fields: [examId], references: [id], onDelete: SetNull)
  section      ExamSection? @relation(fields: [sectionId], references: [id], onDelete: SetNull)
  topic        ExamTopic?   @relation(fields: [topicId], references: [id], onDelete: SetNull)
  user         User?        @relation(fields: [userId], references: [id], onDelete: Cascade)
  mockExamQuestions MockExamQuestion[]

  @@index([examId])
  @@index([sectionId])
  @@index([topicId])
}

model ExamOption {
  id         Int          @id @default(autoincrement())
  questionId Int
  question   ExamQuestion @relation(fields: [questionId], references: [id])
  label      String
  text       String
}

model ExamAnswer {
  id             Int               @id @default(autoincrement())
  questionId     Int               @unique
  question       ExamQuestion      @relation(fields: [questionId], references: [id])
  correctOptions Json
  explanations   ExamExplanation[]
}

model ExamExplanation {
  id        Int        @id @default(autoincrement())
  answerId  Int
  answer    ExamAnswer @relation(fields: [answerId], references: [id])
  label     String
  text      String
  createdAt DateTime   @default(now())
}

model MockExam {
  id        Int                     @id @default(autoincrement())
  name      String?
  examId    String
  userId    String?
  createdAt DateTime                @default(now())
  exam      Exam                    @relation(fields: [examId], references: [id])
  user      User?                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  sections  MockExamSectionConfig[]
  questions MockExamQuestion[]
  attempts  MockExamAttempt[]
}

model MockExamSectionConfig {
  id            Int      @id @default(autoincrement())
  mockExamId    Int
  sectionName   String
  questionCount Int
  mockExam      MockExam @relation(fields: [mockExamId], references: [id], onDelete: Cascade)
}

model MockExamQuestion {
  id             Int                     @id @default(autoincrement())
  mockExamId     Int
  examQuestionId Int
  order          Int
  mockExam       MockExam                @relation(fields: [mockExamId], references: [id], onDelete: Cascade)
  examQuestion   ExamQuestion            @relation(fields: [examQuestionId], references: [id])
  attemptAnswers MockExamAttemptAnswer[]
}

model MockExamAttempt {
  id         Int                     @id @default(autoincrement())
  mockExamId Int
  userId     String?
  startedAt  DateTime                @default(now())
  finishedAt DateTime?
  score      Int?
  mockExam   MockExam                @relation(fields: [mockExamId], references: [id], onDelete: Cascade)
  user       User?                   @relation(fields: [userId], references: [id], onDelete: Cascade)
  answers    MockExamAttemptAnswer[]
}

model MockExamAttemptAnswer {
  id                 Int              @id @default(autoincrement())
  attemptId          Int
  mockExamQuestionId Int
  selectedOptions    String
  attempt            MockExamAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  mockExamQuestion   MockExamQuestion @relation(fields: [mockExamQuestionId], references: [id])
}
```

- [ ] **Step 4: Mirror the exact same changes into `prisma/prod/schema.prisma`**

Apply Steps 1–3 identically to `prisma/prod/schema.prisma`. The only differences between the two files are the `datasource`/`generator` blocks at the top — leave those untouched. The model definitions must be byte-identical.

- [ ] **Step 5: Format and validate both schemas**

Run: `npx prisma format --schema=prisma/dev/schema.prisma && npx prisma format --schema=prisma/prod/schema.prisma`
Then: `npx prisma validate --schema=prisma/dev/schema.prisma && npx prisma validate --schema=prisma/prod/schema.prisma`
Expected: `The schema at ... is valid 🚀` for both.

- [ ] **Step 6: Commit**

```bash
git add prisma/dev/schema.prisma prisma/prod/schema.prisma
git commit -m "feat: unify Certification and PublicExam into Exam schema"
```

---

### Task 1.2: Generate the dev migration and regenerate the client

**Files:**
- Create: `prisma/dev/migrations/<timestamp>_unify_exam_schema/migration.sql` (generated)

- [ ] **Step 1: Create the migration**

Run: `npm run prisma:migrate:dev -- --name unify_exam_schema`
(This maps to `prisma migrate dev` against `prisma/dev/schema.prisma`. If the script does not forward `--name`, run `npx prisma migrate dev --name unify_exam_schema --schema=prisma/dev/schema.prisma`.)
Expected: Prisma prints that it will drop the old tables and create the new ones, applies the migration, and regenerates the client. Because there is no data to preserve, accept the drop.

- [ ] **Step 2: Regenerate the client explicitly (safety)**

Run: `npm run prisma:generate:dev`
Expected: `Generated Prisma Client`.

- [ ] **Step 3: Sanity-check the generated types**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: MANY errors referencing `prisma.certification`, `prisma.publicExam`, `Question`, etc. This is expected — those are fixed in Phases 2–4. Confirm the errors are all about the removed models (not about the new schema failing to generate).

- [ ] **Step 4: Commit**

```bash
git add prisma/dev/migrations
git commit -m "feat: add unify_exam_schema dev migration"
```

---

### Task 1.3: Rewrite the dev seed

**Files:**
- Modify: `prisma/dev/scripts/seed.ts`

- [ ] **Step 1: Read the current seed to learn its structure**

Run: `cat prisma/dev/scripts/seed.ts`
Note how it currently creates a `certification` (+ topics + questions) and a `publicExam` (+ subjects + topics + questions). You will rewrite both to create `Exam` rows.

- [ ] **Step 2: Rewrite the seed to create unified `Exam` rows**

Replace the certification-creation block with an `Exam` of `type: 'certification'` that has a `Provider` and flat `ExamSection`s (no topics), and the public-exam block with an `Exam` of `type: 'public_exam'` that has an `ExamBoard` and `ExamSection`s each containing `ExamTopic`s. Use this shape (adapt names to whatever the seed already used):

```ts
const aws = await prisma.provider.upsert({
  where: { name: 'AWS' },
  update: {},
  create: { name: 'AWS', fullName: 'Amazon Web Services' },
});

const certExam = await prisma.exam.create({
  data: {
    type: 'certification',
    name: 'AWS Certified Cloud Practitioner',
    year: 2025,
    totalQuestions: 65,
    providerId: aws.id,
    userId: seedUserId,
    sections: {
      create: [
        { name: 'Cloud Concepts', minQuestions: 20, maxQuestions: 30 },
        { name: 'Security and Compliance', minQuestions: 20, maxQuestions: 30 },
        { name: 'Technology', minQuestions: 25, maxQuestions: 40 },
        { name: 'Billing and Pricing', minQuestions: 10, maxQuestions: 20 },
      ],
    },
  },
});

const fgv = await prisma.examBoard.upsert({
  where: { name: 'FGV' },
  update: {},
  create: { name: 'FGV', fullName: 'Fundação Getulio Vargas' },
});

const examConcurso = await prisma.exam.create({
  data: {
    type: 'public_exam',
    name: 'Analista Judiciário',
    role: 'Analista Judiciário - Área Administrativa',
    year: 2025,
    totalQuestions: 70,
    examBoardId: fgv.id,
    userId: seedUserId,
    sections: {
      create: [
        {
          name: 'Língua Portuguesa',
          minQuestions: 20,
          maxQuestions: 30,
          topics: { create: [{ name: 'Interpretação de Texto' }, { name: 'Crase' }] },
        },
        {
          name: 'Direito Constitucional',
          minQuestions: 20,
          maxQuestions: 30,
          topics: { create: [{ name: 'Direitos Fundamentais' }] },
        },
      ],
    },
  },
});
```

Then create a few `ExamQuestion` rows for each (mirroring how the old seed created `Question`/`PublicExamQuestion`), setting `examId`, `sectionId`, snapshot strings `examName`/`sectionName`/`topicName`, `options` (A–E), and an `answer` with `correctOptions` + `explanations`.

- [ ] **Step 3: Run the seed against a fresh DB**

Run: `npm run db:clear:dev && npm run db:seed:dev`
Expected: no errors; script prints the created exam ids.

- [ ] **Step 4: Verify rows exist**

Run: `sqlite3 prisma/dev.db "SELECT type, name FROM Exam;"`
Expected: two rows — `certification|AWS Certified Cloud Practitioner` and `public_exam|Analista Judiciário`.

- [ ] **Step 5: Commit**

```bash
git add prisma/dev/scripts/seed.ts
git commit -m "feat: reseed dev DB with unified Exam rows"
```

---

# Phase 2 — Types, constants, connectors

### Task 2.1: Rewrite shared types

**Files:**
- Modify: `shared/types/index.ts`

- [ ] **Step 1: Read the current types to catalog every Certification/PublicExam type**

Run: `grep -nE 'Certification|PublicExam|interface |type ' shared/types/index.ts`
Make a list of every type you must replace. The replacements below cover the domain entities; keep unrelated types (auth, billing, generation-job, question-bank) as-is unless they reference removed types.

- [ ] **Step 2: Add the unified domain types**

Add (replacing the `Certification`, `CertificationTopic`, `PublicExam`, `PublicExamSubject`, `PublicExamTopic` interfaces and their question/option/answer/explanation twins):

```ts
export type ExamType = 'certification' | 'public_exam';

export interface Provider {
  readonly id: string;
  readonly name: string;
  readonly fullName?: string | null;
  readonly logoUrl?: string | null;
}

export interface ExamBoard {
  readonly id: string;
  readonly name: string;
  readonly fullName?: string | null;
}

export interface ExamTopic {
  readonly id?: string;
  readonly name: string;
}

export interface ExamSection {
  readonly id?: string;
  readonly name: string;
  readonly minQuestions: number; // 0–100 percent
  readonly maxQuestions: number; // 0–100 percent
  readonly topics?: ExamTopic[];
}

export interface Exam {
  readonly id?: string;
  readonly type: ExamType;
  readonly name: string;
  readonly role?: string | null;
  readonly year?: number | null;
  readonly totalQuestions: number;
  readonly examDurationMinutes?: number | null;
  readonly passingScore?: number | null;
  readonly provider?: Provider | null;
  readonly examBoard?: ExamBoard | null;
  readonly sections: ExamSection[];
}
```

- [ ] **Step 3: Update `QuotaAction` and `UsageStats`**

Replace the `QuotaAction` union and `UsageStats` interface with:

```ts
export type QuotaAction = 'generate_questions' | 'create_exam';

export interface UsageStats {
  readonly plan: UserPlan;
  readonly questionsUsed: number;
  readonly questionsLimit: number;
  readonly questionsSavedInLibrary: number;
  readonly examsUsed: number;        // enforcement: total across both types
  readonly examsLimit: number;       // -1 = unlimited
  readonly certificationsUsed: number; // display only
  readonly publicExamsUsed: number;    // display only
  readonly periodStartDate: string;
}
```

- [ ] **Step 4: Update the question/simulado view types**

Wherever the file defines `UnifiedQuestion`, `QuestionBank*`, simulado, mock-exam, or attempt view types that referenced the old models, repoint them to the `Exam*` names. Keep field names identical where possible so downstream code changes stay mechanical. For the simulado config type, rename `topicName`/`subjectName` fields to `sectionName`.

- [ ] **Step 5: Typecheck the types file in isolation**

Run: `npx tsc --noEmit 2>&1 | grep 'shared/types/index.ts' | head`
Expected: no errors originating inside `shared/types/index.ts` itself (errors in other files are fine at this stage).

- [ ] **Step 6: Commit**

```bash
git add shared/types/index.ts
git commit -m "feat: unify domain types into Exam discriminated union"
```

---

### Task 2.2: Rewrite constants (PLAN_LIMITS, URLs, initial states)

**Files:**
- Modify: `config/constants/index.ts`

- [ ] **Step 1: Replace `PLAN_LIMITS`**

Replace lines 181–187 with:

```ts
export const PLAN_LIMITS = {
  free:   { questionsPerPeriod: 250,      maxExams: 2 },
  pro:    { questionsPerPeriod: 1500,     maxExams: 5 },
  pro_ai: { questionsPerPeriod: 2500,     maxExams: 5 },
  tester: { questionsPerPeriod: Infinity, maxExams: Infinity },
  admin:  { questionsPerPeriod: Infinity, maxExams: Infinity },
} as const;
```

- [ ] **Step 2: Consolidate the domain URLs**

Replace the certification/public-exam URL constants (lines 8–15, 207–217, 235–240) with a single `exam/*` set. Add:

```ts
export const EXAMS_URL = '/exam/exams';
export const SAVE_EXAM_URL = '/exam/save-exam';
export const SAVE_EXAM_QUESTIONS_URL = '/exam/save-questions';
export const GET_EXAM_ANSWERS_URL = '/exam/get-answers';
export const EXAM_QUIZ_GENERATOR_URL = '/exam/quiz-generator';
export const EXAM_QUESTION_EXPLANATION_URL = '/exam/questions';
export const BROWSE_SUMMARY_URL = '/exam/browse-questions/summary';
export const BROWSE_QUESTIONS_URL = '/exam/browse-questions/questions';
export const PROVIDERS_URL = '/exam/providers';
export const EXAM_BOARDS_URL = '/exam/exam-boards';
export const EXTRACT_EDITAL_URL = '/exam/extract-from-edital';
export const MOCK_EXAMS_URL = '/mock-exams';
```

Delete the now-unused old URL constants (`GET_CERTIFICATION_ANSWERS_URL`, `SAVE_QUESTIONS_URL`, `SAVE_CERTIFICATION_URL`, `QUIZ_GENERATOR_URL`, `SAVE_PUBLIC_EXAM_QUESTIONS_URL`, `GET_PUBLIC_EXAM_ANSWERS_URL`, `SAVE_PUBLIC_EXAM_URL`, `PUBLIC_EXAMS_URL`, `BROWSE_PUBLIC_EXAM_SUMMARY_URL`, `BROWSE_PUBLIC_EXAM_QUESTIONS_URL`, `CERT_SIMULADOS_URL`, `CERT_QUESTION_EXPLANATION_URL`). Grep for each name across the repo and confirm no other file imports it before deleting (those importers are updated in later phases; note them).

- [ ] **Step 3: Replace the localStorage keys and initial states**

Replace `CERTIFICATIONS_LOCAL_STORAGE_KEY`, `PUBLIC_EXAMS_LOCAL_STORAGE_KEY`, `CERT_SIMULADOS_LOCAL_STORAGE_KEY` with:

```ts
export const EXAMS_LOCAL_STORAGE_KEY = 'EXAMS';
export const MOCK_EXAMS_LOCAL_STORAGE_KEY = 'MOCK_EXAMS';
```

Delete `INITIAL_CERTIFICATIONS_STATE` (lines 38–171), `INITIAL_PUBLIC_EXAMS_STATE` (219–225), `INITIAL_CERT_SIMULADOS_STATE` (242–245) and their imports at the top (lines 1–4). Add one initial state matching the new reducer (defined in Phase 5):

```ts
import { ExamsState } from '@/features/reducers/exams.reducer';
import { MockExamsState } from '@/features/reducers/mockExams.reducer';

export const INITIAL_EXAMS_STATE: ExamsState = {
  exams: [],
  selectedExam: null,
  selectedSections: [],
  selectedTopic: null,
  isLoading: true,
};

export const INITIAL_MOCK_EXAMS_STATE: MockExamsState = {
  mockExams: [],
  isLoading: true,
};
```

(These imports will error until Phase 5 creates the reducers — that's expected and resolved there.)

- [ ] **Step 4: Commit**

```bash
git add config/constants/index.ts
git commit -m "feat: unify PLAN_LIMITS quota and exam URLs/constants"
```

---

### Task 2.3: Rewrite connectors

**Files:**
- Modify: `features/connectors.ts`

- [ ] **Step 1: List the duplicated connector pairs**

Run: `grep -nE 'export (async )?function|export const' features/connectors.ts | grep -iE 'certification|publicExam|simulado|mockExam|examBoard'`
For each certification/public-exam pair, you will collapse into one function that takes `type: ExamType` (or operates on the already-typed `Exam`).

- [ ] **Step 2: Collapse each pair**

Example — replace `getCertifications()` and `getPublicExams()` with:

```ts
export async function getExams(): Promise<Exam[]> {
  const { data } = await api.get<Exam[]>(EXAMS_URL);
  return data;
}

export async function saveExam(exam: Exam): Promise<Exam> {
  const { data } = await api.post<Exam>(SAVE_EXAM_URL, exam);
  return data;
}
```

Apply the same collapse to: save-questions, get-answers, quiz-generator, explanation, browse-summary, browse-questions, and the simulado/mock-exam CRUD + attempt functions. Add `getProviders()` and `getExamBoards()` (both `GET` autocomplete lists). Update all imports to the new URL constants from Task 2.2.

- [ ] **Step 3: Typecheck connectors**

Run: `npx tsc --noEmit 2>&1 | grep 'features/connectors.ts' | head`
Expected: no errors inside `connectors.ts` (callers in components error until Phase 7).

- [ ] **Step 4: Commit**

```bash
git add features/connectors.ts
git commit -m "feat: collapse connectors to type-parameterized exam calls"
```

---

# Phase 3 — Services

### Task 3.1: Create `ExamService`

**Files:**
- Create: `features/services/exam.service.ts`
- Test: `tests/unit/api/services/exam.service.test.ts`
- Delete (Step 6): `features/services/certification.service.ts`, `features/services/public-exam.service.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/api/services/exam.service.test.ts`:

```ts
import { prismaMock } from '../__mocks__/prisma';
import { ExamService } from '@/features/services/exam.service';

describe('ExamService', () => {
  it('creates a certification exam with flat sections', async () => {
    prismaMock.exam.create.mockResolvedValue({ id: 'e1' } as any);
    const service = new ExamService(prismaMock as any);
    await service.saveExam('user1', {
      type: 'certification',
      name: 'AWS CCP',
      totalQuestions: 65,
      sections: [{ name: 'Cloud Concepts', minQuestions: 20, maxQuestions: 30 }],
    } as any);
    expect(prismaMock.exam.create).toHaveBeenCalled();
    const arg = prismaMock.exam.create.mock.calls[0][0];
    expect(arg.data.type).toBe('certification');
  });

  it('propagates updatedAt to parent Exam when renaming a section', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.examSection.update.mockResolvedValue({ id: 's1', examId: 'e1', name: 'New' } as any);
    prismaMock.examQuestion.updateMany.mockResolvedValue({ count: 3 } as any);
    prismaMock.exam.update.mockResolvedValue({ id: 'e1' } as any);
    const service = new ExamService(prismaMock as any);
    await service.updateSection('user1', 's1', { name: 'New' });
    expect(prismaMock.examQuestion.updateMany).toHaveBeenCalled();
    expect(prismaMock.exam.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'e1' } }),
    );
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- exam.service`
Expected: FAIL — `Cannot find module '@/features/services/exam.service'`.

- [ ] **Step 3: Implement `ExamService`**

Create `features/services/exam.service.ts`. Port the CRUD + ownership guards from the deleted `certification.service.ts` and `public-exam.service.ts`, unifying them: one `getExams(userId)`, `getExam(userId, id)`, `saveExam(userId, exam)`, `deleteExam(userId, id)`, `addSection`/`updateSection`/`deleteSection`, `addTopic`/`updateTopic`/`deleteTopic`. On section/topic rename, rewrite the denormalized snapshot strings on `ExamQuestion` via `updateMany` (port the `updateMany` logic that `public-exam.service` used for subjects/topics — now applied uniformly), and bump the parent `Exam.updatedAt`. Constructor takes an injected prisma client defaulting to the singleton:

```ts
import type { PrismaClient } from '@prisma/client';
import { prisma as prismaSingleton } from '@/lib/prisma';
import type { Exam } from '@/shared/types';

export class ExamService {
  constructor(private readonly prisma: PrismaClient = prismaSingleton) {}
  // ...methods
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- exam.service`
Expected: PASS (2 tests).

- [ ] **Step 5: Delete the old services**

Run: `git rm features/services/certification.service.ts features/services/public-exam.service.ts`
(Their tests are deleted in Phase 9. If `npm test` breaks on the old test files now, that's fine — Phase 9 fixes them. To keep the suite green between phases, you may instead delete `certification.service.test.ts` and `public-exam.service.test.ts` here and note it.)

- [ ] **Step 6: Commit**

```bash
git add features/services/exam.service.ts tests/unit/api/services/exam.service.test.ts
git commit -m "feat: add unified ExamService"
```

---

### Task 3.2: Create `ExamQuestionService`

**Files:**
- Create: `features/services/exam-question.service.ts`
- Test: `tests/unit/api/services/exam-question.service.test.ts`
- Delete: `features/services/question.service.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { prismaMock } from '../__mocks__/prisma';
import { ExamQuestionService } from '@/features/services/exam-question.service';

describe('ExamQuestionService', () => {
  it('saveAnswers upserts an ExamAnswer with explanations', async () => {
    prismaMock.$transaction.mockImplementation(async (fn: any) => fn(prismaMock));
    prismaMock.examAnswer.upsert.mockResolvedValue({ id: 1 } as any);
    const service = new ExamQuestionService(prismaMock as any);
    await service.saveAnswers(1, { correctOptions: ['A'], explanations: [{ label: 'A', text: 'ok' }] } as any);
    expect(prismaMock.examAnswer.upsert).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- exam-question.service`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `features/services/exam-question.service.ts` porting the byte-identical `saveAnswers`/`saveExplanations` and the save/browse-question logic from the two old question services into single methods keyed off `ExamQuestion`/`ExamAnswer`/`ExamExplanation`.

- [ ] **Step 4: Run tests**

Run: `npm test -- exam-question.service`
Expected: PASS.

- [ ] **Step 5: Delete old service + commit**

```bash
git rm features/services/question.service.ts
git add features/services/exam-question.service.ts tests/unit/api/services/exam-question.service.test.ts
git commit -m "feat: add unified ExamQuestionService"
```

---

### Task 3.3: Rewrite `QuotaService`

**Files:**
- Modify: `features/services/quota.service.ts`
- Test: `tests/unit/api/services/quota.service.test.ts` (rewritten in Phase 9; adjust minimally here to keep green)

- [ ] **Step 1: Replace the `create_certification`/`create_public_exam` branches**

In `check()`, delete the two `if (action === 'create_certification')` and `if (action === 'create_public_exam')` blocks (lines 62–98) and replace with one:

```ts
    if (action === 'create_exam') {
      const examCount = await prisma.exam.count({ where: { userId } });
      const limit = limits.maxExams;

      if (limit !== Infinity && examCount >= limit) {
        const err = Object.assign(new Error(`Exam limit reached (${limit})`), {
          status: 403,
          body: { error: 'quota_exceeded', message: `Exam limit reached (${limit})`, limit, used: examCount, plan },
        });
        throw err;
      }
    }
```

- [ ] **Step 2: Rewrite `getUsage()` for the dual shape**

Replace the counts block (lines 189–207) with:

```ts
    const [certCount, examConcursoCount, savedQuestions] = await Promise.all([
      prisma.exam.count({ where: { userId, type: 'certification' } }),
      prisma.exam.count({ where: { userId, type: 'public_exam' } }),
      prisma.examQuestion.count({ where: { userId } }),
    ]);
    const examsUsed = certCount + examConcursoCount;
    const questionsLimit = this.resolveQuestionsLimit(user);

    return {
      plan,
      questionsUsed: user.questionsGeneratedThisPeriod,
      questionsLimit: questionsLimit === Infinity ? -1 : questionsLimit,
      questionsSavedInLibrary: savedQuestions,
      examsUsed,
      examsLimit: limits.maxExams === Infinity ? -1 : limits.maxExams,
      certificationsUsed: certCount,
      publicExamsUsed: examConcursoCount,
      periodStartDate: user.periodStartDate.toISOString(),
    };
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep 'quota.service' | head`
Expected: no errors in `quota.service.ts`.

- [ ] **Step 4: Commit**

```bash
git add features/services/quota.service.ts
git commit -m "feat: enforce single maxExams quota, dual-count usage display"
```

---

### Task 3.4: Rewrite `MockExamService`, `generation-job`, `browse`, `question-bank`, `metrics`, `quiz-generator`

**Files:**
- Modify: `features/services/mock-exam.service.ts`, `features/services/generation-job.service.ts`, `features/services/browse.service.ts`, `features/services/question-bank.service.ts`, `features/services/metrics.service.ts`, `features/services/quiz-generator.service.ts`

- [ ] **Step 1: `mock-exam.service.ts` — unify the two simulado families**

Repoint all Prisma calls to `mockExam`, `mockExamSectionConfig` (was `mockExamSubjectConfig` + `certificationSimuladoTopicConfig`), `mockExamQuestion` (FK `examQuestionId`), `mockExamAttempt`, `mockExamAttemptAnswer`. Replace the string/label and fuzzy `looseKey` joins with a direct FK join through `Exam` → `ExamQuestion`. The scoring loop (`selected.length === correctOptions.length && every-includes`) is unchanged. Delete any `certKey`/`looseKey` helpers.

- [ ] **Step 2: `generation-job.service.ts` — repoint refKey to Exam.id**

Change every `prisma.certification.*` / `prisma.publicExam.*` / `prisma.question.*` / `prisma.publicExamQuestion.*` call to the `exam*` equivalents. Keep the existing `type` discriminator and prompt-dispatch (Phase 6 formalizes the dispatch table). `refKey` now holds `Exam.id`.

- [ ] **Step 3: `browse.service.ts` — single read path**

If `BaseBrowseService` already abstracts `deleteQuestion`, extend it so summary + questions reads target `ExamQuestion` filtered by `exam.type` when a `type` is passed. Remove the cert/public-exam subclasses if they existed.

- [ ] **Step 4: `question-bank.service.ts`, `metrics.service.ts`, `quiz-generator.service.ts`**

Repoint model names to `exam*`. In `quiz-generator.service.ts`, the only place that converts percent→fraction (`Math.floor((section.minQuestions / 100) * total)`) stays — just rename the field access from `topic`/`subject` to `section`.

- [ ] **Step 5: Typecheck all services**

Run: `npx tsc --noEmit 2>&1 | grep 'features/services/' | head -40`
Expected: no errors in `features/services/*` (route/component callers still error).

- [ ] **Step 6: Run the full unit suite (service tests may still reference old names — that's Phase 9)**

Run: `npm test -- services 2>&1 | tail -20`
Expected: the new `exam.service` and `exam-question.service` tests pass; `mock-exam`, `generation-job`, `quota`, `metrics`, `quiz-generator` tests may fail on renamed mocks — note which, they're fixed in Phase 9.

- [ ] **Step 7: Commit**

```bash
git add features/services/mock-exam.service.ts features/services/generation-job.service.ts features/services/browse.service.ts features/services/question-bank.service.ts features/services/metrics.service.ts features/services/quiz-generator.service.ts
git commit -m "feat: repoint remaining services to unified Exam models"
```

---

# Phase 4 — API routes

### Task 4.1: Create the `exam/*` route tree

**Files:**
- Create: `app/api/exam/exams/route.ts`, `app/api/exam/save-exam/route.ts`, `app/api/exam/save-questions/route.ts`, `app/api/exam/get-answers/route.ts`, `app/api/exam/quiz-generator/route.ts`, `app/api/exam/questions/[questionId]/explanation/route.ts`, `app/api/exam/browse-questions/summary/route.ts`, `app/api/exam/browse-questions/questions/route.ts`, `app/api/exam/providers/route.ts`, `app/api/exam/exam-boards/route.ts`, `app/api/exam/extract-from-edital/route.ts`
- Delete: the entire `app/api/certification/` and `app/api/public-exam/` trees

- [ ] **Step 1: Port each route as a thin handler**

Each route follows the established pattern: `auth()` → validate → call service → `NextResponse.json()`, catch → `toApiErrorResponse(err)`. The entity `type` comes from the request body/query (`type: ExamType`). Example — `app/api/exam/save-exam/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ExamService } from '@/features/services/exam.service';
import { QuotaService } from '@/features/services/quota.service';
import { toApiErrorResponse } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    const body = await req.json();
    const isNew = !body.id;
    if (isNew) await new QuotaService().check(session.user.id, 'create_exam', 1);
    const exam = await new ExamService().saveExam(session.user.id, body);
    return NextResponse.json(exam);
  } catch (err) {
    const { status, ...rest } = toApiErrorResponse(err);
    return NextResponse.json(rest, { status });
  }
}
```

Port the remaining routes from their `certification/*` and `public-exam/*` originals, using the unified services. `providers/route.ts` returns `prisma.provider.findMany`; `exam-boards/route.ts` returns `prisma.examBoard.findMany`; `extract-from-edital` keeps calling `EditalExtractorService` (public-exam-only feature, but now lives under `exam/`).

- [ ] **Step 2: Delete the old route trees**

Run: `git rm -r app/api/certification app/api/public-exam`

- [ ] **Step 3: Verify no route imports removed symbols**

Run: `grep -rnE "certification\.|publicExam\.|CertificationService|PublicExamService|QuestionService" app/api | grep -v generation-job`
Expected: no matches.

- [ ] **Step 4: Commit**

```bash
git add app/api/exam
git commit -m "feat: add unified exam/* API routes, remove split routes"
```

---

### Task 4.2: Unify the simulado routes into `mock-exams/*`

**Files:**
- Modify: `app/api/mock-exams/route.ts`, `app/api/mock-exams/[id]/route.ts`, `app/api/mock-exams/[id]/answers/route.ts`, `app/api/mock-exams/[id]/attempts/route.ts`, `app/api/mock-exams/[id]/attempts/[attemptId]/route.ts`
- Delete: the entire `app/api/certification-simulados/` tree

- [ ] **Step 1: Point the `mock-exams/*` routes at the unified `MockExamService`**

The mock-exams routes already exist for public exams. Update them to call the unified `MockExamService` (Task 3.4) and accept an `examId` (the `Exam.id`) instead of `publicExamId`. The certification-simulados routes become redundant.

- [ ] **Step 2: Delete the certification-simulados tree**

Run: `git rm -r app/api/certification-simulados`

- [ ] **Step 3: Verify**

Run: `grep -rn "certificationSimulado\|CertSimulado\|certification-simulados" app | grep -v docs`
Expected: no matches (component/provider references are fixed in Phases 5 & 7 — if any show up there, note them).

- [ ] **Step 4: Commit**

```bash
git add app/api/mock-exams
git commit -m "feat: unify simulado routes into mock-exams/*"
```

---

# Phase 5 — Providers & reducers

### Task 5.1: Create the unified `exams` reducer + provider

**Files:**
- Create: `features/reducers/exams.reducer.ts`, `features/providers/exams.provider.tsx`
- Modify: `features/reducers/mockExams.reducer.ts`, `features/providers/mockExams.provider.tsx`
- Delete: `certifications.reducer.ts`, `publicExams.reducer.ts`, `certSimulados.reducer.ts`, `root.reducer.ts`, `certifications.provider.tsx`, `publicExams.provider.tsx`, `certSimulados.provider.tsx`

- [ ] **Step 1: Write `exams.reducer.ts`**

Merge the certifications + publicExams reducers. State shape:

```ts
import type { Exam, ExamSection, ExamTopic } from '@/shared/types';

export interface ExamsState {
  exams: Exam[];
  selectedExam: Exam | null;
  selectedSections: ExamSection[];
  selectedTopic: ExamTopic | null;
  isLoading: boolean;
}

export type ExamsAction =
  | { type: 'setExams'; payload: Exam[] }
  | { type: 'selectExam'; payload: Exam | null }
  | { type: 'setSelectedSections'; payload: ExamSection[] }
  | { type: 'selectTopic'; payload: ExamTopic | null }
  | { type: 'setLoading'; payload: boolean };

export function examsReducer(state: ExamsState, action: ExamsAction): ExamsState {
  switch (action.type) {
    case 'setExams': return { ...state, exams: action.payload };
    case 'selectExam': return { ...state, selectedExam: action.payload };
    case 'setSelectedSections': return { ...state, selectedSections: action.payload };
    case 'selectTopic': return { ...state, selectedTopic: action.payload };
    case 'setLoading': return { ...state, isLoading: action.payload };
    default: return state;
  }
}
```

- [ ] **Step 2: Write `exams.provider.tsx`**

Port `certifications.provider.tsx`, swapping the fetch to `getExams()` and the storage key to `EXAMS_LOCAL_STORAGE_KEY`. Expose `exams`, `certifications` (derived `exams.filter(e => e.type === 'certification')`), `publicExams` (derived filter), plus the dispatch helpers. This lets existing consumers migrate incrementally.

- [ ] **Step 3: Rewrite `mockExams.provider.tsx` + reducer**

Repoint to the unified `MockExamService` connectors and `examId`.

- [ ] **Step 4: Delete the orphans**

Run: `git rm features/reducers/certifications.reducer.ts features/reducers/publicExams.reducer.ts features/reducers/certSimulados.reducer.ts features/reducers/root.reducer.ts features/providers/certifications.provider.tsx features/providers/publicExams.provider.tsx features/providers/certSimulados.provider.tsx`

- [ ] **Step 5: Update provider composition in `app/layout.tsx` (or `app/providers.tsx`)**

Run: `grep -rln "CertificationsProvider\|PublicExamsProvider\|CertSimuladosProvider" app`
Replace those with `<ExamsProvider>` in the composition. Update any `useCertifications`/`usePublicExams` hook imports to the new `useExams` hook (add hook aliases in the provider file if the churn is large).

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -E 'providers/|reducers/' | head`
Expected: no errors in providers/reducers (component consumers fixed in Phase 7).

- [ ] **Step 7: Commit**

```bash
git add features/providers features/reducers app
git commit -m "feat: unify exams provider/reducer, drop split stores"
```

---

# Phase 6 — Prompt dispatch

### Task 6.1: Add a `type`-keyed prompt dispatch table

**Files:**
- Modify: `config/prompts/index.ts`
- Modify: `features/services/generation-job.service.ts` (consume the table)

- [ ] **Step 1: Add the dispatch table to `config/prompts/index.ts`**

Keep both prompt families. Add:

```ts
import type { ExamType } from '@/shared/types';
import { certificationQuestionsResearchPrompt } from './certification-questions-research.prompt';
import { certificationQuestionsReviewPrompt } from './certification-questions-review.prompt';
import { certificationQuestionsFormatPrompt } from './certification-questions-format.prompt';
import { certificationAnswersPrompt } from './certification-answers.prompt';
import { certificationExplanationsPrompt } from './certification-explanations.prompt';
import { publicExamQuestionsResearchPrompt } from './public-exam-questions-research.prompt';
import { publicExamQuestionsReviewPrompt } from './public-exam-questions-review.prompt';
import { publicExamQuestionsFormatPrompt } from './public-exam-questions-format.prompt';
import { publicExamAnswersPrompt } from './public-exam-answers.prompt';
import { publicExamExplanationsPrompt } from './public-exam-explanations.prompt';

export const EXAM_PROMPTS: Record<ExamType, {
  research: typeof certificationQuestionsResearchPrompt;
  review: typeof certificationQuestionsReviewPrompt;
  format: typeof certificationQuestionsFormatPrompt;
  answers: typeof certificationAnswersPrompt;
  explanations: typeof certificationExplanationsPrompt;
}> = {
  certification: {
    research: certificationQuestionsResearchPrompt,
    review: certificationQuestionsReviewPrompt,
    format: certificationQuestionsFormatPrompt,
    answers: certificationAnswersPrompt,
    explanations: certificationExplanationsPrompt,
  },
  public_exam: {
    research: publicExamQuestionsResearchPrompt,
    review: publicExamQuestionsReviewPrompt,
    format: publicExamQuestionsFormatPrompt,
    answers: publicExamAnswersPrompt,
    explanations: publicExamExplanationsPrompt,
  },
};
```

(If the prompt input shapes differ enough that a single `Record` type won't hold both, type the values as `PromptDefinition<any>` — the dispatch site passes the right input per type.)

- [ ] **Step 2: Consume it in `generation-job.service.ts`**

Where the service currently branches `if (type === 'certification') use certPrompt else use publicExamPrompt`, replace with `const prompts = EXAM_PROMPTS[type];` then `prompts.research`, `prompts.format`, etc. Pass `provider.name` (cert) or `examBoard.name` (concurso) into the prompt input.

- [ ] **Step 3: Typecheck + test**

Run: `npx tsc --noEmit 2>&1 | grep -E 'prompts|generation-job' | head` then `npm test -- generation-job`
Expected: no type errors; generation-job test passes (after Phase 9 rewrite it references exam models).

- [ ] **Step 4: Commit**

```bash
git add config/prompts/index.ts features/services/generation-job.service.ts
git commit -m "feat: dispatch prompts by exam type"
```

---

# Phase 7 — Components

> The workspace pages currently live under `app/(workspace)/`. Run this first to map them:
> `grep -rln "certification\|publicExam\|Simulado\|MockExam" "app/(workspace)" shared/components | sort -u`
> Work through the list; the tasks below cover the structural merges. Purely mechanical renames (import path, hook name, `t()` key) are done alongside.

### Task 7.1: Unify the sections table (flat + expandable topics)

**Files:**
- Identify + modify the two current tables (from spec: `SectionsTable` / `PublicExamSubjectsTable`). Run `grep -rln "SectionsTable\|SubjectsTable\|SectionsTable" "app/(workspace)" shared/components` to locate them.

- [ ] **Step 1: Locate and read both table components**

Run the grep above; read both files fully.

- [ ] **Step 2: Merge into one `ExamSectionsTable`**

Create/rename to a single component that renders `ExamSection` rows with `min/maxQuestions` sliders/inputs (integers 0–100), and — when a section has `topics?.length` — an expandable sub-row listing `ExamTopic`s. When `topics` is empty/undefined it renders flat (the old certification behavior). Use HeroUI Table with `data-testid` matching the `TID` catalog (Phase 9 updates the catalog). Named export, `readonly` props.

- [ ] **Step 3: Point both wizards at it; delete the redundant table**

- [ ] **Step 4: Typecheck the touched files**

Run: `npx tsc --noEmit 2>&1 | grep -i 'SectionsTable\|SubjectsTable' | head`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add "app/(workspace)" shared/components
git commit -m "feat: unify exam sections table with optional topic rows"
```

---

### Task 7.2: Unify the wizard steps and provider/board Step 1

**Files:**
- Modify: `Step2DefineTopics` + `Step2DefineSubjects` → `Step2DefineSections`; the `Step1` component. Locate with `grep -rln "Step1\|Step2Define" "app/(workspace)"`.

- [ ] **Step 1: Merge `Step2DefineTopics` and `Step2DefineSubjects`**

One `Step2DefineSections` component operating on `ExamSection[]`, rendering the `ExamSectionsTable` from Task 7.1.

- [ ] **Step 2: Make `Step1` label the reference field by type**

Show one Autocomplete. When `type === 'certification'` label it "Provider" and source options from `getProviders()`; when `type === 'public_exam'` label it "Banca" and source from `getExamBoards()`. Bind to `providerId`/`examBoardId` respectively. Use `useTranslation` keys `exam.providerLabel` / `exam.examBoardLabel` (add in Phase 8).

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep -i 'Step1\|Step2' | head`

```bash
git add "app/(workspace)"
git commit -m "feat: unify wizard steps and type-aware reference field"
```

---

### Task 7.3: Collapse the two AI-chat draft cards

**Files:**
- Modify: `shared/components/ai-chat/AiChatCertificationDraftCard.tsx`, `shared/components/ai-chat/AiChatExamDraftCard.tsx` → keep one; the shared `DraftReviewModal`/`DraftModalShell`/`DraftExamMetricsFields` chain already exists.

- [ ] **Step 1: Read all four files**

Run: `for f in AiChatCertificationDraftCard AiChatExamDraftCard DraftReviewModal DraftModalShell; do echo "== $f =="; cat "shared/components/ai-chat/$f.tsx"; done | head -400`

- [ ] **Step 2: Make `AiChatExamDraftCard` handle both types**

Drive the difference off `draft.type` (`ExamType`): the metrics fields and section/topic rendering already go through the shared chain. Delete `AiChatCertificationDraftCard.tsx` and update its importer(s).

- [ ] **Step 3: Typecheck + commit**

Run: `npx tsc --noEmit 2>&1 | grep -i 'DraftCard' | head`

```bash
git add shared/components/ai-chat
git commit -m "feat: collapse AI chat draft cards into one type-aware card"
```

---

### Task 7.4: Sweep remaining component references

- [ ] **Step 1: Find stragglers**

Run: `npx tsc --noEmit 2>&1 | grep -E "app/\(workspace\)|shared/components" | head -60`

- [ ] **Step 2: Fix each** — repoint imports to `useExams`/`getExams`/`Exam*` types, rename `topic`/`subject` field access to `section`, update `t()` keys. These are mechanical.

- [ ] **Step 3: Full typecheck must be clean**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: **zero errors** across the whole repo.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "fix: repoint remaining component references to unified exam"
```

---

# Phase 8 — Quota UI, i18n, admin

### Task 8.1: Sidebar/header counters + i18n

**Files:**
- Modify: `shared/components/ui/sidebar.tsx`, `shared/components/ui/workspace-header.tsx` (locate `UsageBadge` too), and any component reading `usage.certificationsLimit`/`publicExamsLimit`
- Modify: `public/messages/en.properties`, `public/messages/pt.properties`

- [ ] **Step 1: Update sidebar/header to the dual `UsageStats` shape**

The feature-gate that hid concursos for free users (`usage.publicExamsLimit === 0`) is removed — free can now create both types. Keep the split **display**: show `certificationsUsed` and `publicExamsUsed` separately, and the shared `examsUsed / examsLimit` for the limit. Update all reads of removed fields (`certificationsLimit`, `publicExamsLimit`).

- [ ] **Step 2: Add i18n keys**

Add to `en.properties` and `pt.properties` (pt uses `\uXXXX` for accents): `exam.providerLabel`, `exam.examBoardLabel`, `exam.examsUsed`, and any renamed keys the components now reference. Grep the components for `t('...')` calls introduced in Phase 7 and ensure every key exists in both files.

- [ ] **Step 3: Typecheck + commit**

```bash
git add shared/components public/messages
git commit -m "feat: dual exam counters in sidebar/header, remove free-tier concurso gate"
```

---

### Task 8.2: Admin overview/analytics per-type counts

**Files:**
- Modify: `app/api/admin/admin.service.ts`, `app/admin/overview/page.tsx`, `app/admin/analytics/page.tsx`

- [ ] **Step 1: Repoint admin counts**

In `AdminService.getOverview`, replace `certification.count` + `publicExam.count` with `exam.count({ where: { type } })` for each type, so the dashboard still shows certifications vs concursos separately. Repoint any `question`/`publicExamQuestion` counts to `examQuestion`.

- [ ] **Step 2: Typecheck + test**

Run: `npx tsc --noEmit 2>&1 | grep admin | head` then `npm test -- admin 2>&1 | tail`
Expected: clean; admin tests (if any) pass.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin app/admin
git commit -m "feat: admin dashboard counts exams per type"
```

---

# Phase 9 — Tests

### Task 9.1: Rewrite/rename service unit tests

**Files:**
- Delete: `tests/unit/api/services/certification.service.test.ts`, `tests/unit/api/services/public-exam.service.test.ts` (if not already removed in Phase 3)
- Modify: `tests/unit/api/services/mock-exam.service.test.ts`, `certification-simulados.service.test.ts` (merge into mock-exam), `quota.service.test.ts`, `generation-job.service.test.ts`, `metrics.service.test.ts`, `quiz-generator.service.test.ts`, `question.service.test.ts` → `exam-question.service.test.ts`
- Also: `tests/unit/api/migration-completeness.test.ts`, `tests/unit/api/schema-drift.test.ts` (these likely assert on model names — update to the unified set)

- [ ] **Step 1: Update `quota.service.test.ts`**

Replace `create_certification`/`create_public_exam` cases with `create_exam` (mock `prismaMock.exam.count`), and update the `getUsage` assertions to the dual shape (`examsUsed`, `examsLimit`, `certificationsUsed`, `publicExamsUsed`).

- [ ] **Step 2: Merge simulado tests**

Fold `certification-simulados.service.test.ts` into `mock-exam.service.test.ts` (one unified service now). Delete the cert one.

- [ ] **Step 3: Update mock names in the remaining tests**

Replace `prismaMock.certification` / `prismaMock.publicExam` / `prismaMock.question` / `prismaMock.publicExamQuestion` with `prismaMock.exam` / `prismaMock.examQuestion` etc.

- [ ] **Step 4: Update `schema-drift.test.ts` / `migration-completeness.test.ts`**

Run: `cat tests/unit/api/schema-drift.test.ts tests/unit/api/migration-completeness.test.ts`
Update the expected model/table lists to the 14 unified tables. If these tests hardcode the two schema files being identical, keep that assertion.

- [ ] **Step 5: Run the full unit suite**

Run: `npm test`
Expected: **all green, 0 failures**. If a test file references a deleted service, delete or rewrite it.

- [ ] **Step 6: Commit**

```bash
git add tests/unit
git commit -m "test: update unit tests for unified Exam services"
```

---

### Task 9.2: Update the E2E suite

**Files:**
- Modify: `tests/e2e/support/journey-config.ts` (the `DOMAINS` map), `tests/e2e/support/constants.ts`, `tests/e2e/support/selectors.ts` (TID catalog), `tests/e2e/support/db-cleanup.ts`, `tests/e2e/global-setup.ts`, `tests/e2e/global-teardown.ts`, and the seed helpers in `tests/e2e/fixtures/`

- [ ] **Step 1: Update `db-cleanup.ts` to the new FK-safe delete order**

Replace the `deleteMany` sequence with the unified tables in FK-safe order: `mockExamAttemptAnswer` → `mockExamAttempt` → `mockExamQuestion` → `mockExamSectionConfig` → `mockExam` → `examExplanation` → `examAnswer` → `examOption` → `examQuestion` → `examTopic` → `examSection` → `exam` → (`provider`/`examBoard` if per-user; otherwise leave global) → generationJob rows → usageLog.

- [ ] **Step 2: Update `journey-config.ts` DOMAINS**

Keep the two-vertical iteration (`certification`, `public_exam`) — the E2E still exercises both types — but repoint the seed helpers and selectors to the unified routes/testids. The `DOMAINS` map now differs only in `type`, reference-field label, and whether sections have topics.

- [ ] **Step 3: Update `selectors.ts` TID catalog**

Rename split testids (e.g. `certifications-*` / `public-exam-*`) to `exam-*` matching the unified components' `data-testid` from Phase 7. Ensure each `TID` value has a matching attribute in a component.

- [ ] **Step 4: Update global setup/teardown seeding**

The setup seeds a cert + a concurso via Prisma — rewrite to create `Exam` rows (like the dev seed in Task 1.3) using `cleanupUserData` from `db-cleanup.ts`.

- [ ] **Step 5: Run E2E**

Run: `DATABASE_URL="file:$(pwd)/prisma/dev.db" npx playwright test`
Expected: all specs green. If the Radio/submit dispatch note (CLAUDE.md) applies, it is unchanged.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e
git commit -m "test: update E2E suite for unified Exam schema"
```

---

# Phase 10 — Docs

### Task 10.1: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update every section describing the split world**

Sections to revise: **Project Structure** (services list), **Prompt management** (table + dispatch note), **Plans and Quotas** (`PLAN_LIMITS` table → single `maxExams`; `QuotaAction` → `create_exam`; `UsageStats` dual shape), **Feature Gating** (remove the "Concursos hidden for free" row, since free can now create both), **Database → Topic/subject percentage unit** (now `ExamSection.minQuestions/maxQuestions`), **Prova Completa** (model names → `Exam`), **Testes Unitários** coverage table (renamed service tests), **Testes E2E** (unified DOMAINS). Remove references to `certKey`, `PublicExamSubject`, `CertificationSimulado`, `MockExamSubjectConfig`, the `backfill-public-exam-question-subjects.ts` script (obsolete — the FK is now native).

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for unified Exam schema"
```

---

### Task 10.2: Final verification

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Full unit suite**

Run: `npm test`
Expected: all green.

- [ ] **Step 3: Lint**

Run: `npm run lint 2>&1 | tail -20`
Expected: no new errors.

- [ ] **Step 4: E2E**

Run: `DATABASE_URL="file:$(pwd)/prisma/dev.db" npm run e2e`
Expected: all green.

- [ ] **Step 5: Boot the app and smoke-test one flow of each type**

Run: `npm run dev` — create a certification and a concurso through the wizard, generate questions, run a simulado. Confirm the reference field label switches (Provider vs Banca) and free-tier can create both.

- [ ] **Step 6: Prod schema parity check**

Run: `diff <(grep -A200 'model Provider' prisma/dev/schema.prisma) <(grep -A200 'model Provider' prisma/prod/schema.prisma)`
Expected: no differences in the model block. Then generate the **prod** migration when deploying (separate from this plan's dev migration): `npx prisma migrate dev --name unify_exam_schema --schema=prisma/prod/schema.prisma` in the prod migration workflow.

---

## Open items to confirm with the product owner before deploy

- The prod DB will be dropped and recreated (no data preserved) — confirm this is acceptable in the prod environment at deploy time.
- Free tier gaining concurso access is a pricing/positioning change — confirm marketing copy and any plan comparison tables are updated separately.
