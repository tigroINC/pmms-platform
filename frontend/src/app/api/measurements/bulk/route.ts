import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userOrgId = (session.user as any).organizationId;
    if (!userOrgId) {
      return NextResponse.json({ error: "조직 정보가 없습니다." }, { status: 400 });
    }

    const body = await request.json();
    const { rows } = body || {};
    
    console.log("[측정 일괄업로드] 요청 데이터:", { rowsCount: rows?.length });
    
    if (!Array.isArray(rows)) {
      return NextResponse.json({ error: "rows required" }, { status: 400 });
    }
    if (rows.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    // Collect unique stacks to resolve ids (굴뚝 이름으로 고객사 자동 조회)
    const stackNames: string[] = Array.from(new Set(rows.map((r: any) => r.stack).filter(Boolean)));
    console.log("[측정 일괄업로드] 굴뚝 이름 목록:", stackNames);
    
    const stacks = await prisma.stack.findMany({ 
      where: { name: { in: stackNames } }, 
      select: { id: true, name: true, customerId: true, isActive: true } 
    });
    
    console.log("[측정 일괄업로드] 조회된 굴뚝:", stacks.length, "개");
    
    // ⚠️ CRITICAL: 활성화된 굴뚝만 측정 데이터 입력 가능
    const inactiveStacks = stacks.filter(s => !s.isActive);
    if (inactiveStacks.length > 0) {
      return NextResponse.json({ 
        error: "비활성화된 굴뚝이 포함되어 있습니다: " + inactiveStacks.map(s => s.name).join(", ")
      }, { status: 400 });
    }
    
    const stackMap = new Map(stacks.map((s) => [s.name, { id: s.id, customerId: s.customerId }] as const));

    const toNumber = (v: any) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    // 보조항목 필드 매핑 (itemKey -> Measurement 필드명)
    const auxFieldMap: Record<string, string> = {
      'weather': 'weather',           // 기상
      'temperature': 'temperatureC',  // 기온
      'humidity': 'humidityPct',      // 습도
      'pressure': 'pressureMmHg',     // 기압
      'wind_direction': 'windDirection', // 풍향
      'wind_speed': 'windSpeedMs',    // 풍속
      'gas_velocity': 'gasVelocityMs', // 가스속도
      'gas_temp': 'gasTempC',         // 가스온도
      'moisture': 'moisturePct',      // 수분함량
      'oxygen_measured': 'oxygenMeasuredPct', // 실측산소농도
      'oxygen_std': 'oxygenStdPct',   // 표준산소농도
      'flow_rate': 'flowSm3Min',      // 배출가스유량
    };

    // 텍스트 타입 보조항목 (숫자 변환하지 않음)
    const textFields = ['weather', 'wind_direction'];

    // 동일 시간대의 데이터를 그룹화 (stack + measuredAt 기준)
    const groupedData = new Map<string, any>();
    
    for (const r of rows as any[]) {
      const stackInfo = stackMap.get(r.stack);
      if (!stackInfo) continue;
      
      // measuredAt 파싱: YYYYMMDDHHmmss 형식 또는 ISO 문자열
      let when: Date | undefined;
      if (r.measuredAt) {
        const str = String(r.measuredAt).trim();
        // YYYYMMDDHHmmss 형식 (14자리 숫자)
        if (/^\d{14}$/.test(str)) {
          const year = parseInt(str.substring(0, 4));
          const month = parseInt(str.substring(4, 6)) - 1; // 0-based
          const day = parseInt(str.substring(6, 8));
          const hour = parseInt(str.substring(8, 10));
          const minute = parseInt(str.substring(10, 12));
          const second = parseInt(str.substring(12, 14));
          when = new Date(year, month, day, hour, minute, second);
        } else {
          // ISO 문자열 또는 다른 형식
          when = new Date(r.measuredAt);
        }
      }
      if (!r.itemKey || !when || isNaN(when.getTime())) continue;
      
      const groupKey = `${stackInfo.id}_${when.toISOString()}`;
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, {
          customerId: stackInfo.customerId,
          stackId: stackInfo.id,
          measuredAt: when,
          organizationId: userOrgId,
          pollutants: [], // 오염물질 데이터
          auxData: {} // 보조항목 데이터
        });
      }
      
      const group = groupedData.get(groupKey)!;
      const auxField = auxFieldMap[r.itemKey];
      
      if (auxField) {
        // 보조항목: auxData에 저장
        const isTextAux = textFields.includes(r.itemKey);
        const auxValue = isTextAux ? String(r.value || '') : toNumber(r.value);
        if (auxValue !== undefined && auxValue !== '') {
          group.auxData[auxField] = auxValue;
          console.log(`[보조항목] ${r.itemKey} (${auxField}): ${auxValue} (타입: ${typeof auxValue})`);
        }
      } else {
        // 오염물질: pollutants 배열에 추가
        const value = toNumber(r.value);
        if (value !== undefined) {
          group.pollutants.push({
            itemKey: String(r.itemKey),
            value
          });
        }
      }
    }

    // 그룹화된 데이터를 Measurement 행으로 변환
    const data: any[] = [];
    for (const group of groupedData.values()) {
      // 각 오염물질마다 별도의 Measurement 행 생성 (보조항목 데이터 포함)
      for (const pollutant of group.pollutants) {
        data.push({
          customerId: group.customerId,
          stackId: group.stackId,
          itemKey: pollutant.itemKey,
          value: pollutant.value,
          measuredAt: group.measuredAt,
          organizationId: group.organizationId,
          ...group.auxData // 보조항목 데이터 병합
        });
      }
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No valid rows" }, { status: 400 });
    }

    console.log("[측정 일괄업로드] 생성할 데이터:", data.length, "건");
    console.log("[측정 일괄업로드] 샘플 데이터:", data[0]);

    // 중복 체크 및 필터링
    const uniqueKeys = new Set<string>();
    const filteredData = data.filter((item) => {
      const key = `${item.stackId}_${item.itemKey}_${item.measuredAt.toISOString()}`;
      if (uniqueKeys.has(key)) {
        return false; // 중복 제거
      }
      uniqueKeys.add(key);
      return true;
    });

    console.log("[측정 일괄업로드] 중복 제거 후:", filteredData.length, "건 (제거:", data.length - filteredData.length, "건)");

    if (filteredData.length === 0) {
      return NextResponse.json({ error: "모든 데이터가 중복입니다." }, { status: 400 });
    }

    // insert many - 개별 삽입으로 변경하여 중복 스킵
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    for (const item of filteredData) {
      try {
        await prisma.measurement.create({ data: item });
        successCount++;
      } catch (e: any) {
        if (e.code === 'P2002') {
          // 중복 데이터는 스킵
          skipCount++;
        } else if (e.code === 'P2003') {
          // Foreign key constraint 에러 - itemKey가 존재하지 않음
          errorCount++;
          const errorMsg = `itemKey '${item.itemKey}' not found in MeasurementItem`;
          if (!errors.includes(errorMsg)) {
            errors.push(errorMsg);
            console.error(`[측정 일괄업로드] ${errorMsg}`);
          }
        } else {
          throw e; // 다른 에러는 throw
        }
      }
    }

    console.log("[측정 일괄업로드] 생성 완료:", successCount, "건, 스킵:", skipCount, "건, 에러:", errorCount, "건");
    
    if (errors.length > 0) {
      console.error("[측정 일괄업로드] 에러 목록:", errors);
    }
    
    return NextResponse.json({ 
      ok: true, 
      count: successCount, 
      skipped: skipCount,
      errors: errorCount > 0 ? errors : undefined,
      message: `${successCount}건 등록 완료${skipCount > 0 ? `, ${skipCount}건 중복 스킵` : ""}${errorCount > 0 ? `, ${errorCount}건 에러` : ""}`
    });
  } catch (e: any) {
    console.error("[측정 일괄업로드 에러]", e);
    return NextResponse.json({ error: e.message || "bulk upload failed" }, { status: 500 });
  }
}
