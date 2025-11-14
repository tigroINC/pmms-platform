import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create initial admin user (Tigro System Admin)
  const adminEmail = "tigrofin@gmail.com";
  const adminPassword = await bcrypt.hash("tigrofin1018*", 10);
  
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "SUPER_ADMIN", // 역할 업데이트
      status: "APPROVED",
      isActive: true,
    },
    create: {
      email: adminEmail,
      password: adminPassword,
      name: "티그로 시스템 관리자",
      role: "SUPER_ADMIN",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ SUPER_ADMIN user created/updated: ${adminEmail} / tigrofin1018*`);

  // Create test organization (PMMS 환경측정기업)
  const pmmsOrg = await prisma.organization.upsert({
    where: { businessNumber: "123-45-67890" },
    update: {},
    create: {
      name: "PMMS 환경측정기업",
      businessNumber: "123-45-67890",
      businessType: "측정대행업",
      address: "서울특별시 강남구",
      phone: "02-1234-5678",
      email: "info@pmms.com",
      subscriptionPlan: "PREMIUM",
      subscriptionStatus: "ACTIVE",
      maxUsers: 50,
      maxStacks: 100,
      maxDataRetention: 365,
    },
  });
  console.log(`✅ Organization created: ${pmmsOrg.name}`);

  // Create ORG_ADMIN (PMMS 환경측정기업 관리자)
  const orgAdminPassword = await bcrypt.hash("pmms1234!", 10);
  const orgAdmin = await prisma.user.upsert({
    where: { email: "admin@pmms.com" },
    update: {
      role: "ORG_ADMIN",
      organizationId: pmmsOrg.id,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      email: "admin@pmms.com",
      password: orgAdminPassword,
      name: "김관리",
      phone: "010-1111-2222",
      role: "ORG_ADMIN",
      organizationId: pmmsOrg.id,
      companyName: "PMMS 환경측정기업",
      department: "관리팀",
      position: "팀장",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ ORG_ADMIN created: ${orgAdmin.email} / pmms1234!`);

  // Create OPERATOR (PMMS 환경측정기업 실무자)
  const operatorPassword = await bcrypt.hash("operator1234!", 10);
  const operator = await prisma.user.upsert({
    where: { email: "operator@pmms.com" },
    update: {
      role: "OPERATOR",
      organizationId: pmmsOrg.id,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      email: "operator@pmms.com",
      password: operatorPassword,
      name: "이실무",
      phone: "010-2222-3333",
      role: "OPERATOR",
      organizationId: pmmsOrg.id,
      companyName: "PMMS 환경측정기업",
      department: "측정팀",
      position: "대리",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ OPERATOR created: ${operator.email} / operator1234!`);

  // Create test customer (고려아연)
  let customer = await prisma.customer.findFirst({
    where: { name: "고려아연" },
  });
  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: "고려아연",
        code: "KZ001",
        businessNumber: "234-56-78901",
        fullName: "주식회사 고려아연",
        address: "충청남도 온양시",
        industry: "제련업",
        siteCategory: "1종",
        createdBy: orgAdmin.id,
        isPublic: false,
        status: "CONNECTED",
      },
    });
  }
  console.log(`✅ Customer created: ${customer.name}`);

  // Create CustomerOrganization relationship (고려아연 ↔ PMMS 환경측정기업)
  const existingCustomerOrg = await prisma.customerOrganization.findFirst({
    where: {
      customerId: customer.id,
      organizationId: pmmsOrg.id,
    },
  });
  if (!existingCustomerOrg) {
    await prisma.customerOrganization.create({
      data: {
        customerId: customer.id,
        organizationId: pmmsOrg.id,
        status: "APPROVED",
        requestedBy: "ORGANIZATION",
      },
    });
  }
  console.log(`✅ CustomerOrganization relationship created`);

  // Create CUSTOMER_ADMIN (고려아연 관리자)
  const customerAdminPassword = await bcrypt.hash("customer1234!", 10);
  const customerAdmin = await prisma.user.upsert({
    where: { email: "admin@koreazinc.com" },
    update: {
      role: "CUSTOMER_ADMIN",
      customerId: customer.id,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      email: "admin@koreazinc.com",
      password: customerAdminPassword,
      name: "박고객",
      phone: "010-3333-4444",
      role: "CUSTOMER_ADMIN",
      customerId: customer.id,
      companyName: "고려아연",
      department: "환경안전팀",
      position: "과장",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ CUSTOMER_ADMIN created: ${customerAdmin.email} / customer1234!`);

  // Create CUSTOMER_USER (고려아연 일반 사용자)
  const customerUserPassword = await bcrypt.hash("user1234!", 10);
  const customerUser = await prisma.user.upsert({
    where: { email: "user@koreazinc.com" },
    update: {
      role: "CUSTOMER_USER",
      customerId: customer.id,
      status: "APPROVED",
      isActive: true,
    },
    create: {
      email: "user@koreazinc.com",
      password: customerUserPassword,
      name: "최사원",
      phone: "010-4444-5555",
      role: "CUSTOMER_USER",
      customerId: customer.id,
      companyName: "고려아연",
      department: "환경안전팀",
      position: "사원",
      status: "APPROVED",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log(`✅ CUSTOMER_USER created: ${customerUser.email} / user1234!`);

  console.log("\n📋 테스트 계정 목록:");
  console.log("1. 시스템 관리자 (티그로): tigrofin@gmail.com / tigrofin1018*");
  console.log("2. 환경측정기업 관리자 (PMMS): admin@pmms.com / pmms1234!");
  console.log("3. 환경측정기업 임직원 (PMMS): operator@pmms.com / operator1234!");
  console.log("4. 고객사 관리자 (고려아연): admin@koreazinc.com / customer1234!");
  console.log("5. 고객사 사용자 (고려아연): user@koreazinc.com / user1234!");

  // Create system settings for organization registration
  const orgRegistrationFields = await prisma.systemSettings.upsert({
    where: { key: "org_registration_required_fields" },
    update: {},
    create: {
      key: "org_registration_required_fields",
      value: JSON.stringify({
        required: ["name", "businessNumber"],  // 초기 필수: 법인명, 사업자등록번호
        optional: ["corporateNumber", "businessType", "address", "phone", "email", "representative", "website", "fax", "establishedDate"]
      }),
      description: "환경측정기업 회원가입 시 필수/선택 입력 항목",
      category: "registration",
    },
  });
  console.log(`✅ System settings created: ${orgRegistrationFields.key}`);

  // Check if mock data exists
  let MOCK_CUSTOMERS: any[] = [];
  let MOCK_ITEMS: any[] = [];
  let MOCK_HISTORY: any[] = [];
  
  try {
    // @ts-ignore - mock 파일이 없을 수 있음
    const mockData = await import("../src/data/mock");
    MOCK_CUSTOMERS = mockData.MOCK_CUSTOMERS || [];
    MOCK_ITEMS = mockData.MOCK_ITEMS || [];
    MOCK_HISTORY = mockData.MOCK_HISTORY || [];
  } catch (e) {
    console.log("ℹ️  No mock data found, skipping...");
  }

  // Customers (mock)
  for (const c of MOCK_CUSTOMERS) {
    const existing = await prisma.customer.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.customer.create({ data: { name: c.name } });
    }
  }

  // Items
  for (const i of MOCK_ITEMS) {
    await prisma.item.upsert({
      where: { key: i.key },
      update: { name: i.name, unit: i.unit, limit: i.limit },
      create: { key: i.key, name: i.name, unit: i.unit, limit: i.limit },
    });
  }

  // Stacks (derive from history per customer)
  const customers = await prisma.customer.findMany();
  const getCustomerIdByName = (name: string) => customers.find((c) => c.name === name)?.id as string;
  const stackSet = new Set<string>();
  for (const r of MOCK_HISTORY) {
    // infer customer name from id in mock
    const customerName = r.customerId === "c1" ? "A회사" : r.customerId === "c2" ? "B회사" : r.customerId;
    const key = `${customerName}::${r.stack}`;
    if (!stackSet.has(key)) {
      stackSet.add(key);
      await prisma.stack.upsert({
        where: { customerId_name: { customerId: getCustomerIdByName(customerName), name: r.stack } },
        update: {},
        create: { customerId: getCustomerIdByName(customerName), name: r.stack },
      });
    }
  }

  // Measurements
  const stacks = await prisma.stack.findMany();
  const items = await prisma.item.findMany();
  const findStackId = (customerId: string, name: string) => stacks.find((s) => s.customerId === customerId && s.name === name)?.id as string;
  for (const r of MOCK_HISTORY) {
    const customerName = r.customerId === "c1" ? "A회사" : r.customerId === "c2" ? "B회사" : r.customerId;
    const customerId = getCustomerIdByName(customerName);
    const stackId = findStackId(customerId, r.stack);
    const itemKey = r.itemKey;
    const item = items.find((i) => i.key === itemKey);
    if (!customerId || !stackId || !item) continue;
    await prisma.measurement.create({
      data: {
        customerId,
        stackId,
        itemKey,
        value: r.value,
        measuredAt: new Date(r.measuredAt),
        organizationId: pmmsOrg.id,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
