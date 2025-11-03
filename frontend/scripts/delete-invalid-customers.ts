import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const invalidNames = ['A회사', 'B회사', '30'];
  
  console.log('=== 잘못된 고객사 삭제 ===\n');
  
  for (const name of invalidNames) {
    const customer = await prisma.customer.findUnique({
      where: { name },
      include: {
        _count: {
          select: { stacks: true, measurements: true }
        }
      }
    });
    
    if (!customer) {
      console.log(`❌ ${name}: 존재하지 않음`);
      continue;
    }
    
    console.log(`🔍 ${name} 발견:`);
    console.log(`   - 굴뚝: ${customer._count.stacks}개`);
    console.log(`   - 측정데이터: ${customer._count.measurements}개`);
    
    // 연관 데이터 먼저 삭제
    if (customer._count.measurements > 0) {
      await prisma.measurement.deleteMany({
        where: { customerId: customer.id }
      });
      console.log(`   ✓ 측정데이터 삭제됨`);
    }
    
    if (customer._count.stacks > 0) {
      // 굴뚝 별칭 먼저 삭제
      const stacks = await prisma.stack.findMany({
        where: { customerId: customer.id },
        select: { id: true }
      });
      for (const stack of stacks) {
        await prisma.stackAlias.deleteMany({
          where: { stackId: stack.id }
        });
      }
      
      await prisma.stack.deleteMany({
        where: { customerId: customer.id }
      });
      console.log(`   ✓ 굴뚝 삭제됨`);
    }
    
    // 고객사 삭제
    await prisma.customer.delete({
      where: { id: customer.id }
    });
    console.log(`   ✅ ${name} 삭제 완료\n`);
  }
  
  console.log('완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
