import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUXILIARY_FIELD_MAP, isAuxiliaryItem } from "@/lib/itemKeyMapping";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") || undefined;
    const customerName = searchParams.get("customerName") || undefined;
    const stackName = searchParams.get("stack") || undefined;
    const stackNames = searchParams.getAll("stack");
    const itemKey = searchParams.get("itemKey") || undefined;
    const start = searchParams.get("start") || undefined;
    const end = searchParams.get("end") || undefined;
    const organizationId = searchParams.get("organizationId");
    
    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const userCustomerId = (session.user as any).customerId;
    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    
    // 보조항목 키 목록
    const auxItemKeys = ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate', 'temperature', 'wind_direction', 'oxygen_measured', 'oxygen_std'];
    
    // 보조항목 키 → DB 컬럼 매핑
    const auxKeyToColumn: Record<string, string> = {
      'weather': 'weather',
      'temp': 'temperatureC',
      'temperature': 'temperatureC',
      'humidity': 'humidityPct',
      'pressure': 'pressureMmHg',
      'wind_dir': 'windDirection',
      'wind_direction': 'windDirection',
      'wind_speed': 'windSpeedMs',
      'gas_velocity': 'gasVelocityMs',
      'gas_temp': 'gasTempC',
      'moisture': 'moisturePct',
      'o2_measured': 'oxygenMeasuredPct',
      'oxygen_measured': 'oxygenMeasuredPct',
      'o2_standard': 'oxygenStdPct',
      'oxygen_std': 'oxygenStdPct',
      'flow_rate': 'flowSm3Min'
    };
    
    const isAuxItemRequest = itemKey && auxItemKeys.includes(itemKey);
    
    if (itemKey && !isAuxItemRequest) {
      // 오염물질 항목 조회
      where.itemKey = itemKey;
    } else if (!itemKey) {
      // itemKey 필터가 없으면 보조항목 제외 (오염물질만)
      where.itemKey = { notIn: auxItemKeys };
    }
    // isAuxItemRequest === true이면 where.itemKey 설정 안함 (모든 측정 데이터 조회)
    
    if (start || end) {
      const startDate = start ? new Date(start) : undefined;
      let endDate = end ? new Date(end) : undefined;
      
      // 종료일은 해당 날짜의 23:59:59.999로 설정 (해당 날짜 전체 포함)
      if (endDate) {
        endDate.setHours(23, 59, 59, 999);
      }
      
      where.measuredAt = { 
        gte: startDate, 
        lte: endDate 
      };
    }
    
    // Join via stack to ensure accurate customer matching even when raw monthly data lacked customer field
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stackFilter: any = {};
    if (stackNames && stackNames.length > 1) stackFilter.name = { in: stackNames };
    else if (stackName) stackFilter.name = stackName;
    
    // 고객사 필터링
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customerFilter: any = {};
    
    // 조직 ID 계산 (고객사 사용자와 환경측정기업 사용자 모두 사용)
    const effectiveOrgId = organizationId || userOrgId;
    
    // 고객사 사용자: 자신의 고객사 데이터만 조회
    if (isCustomerUser && userCustomerId) {
      customerFilter.id = userCustomerId;
    } else {
      // 환경측정기업 사용자
      if (customerId) {
        customerFilter.id = customerId;
      }
      if (customerName) {
        customerFilter.name = customerName;
      }
      
      // 조직 필터링 (내부 관리 + 연결된 고객사)
      const userId = (session.user as any).id;
      
      if (userRole === "SUPER_ADMIN") {
        if (organizationId) {
          customerFilter.OR = [
            { createdBy: userId },
            {
              organizations: {
                some: {
                  organizationId: organizationId,
                  status: "APPROVED"
                }
              }
            }
          ];
        }
      } else if (effectiveOrgId) {
        // 일반 환경측정기업 사용자: 해당 조직의 측정 데이터만 조회
        // customerFilter는 설정하지 않고, measurement의 organizationId로 필터링
      }
    }
    
    where.stack = {
      ...stackFilter,
      ...(Object.keys(customerFilter).length > 0 ? { customer: customerFilter } : {}),
    };
    
    // 환경측정기업 사용자는 organizationId로 필터링
    if (!isCustomerUser && effectiveOrgId) {
      where.organizationId = effectiveOrgId;
    }

  const data = await prisma.measurement.findMany({
    where,
    include: { 
      customer: { 
        select: { 
          id: true, 
          name: true,
          organizations: {
            select: {
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        } 
      }, 
      stack: { select: { id: true, name: true, customerId: true } }, 
      item: { select: { key: true, name: true, unit: true, limit: true } } 
    },
    orderBy: { measuredAt: "desc" },
  });

  // 각 측정 데이터에 적용되는 실제 배출허용기준 조회
  // 우선순위: 굴뚝별 > 고객사별 > 전체(Item 기본값)
  const itemKeys: string[] = [...new Set(data.map(d => d.itemKey).filter((x): x is string => !!x))];
  const customerIds: string[] = [...new Set(data.map(d => d.customerId).filter((x): x is string => !!x))];
  const stackIds: string[] = [...new Set(data.map(d => d.stackId).filter((x): x is string => !!x))];

  // @ts-ignore
  const emissionLimits = await prisma.emissionLimit.findMany({
    where: {
      itemKey: { in: itemKeys },
    },
  });

  // 각 측정에 적용되는 limit 계산
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataWithLimit = data.map((measurement: any) => {
    const itemKey = measurement.itemKey;
    const customerId = measurement.customerId;
    const stackId = measurement.stackId;

    // 우선순위에 따라 limit 찾기
    let applicableLimit = measurement.item?.limit; // 기본값

    // 1. 굴뚝별 기준
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stackLimit = emissionLimits.find(
      (el: any) => el.itemKey === itemKey && el.customerId === customerId && el.stackId === stackId
    );
    if (stackLimit) {
      applicableLimit = stackLimit.limit;
    } else {
      // 2. 고객사별 기준
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customerLimit = emissionLimits.find(
        (el: any) => el.itemKey === itemKey && el.customerId === customerId && el.stackId === ""
      );
      if (customerLimit) {
        applicableLimit = customerLimit.limit;
      } else {
        // 3. 전체 기준
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalLimit = emissionLimits.find(
          (el: any) => el.itemKey === itemKey && el.customerId === "" && el.stackId === ""
        );
        if (globalLimit) {
          applicableLimit = globalLimit.limit;
        }
      }
    }

    return {
      ...measurement,
      item: measurement.item ? {
        ...measurement.item,
        limit: applicableLimit, // 실제 적용되는 limit으로 덮어쓰기
      } : null,
    };
  });
  // 보조항목 요청인 경우: 해당 컬럼 값을 value로 변환
  let finalData = dataWithLimit;
  
  if (isAuxItemRequest && itemKey) {
    const columnName = auxKeyToColumn[itemKey];
    if (columnName) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalData = dataWithLimit.map((r: any) => {
        const auxValue = r[columnName];
        // 보조항목 값이 없으면 제외
        if (auxValue === null || auxValue === undefined) return null;
        
        return {
          ...r,
          itemKey: itemKey, // 보조항목 키로 설정
          value: auxValue,  // 해당 컬럼 값을 value로 설정
        };
      }).filter(Boolean); // null 제거
    }
  }

  // 서버에서 중복 제거
  const seen = new Set<string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniq: any[] = [];
  for (const r of finalData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = r.measuredAt ? new Date(r.measuredAt as any) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const numVal = Number((r as any).value);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const valKey = Number.isFinite(numVal) ? numVal.toFixed(3) : String((r as any).value);
    const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemKey = (r as any).itemKey || (r as any).item?.key || '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const key = (r as any).id ? String((r as any).id) : `${stackKey}|${itemKey}|${minuteEpoch}|${valKey}`;
    if (seen.has(key)) continue;
    seen.add(key);
    
    uniq.push(r);
  }
  return NextResponse.json({ data: uniq });
  } catch (error) {
    console.error("Get measurements error:", error);
    return NextResponse.json({ error: "측정 데이터 조회 중 오류가 발생했습니다." }, { status: 500 });
  }
}

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
    const { customerId, stack, itemKey, value, measuredAt } = body || {};
    
    if (!customerId || !stack || !itemKey || (value === null || value === undefined)) {
      return NextResponse.json({ error: "customerId, stack(name), itemKey, value are required" }, { status: 400 });
    }
    
    const stackRow = await prisma.stack.findFirst({ where: { customerId, name: stack } });
    if (!stackRow) {
      return NextResponse.json({ error: "Invalid stack for customer" }, { status: 400 });
    }
    
    // ⚠️ CRITICAL: 활성화된 굴뚝만 측정 데이터 입력 가능
    if (!stackRow.isActive) {
      return NextResponse.json({ 
        error: "비활성화된 굴뚝입니다. 측정 데이터를 입력할 수 없습니다." 
      }, { status: 400 });
    }
    
    // 데이터 구성
    const data: any = {
      customerId,
      stackId: stackRow.id,
      measuredAt: measuredAt ? new Date(measuredAt) : new Date(),
      organizationId: userOrgId,
    };
    
    // 채취환경 항목인 경우 개별 필드에 저장
    if (isAuxiliaryItem(itemKey)) {
      const fieldName = AUXILIARY_FIELD_MAP[itemKey];
      data[fieldName] = typeof value === 'string' ? value : Number(value);
      data.itemKey = 'auxiliary'; // 더미 itemKey
      data.value = 0; // 더미 value
    } else {
      // 오염물질은 itemKey와 value에 저장
      data.itemKey = itemKey;
      data.value = Number(value);
    }
    
    const created = await prisma.measurement.create({ data });
    
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    console.error("Create measurement error:", error);
    return NextResponse.json({ error: "측정 데이터 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}
