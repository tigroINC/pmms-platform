import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 한국보팍터미날 ===');
  const bokpak = await prisma.customer.findMany({
    where: { name: { contains: '한국보팍' } },
    orderBy: { name: 'asc' }
  });
  bokpak.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.name}, Code: ${c.code}, SiteType: ${c.siteType}`);
  });

  console.log('\n=== 에스에이치팩 ===');
  const shpack = await prisma.customer.findMany({
    where: { name: { contains: '에스에이치팩' } },
    orderBy: { name: 'asc' }
  });
  shpack.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.name}, Code: ${c.code}, SiteType: ${c.siteType}`);
  });

  console.log(`\n총 한국보팍터미날: ${bokpak.length}개`);
  console.log(`총 에스에이치팩: ${shpack.length}개`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
