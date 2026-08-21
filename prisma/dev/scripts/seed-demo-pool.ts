import { prisma } from '@/lib/prisma';
import { expectedOptionCount, type DemoPoolExam, type DemoPoolQuestion } from './data/demo-pool-types';
import { CLOUD_DEMO_POOL } from './data/demo-pool-cloud';
import { INFRA_DEMO_POOL } from './data/demo-pool-infra';
import { FINANCE_DEMO_POOL } from './data/demo-pool-finance';

const DEMO_POOL: readonly DemoPoolExam[] = [...CLOUD_DEMO_POOL, ...INFRA_DEMO_POOL, ...FINANCE_DEMO_POOL];

async function seedQuestion(
  exam: { id: string; type: string; name: string; providerId: string | null; examBoardId: string | null },
  section: { id: string; name: string },
  question: DemoPoolQuestion
): Promise<'created' | 'skipped'> {
  const poolKey = {
    type: exam.type,
    providerId: exam.providerId,
    examBoardId: exam.examBoardId,
    sectionName: section.name,
    topicName: null,
  };

  const pool =
    (await prisma.questionPool.findFirst({ where: poolKey })) ?? (await prisma.questionPool.create({ data: poolKey }));

  const existing = await prisma.examQuestion.findFirst({
    where: { poolId: pool.id, text: question.text },
  });

  if (existing) return 'skipped';

  await prisma.examQuestion.create({
    data: {
      text: question.text,
      correctCount: question.correctOptions.length,
      difficulty: question.difficulty,
      examName: exam.name,
      sectionName: section.name,
      topicName: null,
      examId: exam.id,
      sectionId: section.id,
      poolId: pool.id,
      options: {
        create: Object.entries(question.options).map(([label, text]) => ({ label, text })),
      },
      answer: {
        create: {
          correctOptions: question.correctOptions,
          explanations: {
            create: Object.entries(question.explanations).map(([label, text]) => ({ label, text })),
          },
        },
      },
    },
  });

  return 'created';
}

function validate(entry: DemoPoolExam, sectionNames: Set<string>): string[] {
  const problems: string[] = [];

  entry.questions.forEach((question, index) => {
    const where = `${entry.examName} #${index + 1}`;
    const labels = Object.keys(question.options);
    const expected = expectedOptionCount(entry, question.correctOptions.length);

    if (!sectionNames.has(question.section)) {
      problems.push(`${where}: unknown section "${question.section}"`);
    }
    if (labels.length !== expected) {
      problems.push(`${where}: has ${labels.length} options, real exam format uses ${expected}`);
    }
    if (question.correctOptions.length === 0) {
      problems.push(`${where}: no correct option`);
    }
    question.correctOptions.forEach((label) => {
      if (!labels.includes(label)) problems.push(`${where}: correct option "${label}" is not an option`);
    });
    labels.forEach((label) => {
      if (!question.explanations[label]) problems.push(`${where}: option "${label}" has no explanation`);
    });
  });

  return problems;
}

// Matches on examName plus userId: null rather than on the question text:
// rewriting a question changes its text, and matching by text would strand
// the previous version in the pool. userId: null is what distinguishes
// script-seeded pool questions from real user-generated ones — user flows
// always set userId (see exam-question.service.ts), and explanation/route.ts
// can attach explanations to a user's pool question, so matching on "has an
// explanation" alone would also delete those.
//
// SQLite has no cascade on Option/Answer/Explanation, so the order matters.
async function deleteSeeded(entry: DemoPoolExam): Promise<number> {
  const questions = await prisma.examQuestion.findMany({
    where: {
      poolId: { not: null },
      examName: entry.examName,
      userId: null,
    },
    select: { id: true, answer: { select: { id: true } } },
  });

  if (questions.length === 0) return 0;

  const questionIds = questions.map((question) => question.id);
  const answerIds = questions.map((question) => question.answer?.id).filter((id): id is number => Boolean(id));

  await prisma.examExplanation.deleteMany({ where: { answerId: { in: answerIds } } });
  await prisma.examAnswer.deleteMany({ where: { questionId: { in: questionIds } } });
  await prisma.examOption.deleteMany({ where: { questionId: { in: questionIds } } });
  await prisma.examQuestion.deleteMany({ where: { id: { in: questionIds } } });

  return questionIds.length;
}

async function main() {
  const reset = process.argv.includes('--reset');
  let created = 0;
  let skipped = 0;
  let removed = 0;
  const allProblems: string[] = [];

  for (const entry of DEMO_POOL) {
    const exam = await prisma.exam.findFirst({
      where: { name: entry.examName, isTemplate: true },
      include: { sections: true },
    });

    if (!exam) {
      allProblems.push(`Template not found: ${entry.examName}`);
      continue;
    }

    const problems = validate(entry, new Set(exam.sections.map((section) => section.name)));

    if (problems.length > 0) {
      allProblems.push(...problems);
      continue;
    }

    if (reset) removed += await deleteSeeded(entry);

    const sectionByName = new Map(exam.sections.map((section) => [section.name, section]));
    let examCreated = 0;

    for (const question of entry.questions) {
      const outcome = await seedQuestion(exam, sectionByName.get(question.section)!, question);

      if (outcome === 'created') {
        created += 1;
        examCreated += 1;
      } else {
        skipped += 1;
      }
    }

    console.log(`  ${entry.examName}: +${examCreated} (${entry.questions.length} defined)`);
  }

  if (allProblems.length > 0) {
    console.error('\nProblems found:');
    allProblems.forEach((problem) => console.error(`  - ${problem}`));
    process.exitCode = 1;
    return;
  }

  const resetNote = reset ? `Removed ${removed}, ` : '';
  console.log(`\n${resetNote}created ${created} questions, skipped ${skipped} already present.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
