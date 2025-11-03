import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('불필요한 측정항목 확인 중...\n');
  
  // 보조항목 키 목록 (삭제 대상 제외)
  const AUXILIARY_ITEM_KEYS = [
    'weather', 'temp', 'humidity', 'pressure', 
    'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 
    'moisture', 'o2_measured', 'o2_standard', 'flow_rate'
  ];
  
  // 1. 허용기준이 없고 (hasLimit = false) 측정 데이터가 없는 항목 찾기
  const items = await prisma.item.findMany({
    where: {
      hasLimit: false,
      key: { notIn: AUXILIARY_ITEM_KEYS } // 보조항목은 제외
    },
    include: {
      _count: {
        select: { measurements: true }
      }
    }
  });
  
  console.log('📋 허용기준 N 항목 목록:');
  items.forEach(item => {
    console.log(`- ${item.key}: ${item.name} (측정 횟수: ${item._count.measurements}회)`);
  });
  
  // 2. 측정 데이터가 없는 항목만 필터링
  const itemsToDelete = items.filter(item => item._count.measurements === 0);
  
  if (itemsToDelete.length === 0) {
    console.log('\n✅ 삭제할 항목이 없습니다.');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`\n🗑️  삭제 대상 항목 (${itemsToDelete.length}개):`);
  itemsToDelete.forEach(item => {
    console.log(`- ${item.key}: ${item.name}`);
  });
  
  // 3. 삭제 실행
  const deleteResult = await prisma.item.deleteMany({
    where: {
      key: { in: itemsToDelete.map(item => item.key) }
    }
  });
  
  console.log(`\n✅ ${deleteResult.count}개 항목 삭제 완료`);
  
  // 4. 최종 결과
  const remaining = await prisma.item.count();
  const pollutants = await prisma.item.count({ where: { category: '오염물질' } });
  const auxiliary = await prisma.item.count({ where: { category: '보조항목' } });
  
  console.log('\n📊 최종 결과:');
  console.log(`- 전체 항목: ${remaining}개`);
  console.log(`- 오염물질: ${pollutants}개`);
  console.log(`- 보조항목: ${auxiliary}개`);
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
