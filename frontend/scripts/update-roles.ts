import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 역할 업데이트 시작...");

  // ADMIN을 ORG_ADMIN으로 변경
  const adminUsers = await prisma.user.findMany({
    where: { role: "ADMIN" as any },
  });

  console.log(`📋 ADMIN 사용자 ${adminUsers.length}명 발견`);

  for (const user of adminUsers) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ORG_ADMIN" },
    });
    console.log(`✅ ${user.email}: ADMIN → ORG_ADMIN`);
  }

  // ORG_OWNER, ORG_BILLING을 ORG_ADMIN으로 변경
  const orgOwners = await prisma.user.findMany({
    where: {
      OR: [
        { role: "ORG_OWNER" as any },
        { role: "ORG_BILLING" as any },
      ],
    },
  });

  console.log(`📋 ORG_OWNER/ORG_BILLING 사용자 ${orgOwners.length}명 발견`);

  for (const user of orgOwners) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "ORG_ADMIN" },
    });
    console.log(`✅ ${user.email}: ${user.role} → ORG_ADMIN`);
  }

  console.log("✨ 역할 업데이트 완료!");
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
