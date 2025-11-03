import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('측정항목 category 업데이트 시작...');
  
  // 보조항목 키 목록
  const AUXILIARY_ITEM_KEYS = [
    'weather', 'temp', 'humidity', 'pressure', 
    'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 
    'moisture', 'o2_measured', 'o2_standard', 'flow_rate'
  ];
  
  // 1. 보조항목 업데이트
  const auxiliaryResult = await prisma.item.updateMany({
    where: {
      key: { in: AUXILIARY_ITEM_KEYS }
    },
    data: {
      category: '보조항목'
    }
  });
  console.log(`✅ 보조항목 ${auxiliaryResult.count}개 업데이트 완료`);
  
  // 2. 나머지는 오염물질로 업데이트
  const pollutantResult = await prisma.item.updateMany({
    where: {
      key: { notIn: AUXILIARY_ITEM_KEYS },
      OR: [
        { category: null },
        { category: '' },
        { category: { not: '보조항목' } }
      ]
    },
    data: {
      category: '오염물질'
    }
  });
  console.log(`✅ 오염물질 ${pollutantResult.count}개 업데이트 완료`);
  
  // 3. 결과 확인
  const pollutants = await prisma.item.count({ where: { category: '오염물질' } });
  const auxiliary = await prisma.item.count({ where: { category: '보조항목' } });
  const uncategorized = await prisma.item.count({ where: { OR: [{ category: null }, { category: '' }] } });
  
  console.log('\n📊 업데이트 결과:');
  console.log(`- 오염물질: ${pollutants}개`);
  console.log(`- 보조항목: ${auxiliary}개`);
  console.log(`- 미분류: ${uncategorized}개`);
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
