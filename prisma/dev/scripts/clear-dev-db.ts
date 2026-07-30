import { prisma } from '@/lib/prisma';

async function main() {
  // Delete children first to respect relations
  await prisma.examExplanation.deleteMany();
  await prisma.examAnswer.deleteMany();
  await prisma.examOption.deleteMany();
  await prisma.examQuestion.deleteMany();

  // Optional: reset SQLite autoincrement counters (safe no-op in other DBs)
  // This makes IDs start from 1 again after clearing.
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence;`);
  } catch {
    // ignore (e.g. not sqlite or table doesn't exist)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('✅ Dev database cleared (data only).');
  })
  .catch(async (e) => {
    console.error('❌ Failed to clear dev database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
