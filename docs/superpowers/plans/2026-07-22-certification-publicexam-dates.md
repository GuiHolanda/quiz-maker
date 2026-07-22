# Certification & Public Exam Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar `createdAt` e `updatedAt` aos modelos `Certification` e `PublicExam` e exibi-los nos triggers do acordeão das listas, com data relativa no texto e absoluta no hover. A data de edição é omitida quando igual à de criação (registro nunca editado). Edições em filhos (tópicos/assuntos) propagam `updatedAt` ao pai.

**Architecture:** Migration Prisma em dev e prod adiciona os dois campos. O service de cada filho toca o pai após qualquer mutação. A API expõe os campos, os tipos TypeScript os refletem, e um componente `RelativeDate` encapsula a formatação.

**Tech Stack:** Prisma 6, SQLite (dev) / LibSQL (prod), Next.js 15 App Router, TypeScript 5 strict, `Intl.RelativeTimeFormat`, `Intl.DateTimeFormat`.

---

## File Map

| Ação | Arquivo |
|---|---|
| Modify | `prisma/dev/schema.prisma` |
| Create | `prisma/dev/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql` |
| Modify | `prisma/prod/schema.prisma` |
| Create | `prisma/prod/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql` |
| Modify | `shared/types/index.ts` |
| Modify | `app/api/certification/certifications/route.ts` |
| Modify | `app/api/public-exam/public-exams/route.ts` |
| Modify | `features/services/certification.service.ts` |
| Modify | `features/services/public-exam.service.ts` |
| Create | `shared/components/ui/RelativeDate.tsx` |
| Modify | `app/(workspace)/certifications/configure/components/CertificationsListTab.tsx` |
| Modify | `app/(workspace)/public-exams/configure/components/PublicExamsListTab.tsx` |
| Modify | `public/messages/en.properties` |
| Modify | `public/messages/pt.properties` |

---

## Task 1: Migration dev — adicionar `createdAt` e `updatedAt`

**Files:**
- Modify: `prisma/dev/schema.prisma`
- Create: `prisma/dev/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql`

- [ ] **Step 1: Adicionar campos ao schema dev**

Em `prisma/dev/schema.prisma`, localizar o modelo `Certification` e adicionar após `passingScore`:

```prisma
model Certification {
  id                  String               @id @default(cuid())
  label               String
  key                 String
  provider            String?
  totalQuestions      Int
  examDurationMinutes Int?
  passingScore        Float?
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  topics              CertificationTopic[]
  userId              String?
  user                User?                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, key])
}
```

Localizar o modelo `PublicExam` e adicionar após `passingScore`:

```prisma
model PublicExam {
  id                  String              @id @default(cuid())
  name                String
  role                String?
  year                Int?
  totalQuestions      Int
  examDurationMinutes Int?
  passingScore        Float?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt
  examBoardId         String
  examBoard           ExamBoard           @relation(fields: [examBoardId], references: [id])
  subjects            PublicExamSubject[]
  questions           PublicExamQuestion[]
  userId              String?
  mockExams           MockExam[]
  user                User?               @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, name, year])
}
```

- [ ] **Step 2: Criar o arquivo de migration dev**

Criar o diretório e o arquivo SQL da migration. O SQLite não suporta `ALTER TABLE ADD COLUMN` com `DEFAULT now()` em colunas `NOT NULL` sem um valor padrão para rows existentes, por isso usamos `DEFAULT CURRENT_TIMESTAMP`:

```sql
-- prisma/dev/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql
ALTER TABLE "Certification" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Certification" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "PublicExam" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PublicExam" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

- [ ] **Step 3: Aplicar a migration dev**

```bash
npm run prisma:migrate:dev
```

Saída esperada: `Your database is now in sync with your schema.` e a migration `20260722_add_dates_to_certification_and_public_exam` aparece na lista.

- [ ] **Step 4: Regenerar o Prisma client dev**

```bash
npm run prisma:generate:dev
```

Saída esperada: `Generated Prisma Client`.

- [ ] **Step 5: Commit**

```bash
git add prisma/dev/schema.prisma prisma/dev/migrations/
git commit -m "chore: add createdAt and updatedAt to Certification and PublicExam (dev)"
```

---

## Task 2: Migration prod — adicionar `createdAt` e `updatedAt`

**Files:**
- Modify: `prisma/prod/schema.prisma`
- Create: `prisma/prod/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql`

- [ ] **Step 1: Adicionar campos ao schema prod**

Em `prisma/prod/schema.prisma`, aplicar as mesmas adições do Task 1 Step 1 nos modelos `Certification` e `PublicExam`:

```prisma
-- em Certification, após passingScore:
createdAt           DateTime             @default(now())
updatedAt           DateTime             @updatedAt

