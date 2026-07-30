# Unificação de Certification e PublicExam num schema único (`Exam`)

**Data:** 2026-07-29
**Estratégia:** Opção A — tabela `Exam` polimórfica com discriminador `type`
**Aprovação de schema:** concedida pelo usuário (CLAUDE.md exige aprovação explícita para mudanças de schema)

---

## 1. Contexto e motivação

O codebase mantém duas famílias de entidades quase idênticas — `Certification*` e `PublicExam*` — espelhadas em ~23 tabelas (11 cert / 12 concurso), ~20 pares de tipos, ~23 connectors, 12 serviços, ~15 pares de rotas, 4+4 providers/reducers, e dezenas de componentes. Um estudo de blast-radius (5 exploradores paralelos + síntese) confirmou que a divergência real entre as duas famílias é pequena e que a duplicação já está convergindo espontaneamente (`UnifiedQuestion`, `QuestionBank*`, `GenerationJob` já são polimórficos).

O usuário refinou o design de forma que elimina as divergências estruturais que antes tornavam a unificação de schema custosa:

1. **Certificações também podem ter `ExamTopic`** (nível-folha), igual aos concursos → a hierarquia passa a ser **idêntica** para os dois tipos.
2. **Provider (cert) e Banca (concurso)** são conceitualmente o mesmo papel → diferenciados apenas pelo label na UI.

Combinado com a ausência de dados reais em produção (migração pode ser `DROP + CREATE` limpo), a Opção A deixa de ter os dois maiores riscos (re-sequência de Int-PK e retrofit de FK).

---

## 2. Decisões travadas

| Decisão | Escolha |
|---|---|
| Estratégia | Tabela `Exam` única polimórfica, discriminador `type: "certification" \| "public_exam"` |
| Migração | `DROP + CREATE` limpo — sem dados reais a preservar; sem re-sequência de Int-PK; sem retrofit de FK |
| Prefixo dos models | `Exam*` (exceção: família de simulado usa `MockExam*`) |
| Hierarquia | `Exam → ExamSection` (carrega `min/maxQuestions`) `→ ExamTopic?` (folha opcional, válida para ambos os tipos) |
| Provider/Banca | Duas tabelas ricas — `Provider` e `ExamBoard` — referenciadas por duas FKs nulláveis (`providerId`, `examBoardId`) |
| Simulados | Unificados numa família só, nomeada `MockExam*`, join por FK (sem fallback fuzzy) |
| Cota (enforcement) | Contador único `maxExams`: free 2 / pro 5 / pro_ai 5 (free passa a poder criar concurso) |
| Contadores (exibição) | Sidebar/header/admin continuam mostrando separado por tipo (X certificações · Y concursos) |
| AI chat | Gating inalterado (`pro_ai`, `tester`, `admin`) |
| Prompts | Duas famílias permanecem (divergência estrutural: estilo por banca, PT-BR); unifica apenas o dispatch por `type` |

---

## 3. Schema unificado (Prisma)

Aplica-se a **ambos** os schemas: `prisma/dev/schema.prisma` (SQLite) e `prisma/prod/schema.prisma` (LibSQL/Turso).

