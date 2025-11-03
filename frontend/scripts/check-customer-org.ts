import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== 고객사 목록 ===');
  const customers = await prisma.customer.findMany({
    select: { id: true, name: true }
  });
  customers.forEach(c => console.log(`ID: ${c.id}, Name: ${c.name}`));

  console.log('\n=== 환경측정기업 목록 ===');
  const orgs = await prisma.organization.findMany({
    select: { id: true, name: true }
  });
  orgs.forEach(o => console.log(`ID: ${o.id}, Name: ${o.name}`));

  console.log('\n=== CustomerOrganization 연결 ===');
  const connections = await prisma.customerOrganization.findMany({
    include: {
      customer: { select: { name: true } },
      organization: { select: { name: true } }
    }
  });
  
  if (connections.length === 0) {
    console.log('연결이 없습니다!');
  } else {
    connections.forEach(conn => {
      console.log(`Customer: ${conn.customer.name}, Org: ${conn.organization.name}, Status: ${conn.status}, Nickname: ${conn.nickname || 'N/A'}`);
    });
  }

  console.log('\n=== 고려아연 사용자 확인 ===');
  const users = await prisma.user.findMany({
    where: {
      email: { contains: 'koreazinc' }
    },
    include: {
      customer: { select: { name: true, id: true } }
    }
  });
  
  users.forEach(u => {
    console.log(`Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Customer: ${u.customer?.name || 'N/A'}, CustomerID: ${u.customerId || 'N/A'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
