/**
 * 기존 CONFIRMED 굴뚝을 PENDING_REVIEW로 재설정
 * 실행: npx tsx scripts/reset-stack-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 굴뚝 상태 재설정 시작...\n');

  // 1. 고객사 직접 등록 굴뚝 찾기 (CONFIRMED 유지)
  const customerUsers = await prisma.user.findMany({
    where: {
      role: {
        in: ['CUSTOMER_ADMIN', 'CUSTOMER_USER']
      }
    },
    select: { id: true }
  });

  const customerUserIds = customerUsers.map(u => u.id);

  const customerStacks = await prisma.stack.findMany({
    where: {
      status: 'CONFIRMED',
      createdBy: {
        in: customerUserIds
      }
    }
  });

  console.log(`✅ 고객사 직접 등록 굴뚝 (CONFIRMED 유지): ${customerStacks.length}건`);

  // 2. 나머지 CONFIRMED 굴뚝 → PENDING_REVIEW
  const result = await prisma.stack.updateMany({
    where: {
      status: 'CONFIRMED',
      createdBy: {
        notIn: customerUserIds
      }
    },
    data: {
      status: 'PENDING_REVIEW',
      isVerified: false,
      verifiedBy: null,
      verifiedAt: null
    }
  });

  console.log(`✅ 환경측정기업 등록 굴뚝 → PENDING_REVIEW: ${result.count}건`);

  // 3. 결과 확인
  console.log('\n📊 최종 상태 집계:');
  const statusCounts = await prisma.$queryRaw<Array<{ status: string; count: bigint }>>`
    SELECT 
      COALESCE(status, 'NULL') as status,
      COUNT(*) as count
    FROM Stack
    GROUP BY status
    ORDER BY count DESC
  `;

  statusCounts.forEach(({ status, count }) => {
    console.log(`   ${status}: ${count}건`);
  });

  console.log('\n✨ 완료! 이제 검토대기 탭에서 확인하세요.');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
