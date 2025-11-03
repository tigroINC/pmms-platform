import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('고려아연 연결 해제 중...');
  
  // CustomerOrganization에서 고려아연 연결 삭제
  const deleted = await prisma.customerOrganization.deleteMany({
    where: {
      customer: {
        name: '고려아연'
      }
    }
  });
  
  console.log(`✅ ${deleted.count}개 연결 해제 완료`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
