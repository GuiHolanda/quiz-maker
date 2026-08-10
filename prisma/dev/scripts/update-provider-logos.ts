import { prisma } from '@/lib/prisma';

const LOGO_UPDATES = [
  {
    name: 'GARP',
    logoUrl:
      'https://upload.wikimedia.org/wikipedia/en/thumb/2/26/Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png/330px-Global_Association_of_Risk_Professionals_%28GARP%29_Logo.png',
  },
  {
    name: 'CFP Board',
    logoUrl: 'https://www.cfp.net/assets/images/logo-cfp-board-black-white.svg',
  },
  {
    name: 'ANBIMA',
    logoUrl:
      'https://www.anbima.com.br/lumis-theme/br/com/anbima/portal/theme/portal-anbima/assets/img/logo-anbima.png',
  },
  {
    name: 'ANCORD',
    logoUrl: 'https://www.ancord.org.br/wp-content/themes/ancord/assets/images/logo-ancord.svg',
  },
  {
    name: 'PLANEJAR',
    logoUrl: 'https://framerusercontent.com/images/0mCuFuGOnN9T9Ux7ioZdPGcujw.png',
  },
];

async function main() {
  console.log('Updating provider logos...');

  for (const { name, logoUrl } of LOGO_UPDATES) {
    const result = await prisma.provider.updateMany({
      where: { name },
      data: { logoUrl },
    });
    if (result.count > 0) {
      console.log(`  Updated: ${name}`);
    } else {
      console.log(`  Not found: ${name}`);
    }
  }

  console.log('\nDone.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