```prisma
model Provider {                          // AWS, Azure, SAP... (certificações)
  id       String @id @default(cuid())
  name     String @unique
  fullName String?
  logoUrl  String?
  exams    Exam[]
}

model ExamBoard {                         // FGV, Cebraspe, FCC... (concursos)
  id       String @id @default(cuid())
  name     String @unique
  fullName String?
  exams    Exam[]
}

model Exam {
  id                  String         @id @default(cuid())
  type                String         // "certification" | "public_exam"
  name                String         // era Certification.label / PublicExam.name
  role                String?        // cargo (concurso); null em cert
  year                Int?
  totalQuestions      Int
  examDurationMinutes Int?
  passingScore        Float?
  providerId          String?        // FK → Provider (cert)
  examBoardId         String?        // FK → ExamBoard (concurso)
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

model ExamSection {                        // era CertificationTopic + PublicExamSubject
  id           String         @id @default(cuid())
  name         String
  minQuestions Int            // 0–100 (%), unidade canônica inalterada
  maxQuestions Int
  examId       String
  exam         Exam           @relation(fields: [examId], references: [id], onDelete: Cascade)
  topics       ExamTopic[]
  questions    ExamQuestion[]

  @@unique([examId, name])
}

model ExamTopic {                          // folha opcional — válida para os dois tipos
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
  examName     String       // snapshots denormalizados (histórico)
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

model MockExam {                           // unifica CertificationSimulado + MockExam
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

model MockExamSectionConfig {             // era MockExamSubjectConfig + CertificationSimuladoTopicConfig
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

**`GenerationJob` / `GenerationJobTopic`:** permanecem como estão (já polimórficos). `refKey` passa a referenciar `Exam.id`; `type` e `examBoardName` continuam válidos.

**Resultado:** ~23 tabelas → **14** (Provider, ExamBoard, Exam, ExamSection, ExamTopic, ExamQuestion, ExamOption, ExamAnswer, ExamExplanation, MockExam, MockExamSectionConfig, MockExamQuestion, MockExamAttempt, MockExamAttemptAnswer), fora User/Account/Session/UsageLog/GenerationJob/AdminAuditLog.

**Notas de design:**
- `certKey` é removido — servia apenas ao join por string, que agora é por FK.
- Identidade via `@@unique([userId, type, name, year])`.
- `role` é coluna nullable no `Exam` (atributo do exam, não da banca).
- `ExamSection.minQuestions/maxQuestions` seguem inteiros 0–100 (unidade canônica inalterada; a única conversão para fração continua em `QuizGeneratorService.distributeQuestions`).

---

## 4. Camada de aplicação

### 4.1 Tipos (`shared/types/index.ts`)

O espelho colapsa em uniões discriminadas:

```ts
type ExamType = 'certification' | 'public_exam';

