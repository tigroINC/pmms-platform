import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function diagnoseStackData() {
  console.log("=== 굴뚝 데이터 진단 시작 ===\n");

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
      customerId: true,
      isActive: true,
    },
  });

  console.log(`📊 전체 굴뚝 수: ${allStacks.length}\n`);

  // 상태별 분류
  const byStatus = allStacks.reduce((acc, s) => {
    const status = s.status || "NULL";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log("상태별 굴뚝 수:");
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`  ${status}: ${count}개`);
  });

  // 2. PENDING_REVIEW 굴뚝 상세 분석
  const pendingStacks = allStacks.filter(s => s.status === "PENDING_REVIEW");
  console.log(`\n\n=== PENDING_REVIEW 굴뚝 분석 (${pendingStacks.length}개) ===`);

  if (pendingStacks.length === 0) {
    console.log("⚠️ PENDING_REVIEW 상태의 굴뚝이 없습니다!");
    console.log("검토대기 탭이 비어있는 이유입니다.\n");
  } else {
    for (const stack of pendingStacks.slice(0, 3)) {
      console.log(`\n굴뚝 ID: ${stack.id}`);
      console.log(`  siteCode: ${stack.siteCode}`);
      console.log(`  siteName: ${stack.siteName}`);
      console.log(`  code: ${stack.code || "❌ NULL"}`);
      console.log(`  draftCreatedBy: ${stack.draftCreatedBy || "❌ NULL"}`);

      if (stack.draftCreatedBy) {
        const org = await prisma.organization.findUnique({
          where: { id: stack.draftCreatedBy },
          select: { name: true },
        });
        console.log(`  ✅ 담당 환경측정기업: ${org?.name || "조회 실패"}`);
      } else {
        console.log(`  ❌ draftCreatedBy가 NULL이므로 담당 환경측정기업을 찾을 수 없습니다!`);
      }
    }
  }

  // 3. 전체 탭 (CONFIRMED) 굴뚝 분석
  const confirmedStacks = allStacks.filter(s => s.isActive);
  console.log(`\n\n=== 전체 탭 (활성 굴뚝) 분석 (${confirmedStacks.length}개) ===`);

  // StackOrganization 관계 확인
  const stacksWithOrgs = await prisma.stack.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      siteCode: true,
      organizations: {
        where: {
          status: "APPROVED",
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    take: 5,
  });

  console.log("\n샘플 굴뚝 5개의 StackOrganization 관계:");
  for (const stack of stacksWithOrgs) {
    console.log(`\n굴뚝: ${stack.siteCode} (${stack.name})`);
    if (stack.organizations.length > 0) {
      console.log(`  ✅ 담당 환경측정기업 (${stack.organizations.length}개):`);
      stack.organizations.forEach(so => {
        console.log(`    - ${so.organization.name}`);
      });
    } else {
      console.log(`  ❌ StackOrganization 관계가 없습니다!`);
    }
  }

  // 4. API 응답 시뮬레이션 (전체 탭)
  console.log("\n\n=== API 응답 시뮬레이션: GET /api/stacks ===");
  
  const apiStacks = await prisma.stack.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ customer: { code: "asc" } }, { code: "asc" }],
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          code: true,
          isActive: true,
        },
      },
      organizations: {
        where: {
          status: "APPROVED",
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      _count: {
        select: { measurements: true },
      },
    },
    take: 3,
  });

  for (const stack of apiStacks) {
    let orgNames: string[] = [];

    // StackOrganization에서 담당 환경측정회사
    if (stack.organizations && stack.organizations.length > 0) {
      orgNames = stack.organizations.map(o => o.organization.name);
    }

    // PENDING_REVIEW 상태이고 draftCreatedBy가 있으면 해당 조직 추가
    if (stack.status === "PENDING_REVIEW" && stack.draftCreatedBy && orgNames.length === 0) {
      const draftOrg = await prisma.organization.findUnique({
        where: { id: stack.draftCreatedBy },
        select: { name: true },
      });
      if (draftOrg) {
        orgNames.push(draftOrg.name);
      }
    }

    console.log(`\n굴뚝: ${stack.siteCode}`);
    console.log(`  상태: ${stack.status || "NULL"}`);
    console.log(`  StackOrganization 수: ${stack.organizations.length}`);
    console.log(`  draftCreatedBy: ${stack.draftCreatedBy || "NULL"}`);
    console.log(`  organizationNames: ${orgNames.length > 0 ? orgNames.join(", ") : "❌ 없음"}`);
  }

  // 5. API 응답 시뮬레이션 (검토대기 탭)
  console.log("\n\n=== API 응답 시뮬레이션: GET /api/customer/stacks/pending-review ===");

  const pendingApiStacks = await prisma.stack.findMany({
    where: {
      status: "PENDING_REVIEW",
    },
    orderBy: {
      draftCreatedAt: "desc",
    },
    take: 3,
  });

  // draftCreatedBy로 Organization 정보 조회
  const organizationIds = [...new Set(pendingApiStacks.map(s => s.draftCreatedBy).filter(Boolean))] as string[];
  const organizations = await prisma.organization.findMany({
    where: {
      id: { in: organizationIds },
    },
    select: {
      id: true,
      name: true,
    },
  });
  const orgMap = new Map(organizations.map(o => [o.id, o]));

  console.log(`\nPENDING_REVIEW 굴뚝 ${pendingApiStacks.length}개 중 샘플 3개:`);
  for (const stack of pendingApiStacks) {
    const org = stack.draftCreatedBy ? orgMap.get(stack.draftCreatedBy) : null;
    
    console.log(`\n굴뚝: ${stack.siteCode}`);
    console.log(`  code: ${stack.code || "❌ NULL"}`);
    console.log(`  draftCreatedBy: ${stack.draftCreatedBy || "❌ NULL"}`);
    console.log(`  담당 환경측정기업: ${org?.name || "❌ 없음"}`);
    
    if (!stack.draftCreatedBy) {
      console.log(`  ⚠️ 문제: draftCreatedBy가 NULL이므로 담당 환경측정기업을 표시할 수 없습니다!`);
    }
    if (!stack.code) {
      console.log(`  ⚠️ 문제: code가 NULL이므로 굴뚝코드를 표시할 수 없습니다!`);
    }
  }

  // 6. 종합 진단
  console.log("\n\n=== 종합 진단 결과 ===");
  
  const issues: string[] = [];
  
  if (pendingStacks.length === 0) {
    issues.push("❌ PENDING_REVIEW 상태의 굴뚝이 없어 검토대기 탭이 비어있습니다.");
  } else {
    const pendingWithoutDraftCreatedBy = pendingStacks.filter(s => !s.draftCreatedBy).length;
    if (pendingWithoutDraftCreatedBy > 0) {
      issues.push(`❌ PENDING_REVIEW 굴뚝 중 ${pendingWithoutDraftCreatedBy}개가 draftCreatedBy가 NULL입니다.`);
    }
    
    const pendingWithoutCode = pendingStacks.filter(s => !s.code).length;
    if (pendingWithoutCode > 0) {
      issues.push(`❌ PENDING_REVIEW 굴뚝 중 ${pendingWithoutCode}개가 code가 NULL입니다.`);
    }
  }

  const confirmedWithoutOrgs = stacksWithOrgs.filter(s => s.organizations.length === 0).length;
  if (confirmedWithoutOrgs > 0) {
    issues.push(`❌ 활성 굴뚝 중 ${confirmedWithoutOrgs}개가 StackOrganization 관계가 없습니다.`);
  }

  if (issues.length === 0) {
    console.log("✅ 데이터 구조에 문제가 없습니다.");
    console.log("문제는 프론트엔드 코드나 API 응답 처리에 있을 수 있습니다.");
  } else {
    console.log("발견된 문제:");
    issues.forEach(issue => console.log(`  ${issue}`));
  }

  await prisma.$disconnect();
}

diagnoseStackData().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
