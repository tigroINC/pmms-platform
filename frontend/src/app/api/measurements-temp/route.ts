import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 임시ID 생성 함수
async function generateTempId(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  
  // 오늘 날짜의 마지막 일련번호 조회
  const lastTemp = await prisma.measurementTemp.findFirst({
    where: {
      tempId: {
        startsWith: `TEMP${dateStr}`,
      },
    },
    orderBy: {
      tempId: "desc",
    },
  });
  
  let serial = 1;
  if (lastTemp) {
    const lastSerial = parseInt(lastTemp.tempId.slice(-3));
    serial = lastSerial + 1;
  }
  
  return `TEMP${dateStr}${serial.toString().padStart(3, "0")}`;
}

// POST: 임시 저장
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, stackId, measurementDate, measurements, auxiliaryData } = body;

    // 필수 필드 검증
    if (!customerId || !stackId || !measurementDate || !measurements) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 측정값 검증 - 채취환경만 있는 경우 허용
    if (!Array.isArray(measurements)) {
      return NextResponse.json(
        { error: "측정값 형식이 올바르지 않습니다" },
        { status: 400 }
      );
    }
    
    // measurements와 auxiliaryData 둘 다 비어있으면 에러
    if (measurements.length === 0 && (!auxiliaryData || Object.keys(auxiliaryData).length === 0)) {
      return NextResponse.json(
        { error: "측정값 또는 채취환경 데이터가 필요합니다" },
        { status: 400 }
      );
    }

    // 고객사 및 굴뚝 존재 확인
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
      include: { customer: true },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다" }, { status: 404 });
    }

    if (stack.customerId !== customerId) {
      return NextResponse.json(
        { error: "고객사와 굴뚝이 일치하지 않습니다" },
        { status: 400 }
      );
    }

    // 임시ID 생성
    const tempId = await generateTempId();

    // 임시 저장
    const temp = await prisma.measurementTemp.create({
      data: {
        tempId,
        customerId,
        stackId,
        measurementDate: new Date(measurementDate),
        measurements: JSON.stringify(measurements),
        auxiliaryData: auxiliaryData ? JSON.stringify(auxiliaryData) : null,
        status: "임시저장",
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      tempId: temp.tempId,
      message: "임시 저장되었습니다",
    });
  } catch (error: any) {
    console.error("임시 저장 오류:", error);
    return NextResponse.json(
      { error: error.message || "임시 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// GET: 임시 데이터 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const customerId = searchParams.get("customerId");
    const stackId = searchParams.get("stackId");
    const createdBy = searchParams.get("createdBy");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("limit") || "20");

    // 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 필터 조건 구성
    const where: any = {};

    // 고객사 사용자는 자신의 고객사 데이터만
    if (user.role === "CUSTOMER_ADMIN" || user.role === "CUSTOMER_USER") {
      if (!user.customerId) {
        return NextResponse.json({ error: "고객사 정보가 없습니다" }, { status: 400 });
      }
      where.customerId = user.customerId;
    } else if (user.role === "OPERATOR") {
      // 실무자는 자신이 생성한 데이터만
      where.createdBy = user.id;
    }
    // ORG_ADMIN, SUPER_ADMIN은 모든 데이터 조회 가능

    // 검색 조건 추가 - measurementDate 기준으로 조회
    if (startDate) {
      where.measurementDate = { ...where.measurementDate, gte: new Date(startDate) };
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.measurementDate = { ...where.measurementDate, lte: end };
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (stackId) {
      where.stackId = stackId;
    }
    if (createdBy) {
      where.createdBy = createdBy;
    }

    // 전체 개수 조회
    const total = await (prisma as any).measurementTemp.count({ where });

    // 페이징 데이터 조회
    const temps = await (prisma as any).measurementTemp.findMany({
      where,
      include: {
        customer: {
          select: { id: true, name: true },
        },
        stack: {
          select: { id: true, name: true, siteCode: true, siteName: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 입력자 정보 조회
    const creatorIds = [...new Set(temps.map((t: any) => t.createdBy))] as string[];
    const creators = await prisma.user.findMany({
      where: { id: { in: creatorIds } },
      select: { id: true, name: true },
    });
    const creatorMap = new Map(creators.map((c) => [c.id, c.name]));

    // 항목 정보 조회
    const items = await prisma.item.findMany({
      select: { key: true, name: true, unit: true, limit: true },
    });
    const itemMap = new Map(items.map((i) => [i.key, { name: i.name, unit: i.unit, limit: i.limit }]));

    // 응답 데이터 구성 (측정이력처럼 각 항목별로 행 생성)
    const rows: any[] = [];

    for (const temp of temps) {
      const measurements = JSON.parse(temp.measurements);
      const auxiliaryData = temp.auxiliaryData ? JSON.parse(temp.auxiliaryData) : {};

      // 측정일시 포맷팅 (한국 시간대로 변환)
      const measurementDate = new Date(temp.measurementDate);
      const measuredAt = measurementDate.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Seoul"
      }).replace(/\. /g, "-").replace(".", "");

      // 고객사명
      const customerName = temp.customer?.name || "";

      // 굴뚝번호 (siteCode 우선, 없으면 name)
      const stackName = temp.stack?.siteCode || temp.stack?.name || "";

      // 보조 데이터 (여러 키 형식 지원)
      const weather = auxiliaryData.weather || "";
      const temperature = auxiliaryData.temperatureC || auxiliaryData.temperature || "";
      const humidity = auxiliaryData.humidityPct || auxiliaryData.humidity || "";
      const pressure = auxiliaryData.pressureMmHg || auxiliaryData.pressure || "";
      const windDir = auxiliaryData.windDirection || auxiliaryData.wind_direction || "";
      const windSpeed = auxiliaryData.windSpeedMs || auxiliaryData.windSpeed || auxiliaryData.wind_speed || "";
      const gasVel = auxiliaryData.gasVelocityMs || auxiliaryData.gasVelocity || auxiliaryData.gas_velocity || "";
      const gasTemp = auxiliaryData.gasTempC || auxiliaryData.gasTemp || auxiliaryData.gas_temp || "";
      const moisture = auxiliaryData.moisturePct || auxiliaryData.moisture || "";
      const o2Measured = auxiliaryData.oxygenMeasuredPct || auxiliaryData.oxygenMeasured || auxiliaryData.oxygen_measured || "";
      const o2Standard = auxiliaryData.oxygenStdPct || auxiliaryData.oxygenStd || auxiliaryData.oxygen_std || "";
      const flowRate = auxiliaryData.flowSm3Min || auxiliaryData.flowRate || auxiliaryData.flow || "";
      const company = auxiliaryData.company || "";

      // 오염물질 항목만 행 생성 (채취환경은 각 행의 컬럼으로 표시)
      if (measurements.length === 0) {
        // 측정값이 없고 채취환경만 있는 경우 1개 행 생성
        rows.push({
          id: temp.id,
          tempId: temp.tempId,
          measuredAt,
          customer: customerName,
          stack: stackName,
          weather,
          temp: temperature,
          humidity,
          pressure,
          windDir,
          windSpeed,
          gasVel,
          gasTemp,
          moisture,
          o2Measured,
          o2Standard,
          flowRate,
          pollutant: "-",
          value: "",
          limit: "",
          limitCheck: "",
          company,
          createdBy: creatorMap.get(temp.createdBy) || "알 수 없음",
          createdAt: temp.createdAt.toISOString(),
        });
      } else {
        // 각 측정항목별로 행 생성
        for (const m of measurements) {
          const itemInfo = itemMap.get(m.itemKey);
          const itemName = itemInfo?.name || m.itemKey;
          const limit = itemInfo?.limit || "";
          const limitCheck = limit && m.value <= limit ? "적합" : "";

          rows.push({
            id: temp.id,
            tempId: temp.tempId,
            measuredAt,
            customer: customerName,
            stack: stackName,
            weather,
            temp: temperature,
            humidity,
            pressure,
            windDir,
            windSpeed,
            gasVel,
            gasTemp,
            moisture,
            o2Measured,
            o2Standard,
            flowRate,
            pollutant: itemName,
            value: m.value,
            limit,
            limitCheck,
            company,
            createdBy: creatorMap.get(temp.createdBy) || "알 수 없음",
            createdAt: temp.createdAt.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({
      data: rows,
      total: rows.length,
      page,
      limit: pageSize,
      totalPages: Math.ceil(rows.length / pageSize),
    });
  } catch (error: any) {
    console.error("임시 데이터 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
