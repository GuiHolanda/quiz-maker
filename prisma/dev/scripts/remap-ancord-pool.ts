import { prisma } from '@/lib/prisma';

const PROVIDER_NAME = 'ANCORD';
const EXAM_TYPE = 'certification';

// The AAI pool was populated under a 7-section taxonomy that the exam no longer
// uses — the template moved to a 14-section blueprint, orphaning 40 questions.
// Each entry maps an orphaned pool section to the section that now owns it.
const SECTION_REMAP: ReadonlyArray<{ readonly from: string; readonly to: string }> = [
  { from: 'Sistema Financeiro Nacional', to: 'Sistema Financeiro Nacional' },
  { from: 'Fundos de Investimento', to: 'Fundos de Investimento' },
  { from: 'Derivativos e Produtos Estruturados', to: 'Mercados Derivativos' },
  { from: 'Compliance, Ética e Autorregulação', to: 'Atividade do Assessor de Investimentos' },
  { from: 'Mercado de Capitais', to: 'Mercado de Capitais — Produtos e Modalidades Operacionais' },
  { from: 'Renda Variável', to: 'Mercado de Capitais — Produtos e Modalidades Operacionais' },
  { from: 'Renda Fixa', to: 'Mercado Financeiro — Outros Produtos' },
];

async function main() {
  const provider = await prisma.provider.findUnique({ where: { name: PROVIDER_NAME } });

  if (!provider) {
    console.error(`Provider "${PROVIDER_NAME}" not found — nothing to remap.`);
    return;
  }

  const poolKey = { type: EXAM_TYPE, providerId: provider.id, examBoardId: null };

  const validSections = await prisma.examSection.findMany({
    where: { exam: { providerId: provider.id, isTemplate: true } },
    select: { name: true },
  });
  const validSectionNames = new Set(validSections.map((section) => section.name));

  const unknownTargets = SECTION_REMAP.filter((entry) => !validSectionNames.has(entry.to));

  if (unknownTargets.length > 0) {
    console.error('Aborting — these target sections do not exist on the AAI template:');
    unknownTargets.forEach((entry) => console.error(`  - ${entry.to}`));
    process.exitCode = 1;
    return;
  }

  let movedTotal = 0;

  for (const { from, to } of SECTION_REMAP) {
    if (from === to) {
      console.log(`  Skipped (already correct): ${from}`);
      continue;
    }

    const sourcePool = await prisma.questionPool.findFirst({
      where: { ...poolKey, sectionName: from, topicName: null },
    });

    if (!sourcePool) {
      console.log(`  Skipped (no source pool): ${from}`);
      continue;
    }

    const targetPool =
      (await prisma.questionPool.findFirst({ where: { ...poolKey, sectionName: to, topicName: null } })) ??
      (await prisma.questionPool.create({ data: { ...poolKey, sectionName: to, topicName: null } }));

    const moved = await prisma.examQuestion.updateMany({
      where: { poolId: sourcePool.id },
      data: { poolId: targetPool.id, sectionName: to },
    });

    await prisma.questionPool.delete({ where: { id: sourcePool.id } });

    movedTotal += moved.count;
    console.log(`  ${from} → ${to} (${moved.count} questions)`);
  }

  console.log(`\nRemapped ${movedTotal} questions.`);

  const reachable = await prisma.examQuestion.count({
    where: { pool: { ...poolKey, sectionName: { in: Array.from(validSectionNames) } } },
  });

  console.log(`Reachable from the AAI template: ${reachable} questions.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
