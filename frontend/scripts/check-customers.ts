import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('\n=== 고객사 데이터 확인 ===\n');
  
  // 모든 고객사 조회
  const customers = await prisma.customer.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      createdBy: true,
      isPublic: true,
      organizations: {
        select: {
          organizationId: true,
          status: true,
        }
      }
    },
    orderBy: { code: 'asc' },
  });

  console.log(`총 고객사 수: ${customers.length}\n`);

  // createdBy가 있는 고객사 (내부 관리)
  const internal = customers.filter(c => c.createdBy);
  console.log(`createdBy가 있는 고객사: ${internal.length}개`);
  
  // organizations 연결이 있는 고객사
  const connected = customers.filter(c => c.organizations.length > 0);
  console.log(`organizations 연결이 있는 고객사: ${connected.length}개`);
  
  // 최근 5개 출력
  console.log('\n최근 등록된 고객사 5개:');
  customers.slice(-5).forEach(c => {
    console.log(`- ${c.code || 'NO_CODE'}: ${c.name}`);
    console.log(`  createdBy: ${c.createdBy || 'null'}`);
    console.log(`  isPublic: ${c.isPublic}`);
    console.log(`  organizations: ${c.organizations.length}개 (${c.organizations.map(o => o.status).join(', ')})`);
  });

  // 사용자 확인
  console.log('\n=== 사용자 확인 ===\n');
  const users = await prisma.user.findMany({
    where: {
      role: { in: ['ORG_ADMIN', 'OPERATOR'] }
    },
    select: {
      id: true,
      email: true,
      role: true,
      organizationId: true,
    }
  });
  
  console.log('환경측정기업 사용자:');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}): orgId=${u.organizationId}, userId=${u.id}`);
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
