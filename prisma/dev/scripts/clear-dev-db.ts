import { prisma } from '@/lib/prisma';

async function main() {
  // Delete children first to respect relations
  await prisma.explanation.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.option.deleteMany();
  await prisma.question.deleteMany();

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
