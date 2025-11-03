import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  측정이력 데이터 삭제 시작...");

  const result = await prisma.measurement.deleteMany({});
  
  console.log(`✅ ${result.count}건의 측정이력 데이터가 삭제되었습니다.`);
}

main()
  .catch((e) => {
    console.error("❌ 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
