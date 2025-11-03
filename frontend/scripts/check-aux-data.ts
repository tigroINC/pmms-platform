import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 보조항목 데이터 확인 중...\n");

  // 최근 10개 측정 데이터 조회
  const measurements = await prisma.measurement.findMany({
    take: 10,
    orderBy: { measuredAt: 'desc' },
    include: {
      stack: { select: { name: true } },
      item: { select: { name: true } },
    },
  });

  console.log(`총 ${measurements.length}건의 최근 측정 데이터:\n`);

  measurements.forEach((m, idx) => {
    console.log(`[${idx + 1}] ${m.stack.name} - ${m.item.name}`);
    console.log(`   측정일시: ${m.measuredAt.toISOString()}`);
    console.log(`   측정값: ${m.value}`);
    console.log(`   기상: ${m.weather || '(없음)'}`);
    console.log(`   풍향: ${m.windDirection || '(없음)'}`);
    console.log(`   기온: ${m.temperatureC ?? '(없음)'}`);
    console.log(`   습도: ${m.humidityPct ?? '(없음)'}`);
    console.log(`   기압: ${m.pressureMmHg ?? '(없음)'}`);
    console.log(`   풍속: ${m.windSpeedMs ?? '(없음)'}`);
    console.log(`   가스속도: ${m.gasVelocityMs ?? '(없음)'}`);
    console.log(`   가스온도: ${m.gasTempC ?? '(없음)'}`);
    console.log(`   수분함량: ${m.moisturePct ?? '(없음)'}`);
    console.log(`   실측산소: ${m.oxygenMeasuredPct ?? '(없음)'}`);
    console.log(`   표준산소: ${m.oxygenStdPct ?? '(없음)'}`);
    console.log(`   배출가스유량: ${m.flowSm3Min ?? '(없음)'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error("❌ 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
