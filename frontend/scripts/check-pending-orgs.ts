import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 승인 대기 중인 환경측정기업 확인 ===\n');
  
  const organizations = await prisma.organization.findMany({
    where: {
      isActive: false,
    },
    select: {
      id: true,
      name: true,
      businessNumber: true,
      isActive: true,
      createdAt: true,
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`총 ${organizations.length}개의 승인 대기 중인 환경측정기업\n`);

  organizations.forEach((org, index) => {
    console.log(`${index + 1}. ${org.name}`);
    console.log(`   ID: ${org.id}`);
    console.log(`   사업자번호: ${org.businessNumber || 'N/A'}`);
    console.log(`   상태: ${org.isActive ? '활성' : '승인 대기'}`);
    console.log(`   등록일: ${org.createdAt.toLocaleString('ko-KR')}`);
    console.log(`   관리자: ${org.users.length}명`);
    org.users.forEach(user => {
      console.log(`     - ${user.name} (${user.email}) - ${user.role} - ${user.status}`);
    });
    console.log('');
  });

  // 전체 환경측정기업 수
  const totalOrgs = await prisma.organization.count();
  console.log(`전체 환경측정기업: ${totalOrgs}개`);
  console.log(`활성: ${totalOrgs - organizations.length}개`);
  console.log(`승인 대기: ${organizations.length}개`);
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
