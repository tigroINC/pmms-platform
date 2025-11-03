const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 가스속도 관련 측정항목 조회 ===\n');
  
  // 1. "가스" 또는 "속도"가 포함된 모든 측정항목 조회
  const items = await prisma.item.findMany({
    where: {
      OR: [
        { name: { contains: '가스' } },
        { name: { contains: '속도' } },
        { key: { contains: 'gas' } },
        { key: { contains: 'velocity' } },
      ]
    }
  });
  
  console.log('측정항목 목록:');
  items.forEach(item => {
    console.log(`  - key: "${item.key}", name: "${item.name}", category: "${item.category}"`);
  });
  
  // 2. 보조항목 전체 조회
  console.log('\n보조항목 전체 목록:');
  const auxItems = await prisma.item.findMany({
    where: { category: '보조항목' }
  });
  auxItems.forEach(item => {
    console.log(`  - key: "${item.key}", name: "${item.name}"`);
  });
  
  // 3. gas_velocity로 저장된 측정 데이터 확인
  console.log('\n\ngas_velocity 측정 데이터 확인:');
  const measurements = await prisma.measurement.findMany({
    where: { itemKey: 'gas_velocity' },
    take: 5,
    include: {
      stack: true,
      customer: true
    }
  });
  console.log(`총 ${measurements.length}건 (최대 5건 표시)`);
  measurements.forEach(m => {
    console.log(`  - 고객사: ${m.customer?.name}, 굴뚝: ${m.stack?.name}, 값: ${m.value}, 측정일: ${m.measuredAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