-- em PublicExam, após passingScore:
createdAt           DateTime            @default(now())
updatedAt           DateTime            @updatedAt
```

- [ ] **Step 2: Criar o arquivo de migration prod**

LibSQL (Turso) usa SQLite com a mesma sintaxe:

```sql
-- prisma/prod/migrations/20260722_add_dates_to_certification_and_public_exam/migration.sql
ALTER TABLE "Certification" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Certification" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "PublicExam" ADD COLUMN "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "PublicExam" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;
```

- [ ] **Step 3: Commit**

```bash
git add prisma/prod/schema.prisma prisma/prod/migrations/
git commit -m "chore: add createdAt and updatedAt to Certification and PublicExam (prod)"
```

> **Nota:** `npm run prisma:migrate:prod` (que executa `prisma migrate deploy`) deve ser rodado no deploy para prod, não localmente. O schema e o arquivo SQL são suficientes para o CI/CD aplicar.

---

## Task 3: Atualizar tipos TypeScript

**Files:**
- Modify: `shared/types/index.ts`

- [ ] **Step 1: Adicionar `createdAt` e `updatedAt` à interface `Certification`**

Localizar a interface `Certification` (linha ~76) e adicionar os dois campos:

```ts
export interface Certification {
  label: string;
  key: string;
  provider?: string;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
  createdAt: string;
  updatedAt: string;
  topics: CertificationTopic[];
}
```

- [ ] **Step 2: Adicionar `createdAt` e `updatedAt` à interface `PublicExam`**

Localizar a interface `PublicExam` (linha ~230) e adicionar os dois campos:

```ts
export interface PublicExam {
  id?: string;
  name: string;
  role?: string;
  year?: number;
  totalQuestions: number;
  examDurationMinutes?: number;
  passingScore?: number;
  createdAt: string;
  updatedAt: string;
  examBoard: ExamBoard;
  subjects: PublicExamSubject[];
}
```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

Saída esperada: nenhum erro.

- [ ] **Step 4: Commit**

```bash
git add shared/types/index.ts
git commit -m "feat: add createdAt and updatedAt to Certification and PublicExam types"
```

---

## Task 4: Expor as datas nas rotas GET de listagem

**Files:**
- Modify: `app/api/certification/certifications/route.ts`
- Modify: `app/api/public-exam/public-exams/route.ts`

- [ ] **Step 1: Adicionar `createdAt` e `updatedAt` ao mapeamento de certificações**

Em `app/api/certification/certifications/route.ts`, substituir o `records.map` existente:

```ts
const certifications = records.map(({ label, key, provider, totalQuestions, examDurationMinutes, passingScore, createdAt, updatedAt, topics }) => ({
  label,
  key,
  provider: provider ?? undefined,
  totalQuestions,
  examDurationMinutes: examDurationMinutes ?? undefined,
  passingScore: passingScore ?? undefined,
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString(),
  topics: topics.map(({ id, name, minQuestions, maxQuestions }) => ({ id, name, minQuestions, maxQuestions })),
}));
```

- [ ] **Step 2: Adicionar `createdAt` e `updatedAt` ao mapeamento de concursos**

Em `app/api/public-exam/public-exams/route.ts`, substituir o `records.map` existente:

```ts
const publicExams = records.map(({ id, name, role, year, totalQuestions, examDurationMinutes, passingScore, createdAt, updatedAt, examBoard, subjects }) => ({
  id,
  name,
  role: role ?? undefined,
  year: year ?? undefined,
  totalQuestions,
  examDurationMinutes: examDurationMinutes ?? undefined,
  passingScore: passingScore ?? undefined,
  createdAt: createdAt.toISOString(),
  updatedAt: updatedAt.toISOString(),
  examBoard: { id: examBoard.id, name: examBoard.name, fullName: examBoard.fullName ?? undefined },
  subjects: subjects.map(({ id: sid, name: sname, minQuestions, maxQuestions, topics }) => ({
    id: sid,
    name: sname,
    minQuestions,
    maxQuestions,
    topics: topics.map(({ id: tid, name: tname }) => ({ id: tid, name: tname })),
  })),
}));
```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/api/certification/certifications/route.ts app/api/public-exam/public-exams/route.ts
git commit -m "feat: expose createdAt and updatedAt in certifications and public-exams GET"
```

