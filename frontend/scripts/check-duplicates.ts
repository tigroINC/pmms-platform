import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 동일 시간대, 동일 배출구, 동일 항목의 중복 데이터 확인
  const measurements = await prisma.measurement.findMany({
    include: {
      customer: { select: { name: true } },
      stack: { select: { name: true } },
      item: { select: { name: true } },
    },
    orderBy: [{ measuredAt: 'desc' }, { stackId: 'asc' }, { itemKey: 'asc' }],
    take: 100,
  });

  console.log('=== 중복 데이터 확인 ===\n');

  // 시간대별로 그룹화
  const byTime = new Map<string, any[]>();
  measurements.forEach((m) => {
    const d = new Date(m.measuredAt);
    const minuteEpoch = Math.floor(d.getTime() / 60000);
    const key = `${m.stackId}|${minuteEpoch}`;
    if (!byTime.has(key)) {
      byTime.set(key, []);
    }
    byTime.get(key)!.push(m);
  });

  // 중복 확인
  let duplicateCount = 0;
  byTime.forEach((items, key) => {
    const [stackId, minuteEpoch] = key.split('|');
    const byItem = new Map<string, any[]>();
    items.forEach((m) => {
      if (!byItem.has(m.itemKey)) {
        byItem.set(m.itemKey, []);
      }
      byItem.get(m.itemKey)!.push(m);
    });

    byItem.forEach((sameItems, itemKey) => {
      if (sameItems.length > 1) {
        duplicateCount++;
        console.log(`\n[중복 발견]`);
        console.log(`  시간: ${new Date(parseInt(minuteEpoch) * 60000).toISOString()}`);
        console.log(`  배출구: ${sameItems[0].stack?.name} (${stackId})`);
        console.log(`  항목: ${sameItems[0].item?.name} (${itemKey})`);
        console.log(`  중복 건수: ${sameItems.length}건`);
        sameItems.forEach((m, idx) => {
          console.log(`    [${idx + 1}] ID: ${m.id}, 값: ${m.value}, 기상: ${m.weather}`);
        });
      }
    });
  });

  if (duplicateCount === 0) {
    console.log('중복 데이터가 없습니다.');
  } else {
    console.log(`\n총 ${duplicateCount}개의 중복 그룹이 발견되었습니다.`);
  }

  // 오염물질 데이터의 기상 정보 확인
  console.log('\n\n=== 오염물질 데이터의 기상 정보 확인 ===\n');
  const pollutantItems = measurements.filter(
    (m) => !['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'].includes(m.itemKey)
  );

  const withWeather = pollutantItems.filter((m) => m.weather !== null).length;
  const withoutWeather = pollutantItems.filter((m) => m.weather === null).length;

  console.log(`오염물질 측정 데이터: 총 ${pollutantItems.length}건`);
  console.log(`  기상 정보 있음: ${withWeather}건`);
  console.log(`  기상 정보 없음: ${withoutWeather}건`);

  if (pollutantItems.length > 0) {
    console.log('\n샘플 데이터:');
    pollutantItems.slice(0, 5).forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.stack?.name} - ${m.item?.name}: ${m.value}`);
      console.log(`      기상: ${m.weather}, 기온: ${m.temperatureC}, 습도: ${m.humidityPct}`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
