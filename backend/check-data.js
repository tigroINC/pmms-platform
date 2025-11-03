const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== 측정항목 샘플 ===');
  const items = await prisma.item.findMany({ take: 5 });
  console.log(JSON.stringify(items, null, 2));
  
  console.log('\n=== 측정 데이터 샘플 ===');
  const measurements = await prisma.measurement.findMany({ 
    take: 3,
    include: { item: true }
  });
  console.log(JSON.stringify(measurements, null, 2));
  
  await prisma.$disconnect();
}

main().catch(console.error);
