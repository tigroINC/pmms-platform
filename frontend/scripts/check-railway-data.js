// Railway PostgreSQL 데이터 확인 스크립트
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('🔍 Railway 데이터베이스 확인 시작...\n');
    
    // 1. 측정 데이터 개수
    const measurementCount = await prisma.measurement.count();
    console.log(`📊 측정 데이터: ${measurementCount}건`);
    
    // 2. 고객사 개수
    const customerCount = await prisma.customer.count();
    console.log(`👥 고객사: ${customerCount}건`);
    
    // 3. 굴뚝 개수
    const stackCount = await prisma.stack.count();
    console.log(`🏭 굴뚝: ${stackCount}건`);
    
    if (measurementCount > 0) {
      // 샘플 데이터 확인
      const samples = await prisma.measurement.findMany({
        take: 3,
        include: {
          customer: { select: { id: true, name: true } },
          stack: { select: { id: true, name: true, customerId: true } },
          item: { select: { key: true, name: true } }
        },
        orderBy: { measuredAt: 'desc' }
      });
      
      console.log('\n📋 최근 측정 데이터 샘플:');
      samples.forEach((m, i) => {
        console.log(`\n${i + 1}번째 데이터:`);
        console.log(`  측정 ID: ${m.id}`);
        console.log(`  고객사: ${m.customer?.name || 'NULL'} (ID: ${m.customerId})`);
        console.log(`  굴뚝: ${m.stack?.name || 'NULL'} (ID: ${m.stackId})`);
        console.log(`  굴뚝의 고객사 ID: ${m.stack?.customerId || 'NULL'}`);
        console.log(`  항목: ${m.item?.name || 'NULL'} (${m.itemKey})`);
        console.log(`  측정값: ${m.value}`);
        console.log(`  측정일시: ${m.measuredAt}`);
        console.log(`  조직 ID: ${m.organizationId || 'NULL'}`);
        
        // 불일치 체크
        if (m.customerId !== m.stack?.customerId) {
          console.log(`  ⚠️  경고: 측정의 고객사 ID와 굴뚝의 고객사 ID가 다릅니다!`);
        }
      });
    }
    
    console.log('\n✅ 확인 완료');
    
  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
