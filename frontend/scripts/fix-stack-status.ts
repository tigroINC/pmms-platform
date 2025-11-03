/**
 * 기존 굴뚝 데이터 상태 업데이트 스크립트
 * 실행: npx tsx scripts/fix-stack-status.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 굴뚝 상태 업데이트 시작...\n');

  // 1. 고객사 직접 등록 굴뚝 → CONFIRMED (우선 처리)
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
      OR: [
        { status: null },
        { status: '' }
      ],
      createdBy: {
        in: customerUserIds
      }
    }
  });

  for (const stack of customerStacks) {
    await prisma.stack.update({
      where: { id: stack.id },
      data: {
        status: 'CONFIRMED',
        isVerified: true,
        verifiedBy: stack.createdBy,
        verifiedAt: new Date()
      }
    });
  }
  console.log(`✅ 고객사 직접 등록 굴뚝 CONFIRMED: ${customerStacks.length}건`);

  // 2. 나머지 모든 굴뚝 → PENDING_REVIEW (기본값)
  const remainingResult = await prisma.$executeRaw`
    UPDATE Stack 
    SET status = 'PENDING_REVIEW',
        isVerified = 0
    WHERE (status IS NULL OR status = '')
  `;
  console.log(`✅ 나머지 굴뚝 PENDING_REVIEW (검토 필요): ${remainingResult}건`);

  // 4. 결과 확인
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

  console.log('\n✨ 완료!');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
