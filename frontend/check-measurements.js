const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 측정 데이터 구조 확인 ===\n');
  
  // 1. 최근 측정 데이터 5건 조회
  const recentMeasurements = await prisma.measurement.findMany({
    take: 5,
    orderBy: { measuredAt: 'desc' },
    include: {
      stack: true,
      customer: true
    }
  });
  
  console.log('최근 측정 데이터 5건:');
  recentMeasurements.forEach(m => {
    console.log(`  - itemKey: "${m.itemKey}", 고객사: ${m.customer?.name}, 굴뚝: ${m.stack?.name}, 값: ${m.value}`);
    console.log(`    보조항목 필드들:`);
    console.log(`      weather: ${m.weather}, temp: ${m.temperatureC}, humidity: ${m.humidity}`);
    console.log(`      wind_dir: ${m.windDirection}, wind_speed: ${m.windSpeed}`);
    console.log(`      gas_velocity: ${m.gasVelocity}, gas_temp: ${m.gasTemperatureC}`);
    console.log(`      moisture: ${m.moisture}, o2_measured: ${m.oxygenMeasured}, o2_standard: ${m.oxygenStandard}`);
    console.log(`      flow_rate: ${m.flowRate}\n`);
  });
  
  // 2. gasVelocity 필드에 값이 있는 데이터 확인
  const withGasVelocity = await prisma.measurement.findMany({
    where: {
      gasVelocity: { not: null }
    },
    take: 5,
    include: {
      stack: true,
      customer: true
    }
  });
  
  console.log(`\ngasVelocity 필드에 값이 있는 데이터: 총 ${withGasVelocity.length}건`);
  withGasVelocity.forEach(m => {
    console.log(`  - itemKey: "${m.itemKey}", gasVelocity: ${m.gasVelocity}, 고객사: ${m.customer?.name}, 측정일: ${m.measuredAt}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
