/**
 * One-shot migration: normalize CertificationTopic and PublicExamSubject
 * percentage units to integer 0–100.
 *
 * Background
 *
 * `minQuestions` / `maxQuestions` historically had mixed units in the database:
 * rows created via the AI chat flow stored fractions 0–1 (e.g. 0.20 = 20%),
 * while rows created via the manual wizard or the SectionsTable inline edits
 * stored integers 0–100 (e.g. 20 = 20%). The canonical unit is now integer
 * 0–100 across the whole app.
 *
 * This script multiplies fractional rows by 100. Rows whose `maxQuestions` is
 * already > 1 are considered already integers and are skipped — making the
 * script idempotent: re-running it after a successful apply is a no-op.
 *
 * USAGE
 *
 *   # Diagnose (dry run) on dev SQLite
 *   DATABASE_URL="file:$(pwd)/prisma/dev.db" \
 *     npx tsx scripts/normalize-topic-units.ts --diagnose
 *
 *   # Apply on dev SQLite
 *   DATABASE_URL="file:$(pwd)/prisma/dev.db" \
 *     npx tsx scripts/normalize-topic-units.ts --apply
 *
 *   # Apply on prod (LibSQL / Postgres) — set DATABASE_URL to the prod URL
 *   DATABASE_URL="$PROD_DATABASE_URL" \
 *     npx tsx scripts/normalize-topic-units.ts --apply
 *
 * A row is considered "fractional" (and gets *100) when maxQuestions <= 1.
 * Rows where maxQuestions > 1 are left untouched.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Mode = 'diagnose' | 'apply';

function parseArgs(): Mode {
  const args = process.argv.slice(2);

  if (args.includes('--apply')) return 'apply';
  if (args.includes('--diagnose')) return 'diagnose';
  console.error('Usage: tsx scripts/normalize-topic-units.ts (--diagnose | --apply)');
  process.exit(1);
}

async function main() {
  const mode = parseArgs();

  console.log(`Mode: ${mode}\n`);

  const topics = await prisma.certificationTopic.findMany({
    where: { maxQuestions: { lte: 1 } },
    select: { id: true, name: true, minQuestions: true, maxQuestions: true, certificationId: true },
  });

  const subjects = await prisma.publicExamSubject.findMany({
    where: { maxQuestions: { lte: 1 } },
    select: { id: true, name: true, minQuestions: true, maxQuestions: true, publicExamId: true },
  });

  console.log(`Fractional CertificationTopic rows to normalize: ${topics.length}`);
  console.log(`Fractional PublicExamSubject rows to normalize: ${subjects.length}\n`);

  if (topics.length > 0) {
    console.log('Sample CertificationTopic rows (first 5):');
    for (const t of topics.slice(0, 5)) {
      console.log(
        `  - ${t.name}: min=${t.minQuestions} max=${t.maxQuestions} → min=${Math.round(
          t.minQuestions * 100
        )} max=${Math.round(t.maxQuestions * 100)}`
      );
    }
    console.log();
  }

  if (subjects.length > 0) {
    console.log('Sample PublicExamSubject rows (first 5):');
    for (const s of subjects.slice(0, 5)) {
      console.log(
        `  - ${s.name}: min=${s.minQuestions} max=${s.maxQuestions} → min=${Math.round(
          s.minQuestions * 100
        )} max=${Math.round(s.maxQuestions * 100)}`
      );
    }
    console.log();
  }

  if (mode === 'diagnose') {
    console.log('Diagnose mode — no changes applied. Re-run with --apply to normalize.');

    return;
  }

  let topicUpdates = 0;
  let subjectUpdates = 0;

  await prisma.$transaction(async (tx) => {
    for (const t of topics) {
      await tx.certificationTopic.update({
        where: { id: t.id },
        data: {
          minQuestions: Math.round(t.minQuestions * 100),
          maxQuestions: Math.round(t.maxQuestions * 100),
        },
      });
      topicUpdates += 1;
    }

    for (const s of subjects) {
      await tx.publicExamSubject.update({
        where: { id: s.id },
        data: {
          minQuestions: Math.round(s.minQuestions * 100),
          maxQuestions: Math.round(s.maxQuestions * 100),
        },
      });
      subjectUpdates += 1;
    }
  });

  console.log(`Updated ${topicUpdates} CertificationTopic rows.`);
  console.log(`Updated ${subjectUpdates} PublicExamSubject rows.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
