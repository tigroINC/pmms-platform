import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 고려아연 찾기
  const koreazinc = await prisma.customer.findFirst({
    where: { name: '고려아연' }
  });

  // 보아스환경기술 찾기
  const boaz = await prisma.organization.findFirst({
    where: { name: '보아스환경기술' }
  });

  if (!koreazinc) {
    console.error('고려아연을 찾을 수 없습니다.');
    return;
  }

  if (!boaz) {
    console.error('보아스환경기술을 찾을 수 없습니다.');
    return;
  }

  console.log(`고려아연 ID: ${koreazinc.id}`);
  console.log(`보아스환경기술 ID: ${boaz.id}`);

  // 기존 연결 확인
  const existing = await prisma.customerOrganization.findFirst({
    where: {
      customerId: koreazinc.id,
      organizationId: boaz.id
    }
  });

  if (existing) {
    console.log('이미 연결이 존재합니다:', existing);
    return;
  }

  // 연결 생성
  const connection = await prisma.customerOrganization.create({
    data: {
      customerId: koreazinc.id,
      organizationId: boaz.id,
      status: 'APPROVED',
      nickname: null,
      contractStartDate: null,
      contractEndDate: null,
      notificationEnabled: true,
      notificationEmail: null,
      notificationPhone: null,
    }
  });

  console.log('연결이 생성되었습니다:', connection);

  // 다른 고객사들도 보아스환경기술과 연결
  const otherCustomers = await prisma.customer.findMany({
    where: {
      id: { not: koreazinc.id }
    },
    take: 10 // 처음 10개만
  });

  console.log(`\n다른 고객사 ${otherCustomers.length}개도 연결 중...`);
  
  for (const customer of otherCustomers) {
    const existingConn = await prisma.customerOrganization.findFirst({
      where: {
        customerId: customer.id,
        organizationId: boaz.id
      }
    });

    if (!existingConn) {
      await prisma.customerOrganization.create({
        data: {
          customerId: customer.id,
          organizationId: boaz.id,
          status: 'APPROVED',
          nickname: null,
          contractStartDate: null,
          contractEndDate: null,
          secondCode: null,
          notificationEnabled: true,
          notificationEmail: null,
          notificationPhone: null,
        }
      });
      console.log(`${customer.name} 연결 완료`);
    }
  }

  console.log('\n모든 연결이 완료되었습니다!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
