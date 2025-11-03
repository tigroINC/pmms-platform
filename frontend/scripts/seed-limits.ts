/**
 * 배출허용기준 기본값 설정 스크립트
 * 실행: npx tsx scripts/seed-limits.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 전국 기본 배출허용기준 (1종 사업장 기준)
const DEFAULT_LIMITS = [
  { itemKey: "EA-I-0001", value: 30, region: "전국", note: "먼지 (1종)" },
  { itemKey: "EA-I-0003", value: 100, region: "전국", note: "암모니아 (1종)" },
  { itemKey: "EA-I-0004", value: 200, region: "전국", note: "일산화탄소 (1종)" },
  { itemKey: "EA-I-0005", value: 30, region: "전국", note: "염화수소 (1종)" },
  { itemKey: "EA-I-0006", value: 10, region: "전국", note: "염소 (1종)" },
  { itemKey: "EA-I-0007", value: 50, region: "전국", note: "황산화물 (1종)" },
  { itemKey: "EA-I-0008", value: 100, region: "전국", note: "질소산화물 (1종)" },
  { itemKey: "EA-I-0009", value: 10, region: "전국", note: "이황화탄소 (1종)" },
  { itemKey: "EA-I-0010", value: 20, region: "전국", note: "황화수소 (1종)" },
  { itemKey: "EA-I-0011", value: 10, region: "전국", note: "플루오린화합물 (1종)" },
  { itemKey: "EA-I-0012", value: 5, region: "전국", note: "사이안화수소 (1종)" },
  { itemKey: "EA-I-0013", value: 2, region: "전국", note: "매연 (1종)" },
  { itemKey: "EA-M-0001", value: 1.5, region: "전국", note: "비소화합물 (1종)" },
  { itemKey: "EA-M-0002", value: 0.5, region: "전국", note: "카드뮴화합물 (1종)" },
  { itemKey: "EA-M-0003", value: 5, region: "전국", note: "납화합물 (1종)" },
  { itemKey: "EA-M-0004", value: 1, region: "전국", note: "크로뮴화합물 (1종)" },
  { itemKey: "EA-M-0005", value: 10, region: "전국", note: "구리화합물 (1종)" },
  { itemKey: "EA-M-0006", value: 2, region: "전국", note: "니켈화합물 (1종)" },
  { itemKey: "EA-M-0007", value: 30, region: "전국", note: "아연화합물 (1종)" },
  { itemKey: "EA-M-0008", value: 0.08, region: "전국", note: "수은화합물 (1종)" },
  { itemKey: "EA-V-0001", value: 10, region: "전국", note: "폼알데하이드 (1종)" },
  { itemKey: "EA-V-0002", value: 50, region: "전국", note: "아세트알데하이드 (1종)" },
  { itemKey: "EA-V-0044", value: 10, region: "전국", note: "벤젠 (1종)" },
  { itemKey: "EA-V-0045", value: 400, region: "전국", note: "총탄화수소 (1종)" },
  { itemKey: "EA-V-0046", value: 10, region: "전국", note: "사염화탄소 (1종)" },
  { itemKey: "EA-V-0047", value: 30, region: "전국", note: "클로로포름 (1종)" },
  { itemKey: "EA-V-0048", value: 10, region: "전국", note: "염화바이닐 (1종)" },
  { itemKey: "EA-V-0056", value: 50, region: "전국", note: "다이클로로메테인 (1종)" },
  { itemKey: "EA-V-0063", value: 100, region: "전국", note: "트라이클로로에틸렌 (1종)" },
  { itemKey: "EA-V-0069", value: 50, region: "전국", note: "테트라클로로에틸렌 (1종)" },
];

async function main() {
  console.log("📋 배출허용기준 기본값 설정 시작...\n");

  let created = 0;
  let skipped = 0;

  for (const limit of DEFAULT_LIMITS) {
    try {
      // 항목 존재 확인
      const item = await prisma.item.findUnique({
        where: { key: limit.itemKey },
      });

      if (!item) {
        console.log(`⏭️  ${limit.itemKey} - 항목이 존재하지 않음 (스킵)`);
        skipped++;
        continue;
      }

      // 전체 기준으로 기존 설정 확인 (customerId="", stackId="")
      const existing = await prisma.emissionLimit.findFirst({
        where: {
          itemKey: limit.itemKey,
          customerId: "",
          stackId: "",
          region: limit.region,
        },
      });

      if (existing) {
        console.log(`⏭️  ${limit.itemKey} - 이미 설정됨 (스킵)`);
        skipped++;
        continue;
      }

      // 신규 생성 (전체 기준: customerId="", stackId="")
      await prisma.emissionLimit.create({
        data: {
          itemKey: limit.itemKey,
          limit: limit.value,
          region: limit.region,
          customerId: "", // 전체 기준
          stackId: "", // 전체 기준
        },
      });

      console.log(`✅ ${limit.itemKey} - ${limit.note}: ${limit.value} 설정 완료`);
      created++;
    } catch (error: any) {
      console.error(`❌ ${limit.itemKey} 설정 실패:`, error.message);
    }
  }

  console.log(`\n📊 설정 완료: 생성 ${created}개, 스킵 ${skipped}개`);
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
