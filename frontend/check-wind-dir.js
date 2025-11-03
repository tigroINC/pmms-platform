const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 풍향 관련 측정항목 조회 ===\n');
  
  const windItems = await prisma.item.findMany({
    where: {
      OR: [
        { name: { contains: '풍향' } },
        { key: { contains: 'wind' } },
        { key: { contains: 'dir' } },
      ]
    }
  });
  
  console.log(`풍향 관련 항목: ${windItems.length}개`);
  windItems.forEach(item => {
    console.log(`  - key: "${item.key}", name: "${item.name}", category: "${item.category}"`);
  });
  
  // 보조항목만 필터링
  const auxWindItems = windItems.filter(item => item.category === '보조항목');
  console.log(`\n보조항목 중 풍향: ${auxWindItems.length}개`);
  auxWindItems.forEach(item => {
    console.log(`  - key: "${item.key}", name: "${item.name}"`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
