import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    take: 5,
    include: {
      _count: {
        select: { stacks: true }
      }
    }
  });

  console.log('=== 고객사 데이터 확인 ===\n');
  customers.forEach((c, idx) => {
    console.log(`[${idx + 1}] ${c.name}`);
    console.log(`  코드: ${c.code || '(없음)'}`);
    console.log(`  정식명칭: ${c.fullName || '(없음)'}`);
    console.log(`  사업장구분: ${c.siteType || '(없음)'}`);
    console.log(`  주소: ${c.address || '(없음)'}`);
    console.log(`  업종: ${c.industry || '(없음)'}`);
    console.log(`  사업장종별: ${c.siteCategory || '(없음)'}`);
    console.log(`  굴뚝수: ${c._count.stacks}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