---

## Task 5: Propagar `updatedAt` em mutações de filhos — `CertificationService`

**Files:**
- Modify: `features/services/certification.service.ts`

Os métodos `addTopic`, `updateTopic` e `deleteTopic` precisam tocar o pai após cada operação para que `@updatedAt` seja acionado. Edições diretas no pai (`updateCertificationMeta`) já são cobertas automaticamente pela diretiva `@updatedAt`.

- [ ] **Step 1: Atualizar `addTopic` para tocar o pai**

Localizar o método `addTopic` em `features/services/certification.service.ts` e substituir o `return` final:

```ts
public async addTopic(
  certificationKey: string,
  name: string,
  minQuestions: number,
  maxQuestions: number,
  userId: string
) {
  const certification = await this.prismaService.certification.findFirst({
    where: { key: certificationKey, userId },
  });

  if (!certification) {
    throw Object.assign(new Error(`Certification "${certificationKey}" not found`), { status: 404 });
  }

  const existing = await this.prismaService.certificationTopic.findUnique({
    where: { certificationId_name: { certificationId: certification.id, name } },
  });

  if (existing) {
    throw Object.assign(new Error(`Topic "${name}" already exists`), { status: 409 });
  }

  const topic = await this.prismaService.certificationTopic.create({
    data: { name, minQuestions, maxQuestions, certificationId: certification.id },
  });

  await this.prismaService.certification.update({
    where: { id: certification.id },
    data: { updatedAt: new Date() },
  });

  return topic;
}
```

- [ ] **Step 2: Atualizar `updateTopic` para tocar o pai**

Localizar o método `updateTopic` e substituí-lo integralmente:

```ts
public async updateTopic(payload: TopicUpdatePayload, userId: string) {
  const { topicId, newName, minQuestions, maxQuestions } = payload;

  const topic = await this.prismaService.certificationTopic.findUnique({
    where: { id: topicId },
    include: { certification: true },
  });

  if (!topic) {
    throw Object.assign(new Error(`Topic not found`), { status: 404 });
  }

  if (topic.certification.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const updated = await this.prismaService.certificationTopic.update({
    where: { id: topicId },
    data: {
      ...(newName !== undefined && { name: newName }),
      minQuestions,
      maxQuestions,
    },
  });

  await this.prismaService.certification.update({
    where: { id: topic.certification.id },
    data: { updatedAt: new Date() },
  });

  return updated;
}
```

- [ ] **Step 3: Atualizar `deleteTopic` para tocar o pai**

Localizar o método `deleteTopic` e substituí-lo integralmente:

```ts
public async deleteTopic(topicId: string, userId: string) {
  const topic = await this.prismaService.certificationTopic.findUnique({
    where: { id: topicId },
    include: { certification: true },
  });

  if (!topic) {
    throw Object.assign(new Error('Topic not found'), { status: 404 });
  }

  if (topic.certification.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await this.prismaService.certificationTopic.delete({ where: { id: topicId } });

  await this.prismaService.certification.update({
    where: { id: topic.certification.id },
    data: { updatedAt: new Date() },
  });
}
```

- [ ] **Step 4: Rodar os testes unitários**

```bash
npm test
```

Saída esperada: todos os testes passam. Os mocks existentes do Prisma já cobrem `certification.update` — verificar que os testes de `certification.service.test.ts` continuam verdes.

- [ ] **Step 5: Commit**

```bash
git add features/services/certification.service.ts
git commit -m "feat: touch certification updatedAt on topic add/update/delete"
```

---

## Task 6: Propagar `updatedAt` em mutações de filhos — `PublicExamService`

