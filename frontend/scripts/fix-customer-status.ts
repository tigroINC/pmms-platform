import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('고객사 연결 상태를 APPROVED로 업데이트 중...');
  
  // PENDING 상태인 CustomerOrganization을 모두 APPROVED로 변경
  const result = await prisma.customerOrganization.updateMany({
    where: {
      status: 'PENDING',
    },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
    },
  });

  console.log(`✅ ${result.count}건의 고객사 연결이 승인되었습니다.`);
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
