import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 이전 임포트에서 생성된 중복 데이터 삭제
  // (사업장 구분이 name에 포함되지 않은 것들)
  
  const toDelete = [
    'cmh8lv2z500nltn3440x4qwgm', // 한국보팍터미날 (이전)
    'cmh8lv3dl00pwtn34puynjyqn', // 에스에이치팩 (이전)
  ];

  for (const id of toDelete) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stacks: true, measurements: true }
        }
      }
    });

    if (!customer) {
      console.log(`❌ ${id}: 존재하지 않음`);
      continue;
    }

    console.log(`🔍 ${customer.name} 삭제 중...`);
    console.log(`   - 굴뚝: ${customer._count.stacks}개`);
    console.log(`   - 측정데이터: ${customer._count.measurements}개`);

    // 측정 데이터 삭제
    if (customer._count.measurements > 0) {
      await prisma.measurement.deleteMany({
        where: { customerId: id }
      });
      console.log(`   ✓ 측정데이터 삭제됨`);
    }

    // 굴뚝 별칭 삭제
    const stacks = await prisma.stack.findMany({
      where: { customerId: id },
      select: { id: true }
    });

    for (const stack of stacks) {
      await prisma.stackAlias.deleteMany({
        where: { stackId: stack.id }
      });
    }

    // 굴뚝 삭제
    if (customer._count.stacks > 0) {
      await prisma.stack.deleteMany({
        where: { customerId: id }
      });
      console.log(`   ✓ 굴뚝 삭제됨`);
    }

    // 고객사 삭제
    await prisma.customer.delete({
      where: { id }
    });
    console.log(`   ✅ ${customer.name} 삭제 완료\n`);
  }

  console.log('완료!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
