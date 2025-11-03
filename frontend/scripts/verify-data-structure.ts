import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 데이터 구조 검증 ===\n');

  // 1. 최근 측정 데이터 10건 확인
  const recent = await prisma.measurement.findMany({
    where: {
      itemKey: { notIn: ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'] }
    },
    include: {
      customer: { select: { name: true } },
      stack: { select: { name: true } },
      item: { select: { name: true } },
    },
    orderBy: { measuredAt: 'desc' },
    take: 10,
  });

  console.log(`최근 오염물질 측정 데이터 ${recent.length}건:\n`);
  
  recent.forEach((m, idx) => {
    console.log(`[${idx + 1}] ${m.measuredAt.toISOString().slice(0, 16).replace('T', ' ')}`);
    console.log(`    고객사: ${m.customer?.name}`);
    console.log(`    배출구: ${m.stack?.name}`);
    console.log(`    오염물질: ${m.item?.name}`);
    console.log(`    농도: ${m.value}`);
    console.log(`    기상: ${m.weather || '(없음)'}`);
    console.log(`    기온: ${m.temperatureC ?? '(없음)'}`);
    console.log(`    습도: ${m.humidityPct ?? '(없음)'}`);
    console.log(`    기압: ${m.pressureMmHg ?? '(없음)'}`);
    console.log(`    풍향: ${m.windDirection || '(없음)'}`);
    console.log(`    풍속: ${m.windSpeedMs ?? '(없음)'}`);
    console.log(`    가스속도: ${m.gasVelocityMs ?? '(없음)'}`);
    console.log(`    가스온도: ${m.gasTempC ?? '(없음)'}`);
    console.log(`    수분함량: ${m.moisturePct ?? '(없음)'}`);
    console.log(`    실측산소농도: ${m.oxygenMeasuredPct ?? '(없음)'}`);
    console.log(`    표준산소농도: ${m.oxygenStdPct ?? '(없음)'}`);
    console.log(`    배출가스유량: ${m.flowSm3Min ?? '(없음)'}`);
    console.log('');
  });

  // 2. 동일 시간대 데이터 확인
  if (recent.length > 0) {
    const first = recent[0];
    const sameTime = await prisma.measurement.findMany({
      where: {
        stackId: first.stackId,
        measuredAt: first.measuredAt,
      },
      include: {
        item: { select: { name: true } },
      },
    });

    console.log(`\n=== 동일 시간대(${first.measuredAt.toISOString().slice(0, 16)}) 데이터 ===`);
    console.log(`배출구: ${first.stack?.name}`);
    console.log(`총 ${sameTime.length}건\n`);
    
    sameTime.forEach((m, idx) => {
      console.log(`[${idx + 1}] ${m.item?.name}: ${m.value}`);
      console.log(`    기상: ${m.weather || '(없음)'}, 기온: ${m.temperatureC ?? '(없음)'}, 습도: ${m.humidityPct ?? '(없음)'}`);
    });
  }

  // 3. itemKey가 기상 데이터인 행 확인
  const weatherItems = await prisma.measurement.count({
    where: {
      itemKey: { in: ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'] }
    }
  });

  console.log(`\n\n=== 기상 데이터 (itemKey로 저장된 행) ===`);
  console.log(`총 ${weatherItems}건`);
  console.log('\n⚠️  이 데이터는 불필요합니다. 모든 기상 정보는 오염물질 행의 컬럼에 저장되어야 합니다.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
