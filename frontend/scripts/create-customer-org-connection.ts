import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 고려아연 찾기
  const koreazinc = await prisma.customer.findFirst({
    where: { name: '고려아연' }
  });

  // PMMS 환경측정기업 찾기
  const pmms = await prisma.organization.findFirst({
    where: { name: 'PMMS 환경측정기업' }
  });

  if (!koreazinc) {
    console.error('고려아연을 찾을 수 없습니다.');
    return;
  }

  if (!pmms) {
    console.error('PMMS 환경측정기업을 찾을 수 없습니다.');
    return;
  }

  console.log(`고려아연 ID: ${koreazinc.id}`);
  console.log(`PMMS 환경측정기업 ID: ${pmms.id}`);

  // 기존 연결 확인
  const existing = await prisma.customerOrganization.findFirst({
    where: {
      customerId: koreazinc.id,
      organizationId: pmms.id
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
      organizationId: pmms.id,
      status: 'APPROVED',
      requestedBy: 'ORGANIZATION',
      contractStartDate: null,
      contractEndDate: null,
      customCode: null,
      nickname: null,
      proposedData: null,
      notified30Days: false,
      notified21Days: false,
      notified14Days: false,
      notified7Days: false,
      notifiedExpiry: false,
      isActive: true,
      approvedAt: null,
      approvedBy: null,
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
        organizationId: pmms.id
      }
    });

    if (!existingConn) {
      await prisma.customerOrganization.create({
        data: {
          customerId: customer.id,
          organizationId: pmms.id,
          status: 'APPROVED',
          requestedBy: 'ORGANIZATION',
          contractStartDate: null,
          contractEndDate: null,
          customCode: null,
          nickname: null,
          proposedData: null,
          notified30Days: false,
          notified21Days: false,
          notified14Days: false,
          notified7Days: false,
          notifiedExpiry: false,
          isActive: true,
          approvedAt: null,
          approvedBy: null,
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
