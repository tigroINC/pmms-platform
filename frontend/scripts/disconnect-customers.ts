/**
 * 모든 고객사를 내부 관리 상태로 변경하는 스크립트
 * - CustomerOrganization 관계 삭제
 * - Customer status를 DRAFT로 변경
 * 실행: npx tsx scripts/disconnect-customers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 고객사를 내부 관리 상태로 변경 시작...\n");

  // 1. CustomerOrganization 관계 삭제
  const deletedRelations = await prisma.customerOrganization.deleteMany({});
  console.log(`✅ CustomerOrganization 관계 ${deletedRelations.count}개 삭제 완료`);

  // 2. 모든 Customer의 status를 DRAFT로 변경
  const updatedCustomers = await prisma.customer.updateMany({
    where: {
      status: "CONNECTED",
    },
    data: {
      status: "DRAFT",
    },
  });
  console.log(`✅ Customer status 변경: ${updatedCustomers.count}개`);

  console.log("\n📊 완료: 모든 고객사가 내부 관리 상태로 변경되었습니다.");
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
