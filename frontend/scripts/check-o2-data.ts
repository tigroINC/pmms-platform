import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const o2Data = await prisma.measurement.findMany({
    where: {
      itemKey: { in: ['o2_measured', 'o2_standard'] }
    },
    include: {
      stack: { select: { name: true } },
    },
    take: 10,
    orderBy: { measuredAt: 'desc' }
  });

  console.log('=== 산소 농도 데이터 (별도 행) ===\n');
  console.log(`총 ${o2Data.length}건`);
  
  o2Data.forEach((m, idx) => {
    console.log(`\n[${idx + 1}]`);
    console.log(`  배출구: ${m.stack?.name}`);
    console.log(`  항목: ${m.itemKey}`);
    console.log(`  값: ${m.value}`);
    console.log(`  측정일시: ${m.measuredAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