**Files:**
- Modify: `features/services/public-exam.service.ts`

Os métodos `addSubject`, `updateSubject`, `deleteSubject`, `addTopic`, `updateTopic` e `deleteTopic` precisam tocar o pai.

- [ ] **Step 1: Atualizar `addSubject` para tocar o pai**

Localizar o método `addSubject` e substituir o `return` final por:

```ts
const subject = await this.prismaService.publicExamSubject.create({
  data: { name: normalizedName, minQuestions, maxQuestions, publicExamId: exam.id },
});

await this.prismaService.publicExam.update({
  where: { id: exam.id },
  data: { updatedAt: new Date() },
});

return subject;
```

- [ ] **Step 2: Atualizar `updateSubject` para tocar o pai**

O método `updateSubject` usa uma `$transaction`. Adicionar o toque ao pai dentro da mesma transaction. Substituir o método integralmente:

```ts
public async updateSubject(payload: PublicExamSubjectUpdatePayload, userId: string) {
  const { subjectId, newName, minQuestions, maxQuestions } = payload;

  const subject = await this.prismaService.publicExamSubject.findUnique({
    where: { id: subjectId },
    include: { publicExam: true },
  });

  if (!subject) {
    throw Object.assign(new Error('Subject not found'), { status: 404 });
  }

  if (subject.publicExam.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const normalizedNewName = newName !== undefined ? normalizeName(newName) : undefined;

  return this.prismaService.$transaction(async (tx) => {
    if (normalizedNewName !== undefined && normalizedNewName !== subject.name) {
      await tx.publicExamQuestion.updateMany({
        where: {
          userId,
          OR: [
            { subjectId: subject.id },
            { subjectId: null, publicExamName: subject.publicExam.name, subject: subject.name },
          ],
        },
        data: { subject: normalizedNewName },
      });
    }

    const updated = await tx.publicExamSubject.update({
      where: { id: subjectId },
      data: {
        ...(normalizedNewName !== undefined && { name: normalizedNewName }),
        minQuestions,
        maxQuestions,
      },
    });

    await tx.publicExam.update({
      where: { id: subject.publicExam.id },
      data: { updatedAt: new Date() },
    });

    return updated;
  });
}
```

- [ ] **Step 3: Atualizar `deleteSubject` para tocar o pai**

Localizar o método `deleteSubject` e substituí-lo:

```ts
public async deleteSubject(subjectId: string, userId: string) {
  const subject = await this.prismaService.publicExamSubject.findUnique({
    where: { id: subjectId },
    include: { publicExam: true },
  });

  if (!subject) {
    throw Object.assign(new Error('Subject not found'), { status: 404 });
  }

  if (subject.publicExam.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await this.prismaService.publicExamSubject.delete({ where: { id: subjectId } });

  await this.prismaService.publicExam.update({
    where: { id: subject.publicExam.id },
    data: { updatedAt: new Date() },
  });
}
```

- [ ] **Step 4: Atualizar `addTopic` para tocar o pai**

Localizar o método `addTopic` (tópico de assunto) e substituir o `return` final:

```ts
const topic = await this.prismaService.publicExamTopic.create({
  data: { name: normalizedName, subjectId },
});

await this.prismaService.publicExam.update({
  where: { id: subject.publicExam.id },
  data: { updatedAt: new Date() },
});

return topic;
```

O `subject.publicExam.id` já está disponível porque o método faz `include: { publicExam: true }` na busca do subject.

- [ ] **Step 5: Atualizar `updateTopic` para tocar o pai**

O método `updateTopic` usa uma `$transaction`. Adicionar o toque ao pai dentro da mesma transaction. Substituir o método integralmente:

