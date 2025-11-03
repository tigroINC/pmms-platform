const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 풍향 실제 데이터 값 확인 ===\n');
  
  // windDirection 필드에 값이 있는 데이터 조회
  const measurements = await prisma.measurement.findMany({
    where: {
      windDirection: { not: null }
    },
    select: {
      windDirection: true,
      weather: true,
      measuredAt: true
    },
    take: 20,
    orderBy: { measuredAt: 'desc' }
  });
  
  console.log(`windDirection 필드에 값이 있는 데이터: ${measurements.length}건\n`);
  
  // 고유한 풍향 값 추출
  const uniqueWindDirs = [...new Set(measurements.map(m => m.windDirection).filter(Boolean))];
  console.log('고유한 풍향 값:');
  uniqueWindDirs.forEach(val => {
    console.log(`  - "${val}"`);
  });
  
  // 고유한 기상 값 추출
  const uniqueWeathers = [...new Set(measurements.map(m => m.weather).filter(Boolean))];
  console.log('\n고유한 기상 값:');
  uniqueWeathers.forEach(val => {
    console.log(`  - "${val}"`);
  });
  
  // 샘플 데이터 출력
  console.log('\n샘플 데이터 (최근 5건):');
  measurements.slice(0, 5).forEach(m => {
    console.log(`  - 풍향: "${m.windDirection}", 기상: "${m.weather}", 측정일: ${m.measuredAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
