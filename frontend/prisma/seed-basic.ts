import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedBasic() {
  console.log('🌱 Seeding basic data...');

  // 1. 기본 조직 (보아스환경기술)
  const org = await prisma.organization.upsert({
    where: { businessNumber: '123-45-67890' },
    update: {},
    create: {
      name: '보아스환경기술',
      businessNumber: '123-45-67890',
      address: '서울시 강남구',
      phone: '02-1234-5678',
      subscriptionPlan: 'PREMIUM',
      subscriptionStatus: 'ACTIVE',
      isActive: true,
    },
  });
  console.log(`  ✓ 조직 생성: ${org.name}`);

  // 2. 시스템 관리자 (티그로)
  const superAdminPassword = await bcrypt.hash('tigrofin1018*', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'tigrofin@gmail.com' },
    update: {},
    create: {
      email: 'tigrofin@gmail.com',
      password: superAdminPassword,
      name: '티그로 관리자',
      role: 'SUPER_ADMIN',
      status: 'APPROVED',
      accessScope: 'SYSTEM',
    },
  });
  console.log(`  ✓ SUPER_ADMIN: ${superAdmin.email}`);

  // 3. 환경측정기업 관리자
  const orgAdminPassword = await bcrypt.hash('boaz1234!', 10);
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@boaz.com' },
    update: {},
    create: {
      email: 'admin@boaz.com',
      password: orgAdminPassword,
      name: '김관리',
      role: 'ORG_ADMIN',
      organizationId: org.id,
      status: 'APPROVED',
      accessScope: 'ORGANIZATION',
      department: '관리팀',
      position: '팀장',
    },
  });
  console.log(`  ✓ ORG_ADMIN: ${orgAdmin.email}`);

  // 4. 환경측정기업 실무자
  const operatorPassword = await bcrypt.hash('operator1234!', 10);
  const operator = await prisma.user.upsert({
    where: { email: 'operator@boaz.com' },
    update: {},
    create: {
      email: 'operator@boaz.com',
      password: operatorPassword,
      name: '이실무',
      role: 'OPERATOR',
      organizationId: org.id,
      status: 'APPROVED',
      accessScope: 'ORGANIZATION',
      department: '측정팀',
      position: '대리',
    },
  });
  console.log(`  ✓ OPERATOR: ${operator.email}`);

  // 5. 고객사 (고려아연)
  const customer = await prisma.customer.upsert({
    where: { name: '고려아연' },
    update: {},
    create: {
      name: '고려아연',
      code: 'CUST001',
      fullName: '고려아연㈜온산제련소',
      address: '울산광역시 울주군',
      industry: '제조업',
      createdBy: orgAdmin.id,
      status: 'DRAFT',
      isActive: true,
    },
  });
  console.log(`  ✓ 고객사 생성: ${customer.name}`);

  // 6. 고객사-조직 연결
  await prisma.customerOrganization.upsert({
    where: {
      customerId_organizationId: {
        customerId: customer.id,
        organizationId: org.id,
      },
    },
    update: {},
    create: {
      customer: { connect: { id: customer.id } },
      organization: { connect: { id: org.id } },
      status: 'APPROVED',
      requestedBy: 'ORGANIZATION',
    },
  });
  console.log(`  ✓ 고객사-조직 연결 완료`);

  // 7. 고객사 관리자
  const customerAdminPassword = await bcrypt.hash('customer1234!', 10);
  const customerAdmin = await prisma.user.upsert({
    where: { email: 'admin@koreazinc.com' },
    update: {},
    create: {
      email: 'admin@koreazinc.com',
      password: customerAdminPassword,
      name: '박고객',
      role: 'CUSTOMER_ADMIN',
      customerId: customer.id,
      status: 'APPROVED',
      accessScope: 'SITE',
      department: '환경안전팀',
      position: '과장',
    },
  });
  console.log(`  ✓ CUSTOMER_ADMIN: ${customerAdmin.email}`);

  // 8. 고객사 일반 사용자
  const customerUserPassword = await bcrypt.hash('user1234!', 10);
  const customerUser = await prisma.user.upsert({
    where: { email: 'user@koreazinc.com' },
    update: {},
    create: {
      email: 'user@koreazinc.com',
      password: customerUserPassword,
      name: '최사원',
      role: 'CUSTOMER_USER',
      customerId: customer.id,
      status: 'APPROVED',
      accessScope: 'SITE',
      department: '환경안전팀',
      position: '사원',
    },
  });
  console.log(`  ✓ CUSTOMER_USER: ${customerUser.email}`);

  console.log('✅ Basic data seeded successfully!');
}

seedBasic()
  .catch((e) => {
    console.error('❌ Error seeding basic data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
