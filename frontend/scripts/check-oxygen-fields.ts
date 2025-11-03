import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const measurement = await prisma.measurement.findFirst({
    where: { itemKey: 'EA-I-0001' },
  });

  if (measurement) {
    console.log('=== 오염물질 데이터 필드 ===\n');
    console.log('모든 필드:', Object.keys(measurement));
    console.log('\n=== 산소 관련 필드 ===');
    console.log('oxygenMeasuredPct:', measurement.oxygenMeasuredPct);
    console.log('oxygenStdPct:', measurement.oxygenStdPct);
    
    console.log('\n=== 전체 데이터 ===');
    console.log(JSON.stringify(measurement, null, 2));
  } else {
    console.log('데이터를 찾을 수 없습니다.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
