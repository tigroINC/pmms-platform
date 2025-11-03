import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMissingItems() {
  try {
    console.log("⚙️  누락된 측정 항목들을 추가합니다...");
    
    const items = [
      // 보조 항목 (기상/가스 정보)
      { key: "temp", name: "기온", unit: "℃", category: "기상정보" },
      { key: "humidity", name: "습도", unit: "%", category: "기상정보" },
      { key: "pressure", name: "기압", unit: "mmHg", category: "기상정보" },
      { key: "wind_speed", name: "풍속", unit: "m/s", category: "기상정보" },
      { key: "wind_dir", name: "풍향", unit: "", category: "기상정보" },
      { key: "weather", name: "기상", unit: "", category: "기상정보" },
      
      { key: "gas_velocity", name: "가스속도", unit: "m/s", category: "가스정보" },
      { key: "gas_temp", name: "가스온도", unit: "℃", category: "가스정보" },
      { key: "moisture", name: "수분함량", unit: "%", category: "가스정보" },
      { key: "o2_measured", name: "실측산소농도", unit: "%", category: "가스정보" },
      { key: "o2_standard", name: "표준산소농도", unit: "%", category: "가스정보" },
      { key: "flow_rate", name: "배출가스유량", unit: "S㎥/min", category: "가스정보" },
      
      // 중금속 항목
      { key: "불소화합물(F로서)", name: "불소화합물(F로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "구리화합물(Cu로서)", name: "구리화합물(Cu로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "크롬화합물(Cr로서)", name: "크롬화합물(Cr로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "납화합물(Pb로서)", name: "납화합물(Pb로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "카드뮴화합물(Cd로서)", name: "카드뮴화합물(Cd로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "니켈-및-그-화합물", name: "니켈 및 그 화합물", unit: "mg/S㎥", category: "중금속" },
      { key: "아연화합물(Zn로서)", name: "아연화합물(Zn로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "비소화합물(As로서)", name: "비소화합물(As로서)", unit: "mg/S㎥", category: "중금속" },
      { key: "수은화합물(Hg로서)", name: "수은화합물(Hg로서)", unit: "mg/S㎥", category: "중금속" },
    ];
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const item of items) {
      try {
        await prisma.item.create({
          data: {
            key: item.key,
            name: item.name,
            unit: item.unit,
            category: item.category,
            limit: 0, // 기본값
            isActive: true,
          },
        });
        console.log(`✅ 추가: ${item.name} (${item.key})`);
        addedCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          console.log(`⏭️  스킵 (이미 존재): ${item.name}`);
          skippedCount++;
        } else {
          throw e;
        }
      }
    }
    
    console.log(`\n📊 완료: ${addedCount}개 추가, ${skippedCount}개 스킵`);
    
  } catch (error) {
    console.error("❌ 에러 발생:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingItems();
