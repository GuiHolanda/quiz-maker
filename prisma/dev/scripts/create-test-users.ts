import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/prisma';

const TEST_USERS = [
  {
    name: 'Test Free',
    email: 'test-free@certifiqueai.test',
    password: 'TestFree123!',
    plan: 'free',
  },
  {
    name: 'Test Pro',
    email: 'test-pro@certifiqueai.test',
    password: 'TestPro123!',
    plan: 'pro',
  },
  {
    name: 'Test Pro AI',
    email: 'test-proai@certifiqueai.test',
    password: 'TestProAI123!',
    plan: 'pro_ai',
  },
] as const;

async function main() {
  console.log('👤 Creating test users...\n');

  for (const u of TEST_USERS) {
    const hashed = await bcrypt.hash(u.password, 12);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        password: hashed,
        plan: u.plan,
        emailVerified: new Date(),
      },
      create: {
        name: u.name,
        email: u.email,
        password: hashed,
        plan: u.plan,
        emailVerified: new Date(),
      },
    });

    console.log(`  ✅  ${u.plan.padEnd(8)}  ${u.email}  /  ${u.password}`);
  }

  console.log('\nDone.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
