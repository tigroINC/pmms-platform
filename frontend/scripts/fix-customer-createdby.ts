/**
 * Customer의 createdBy를 organizationId에서 userId로 수정하는 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Customer createdBy 수정 시작...\n");

  // 보아스 조직 찾기
  const org = await prisma.organization.findFirst({
    where: { name: "보아스환경기술" },
  });

  if (!org) {
    console.error("❌ 보아스환경기술 조직을 찾을 수 없습니다.");
    return;
  }

  console.log(`✅ 조직: ${org.name} (${org.id})\n`);

  // Admin 사용자 찾기
  const admin = await prisma.user.findFirst({
    where: {
      organizationId: org.id,
      role: "ORG_ADMIN",
    },
  });

  if (!admin) {
    console.error("❌ ORG_ADMIN 사용자를 찾을 수 없습니다.");
    return;
  }

  console.log(`✅ Admin: ${admin.name} (${admin.id})\n`);

  // createdBy가 organizationId인 고객사를 userId로 변경
  const updated = await prisma.customer.updateMany({
    where: {
      createdBy: org.id,
    },
    data: {
      createdBy: admin.id,
    },
  });

  console.log(`✅ ${updated.count}개 고객사의 createdBy를 수정했습니다.`);
  console.log(`   organizationId (${org.id}) → userId (${admin.id})`);
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
