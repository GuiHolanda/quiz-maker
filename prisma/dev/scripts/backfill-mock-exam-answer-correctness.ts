import { PrismaClient } from '@prisma/client';

function isSetEqual(a: string[], b: string[]): boolean {
  return b.length > 0 && a.length === b.length && a.every((x) => b.includes(x));
}

export async function backfillAnswerCorrectness(
  client: PrismaClient,
): Promise<{ updated: number; indeterminate: number }> {
  const rows = await client.mockExamAttemptAnswer.findMany({
    select: {
      id: true,
      selectedOptions: true,
      mockExamQuestion: {
        select: { examQuestion: { select: { answer: { select: { correctOptions: true } } } } },
      },
    },
  });

  let updated = 0;
  let indeterminate = 0;

  for (const row of rows) {
    const key = row.mockExamQuestion?.examQuestion?.answer?.correctOptions as string[] | undefined;
    const selected = JSON.parse(row.selectedOptions) as string[];
    const correct = key && isSetEqual(selected, key);

    await client.mockExamAttemptAnswer.update({ where: { id: row.id }, data: { isCorrect: !!correct } });

    if (!key) indeterminate += 1;
    else if (correct) updated += 1;
  }

  return { updated, indeterminate };
}

if (require.main === module) {
  const client = new PrismaClient();
  backfillAnswerCorrectness(client)
    .then((r) => {
      console.log(`isCorrect backfill: ${r.updated} corretas, ${r.indeterminate} indeterminadas (deixadas como false)`);
    })
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => client.$disconnect());
}
