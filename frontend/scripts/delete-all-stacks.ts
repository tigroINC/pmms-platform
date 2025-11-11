import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllStacks() {
  try {
    console.log("⚠️  굴뚝 데이터 전체 삭제를 시작합니다...");
    
    // 현재 데이터 개수 확인
    const stackCount = await prisma.stack.count();
    const measurementCount = await prisma.measurement.count();
    const tempCount = await prisma.measurementTemp.count();
    const targetItemCount = await prisma.stackMeasurementItem.count();
    
    console.log(`📊 현재 데이터 상태:`);
    console.log(`   - 굴뚝: ${stackCount}건`);
    console.log(`   - 측정 데이터: ${measurementCount}건`);
    console.log(`   - 임시 데이터: ${tempCount}건`);
    console.log(`   - 굴뚝별 측정항목: ${targetItemCount}건`);
    
    if (stackCount === 0) {
      console.log("✅ 삭제할 굴뚝이 없습니다.");
      return;
    }
    
    console.log("\n🗑️  연관 데이터 삭제 중...");
    
    // 1. 측정 데이터 삭제
    const deletedMeasurements = await prisma.measurement.deleteMany({});
    console.log(`   ✓ 측정 데이터 ${deletedMeasurements.count}건 삭제`);
    
    // 2. 임시 데이터 삭제
    const deletedTemp = await prisma.measurementTemp.deleteMany({});
    console.log(`   ✓ 임시 데이터 ${deletedTemp.count}건 삭제`);
    
    // 3. 굴뚝별 측정항목 삭제
    const deletedTargetItems = await prisma.stackMeasurementItem.deleteMany({});
    console.log(`   ✓ 굴뚝별 측정항목 ${deletedTargetItems.count}건 삭제`);
    
    // 4. 굴뚝 관련 테이블 삭제
    const deletedStackAlias = await prisma.stackAlias.deleteMany({});
    console.log(`   ✓ 굴뚝 별칭 ${deletedStackAlias.count}건 삭제`);
    
    const deletedStackOrg = await prisma.stackOrganization.deleteMany({});
    console.log(`   ✓ 굴뚝-기업 관계 ${deletedStackOrg.count}건 삭제`);
    
    const deletedStackCode = await prisma.stackCode.deleteMany({});
    console.log(`   ✓ 굴뚝 코드 ${deletedStackCode.count}건 삭제`);
    
    const deletedStackHistory = await prisma.stackHistory.deleteMany({});
    console.log(`   ✓ 굴뚝 이력 ${deletedStackHistory.count}건 삭제`);
    
    const deletedStackUpdateLog = await prisma.stackUpdateLog.deleteMany({});
    console.log(`   ✓ 굴뚝 수정 로그 ${deletedStackUpdateLog.count}건 삭제`);
    
    const deletedStackAssignment = await prisma.stackAssignment.deleteMany({});
    console.log(`   ✓ 굴뚝 담당 할당 ${deletedStackAssignment.count}건 삭제`);
    
    const deletedStackRequest = await prisma.stackRequest.deleteMany({});
    console.log(`   ✓ 굴뚝 등록 요청 ${deletedStackRequest.count}건 삭제`);
    
    const deletedReports = await prisma.report.deleteMany({});
    console.log(`   ✓ 보고서 ${deletedReports.count}건 삭제`);
    
    const deletedEmissionLimits = await prisma.emissionLimit.deleteMany({});
    console.log(`   ✓ 배출허용기준 ${deletedEmissionLimits.count}건 삭제`);
    
    const deletedNotifications = await prisma.notification.deleteMany({ where: { stackId: { not: null } } });
    console.log(`   ✓ 굴뚝 관련 알림 ${deletedNotifications.count}건 삭제`);
    
    const deletedCommunications = await prisma.communication.deleteMany({ where: { stackId: { not: null } } });
    console.log(`   ✓ 굴뚝 관련 소통 ${deletedCommunications.count}건 삭제`);
    
    // 5. 굴뚝 삭제
    const deletedStacks = await prisma.stack.deleteMany({});
    console.log(`   ✓ 굴뚝 ${deletedStacks.count}건 삭제`);
    
    console.log("\n✅ 모든 굴뚝 데이터 삭제 완료!");
    
    // 삭제 후 확인
    const afterStackCount = await prisma.stack.count();
    const afterMeasurementCount = await prisma.measurement.count();
    const afterTempCount = await prisma.measurementTemp.count();
    const afterTargetItemCount = await prisma.stackMeasurementItem.count();
    
    console.log(`\n📊 삭제 후 데이터 상태:`);
    console.log(`   - 굴뚝: ${afterStackCount}건`);
    console.log(`   - 측정 데이터: ${afterMeasurementCount}건`);
    console.log(`   - 임시 데이터: ${afterTempCount}건`);
    console.log(`   - 굴뚝별 측정항목: ${afterTargetItemCount}건`);
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllStacks();