```ts
public async updateTopic(topicId: string, newName: string, userId: string) {
  const topic = await this.prismaService.publicExamTopic.findUnique({
    where: { id: topicId },
    include: { subject: { include: { publicExam: true } } },
  });

  if (!topic) {
    throw Object.assign(new Error('Topic not found'), { status: 404 });
  }

  if (topic.subject.publicExam.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  const normalizedNewName = normalizeName(newName);

  const duplicate = await this.prismaService.publicExamTopic.findUnique({
    where: { subjectId_name: { subjectId: topic.subjectId, name: normalizedNewName } },
  });

  if (duplicate && duplicate.id !== topicId) {
    throw Object.assign(new Error(`Topic "${normalizedNewName}" already exists`), { status: 409 });
  }

  return this.prismaService.$transaction(async (tx) => {
    if (normalizedNewName !== topic.name) {
      await tx.publicExamQuestion.updateMany({
        where: {
          userId,
          OR: [
            { topicId: topic.id },
            {
              topicId: null,
              publicExamName: topic.subject.publicExam.name,
              subject: topic.subject.name,
              topic: topic.name,
            },
          ],
        },
        data: { topic: normalizedNewName },
      });
    }

    const updated = await tx.publicExamTopic.update({
      where: { id: topicId },
      data: { name: normalizedNewName },
    });

    await tx.publicExam.update({
      where: { id: topic.subject.publicExam.id },
      data: { updatedAt: new Date() },
    });

    return updated;
  });
}
```

- [ ] **Step 6: Atualizar `deleteTopic` para tocar o pai**

Localizar o método `deleteTopic` e substituí-lo:

```ts
public async deleteTopic(topicId: string, userId: string) {
  const topic = await this.prismaService.publicExamTopic.findUnique({
    where: { id: topicId },
    include: { subject: { include: { publicExam: true } } },
  });

  if (!topic) {
    throw Object.assign(new Error('Topic not found'), { status: 404 });
  }

  if (topic.subject.publicExam.userId !== userId) {
    throw Object.assign(new Error('Forbidden'), { status: 403 });
  }

  await this.prismaService.publicExamTopic.delete({ where: { id: topicId } });

  await this.prismaService.publicExam.update({
    where: { id: topic.subject.publicExam.id },
    data: { updatedAt: new Date() },
  });
}
```

- [ ] **Step 7: Rodar os testes unitários**

```bash
npm test
```

Saída esperada: todos os testes passam. Os mocks existentes do Prisma cobrem `publicExam.update`.

- [ ] **Step 8: Commit**

```bash
git add features/services/public-exam.service.ts
git commit -m "feat: touch publicExam updatedAt on subject/topic add/update/delete"
```

---

## Task 7: Criar o componente `RelativeDate`

**Files:**
- Create: `shared/components/ui/RelativeDate.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// shared/components/ui/RelativeDate.tsx
'use client';

interface RelativeDateProps {
  readonly date: string;
}

export function RelativeDate({ date }: RelativeDateProps) {
  const d = new Date(date);
  const absolute = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
  const relative = formatRelative(d);

  return (
    <time dateTime={date} title={absolute}>
      {relative}
    </time>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHr = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHr / 24);
  const diffMonth = Math.round(diffDay / 30);
  const diffYear = Math.round(diffDay / 365);

  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(diffSec, 'second');
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
  if (Math.abs(diffDay) < 30) return rtf.format(diffDay, 'day');
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month');
  return rtf.format(diffYear, 'year');
}
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add shared/components/ui/RelativeDate.tsx
git commit -m "feat: add RelativeDate component with hover absolute date"
```

---

## Task 8: Adicionar chaves i18n

**Files:**
- Modify: `public/messages/en.properties`
- Modify: `public/messages/pt.properties`

- [ ] **Step 1: Adicionar as chaves ao arquivo de inglês**

Em `public/messages/en.properties`, adicionar no namespace `common`:

```properties
common.createdAt=Created {date}
common.updatedAt=Edited {date}
```

- [ ] **Step 2: Adicionar as chaves ao arquivo de português**

Em `public/messages/pt.properties`, adicionar no namespace `common`:

```properties
common.createdAt=Criado {date}
common.updatedAt=Editado {date}
```

> **Nota:** As chaves usam `{date}` como placeholder para interpolação com `t('common.createdAt', { date: <RelativeDate> })`. Como `RelativeDate` é um componente, a interpolação acontece no JSX, não via `t()`. O valor final no JSX é: `{t('common.createdAt', { date: '' }).replace('{date}', '')}` — na prática, o label "Criado" ou "Editado" é renderizado como texto junto ao `<RelativeDate>`. Veja Task 9 para o padrão exato.

