import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== createdBy 수정 시작 ===\n');
  
  // admin@boaz.com 사용자 찾기
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@boaz.com' },
    select: { id: true, organizationId: true }
  });

  if (!adminUser) {
    console.error('❌ admin@boaz.com 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 사용자 확인: ${adminUser.id}`);
  console.log(`✅ 조직 ID: ${adminUser.organizationId}\n`);

  // createdBy가 null이고 organizations가 없거나 PENDING인 고객사 찾기
  const customers = await prisma.customer.findMany({
    where: {
      createdBy: null,
    },
    include: {
      organizations: true,
    }
  });

  console.log(`createdBy가 null인 고객사: ${customers.length}개\n`);

  let updatedCount = 0;
  let deletedOrgCount = 0;

  for (const customer of customers) {
    // organizations 연결 삭제 (PENDING 상태)
    if (customer.organizations.length > 0) {
      const deleted = await prisma.customerOrganization.deleteMany({
        where: {
          customerId: customer.id,
          status: 'PENDING',
        }
      });
      deletedOrgCount += deleted.count;
    }

    // createdBy 업데이트
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        createdBy: adminUser.id,
        isPublic: false,
      }
    });

    updatedCount++;
    console.log(`✅ ${customer.code || 'NO_CODE'}: ${customer.name}`);
  }

  console.log(`\n완료: ${updatedCount}개 고객사 업데이트, ${deletedOrgCount}개 연결 삭제`);
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
