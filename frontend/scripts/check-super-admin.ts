import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== SUPER_ADMIN 계정 확인 ===\n');
  
  const superAdmins = await prisma.user.findMany({
    where: {
      role: 'SUPER_ADMIN',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      status: true,
      isActive: true,
    }
  });

  if (superAdmins.length === 0) {
    console.log('❌ SUPER_ADMIN 계정이 없습니다!');
    console.log('   데이터베이스 초기화 스크립트를 다시 실행하세요.');
    return;
  }

  console.log(`✅ SUPER_ADMIN 계정: ${superAdmins.length}개\n`);
  superAdmins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name} (${admin.email})`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   상태: ${admin.status}`);
    console.log(`   활성: ${admin.isActive}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