- [ ] **Step 3: Commit**

```bash
git add public/messages/en.properties public/messages/pt.properties
git commit -m "feat: add i18n keys for createdAt and updatedAt labels"
```

---

## Task 9: Atualizar `CertificationsListTab` — novo layout do trigger

**Files:**
- Modify: `app/(workspace)/certifications/configure/components/CertificationsListTab.tsx`

- [ ] **Step 1: Adicionar import de `RelativeDate`**

No topo do arquivo, após os imports existentes, adicionar:

```ts
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
```

- [ ] **Step 2: Substituir `renderTriggerTitle` integralmente**

Localizar a função `renderTriggerTitle` no final do componente e substituí-la:

```tsx
function renderTriggerTitle(certification: Certification) {
  const topicStatus =
    certification.topics.length === 0 ? (
      <Chip color="warning" size="sm" variant="flat">
        {t('certification.noTopics')}
      </Chip>
    ) : (
      <span
        aria-label={t('certification.topicsAriaLabel', { count: String(certification.topics.length) })}
        className="flex items-center gap-1 text-xs text-default-400"
      >
        <FontAwesomeIcon className="text-[10px]" icon={faLayerGroup} />
        {certification.topics.length === 1
          ? t('certification.topicCount1')
          : t('certification.topicCountN', { count: String(certification.topics.length) })}
      </span>
    );

  const isEdited = certification.updatedAt !== certification.createdAt;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {/* Linha 1: nome | provider + tópicos */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate min-w-0">{certification.label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {certification.provider && (
            <span className="text-xs text-default-400 truncate max-w-[160px]">{certification.provider}</span>
          )}
          {topicStatus}
        </div>
      </div>

      {/* Linha 2: metadados (esq) | datas (dir) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {certification.totalQuestions > 0 && (
            <span
              aria-label={t('certification.totalQuestionsAriaLabel', { count: String(certification.totalQuestions) })}
              className="flex items-center gap-1 text-xs text-default-400"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faHashtag} />
              {t('certification.questionsCount', { count: String(certification.totalQuestions) })}
            </span>
          )}
          {certification.examDurationMinutes && (
            <span
              aria-label={t('certification.durationAriaLabel', { minutes: String(certification.examDurationMinutes) })}
              className="flex items-center gap-1 text-xs text-default-400"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faClock} />
              {t('certification.durationValue', { minutes: String(certification.examDurationMinutes) })}
            </span>
          )}
          {certification.passingScore != null && (
            <span
              aria-label={t('certification.passingScoreAriaLabel', { score: String(certification.passingScore) })}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faBullseye} />
              {t('certification.passingScoreValue', { score: String(certification.passingScore) })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-default-400 shrink-0">
          <span>
            {t('common.createdAt', { date: '' }).replace('{date}', '')}<RelativeDate date={certification.createdAt} />
          </span>
          {isEdited && (
            <span>
              {t('common.updatedAt', { date: '' }).replace('{date}', '')}<RelativeDate date={certification.updatedAt} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

> **Nota sobre i18n + JSX:** como `RelativeDate` é um componente React, não podemos passá-lo como variável a `t()`. O padrão acima separa o label traduzido do componente de data. Uma alternativa mais limpa é usar labels fixos como `"Criado "` e `"Editado "` sem passar por `t()` — mas para respeitar o sistema i18n, usamos o padrão `replace`. Se preferir simplicidade, basta trocar por:
> ```tsx
> <span className="flex items-center gap-1">
>   <span>{t('common.createdAt', { date: '' }).replace(' {date}', '')}</span>
>   <RelativeDate date={certification.createdAt} />
> </span>
> ```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/(workspace)/certifications/configure/components/CertificationsListTab.tsx
git commit -m "feat: show createdAt/updatedAt in CertificationsListTab trigger"
```

---

## Task 10: Atualizar `PublicExamsListTab` — novo layout do trigger

**Files:**
- Modify: `app/(workspace)/public-exams/configure/components/PublicExamsListTab.tsx`

- [ ] **Step 1: Adicionar import de `RelativeDate`**

No topo do arquivo, após os imports existentes:

```ts
import { RelativeDate } from '@/shared/components/ui/RelativeDate';
```

