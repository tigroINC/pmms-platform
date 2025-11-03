import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 기타거래처 찾기
  const etcCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { contains: '기타' } },
        { code: null },
        { code: '' }
      ]
    }
  });

  console.log('=== 기타거래처 후보 ===');
  etcCustomers.forEach(c => {
    console.log(`ID: ${c.id}, Name: ${c.name}, Code: ${c.code}`);
  });

  // 기타거래처를 CUST999로 업데이트
  for (const customer of etcCustomers) {
    if (customer.name.includes('기타') || !customer.code) {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { code: 'CUST999' }
      });
      console.log(`✅ ${customer.name} → CUST999로 업데이트`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
