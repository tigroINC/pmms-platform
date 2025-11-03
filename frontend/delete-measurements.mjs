import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('측정이력 데이터 삭제 시작...');
  
  // 측정이력 데이터 개수 확인
  const count = await prisma.measurement.count();
  console.log(`삭제할 측정이력 데이터: ${count}개`);
  
  if (count === 0) {
    console.log('삭제할 데이터가 없습니다.');
    await prisma.$disconnect();
    return;
  }
  
  // 모든 측정이력 데이터 삭제
  const result = await prisma.measurement.deleteMany({});
  console.log(`✅ ${result.count}개의 측정이력 데이터가 삭제되었습니다.`);
  
  // 삭제 후 확인
  const remainingCount = await prisma.measurement.count();
  console.log(`남은 측정이력 데이터: ${remainingCount}개`);
  
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('❌ 에러 발생:', error);
  process.exit(1);
});