- [ ] **Step 2: Substituir `renderTriggerTitle` integralmente**

Localizar a função `renderTriggerTitle` no final do componente e substituí-la:

```tsx
function renderTriggerTitle(publicExam: PublicExam) {
  const subjectStatus =
    publicExam.subjects.length === 0 ? (
      <Chip color="warning" size="sm" variant="flat">
        {t('concurso.noSubjects')}
      </Chip>
    ) : (
      <span
        aria-label={t('concurso.subjectsAriaLabel', { count: String(publicExam.subjects.length) })}
        className="flex items-center gap-1 text-xs text-default-400"
      >
        <FontAwesomeIcon className="text-[10px]" icon={faLayerGroup} />
        {publicExam.subjects.length === 1
          ? t('concurso.subjectCount1')
          : t('concurso.subjectCountN', { count: String(publicExam.subjects.length) })}
      </span>
    );

  const isEdited = publicExam.updatedAt !== publicExam.createdAt;

  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      {/* Linha 1: nome | banca + ano + assuntos */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-sm font-semibold text-foreground truncate min-w-0">{publicExam.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          {publicExam.year != null && (
            <span
              aria-label={t('concurso.yearAriaLabel', { year: String(publicExam.year) })}
              className="flex items-center gap-1 text-xs text-default-400"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faCalendar} />
              {publicExam.year}
            </span>
          )}
          {publicExam.examBoard?.name && (
            <span className="text-xs text-default-400 truncate max-w-[160px]">{publicExam.examBoard.name}</span>
          )}
          {subjectStatus}
        </div>
      </div>

      {/* Linha 2: metadados (esq) | datas (dir) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          {publicExam.totalQuestions > 0 && (
            <span
              aria-label={t('concurso.totalQuestionsAriaLabel', { count: String(publicExam.totalQuestions) })}
              className="flex items-center gap-1 text-xs text-default-400"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faHashtag} />
              {t('concurso.questionsCount', { count: String(publicExam.totalQuestions) })}
            </span>
          )}
          {publicExam.examDurationMinutes && (
            <span
              aria-label={t('concurso.durationAriaLabel', { minutes: String(publicExam.examDurationMinutes) })}
              className="flex items-center gap-1 text-xs text-default-400"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faClock} />
              {t('concurso.durationValue', { minutes: String(publicExam.examDurationMinutes) })}
            </span>
          )}
          {publicExam.passingScore != null && (
            <span
              aria-label={t('concurso.passingScoreAriaLabel', { score: String(publicExam.passingScore) })}
              className="flex items-center gap-1 text-xs text-primary font-medium"
            >
              <FontAwesomeIcon className="text-[10px]" icon={faBullseye} />
              {t('concurso.passingScoreValue', { score: String(publicExam.passingScore) })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-default-400 shrink-0">
          <span>
            {t('common.createdAt', { date: '' }).replace('{date}', '')}<RelativeDate date={publicExam.createdAt} />
          </span>
          {isEdited && (
            <span>
              {t('common.updatedAt', { date: '' }).replace('{date}', '')}<RelativeDate date={publicExam.updatedAt} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verificar que o TypeScript compila sem erros**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add app/(workspace)/public-exams/configure/components/PublicExamsListTab.tsx
git commit -m "feat: show createdAt/updatedAt in PublicExamsListTab trigger"
```

---

## Self-review

**Spec coverage:**

| Requisito | Task |
|---|---|
| `createdAt` + `updatedAt` no schema dev | Task 1 |
| `createdAt` + `updatedAt` no schema prod | Task 2 |
| Tipos TypeScript atualizados | Task 3 |
| API expõe os campos | Task 4 |
| Filhos de Certification propagam `updatedAt` | Task 5 |
| Filhos de PublicExam propagam `updatedAt` | Task 6 |
| Componente `RelativeDate` (relativa + hover absoluta) | Task 7 |
| Chaves i18n `common.createdAt` / `common.updatedAt` | Task 8 |
| `CertificationsListTab` com novo layout | Task 9 |
| `PublicExamsListTab` com novo layout | Task 10 |
| "Editado" omitido quando `updatedAt === createdAt` | Tasks 9 e 10 (`isEdited`) |

**Todos os requisitos cobertos.**
