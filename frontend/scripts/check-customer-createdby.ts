/**
 * Customer의 createdBy 필드 확인 스크립트
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Customer createdBy 확인...\n");

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

  // Customer 확인
  const customers = await prisma.customer.findMany({
    take: 10,
    select: {
      id: true,
      name: true,
      createdBy: true,
      status: true,
    },
  });

  console.log("고객사 샘플 (10개):");
  customers.forEach((c) => {
    console.log(`- ${c.name}: createdBy=${c.createdBy}, status=${c.status}`);
  });

  // createdBy가 organizationId인 경우 카운트
  const wrongCreatedBy = await prisma.customer.count({
    where: {
      createdBy: org.id,
    },
  });

  console.log(`\n⚠️  createdBy가 organizationId인 고객사: ${wrongCreatedBy}개`);

  // createdBy가 userId인 경우 카운트
  const correctCreatedBy = await prisma.customer.count({
    where: {
      createdBy: admin.id,
    },
  });

  console.log(`✅ createdBy가 userId인 고객사: ${correctCreatedBy}개`);
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
