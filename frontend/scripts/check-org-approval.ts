import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 환경측정기업 승인 가능 여부 체크 ===\n');
  
  // 승인 대기 중인 환경측정기업 찾기
  const pendingOrgs = await prisma.organization.findMany({
    where: {
      isActive: false,
    },
    include: {
      users: {
        where: {
          role: 'ORG_ADMIN',
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          isActive: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });

  if (pendingOrgs.length === 0) {
    console.log('❌ 승인 대기 중인 환경측정기업이 없습니다.');
    return;
  }

  const org = pendingOrgs[0];
  console.log(`환경측정기업: ${org.name}`);
  console.log(`ID: ${org.id}`);
  console.log(`사업자번호: ${org.businessNumber || 'N/A'}`);
  console.log(`현재 상태:`);
  console.log(`  - isActive: ${org.isActive}`);
  console.log(`  - subscriptionStatus: ${org.subscriptionStatus}`);
  console.log(`\n관리자 계정:`);
  
  if (org.users.length === 0) {
    console.log('  ❌ 관리자 계정이 없습니다! (문제 발견)');
  } else {
    org.users.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`);
      console.log(`    role: ${user.role}`);
      console.log(`    status: ${user.status}`);
      console.log(`    isActive: ${user.isActive}`);
    });
  }

  // 승인 시뮬레이션
  console.log('\n=== 승인 시뮬레이션 ===\n');
  console.log('다음과 같이 변경됩니다:');
  console.log('\nOrganization:');
  console.log(`  isActive: false → true`);
  console.log(`  subscriptionStatus: ${org.subscriptionStatus} → ACTIVE`);
  console.log(`  subscriptionStartAt: null → ${new Date().toISOString()}`);
  
  console.log('\nORG_ADMIN 사용자:');
  org.users.forEach(user => {
    console.log(`  ${user.email}:`);
    console.log(`    status: ${user.status} → APPROVED`);
    console.log(`    isActive: ${user.isActive} → true`);
  });

  // 실제 승인 테스트 (주석 처리)
  console.log('\n⚠️  실제 승인을 테스트하려면 아래 주석을 해제하세요.');
  /*
  console.log('\n=== 실제 승인 실행 ===\n');
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.organization.update({
        where: { id: org.id },
        data: {
          isActive: true,
          subscriptionStatus: 'ACTIVE',
          subscriptionStartAt: new Date(),
        },
      });

      await tx.user.updateMany({
        where: {
          organizationId: org.id,
          role: 'ORG_ADMIN',
        },
        data: {
          status: 'APPROVED',
          isActive: true,
        },
      });
    });

    console.log('✅ 승인 성공!');
  } catch (error) {
    console.error('❌ 승인 실패:', error);
  }
  */
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
