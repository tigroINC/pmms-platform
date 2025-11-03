import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 측정 데이터 샘플 확인
  const measurements = await prisma.measurement.findMany({
    take: 10,
    include: {
      customer: { select: { name: true } },
      stack: { select: { name: true } },
      item: { select: { name: true, limit: true } },
    },
    orderBy: { measuredAt: 'desc' },
  });

  console.log('=== 측정 데이터 샘플 ===');
  measurements.forEach((m, idx) => {
    console.log(`\n[${idx + 1}]`);
    console.log(`  ID: ${m.id}`);
    console.log(`  고객사: ${m.customer?.name}`);
    console.log(`  배출구: ${m.stack?.name}`);
    console.log(`  항목: ${m.item?.name} (${m.itemKey})`);
    console.log(`  값: ${m.value}`);
    console.log(`  측정일시: ${m.measuredAt}`);
    console.log(`  기상: ${m.weather}`);
    console.log(`  기온: ${m.temperatureC}`);
    console.log(`  습도: ${m.humidityPct}`);
    console.log(`  기압: ${m.pressureMmHg}`);
    console.log(`  풍향: ${m.windDirection}`);
    console.log(`  풍속: ${m.windSpeedMs}`);
  });

  // 동일 시간대의 데이터 확인
  const firstMeasuredAt = measurements[0]?.measuredAt;
  if (firstMeasuredAt) {
    const sameTime = await prisma.measurement.findMany({
      where: { measuredAt: firstMeasuredAt },
      include: {
        customer: { select: { name: true } },
        stack: { select: { name: true } },
        item: { select: { name: true } },
      },
    });
    console.log(`\n\n=== 동일 시간대(${firstMeasuredAt}) 데이터 ===`);
    console.log(`총 ${sameTime.length}건`);
    sameTime.forEach((m, idx) => {
      console.log(`  [${idx + 1}] ${m.stack?.name} - ${m.item?.name}: ${m.value} (기상: ${m.weather})`);
    });
  }

  // itemKey별 데이터 확인
  const itemKeys = await prisma.measurement.groupBy({
    by: ['itemKey'],
    _count: true,
  });
  console.log('\n\n=== 항목별 데이터 건수 ===');
  itemKeys.forEach((k) => {
    console.log(`  ${k.itemKey}: ${k._count}건`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
