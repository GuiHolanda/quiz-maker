/**
 * Recovery script: backfill drifted PublicExamQuestion.subject and topic
 * snapshots so they match the configured PublicExamSubject / PublicExamTopic.
 *
 * USAGE
 *
 *   # Dev (SQLite). Pass the SCHEMA path via env so prisma uses the right client.
 *   DATABASE_URL="file:$(pwd)/prisma/dev.db" \
 *     npx tsx scripts/backfill-public-exam-question-subjects.ts --diagnose
 *
 *   DATABASE_URL="file:$(pwd)/prisma/dev.db" \
 *     npx tsx scripts/backfill-public-exam-question-subjects.ts --apply
 *
 *   # Prod (Postgres / LibSQL). Set DATABASE_URL to the production URL.
 *   DATABASE_URL="$PROD_DATABASE_URL" \
 *     npx tsx scripts/backfill-public-exam-question-subjects.ts --diagnose
 *
 *   # Optionally scope to a single user by email or id:
 *   DATABASE_URL="..." npx tsx scripts/backfill-public-exam-question-subjects.ts \
 *     --apply --user-email gholanda04@gmail.com
 *
 * SAFETY
 *
 *   --diagnose runs zero writes. It prints, for every userId+publicExamName
 *   pair, the configured subject names side-by-side with the distinct subject
 *   strings found on its questions, marking each row "MATCH" / "DRIFT" /
 *   "ORPHAN". Always run --diagnose first, eyeball the output, then run
 *   --apply.
 *
 * STRATEGY
 *
 *   For each (userId, publicExamName) bucket:
 *     1. Load configured subjects (PublicExamSubject) for the matching
 *        PublicExam where exam.name = publicExamName AND exam.userId = userId.
 *        Build a map looseKey(name) -> canonicalName.
 *     2. Group questions by their stored `subject` field.
 *     3. For each distinct stored subject, look up its looseKey in the map.
 *          - exact match (already canonical)        : skip
 *          - relaxed match to a configured subject  : UPDATE rows
 *          - no match                               : ORPHAN — leave alone
 *
 *   Same logic for topics, scoped per (publicExam, subject).
 */

import { PrismaClient } from '@prisma/client';

import { normalizeName, looseKey } from '../shared/utils';

type Args = {
  apply: boolean;
  userEmail?: string;
  userId?: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const userEmail = pluckArg(argv, '--user-email');
  const userId = pluckArg(argv, '--user-id');

  if (!apply && !argv.includes('--diagnose')) {
    console.error('Usage: backfill-public-exam-question-subjects.ts (--diagnose | --apply) [--user-email X] [--user-id Y]');
    process.exit(2);
  }

  return { apply, userEmail, userId };
}

function pluckArg(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1) return undefined;
  return argv[idx + 1];
}

async function resolveUserScope(prisma: PrismaClient, args: Args): Promise<string[] | null> {
  if (args.userId) return [args.userId];
  if (args.userEmail) {
    const user = await prisma.user.findUnique({ where: { email: args.userEmail }, select: { id: true } });
    if (!user) {
      console.error(`No user with email ${args.userEmail}`);
      process.exit(1);
    }
    return [user.id];
  }
  return null;
}

async function main() {
  const args = parseArgs();
  const prisma = new PrismaClient();

  try {
    const userIdsScope = await resolveUserScope(prisma, args);

    const examFilter = userIdsScope ? { userId: { in: userIdsScope } } : {};
    const exams = await prisma.publicExam.findMany({
      where: { ...examFilter, userId: { not: null } },
      include: { subjects: { include: { topics: true } } },
    });

    if (exams.length === 0) {
      console.log('No public exams found in scope.');
      return;
    }

    let totalDriftQuestions = 0;
    let totalOrphanGroups = 0;
    let totalSubjectUpdates = 0;
    let totalTopicUpdates = 0;

    for (const exam of exams) {
      if (!exam.userId) continue;

      const examLabel = `[user=${exam.userId} exam="${exam.name}"]`;

      // Build subject canonical map and per-subject topic maps.
      const subjectByLooseKey = new Map<string, string>();
      const topicByLooseKey = new Map<string, Map<string, string>>();
      for (const s of exam.subjects) {
        subjectByLooseKey.set(looseKey(s.name), s.name);
        const tmap = new Map<string, string>();
        for (const t of s.topics) tmap.set(looseKey(t.name), t.name);
        topicByLooseKey.set(s.name, tmap);
      }

      // Distinct stored subjects under this exam for this user.
      const grouped = await prisma.publicExamQuestion.groupBy({
        by: ['subject'],
        where: { publicExamName: exam.name, userId: exam.userId },
        _count: { id: true },
      });

      if (grouped.length === 0) continue;

      console.log(`\n${examLabel}`);
      console.log(`  configured subjects: ${exam.subjects.map((s) => `"${s.name}"`).join(', ') || '(none)'}`);

      for (const g of grouped) {
        const stored = g.subject;
        const count = g._count.id;
        const canonical = subjectByLooseKey.get(looseKey(stored));

        if (canonical === stored) {
          console.log(`  MATCH    ${count.toString().padStart(4)} × "${stored}"`);
          continue;
        }

        if (canonical) {
          console.log(`  DRIFT    ${count.toString().padStart(4)} × "${stored}" -> "${canonical}"`);
          totalDriftQuestions += count;
          if (args.apply) {
            const res = await prisma.publicExamQuestion.updateMany({
              where: { publicExamName: exam.name, userId: exam.userId, subject: stored },
              data: { subject: canonical },
            });
            totalSubjectUpdates += res.count;
          }
        } else {
          console.log(`  ORPHAN   ${count.toString().padStart(4)} × "${stored}"  (no configured subject matches)`);
          totalOrphanGroups += 1;
          continue;
        }

        // For drifted-but-resolved groups, also fix topics.
        const targetSubject = canonical;
        const tmap = topicByLooseKey.get(targetSubject);
        if (!tmap) continue;

        const topicGroups = await prisma.publicExamQuestion.groupBy({
          by: ['topic'],
          where: { publicExamName: exam.name, userId: exam.userId, subject: args.apply ? targetSubject : stored },
          _count: { id: true },
        });

        for (const tg of topicGroups) {
          if (!tg.topic) continue;
          const canonicalTopic = tmap.get(looseKey(tg.topic));
          if (canonicalTopic && canonicalTopic !== tg.topic) {
            console.log(`    topic DRIFT  ${tg._count.id} × "${tg.topic}" -> "${canonicalTopic}"`);
            if (args.apply) {
              const res = await prisma.publicExamQuestion.updateMany({
                where: {
                  publicExamName: exam.name,
                  userId: exam.userId,
                  subject: targetSubject,
                  topic: tg.topic,
                },
                data: { topic: canonicalTopic },
              });
              totalTopicUpdates += res.count;
            }
          }
        }
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Drifted question rows detected   : ${totalDriftQuestions}`);
    console.log(`Orphan stored-subject groups     : ${totalOrphanGroups}`);
    if (args.apply) {
      console.log(`Subject rows updated             : ${totalSubjectUpdates}`);
      console.log(`Topic rows updated               : ${totalTopicUpdates}`);
    } else {
      console.log('(diagnose mode — no writes performed)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
