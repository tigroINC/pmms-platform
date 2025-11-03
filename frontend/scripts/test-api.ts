// API 응답 테스트
async function testAPI() {
  const baseUrl = 'http://localhost:3000';
  
  // 1. 오염물질 데이터 가져오기 (기상 데이터 제외)
  console.log('=== 1. 오염물질 데이터 (최근 10건) ===\n');
  const weatherKeys = ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'];
  
  // 먼지 데이터만 가져오기
  const dustRes = await fetch(`${baseUrl}/api/measurements?itemKey=EA-I-0001`);
  const dustData = await dustRes.json();
  
  console.log(`먼지(EA-I-0001) 데이터: ${dustData.data?.length || 0}건`);
  if (dustData.data && dustData.data.length > 0) {
    const first = dustData.data[0];
    console.log('\n첫 번째 데이터:');
    console.log(`  ID: ${first.id}`);
    console.log(`  고객사: ${first.customer?.name}`);
    console.log(`  배출구: ${first.stack?.name}`);
    console.log(`  항목: ${first.item?.name}`);
    console.log(`  값: ${first.value}`);
    console.log(`  측정일시: ${first.measuredAt}`);
    console.log(`  기상: ${first.weather}`);
    console.log(`  기온: ${first.temperatureC}`);
    console.log(`  습도: ${first.humidityPct}`);
    console.log(`  기압: ${first.pressureMmHg}`);
    console.log(`  풍향: ${first.windDirection}`);
    console.log(`  풍속: ${first.windSpeedMs}`);
    console.log(`  가스속도: ${first.gasVelocityMs}`);
    console.log(`  가스온도: ${first.gasTempC}`);
    console.log(`  수분함량: ${first.moisturePct}`);
    console.log(`  실측산소농도: ${first.oxygenMeasuredPct}`);
    console.log(`  표준산소농도: ${first.oxygenStdPct}`);
    console.log(`  배출가스유량: ${first.flowSm3Min}`);
  }

  // 2. 기상 데이터 가져오기
  console.log('\n\n=== 2. 기상 데이터 (weather) ===\n');
  const weatherRes = await fetch(`${baseUrl}/api/measurements?itemKey=weather`);
  const weatherData = await weatherRes.json();
  
  console.log(`기상 데이터: ${weatherData.data?.length || 0}건`);
  if (weatherData.data && weatherData.data.length > 0) {
    const first = weatherData.data[0];
    console.log('\n첫 번째 데이터:');
    console.log(`  ID: ${first.id}`);
    console.log(`  배출구: ${first.stack?.name}`);
    console.log(`  값: ${first.value}`);
    console.log(`  측정일시: ${first.measuredAt}`);
    console.log(`  weather 컬럼: ${first.weather}`);
    console.log(`  temperatureC 컬럼: ${first.temperatureC}`);
  }

  // 3. 전체 데이터 가져오기 (필터 없음)
  console.log('\n\n=== 3. 전체 데이터 (최근 50건) ===\n');
  const allRes = await fetch(`${baseUrl}/api/measurements`);
  const allData = await allRes.json();
  
  console.log(`전체 데이터: ${allData.data?.length || 0}건`);
  
  // 항목별 분류
  const byItem = new Map<string, number>();
  allData.data?.forEach((m: any) => {
    const itemName = m.item?.name || m.itemKey;
    byItem.set(itemName, (byItem.get(itemName) || 0) + 1);
  });
  
  console.log('\n항목별 건수:');
  Array.from(byItem.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([item, count]) => {
      console.log(`  ${item}: ${count}건`);
    });
}

testAPI().catch(console.error);
