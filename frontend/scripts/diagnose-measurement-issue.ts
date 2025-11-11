import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function diagnoseMeasurementIssue() {
  try {
    console.log("🔍 측정이력 데이터 진단 시작...\n");
    
    // 1. 측정 데이터 개수 확인
    const measurementCount = await prisma.measurement.count();
    console.log(`📊 총 측정 데이터: ${measurementCount}건`);
    
    if (measurementCount === 0) {
      console.log("❌ 측정 데이터가 없습니다.");
      return;
    }
    
    // 2. 샘플 측정 데이터 확인
    const sampleMeasurements = await prisma.measurement.findMany({
      take: 5,
      include: {
        customer: true,
        stack: true,
        item: true,
      },
      orderBy: { measuredAt: 'desc' }
    });
    
    console.log(`\n📋 최근 측정 데이터 샘플 (${sampleMeasurements.length}건):`);
    sampleMeasurements.forEach((m, i) => {
      console.log(`\n${i + 1}. ID: ${m.id}`);
      console.log(`   고객사 ID: ${m.customerId} (${m.customer?.name || 'NULL'})`);
      console.log(`   굴뚝 ID: ${m.stackId} (${m.stack?.name || 'NULL'})`);
      console.log(`   항목: ${m.itemKey} (${m.item?.name || 'NULL'})`);
      console.log(`   측정값: ${m.value}`);
      console.log(`   측정일시: ${m.measuredAt}`);
      console.log(`   조직 ID: ${m.organizationId || 'NULL'}`);
    });
    
    // 3. 고객사 확인
    const customerCount = await prisma.customer.count();
    console.log(`\n👥 총 고객사: ${customerCount}건`);
    
    const customers = await prisma.customer.findMany({
      take: 5,
      select: { id: true, name: true, status: true }
    });
    console.log("고객사 샘플:");
    customers.forEach(c => {
      console.log(`  - ${c.name} (ID: ${c.id}, 상태: ${c.status})`);
    });
    
    // 4. 굴뚝 확인
    const stackCount = await prisma.stack.count();
    console.log(`\n🏭 총 굴뚝: ${stackCount}건`);
    
    const stacks = await prisma.stack.findMany({
      take: 5,
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    });
    console.log("굴뚝 샘플:");
    stacks.forEach(s => {
      console.log(`  - ${s.name} (ID: ${s.id}, 고객사: ${s.customer?.name || 'NULL'}, 상태: ${s.status})`);
    });
    
    // 5. 고객사-굴뚝 매칭 확인
    console.log("\n🔗 고객사-굴뚝 매칭 확인:");
    const allMeasurements = await prisma.measurement.findMany({
      take: 100,
      include: {
        customer: true,
        stack: { include: { customer: true } }
      }
    });
    
    const measurementsWithMismatch = allMeasurements.filter(m => 
      m.customerId !== m.stack?.customerId
    );
    
    if (measurementsWithMismatch.length > 0) {
      console.log(`⚠️  고객사 불일치 발견: ${measurementsWithMismatch.length}건`);
      measurementsWithMismatch.slice(0, 5).forEach(m => {
        console.log(`  - 측정 ID: ${m.id}`);
        console.log(`    측정의 고객사: ${m.customer?.name} (${m.customerId})`);
        console.log(`    굴뚝의 고객사: ${m.stack?.customer?.name} (${m.stack?.customerId})`);
      });
    } else {
      console.log("✅ 고객사-굴뚝 매칭 정상");
    }
    
    // 6. 조직 ID 확인
    const measurementsWithoutOrg = await prisma.measurement.count({
      where: { organizationId: null }
    });
    console.log(`\n🏢 조직 ID 없는 측정: ${measurementsWithoutOrg}건 / ${measurementCount}건`);
    
    // 7. 측정 항목 확인
    const itemCount = await prisma.item.count();
    console.log(`\n📦 총 측정 항목: ${itemCount}건`);
    
    const measurementsWithInvalidItem = await prisma.measurement.count({
      where: { item: null }
    });
    console.log(`⚠️  유효하지 않은 항목 참조: ${measurementsWithInvalidItem}건`);
    
    // 8. 날짜 범위 확인
    const dateRange = await prisma.measurement.aggregate({
      _min: { measuredAt: true },
      _max: { measuredAt: true }
    });
    console.log(`\n📅 측정 날짜 범위:`);
    console.log(`   최소: ${dateRange._min.measuredAt}`);
    console.log(`   최대: ${dateRange._max.measuredAt}`);
    
    console.log("\n✅ 진단 완료!");
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseMeasurementIssue();
