import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixStackOrganizations() {
  console.log("=== 굴뚝 담당 환경측정기업 정보 수정 시작 ===\n");

  // 1. 고려아연의 고객사 ID 찾기
  const customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { name: { contains: "고려아연" } },
        { code: "CUST001" },
      ],
    },
    select: {
      id: true,
      name: true,
      code: true,
    },
  });

  if (!customer) {
    console.error("❌ 고객사를 찾을 수 없습니다.");
    return;
  }

  console.log(`✅ 고객사 발견: ${customer.name} (${customer.code})`);

  // 2. 보아스환경기술 조직 찾기
  const organization = await prisma.organization.findFirst({
    where: {
      OR: [
        { name: { contains: "보아스" } },
        { name: { contains: "BOAZ" } },
      ],
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    console.error("❌ 환경측정기업을 찾을 수 없습니다.");
    return;
  }

  console.log(`✅ 환경측정기업 발견: ${organization.name}\n`);

  // 3. 해당 고객사의 모든 굴뚝 조회
  const stacks = await prisma.stack.findMany({
    where: {
      customerId: customer.id,
    },
    select: {
      id: true,
      name: true,
      siteCode: true,
      status: true,
      draftCreatedBy: true,
      organizations: true,
    },
  });

  console.log(`📊 총 ${stacks.length}개 굴뚝 발견\n`);

  let updatedCount = 0;
  let orgCreatedCount = 0;

  // 4. 각 굴뚝 처리
  for (const stack of stacks) {
    const updates: string[] = [];

    // 4-1. draftCreatedBy가 NULL이고 PENDING_REVIEW 상태인 경우
    if (!stack.draftCreatedBy && stack.status === "PENDING_REVIEW") {
      await prisma.stack.update({
        where: { id: stack.id },
        data: {
          draftCreatedBy: organization.id,
          draftCreatedAt: new Date(),
        },
      });
      updates.push("draftCreatedBy 설정");
      updatedCount++;
    }

    // 4-2. StackOrganization 관계가 없는 경우 생성
    if (stack.organizations.length === 0) {
      // 시스템 관리자 ID 찾기
      const admin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        select: { id: true },
      });
      
      const userId = admin?.id || "SYSTEM";
      
      await prisma.stackOrganization.create({
        data: {
          stackId: stack.id,
          organizationId: organization.id,
          status: "APPROVED",
          isPrimary: true,
          requestedBy: userId,
          approvedBy: userId,
          approvedAt: new Date(),
        },
      });
      updates.push("StackOrganization 생성");
      orgCreatedCount++;
    }

    if (updates.length > 0) {
      console.log(`✅ ${stack.siteCode}: ${updates.join(", ")}`);
    }
  }

  console.log(`\n=== 수정 완료 ===`);
  console.log(`draftCreatedBy 업데이트: ${updatedCount}개`);
  console.log(`StackOrganization 생성: ${orgCreatedCount}개`);

  // 5. 검증
  console.log("\n=== 검증 ===");
  
  const pendingWithDraft = await prisma.stack.count({
    where: {
      customerId: customer.id,
      status: "PENDING_REVIEW",
      draftCreatedBy: { not: null },
    },
  });

  const stacksWithOrgs = await prisma.stack.count({
    where: {
      customerId: customer.id,
      organizations: {
        some: {},
      },
    },
  });

  console.log(`PENDING_REVIEW 중 draftCreatedBy 있음: ${pendingWithDraft}개`);
  console.log(`StackOrganization 관계 있음: ${stacksWithOrgs}개`);

  await prisma.$disconnect();
}

fixStackOrganizations().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
