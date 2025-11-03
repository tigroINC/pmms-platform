import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllMeasurements() {
  try {
    console.log("⚠️  측정 데이터 전체 삭제를 시작합니다...");
    
    // 현재 데이터 개수 확인
    const count = await prisma.measurement.count();
    console.log(`📊 현재 측정 데이터: ${count}건`);
    
    if (count === 0) {
      console.log("✅ 삭제할 데이터가 없습니다.");
      return;
    }
    
    // 전체 삭제
    const result = await prisma.measurement.deleteMany({});
    console.log(`✅ 측정 데이터 ${result.count}건 삭제 완료!`);
    
    // 삭제 후 확인
    const afterCount = await prisma.measurement.count();
    console.log(`📊 삭제 후 측정 데이터: ${afterCount}건`);
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllMeasurements();
