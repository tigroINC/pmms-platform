import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 보고서 목록 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { searchParams } = new URL(req.url);
    
    const customerId = searchParams.get("customerId");
    const stackId = searchParams.get("stackId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    // 권한별 필터링
    if (user.role === "CUSTOMER") {
      where.customerId = user.customerId;
      where.status = "SHARED"; // 고객사는 공유된 보고서만 조회
    }

    if (customerId) where.customerId = customerId;
    if (stackId) where.stackId = stackId;
    if (status) where.status = status;
    
    if (startDate || endDate) {
      where.measuredAt = {};
      if (startDate) where.measuredAt.gte = new Date(startDate);
      if (endDate) where.measuredAt.lte = new Date(endDate);
    }

    const reports = await prisma.report.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
        stack: {
          select: {
            id: true,
            name: true,
            fullName: true,
          },
        },
      },
      orderBy: [
        { measuredAt: "desc" },
        { version: "desc" },
      ],
    });

    return NextResponse.json({ data: reports });
  } catch (error: any) {
    console.error("보고서 목록 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 목록 조회 실패" },
      { status: 500 }
    );
  }
}

// 보고서 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    // 환경측정기업만 생성 가능
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN" && userRole !== "ORG_USER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await req.json();
    const { customerId, stackId, measuredAt } = body;

    if (!customerId || !stackId || !measuredAt) {
      return NextResponse.json(
        { error: "고객사, 굴뚝, 측정일자는 필수입니다." },
        { status: 400 }
      );
    }

    // 고객사 정보 조회
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json({ error: "고객사를 찾을 수 없습니다." }, { status: 404 });
    }

    // 굴뚝 정보 조회
    const stack = await prisma.stack.findUnique({
      where: { id: stackId },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 측정 데이터 조회 (날짜만 있는 경우 해당 날짜의 모든 데이터)
    const startDate = new Date(measuredAt);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(measuredAt);
    endDate.setHours(23, 59, 59, 999);

    const measurements = await prisma.measurement.findMany({
      where: {
        customerId,
        stackId,
        measuredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        item: true,
      },
    });

    // 주소 축약 (시군구 단위)
    const formatAddress = (addr: string | null): string | null => {
      if (!addr) return null;
      const parts = addr.split(' ');
      if (parts[0]?.includes('광역시') || parts[0]?.includes('특별시')) {
        return parts.slice(0, 2).join(' ');
      }
      return parts.slice(0, 2).join(' ');
    };

    // 측정시간 추출
    const extractTime = (date: Date): string => {
      return date.toTimeString().slice(0, 5); // HH:mm
    };

    // 측정결과 데이터 구성
    const measurementData = measurements.map((m) => ({
      item: m.item.name,
      limit: m.item.limit,
      value: m.value,
      unit: m.item.unit,
      method: m.item.analysisMethod || "",
      startTime: extractTime(m.measuredAt),
      endTime: extractTime(m.measuredAt),
      note: "",
    }));

    // 템플릿 조회 (기본값)
    const template = await prisma.reportTemplate.findUnique({
      where: { customerId },
    });

    // 보고서 생성
    const report = await prisma.report.create({
      data: {
        customerId,
        stackId,
        measuredAt: new Date(measuredAt),
        
        // 의뢰인 정보
        companyName: customer.fullName || customer.name,
        address: formatAddress(customer.address),
        representative: customer.representative,
        environmentalTech: template?.environmentalTech || "",
        
        // 일반현황
        industry: customer.industry,
        facilityType: stack.facilityType,
        siteCategory: customer.siteCategory,
        
        // 의뢰내용
        stackName: stack.fullName || stack.name,
        stackHeight: stack.height,
        stackDiameter: stack.diameter,
        stackType: stack.category,
        
        // 시료채취 (기본값 설정, 사용자가 입력 필요)
        weather: null,
        temp: null,
        humidity: null,
        pressure: null,
        windDir: null,
        wind: null,
        o2Standard: null,
        o2Measured: null,
        flow: null,
        moisture: null,
        gasTemp: null,
        gasVel: null,
        
        samplingDate: new Date(measuredAt),
        samplingStart: measurements[0] ? extractTime(measurements[0].measuredAt) : "",
        samplingEnd: measurements[0] ? extractTime(measurements[0].measuredAt) : "",
        sampler: template?.sampler || "",
        
        // 측정분석결과
        measurements: JSON.stringify(measurementData),
        
        analyst: template?.analyst || "",
        chiefTech: template?.chiefTech || "",
        
        status: "DRAFT",
        createdBy: user.id,
      },
      include: {
        customer: true,
        stack: true,
      },
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error: any) {
    console.error("보고서 생성 오류:", error);
    return NextResponse.json(
      { error: error.message || "보고서 생성 실패" },
      { status: 500 }
    );
  }
}
