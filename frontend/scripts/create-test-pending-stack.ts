/**
 * 테스트용 PENDING_REVIEW 굴뚝 생성 스크립트
 * 실행: npx tsx scripts/create-test-pending-stack.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 테스트용 PENDING_REVIEW 굴뚝 생성 시작...\n');

  // 1. 고려아연 고객사 찾기
  const customer = await prisma.customer.findFirst({
    where: {
      name: {
        contains: '고려아연'
      }
    }
  });

  if (!customer) {
    console.log('❌ 고려아연 고객사를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 고객사 발견: ${customer.name} (${customer.id})`);

  // 2. PMMS 환경측정기업 조직 찾기
  const organization = await prisma.organization.findFirst({
    where: {
      name: {
        contains: 'PMMS'
      }
    }
  });

  if (!organization) {
    console.log('❌ PMMS 환경측정기업 조직을 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ 환경측정기업 발견: PMMS (${organization.id})`);

  // 3. 기존 CONFIRMED 굴뚝 하나를 PENDING_REVIEW로 변경
  const existingStack = await prisma.stack.findFirst({
    where: {
      customerId: customer.id,
      status: 'CONFIRMED'
    }
  });

  if (existingStack) {
    await prisma.stack.update({
      where: { id: existingStack.id },
      data: {
        status: 'PENDING_REVIEW',
        isVerified: false,
        verifiedBy: null,
        verifiedAt: null,
        draftCreatedBy: organization.id,
        draftCreatedAt: new Date()
      }
    });

    console.log(`\n✅ 기존 굴뚝을 PENDING_REVIEW로 변경:`);
    console.log(`   ID: ${existingStack.id}`);
    console.log(`   현장코드: ${existingStack.siteCode}`);
    console.log(`   현장명칭: ${existingStack.siteName}`);
  }

  // 4. 새로운 PENDING_REVIEW 굴뚝 생성
  const newStack = await prisma.stack.create({
    data: {
      customerId: customer.id,
      siteCode: 'TEST-PENDING-001',
      siteName: '테스트 검토대기 굴뚝',
      name: 'TEST-PENDING-001',
      fullName: '테스트 검토대기 굴뚝',
      location: '테스트 위치',
      height: 25.5,
      diameter: 1.2,
      isActive: true,
      isVerified: false,
      status: 'PENDING_REVIEW',
      draftCreatedBy: organization.id,
      draftCreatedAt: new Date(),
      createdBy: organization.id
    }
  });

  console.log(`\n✅ 새로운 PENDING_REVIEW 굴뚝 생성:`);
  console.log(`   ID: ${newStack.id}`);
  console.log(`   현장코드: ${newStack.siteCode}`);
  console.log(`   현장명칭: ${newStack.siteName}`);

  // 5. StackCode 생성 (내부 코드)
  await prisma.stackCode.create({
    data: {
      stack: {
        connect: { id: newStack.id }
      },
      organization: {
        connect: { id: organization.id }
      },
      internalCode: 'PMMS-TEST-001',
      internalName: 'PMMS 테스트 굴뚝',
      isPrimary: true,
      isActive: true,
      createdBy: 'SYSTEM',
    }
  });

  console.log(`   내부코드: PMMS-TEST-001`);

  // 6. 결과 확인
  const pendingCount = await prisma.stack.count({
    where: {
      customerId: customer.id,
      status: 'PENDING_REVIEW'
    }
  });

  console.log(`\n📊 최종 결과:`);
  console.log(`   ${customer.name}의 PENDING_REVIEW 굴뚝: ${pendingCount}개`);
  console.log('\n✨ 완료! 이제 검토대기 탭에서 확인하세요.');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
