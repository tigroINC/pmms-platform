/**
 * 측정항목 표준 리스트 CSV 데이터를 DB에 임포트하는 스크립트
 * 실행: npx tsx scripts/import-items.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface ItemRow {
  key: string;
  name: string;
  englishName: string;
  unit: string;
  category: string;
  hasLimit: string;
}

async function main() {
  console.log("📋 측정항목 표준 리스트 임포트 시작...\n");

  // CSV 파일 읽기
  const csvPath = path.join(__dirname, "../docs/requirements/측정항목표준리스트.CSV");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n").filter((line) => line.trim());

  // 헤더 스킵 (첫 2줄)
  const dataLines = lines.slice(2);

  const items: ItemRow[] = [];
  for (const line of dataLines) {
    // CSV 파싱 (간단한 방식)
    const cols = line.split(",");
    if (cols.length < 6) continue;

    const key = cols[0]?.trim();
    const name = cols[1]?.trim();
    const englishName = cols[2]?.trim();
    const unit = cols[3]?.trim();
    const category = cols[4]?.trim();
    const hasLimit = cols[5]?.trim();

    if (!key || !name || !unit) continue;

    items.push({
      key,
      name,
      englishName,
      unit,
      category,
      hasLimit,
    });
  }

  console.log(`✅ CSV에서 ${items.length}개 항목 파싱 완료\n`);

  // DB에 저장
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      // 기존 항목 확인
      const existing = await prisma.item.findUnique({
        where: { key: item.key },
      });

      if (existing) {
        console.log(`⏭️  ${item.key} - 이미 존재함 (스킵)`);
        skipped++;
        continue;
      }

      // 신규 생성
      await prisma.item.create({
        data: {
          key: item.key,
          name: item.name,
          englishName: item.englishName || null,
          unit: item.unit,
          limit: 0, // 기본값 (실제 허용기준값은 별도 관리)
          category: item.category || null,
          hasLimit: item.hasLimit === "Y",
        },
      });

      console.log(`✅ ${item.key} - ${item.name} 생성 완료`);
      created++;
    } catch (error: any) {
      console.error(`❌ ${item.key} 생성 실패:`, error.message);
    }
  }

  console.log(`\n📊 임포트 완료: 생성 ${created}개, 스킵 ${skipped}개`);
}

main()
  .catch((e) => {
    console.error("❌ 오류 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
