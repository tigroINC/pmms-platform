import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPendingStacks() {
  console.log("=== 검토대기 굴뚝 상태 확인 ===\n");

  // 1. 전체 굴뚝 상태 확인
  const allStacks = await prisma.stack.findMany({
    select: {
      id: true,
      name: true,
      siteCode: true,
      siteName: true,
      code: true,
      status: true,
      draftCreatedBy: true,
      draftCreatedAt: true,
      customerId: true,
    },
  });

  console.log(`전체 굴뚝 수: ${allStacks.length}`);
  
  const statusCount = allStacks.reduce((acc, s) => {
    const status = s.status || "NULL";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log("\n상태별 굴뚝 수:");
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}개`);
  });

  // 2. PENDING_REVIEW 굴뚝 상세 정보
  const pendingStacks = allStacks.filter(s => s.status === "PENDING_REVIEW");
  
  console.log(`\n\n=== PENDING_REVIEW 굴뚝 상세 (${pendingStacks.length}개) ===`);
  
  for (const stack of pendingStacks) {
    console.log(`\n굴뚝 ID: ${stack.id}`);
    console.log(`  굴뚝번호(siteCode): ${stack.siteCode}`);
    console.log(`  굴뚝명(siteName): ${stack.siteName}`);
    console.log(`  굴뚝코드(code): ${stack.code || "없음"}`);
    console.log(`  상태: ${stack.status}`);
    console.log(`  draftCreatedBy: ${stack.draftCreatedBy || "없음"}`);
    console.log(`  draftCreatedAt: ${stack.draftCreatedAt?.toISOString() || "없음"}`);
    
    // 고객사 정보
    const customer = await prisma.customer.findUnique({
      where: { id: stack.customerId },
      select: { name: true, code: true },
    });
    console.log(`  고객사: ${customer?.name} (${customer?.code})`);
    
    // 환경측정기업 정보
    if (stack.draftCreatedBy) {
      const org = await prisma.organization.findUnique({
        where: { id: stack.draftCreatedBy },
        select: { name: true },
      });
      console.log(`  담당 환경측정기업: ${org?.name || "조회 실패"}`);
    }
  }

  // 3. 고객사별 PENDING_REVIEW 굴뚝 수
  const customerPendingCount = pendingStacks.reduce((acc, s) => {
    acc[s.customerId] = (acc[s.customerId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("\n\n=== 고객사별 PENDING_REVIEW 굴뚝 수 ===");
  for (const [customerId, count] of Object.entries(customerPendingCount)) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { name: true, code: true },
    });
    console.log(`${customer?.name} (${customer?.code}): ${count}개`);
  }

  await prisma.$disconnect();
}

checkPendingStacks().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
