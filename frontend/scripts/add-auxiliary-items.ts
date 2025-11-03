import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 보조항목 추가 시작...");

  const auxiliaryItems = [
    { key: "weather", name: "기상", englishName: "Weather", unit: "", category: "보조항목", limit: 0 },
    { key: "temperature", name: "기온", englishName: "Temperature", unit: "℃", category: "보조항목", limit: 0 },
    { key: "humidity", name: "습도", englishName: "Humidity", unit: "%", category: "보조항목", limit: 0 },
    { key: "pressure", name: "기압", englishName: "Pressure", unit: "mmHg", category: "보조항목", limit: 0 },
    { key: "wind_direction", name: "풍향", englishName: "Wind Direction", unit: "", category: "보조항목", limit: 0 },
    { key: "wind_speed", name: "풍속", englishName: "Wind Speed", unit: "m/s", category: "보조항목", limit: 0 },
    { key: "gas_velocity", name: "가스속도", englishName: "Gas Velocity", unit: "m/s", category: "보조항목", limit: 0 },
    { key: "gas_temp", name: "가스온도", englishName: "Gas Temperature", unit: "℃", category: "보조항목", limit: 0 },
    { key: "moisture", name: "수분함량", englishName: "Moisture", unit: "%", category: "보조항목", limit: 0 },
    { key: "oxygen_measured", name: "실측산소농도", englishName: "Measured O₂", unit: "%", category: "보조항목", limit: 0 },
    { key: "oxygen_std", name: "표준산소농도", englishName: "Standard O₂", unit: "%", category: "보조항목", limit: 0 },
    { key: "flow_rate", name: "배출가스유량", englishName: "Flow Rate", unit: "S㎥/min", category: "보조항목", limit: 0 },
  ];

  for (const item of auxiliaryItems) {
    await prisma.item.upsert({
      where: { key: item.key },
      update: {
        name: item.name,
        englishName: item.englishName,
        unit: item.unit,
        category: item.category,
        limit: item.limit,
        hasLimit: false,
        isActive: true,
      },
      create: {
        key: item.key,
        name: item.name,
        englishName: item.englishName,
        unit: item.unit,
        category: item.category,
        limit: item.limit,
        hasLimit: false,
        isActive: true,
      },
    });
    console.log(`✅ ${item.name} (${item.key}) 추가/업데이트 완료`);
  }

  console.log(`\n✅ 총 ${auxiliaryItems.length}개의 보조항목이 추가/업데이트되었습니다.`);
}

main()
  .catch((e) => {
    console.error("❌ 에러 발생:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