interface Exam {
  id: string;
  type: ExamType;
  name: string;
  role?: string | null;
  year?: number | null;
  totalQuestions: number;
  examDurationMinutes?: number | null;
  passingScore?: number | null;
  provider?: Provider | null;      // cert
  examBoard?: ExamBoard | null;    // concurso
  sections: ExamSection[];
}
interface ExamSection { id: string; name: string; minQuestions: number; maxQuestions: number; topics?: ExamTopic[] }
interface ExamTopic   { id: string; name: string }
```

`UnifiedQuestion` e `QuestionBank*` passam de adaptador a tipos primários.

### 4.2 Serviços

| Novo | Substitui | Notas |
|---|---|---|
| `ExamService` | `CertificationService` + `PublicExamService` | CRUD de Exam/Section/Topic; rename reescreve snapshots (`updateMany`) uniformemente para os dois tipos |
| `ExamQuestionService` | pares cert/publicExam de question/browse/answers | `saveAnswers`/`saveExplanations` (byte-idênticos hoje) viram um método só |
| `MockExamService` | `CertificationSimuladoService` + `MockExamService` | join por FK, sem fallback fuzzy nem match por label |
| `quota.service` | idem | ação `create_exam`; conta `WHERE userId AND type IN (...)` contra `maxExams` |
| `generation-job.service` | idem | re-aponta `refKey` → `Exam.id`; mantém dispatch de prompt por `type` |

### 4.3 Rotas

Pares espelhados colapsam por `type` (seguindo o precedente polimórfico do `generation-job`):
- `save-certification` + `save-public-exam` → `save-exam`
- `question-generator`, `browse-questions/*`, simulados → conjunto parametrizado por `type`
- Rotas de listagem/autocomplete de `Provider` e de `ExamBoard` permanecem (uma por tabela)

### 4.4 Providers / reducers

`ExamsProvider` único (substitui os 4 providers e 4 reducers), segregando por `type` em memória. Simplifica AI chat e sidebar. Remover o `root.reducer.ts` órfão.

### 4.5 Componentes

A hierarquia idêntica (Section + Topic opcional) permite unificar a UI:
- `SectionsTable` / `PublicExamSubjectsTable` → um componente com Section e Topics expansíveis opcionais
- Wizard: `Step2DefineTopics` + `Step2DefineSubjects` → `Step2DefineSections`; `Step1` mostra autocomplete de Provider **ou** ExamBoard conforme `type` (só muda o label)
- `AiChatCertificationDraftCard` + `AiChatExamDraftCard` → `AiChatExamDraftCard` único (já convergindo via `DraftReviewModal`/`DraftModalShell`/`DraftExamMetricsFields`)

---

## 5. Prompts

Unificação **parcial e intencional**. As duas famílias (`certification-*`, `public-exam-*`) têm divergência estrutural (estilo por banca — Cebraspe/FGV/FCC/Vunesp/IBFC —, framing PT-BR) e **permanecem separadas**. O que unifica é o **dispatch**: uma tabela `{ [type]: { research, review, format } }` keyed por `Exam.type`, que o `generation-job.service` já implementa ~90%. O input passa `provider.name` ou `examBoard.name` conforme o tipo. `edital-extractor` permanece separado.

---

## 6. Cota e contadores

### 6.1 Enforcement (limite único)

`config/constants/index.ts` → `PLAN_LIMITS`:

```ts
free:   { maxExams: 2,  ... }
pro:    { maxExams: 5,  ... }
pro_ai: { maxExams: 5,  ... }
tester: { maxExams: -1, ... }
admin:  { maxExams: -1, ... }
```

`maxCertifications` e `maxPublicExams` são removidos. `QuotaAction` → `'generate_questions' | 'create_exam'`. `quota.service.check('create_exam')` conta todos os exams do usuário contra `maxExams`.

### 6.2 Exibição (separada por tipo)

Sidebar, header e admin **continuam** mostrando a quebra por tipo para transparência. `UsageStats` carrega ambos:

```ts
interface UsageStats {
  // enforcement
  examsUsed: number;
  examsLimit: number;            // -1 = ilimitado
  // display only (sem limite próprio)
  certificationsUsed: number;
  publicExamsUsed: number;
  // ... resto inalterado (questionsUsed, questionsSavedInLibrary, etc.)
}
```

`AdminService.getOverview` e a página de analytics contam `Exam` por `type` para manter granularidade de relatório.

---

## 7. Plano de execução (menor → maior acoplamento)

1. **Schema + migração** — reescrever `schema.prisma` (dev + prod), gerar migração `DROP+CREATE`, regenerar client, atualizar seed
2. **Tipos + connectors** — uniões discriminadas, funções por `type`
3. **Serviços** — `ExamService`, `ExamQuestionService`, `MockExamService`, `quota.service` (`create_exam`), `generation-job` re-FK
4. **Rotas** — colapsar pares, `save-exam`, rotas `Provider`/`ExamBoard`
5. **Providers/reducers** — `ExamsProvider` único; remover `root.reducer.ts`
6. **Componentes** — `SectionsTable` com topics expansíveis, `Step2DefineSections`, draft card único, autocomplete por label
7. **Prompts** — dispatch table por `type`
8. **Cota/UI** — `maxExams`, `UsageStats` (dual), sidebar/header/admin
9. **Testes** — reescrever service tests (cert/public-exam/simulado → exam/mockexam) + e2e (`journey-config` DOMAINS)
10. **Docs** — atualizar CLAUDE.md (múltiplas seções descrevem o mundo split)

---

## 8. Riscos e observações

- **Escopo grande:** toca praticamente todas as camadas. Cada passo do plano é independentemente shippável e testável; commits agrupados por camada.
- **Prod = Turso:** a migração precisa rodar nos dois schemas (dev SQLite + prod LibSQL). Como não há dados a preservar, é `DROP+CREATE` nos dois.
- **Modelo de negócio:** o free passa a poder criar concursos (antes bloqueado por `maxPublicExams: 0`). Decisão explícita do usuário.
- **CLAUDE.md:** exige aprovação para mudança de schema — concedida. O próprio CLAUDE.md precisa ser atualizado ao final (seções de schema, quotas, plans, feature gating, prova completa, simulados).
- **E2E:** `journey-config.ts` (`DOMAINS` map) modela a diferença cert vs concurso; precisa refletir a unificação mantendo cobertura dos dois tipos.
