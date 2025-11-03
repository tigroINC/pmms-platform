import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 전체 데이터 통계
  const total = await prisma.measurement.count();
  console.log(`=== 전체 데이터 통계 ===`);
  console.log(`총 측정 데이터: ${total}건\n`);

  // 오염물질 vs 기상 데이터
  const weatherKeys = ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'];
  
  const pollutantCount = await prisma.measurement.count({
    where: { itemKey: { notIn: weatherKeys } }
  });
  
  const weatherDataCount = await prisma.measurement.count({
    where: { itemKey: { in: weatherKeys } }
  });

  console.log(`오염물질 측정 데이터: ${pollutantCount}건`);
  console.log(`기상/보조 데이터: ${weatherDataCount}건\n`);

  // 오염물질 데이터 중 기상 정보가 있는 것과 없는 것
  const pollutantWithWeather = await prisma.measurement.count({
    where: { 
      itemKey: { notIn: weatherKeys },
      weather: { not: null }
    }
  });

  const pollutantWithoutWeather = await prisma.measurement.count({
    where: { 
      itemKey: { notIn: weatherKeys },
      weather: null
    }
  });

  console.log(`오염물질 데이터 중:`);
  console.log(`  기상 정보 있음: ${pollutantWithWeather}건`);
  console.log(`  기상 정보 없음: ${pollutantWithoutWeather}건\n`);

  // 기상 정보가 없는 오염물질 데이터 샘플
  if (pollutantWithoutWeather > 0) {
    console.log(`\n=== 기상 정보가 없는 오염물질 데이터 샘플 ===`);
    const samples = await prisma.measurement.findMany({
      where: { 
        itemKey: { notIn: weatherKeys },
        weather: null
      },
      include: {
        customer: { select: { name: true } },
        stack: { select: { name: true } },
        item: { select: { name: true } },
      },
      take: 10,
      orderBy: { measuredAt: 'desc' }
    });

    samples.forEach((m, idx) => {
      console.log(`\n[${idx + 1}]`);
      console.log(`  고객사: ${m.customer?.name}`);
      console.log(`  배출구: ${m.stack?.name}`);
      console.log(`  항목: ${m.item?.name} (${m.itemKey})`);
      console.log(`  값: ${m.value}`);
      console.log(`  측정일시: ${m.measuredAt}`);
      console.log(`  기상: ${m.weather}, 기온: ${m.temperatureC}, 습도: ${m.humidityPct}`);
    });

    // 동일 시간대에 기상 정보가 있는 다른 행이 있는지 확인
    if (samples.length > 0) {
      const firstSample = samples[0];
      const sameTime = await prisma.measurement.findMany({
        where: {
          stackId: firstSample.stackId,
          measuredAt: firstSample.measuredAt,
        },
        include: {
          item: { select: { name: true } },
        },
      });

      console.log(`\n\n=== 동일 시간대(${firstSample.measuredAt}) 데이터 ===`);
      console.log(`총 ${sameTime.length}건`);
      sameTime.forEach((m, idx) => {
        console.log(`  [${idx + 1}] ${m.item?.name}: ${m.value} (기상: ${m.weather})`);
      });
    }
  }

  // 중복 데이터 확인 (전체)
  console.log(`\n\n=== 중복 데이터 확인 (전체) ===`);
  const allMeasurements = await prisma.measurement.findMany({
    select: {
      id: true,
      stackId: true,
      itemKey: true,
      value: true,
      measuredAt: true,
    },
  });

  const seen = new Set<string>();
  const duplicates: any[] = [];
  
  allMeasurements.forEach((m) => {
    const d = new Date(m.measuredAt);
    const minuteEpoch = Math.floor(d.getTime() / 60000);
    const key = `${m.stackId}|${m.itemKey}|${minuteEpoch}`;
    if (seen.has(key)) {
      duplicates.push({ key, id: m.id, value: m.value });
    }
    seen.add(key);
  });

  if (duplicates.length > 0) {
    console.log(`중복 데이터 발견: ${duplicates.length}건`);
    duplicates.slice(0, 10).forEach((d, idx) => {
      console.log(`  [${idx + 1}] ${d.key} - ID: ${d.id}, 값: ${d.value}`);
    });
  } else {
    console.log('중복 데이터가 없습니다.');
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
