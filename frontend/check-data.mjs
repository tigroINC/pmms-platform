import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== 측정항목 샘플 (먼지) ===');
  const items = await prisma.item.findMany({ 
    where: { name: { contains: '먼지' } },
    take: 3
  });
  console.log(JSON.stringify(items, null, 2));
  
  console.log('\n=== 측정 데이터 샘플 (먼지) ===');
  const measurements = await prisma.measurement.findMany({ 
    where: { 
      item: { name: { contains: '먼지' } }
    },
    take: 3,
    include: { item: true, stack: true }
  });
  console.log(JSON.stringify(measurements, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
