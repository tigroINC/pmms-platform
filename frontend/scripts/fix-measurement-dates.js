const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixMeasurementDates() {
  console.log('기존 측정 데이터의 날짜 수정 시작...');
  
  // 1976년~1980년 사이의 데이터 조회 (잘못된 날짜)
  const wrongDates = await prisma.measurement.findMany({
    where: {
      measuredAt: {
        gte: new Date('1976-01-01'),
        lte: new Date('1980-12-31'),
      },
    },
    select: {
      id: true,
      measuredAt: true,
    },
  });

  console.log(`수정할 데이터: ${wrongDates.length}건`);

  let fixed = 0;
  let failed = 0;

  for (const record of wrongDates) {
    try {
      // 밀리초를 YYYYMMDDHHmmss로 역변환
      const timestamp = record.measuredAt.getTime();
      const dateStr = String(timestamp).padStart(14, '0');
      
      // YYYYMMDDHHmmss 파싱
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      const hour = parseInt(dateStr.substring(8, 10));
      const minute = parseInt(dateStr.substring(10, 12));
      const second = parseInt(dateStr.substring(12, 14));
      
      const correctDate = new Date(year, month, day, hour, minute, second);
      
      // 유효한 날짜인지 확인 (2020년 이후)
      if (correctDate.getFullYear() >= 2020 && correctDate.getFullYear() <= 2030) {
        await prisma.measurement.update({
          where: { id: record.id },
          data: { measuredAt: correctDate },
        });
        fixed++;
        
        if (fixed % 100 === 0) {
          console.log(`진행 중... ${fixed}/${wrongDates.length}`);
        }
      } else {
        console.log(`건너뜀 (유효하지 않은 날짜): ${record.id} -> ${correctDate.toISOString()}`);
        failed++;
      }
    } catch (error) {
      console.error(`실패: ${record.id}`, error);
      failed++;
    }
  }

  console.log(`완료: 성공 ${fixed}건, 실패 ${failed}건`);
  await prisma.$disconnect();
}

fixMeasurementDates()
  .then(() => {
    console.log('날짜 수정 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('오류 발생:', error);
    process.exit(1);
  });
