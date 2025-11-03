/**
 * 기존 고객사 연결 해제 및 내부 관리 상태로 전환
 * 
 * 목적:
 * - 기존 CustomerOrganization 연결 삭제
 * - Customer.isPublic을 false로 변경 (내부 관리 상태)
 * - Customer.createdBy를 환경측정기업 관리자로 설정
 * 
 * 실행: npx tsx scripts/migrate-disconnect-customers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 기존 고객사 연결 해제 마이그레이션 시작...\n');

  try {
    // 1. 보아스환경기술 조직 찾기
    const organization = await prisma.organization.findFirst({
      where: { name: '보아스환경기술' },
      include: {
        users: {
          where: { role: 'ORG_ADMIN' },
          take: 1,
        },
      },
    });

    if (!organization) {
      console.error('❌ 보아스환경기술 조직을 찾을 수 없습니다.');
      return;
    }

    const adminUser = organization.users[0];
    if (!adminUser) {
      console.error('❌ 보아스환경기술 관리자를 찾을 수 없습니다.');
      return;
    }

    console.log(`✅ 조직: ${organization.name} (ID: ${organization.id})`);
    console.log(`✅ 관리자: ${adminUser.name} (${adminUser.email})\n`);

    // 2. 기존 연결된 고객사 조회
    const connections = await prisma.customerOrganization.findMany({
      where: {
        organizationId: organization.id,
        status: 'APPROVED',
      },
      include: {
        customer: true,
      },
    });

    console.log(`📊 연결된 고객사 수: ${connections.length}개\n`);

    if (connections.length === 0) {
      console.log('✅ 연결 해제할 고객사가 없습니다.');
      return;
    }

    // 3. 확인 메시지
    console.log('다음 고객사들의 연결이 해제됩니다:');
    connections.forEach((conn, idx) => {
      console.log(`  ${idx + 1}. ${conn.customer.name} (${conn.customer.businessNumber})`);
    });
    console.log('');

    // 4. 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 4-1. CustomerOrganization 삭제
      const deletedConnections = await tx.customerOrganization.deleteMany({
        where: {
          organizationId: organization.id,
          status: 'APPROVED',
        },
      });

      console.log(`✅ CustomerOrganization 삭제: ${deletedConnections.count}개`);

      // 4-2. Customer 업데이트 (isPublic: false, createdBy 설정)
      const customerIds = connections.map((c) => c.customerId);
      const updatedCustomers = await tx.customer.updateMany({
        where: {
          id: { in: customerIds },
        },
        data: {
          isPublic: false,
          createdBy: adminUser.id,
        },
      });

      console.log(`✅ Customer 업데이트: ${updatedCustomers.count}개 (isPublic: false, createdBy 설정)`);

      // 4-3. 활동 로그 기록
      await tx.activityLog.create({
        data: {
          userId: adminUser.id,
          action: 'MIGRATE_DISCONNECT_CUSTOMERS',
          target: 'CustomerOrganization',
          details: JSON.stringify({
            organizationId: organization.id,
            organizationName: organization.name,
            disconnectedCount: deletedConnections.count,
            customerIds,
          }),
        },
      });

      return {
        deletedConnections: deletedConnections.count,
        updatedCustomers: updatedCustomers.count,
      };
    });

    console.log('\n✅ 마이그레이션 완료!');
    console.log(`   - 연결 해제: ${result.deletedConnections}개`);
    console.log(`   - 고객사 업데이트: ${result.updatedCustomers}개`);
    console.log('\n📝 결과:');
    console.log('   - 기존 고객사들이 "내부 관리" 상태로 전환되었습니다.');
    console.log('   - 초대 링크를 생성하여 고객사와 다시 연결할 수 있습니다.');
    console.log('   - 기존 측정 데이터는 그대로 유지됩니다.\n');
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    throw error;
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
