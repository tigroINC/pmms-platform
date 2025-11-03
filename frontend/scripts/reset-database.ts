import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🔥 데이터베이스 초기화 시작...\n');

  // 1. 모든 데이터 삭제 (순서 중요 - 외래키 제약조건)
  console.log('📦 기존 데이터 삭제 중...');
  
  await prisma.measurement.deleteMany({});
  console.log('  ✅ Measurement 삭제');
  
  await prisma.stackHistory.deleteMany({});
  await prisma.stackRequest.deleteMany({});
  await prisma.stackOrganization.deleteMany({});
  await prisma.stackCode.deleteMany({});
  await prisma.stackAlias.deleteMany({});
  await prisma.stackAssignment.deleteMany({});
  await prisma.stackUpdateLog.deleteMany({});
  await prisma.stack.deleteMany({});
  console.log('  ✅ Stack 관련 데이터 삭제');
  
  await prisma.customerOrganization.deleteMany({});
  await prisma.customerAssignment.deleteMany({});
  await prisma.customerInvitation.deleteMany({});
  await prisma.customer.deleteMany({});
  console.log('  ✅ Customer 관련 데이터 삭제');
  
  await prisma.activityLog.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  ✅ User 관련 데이터 삭제');
  
  await prisma.subscriptionHistory.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.organization.deleteMany({});
  console.log('  ✅ Organization 관련 데이터 삭제');
  
  await prisma.customerGroup.deleteMany({});
  await prisma.emissionLimit.deleteMany({});
  await prisma.itemLimitHistory.deleteMany({});
  console.log('  ✅ 기타 데이터 삭제');

  console.log('\n✅ 모든 데이터 삭제 완료\n');

  // 2. 시스템 관리자 계정 생성
  console.log('👤 시스템 관리자 계정 생성 중...\n');
  
  const hashedPassword = await bcrypt.hash('tigrofin1018*', 10);
  
  const superAdmin = await prisma.user.create({
    data: {
      email: 'tigrofin@gmail.com',
      password: hashedPassword,
      name: '티그로 시스템 관리자',
      phone: '010-0000-0000',
      role: 'SUPER_ADMIN',
      companyName: '티그로(Tigro)',
      status: 'APPROVED',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ 시스템 관리자 계정 생성 완료');
  console.log('   이메일: tigrofin@gmail.com');
  console.log('   비밀번호: tigrofin1018*');
  console.log('   역할: SUPER_ADMIN\n');

  // 3. 측정항목(Item) 데이터는 유지 (필수 마스터 데이터)
  const itemCount = await prisma.item.count();
  console.log(`📊 측정항목(Item) 데이터: ${itemCount}개 유지\n`);

  console.log('🎉 데이터베이스 초기화 완료!\n');
  console.log('다음 단계:');
  console.log('1. 브라우저에서 tigrofin@gmail.com으로 로그인');
  console.log('2. 환경측정기업 회원가입 승인');
  console.log('3. 환경측정기업으로 로그인하여 고객사 일괄업로드');
  console.log('4. 고객사 회원가입 및 초대 링크 테스트\n');
}

main()
  .catch((e) => {
    console.error('❌ 오류 발생:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
