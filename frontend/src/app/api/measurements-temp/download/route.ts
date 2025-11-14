import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST: 임시 데이터 CSV 다운로드 (일괄업로드 형식과 동일)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids)) {
      return NextResponse.json(
        { error: "잘못된 요청입니다" },
        { status: 400 }
      );
    }

    // 권한 체크
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다" }, { status: 404 });
    }

    // 임시 데이터 조회
    const where: any = ids.length > 0 ? { id: { in: ids } } : {};

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

    const temps = await prisma.measurementTemp.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        stack: { select: { name: true, siteCode: true, siteName: true } },
      },
      orderBy: { measurementDate: "asc" },
    });

    if (temps.length === 0) {
      return NextResponse.json({ error: "다운로드할 데이터가 없습니다" }, { status: 404 });
    }

    // 항목 정보 조회
    const items = await prisma.item.findMany({
      select: { key: true, name: true, limit: true },
    });
    const itemMap = new Map(items.map((i) => [i.key, { name: i.name, limit: i.limit }]));

    // CSV 헤더 (측정일자, 고객사, 배출구명 순서)
    const header = [
      "측정일자","고객사","배출구명","기상","기온℃","습도％","기압mmHg","풍향","풍속m／sec",
      "가스속도m／s","가스온도℃","수분함량％","실측산소농도％","표준산소농도％",
      "배출가스유량S㎥／min","오염물질","농도","배출허용기준농도","배출허용기준체크","측정업체"
    ];

    // CSV 데이터 구성
    const rows: string[][] = [];

    for (const temp of temps) {
      const measurements = JSON.parse(temp.measurements);
      const auxiliaryData = temp.auxiliaryData ? JSON.parse(temp.auxiliaryData) : {};

      // 측정일시 포맷팅 (YYYYMMDDhhmm)
      const measurementDate = new Date(temp.measurementDate);
      const dateStr = 
        measurementDate.getFullYear() +
        String(measurementDate.getMonth() + 1).padStart(2, "0") +
        String(measurementDate.getDate()).padStart(2, "0") +
        String(measurementDate.getHours()).padStart(2, "0") +
        String(measurementDate.getMinutes()).padStart(2, "0");

      // 고객사명
      const customerName = temp.customer?.name || "";

      // 굴뚝명
      const stackName = temp.stack?.name || "";

      // 보조 데이터 (기상 정보)
      const weather = auxiliaryData.weather || "";
      const temperature = auxiliaryData.temperature || "";
      const humidity = auxiliaryData.humidity || "";
      const pressure = auxiliaryData.pressure || "";
      const windDir = auxiliaryData.windDirection || "";
      const windSpeed = auxiliaryData.windSpeed || "";
      const gasVel = auxiliaryData.gasVelocity || "";
      const gasTemp = auxiliaryData.gasTemp || "";
      const moisture = auxiliaryData.moisture || "";
      const o2Measured = auxiliaryData.oxygenMeasured || "";
      const o2Standard = auxiliaryData.oxygenStd || "";
      const flowRate = auxiliaryData.flowRate || "";
      const company = auxiliaryData.company || "PMMS 환경측정관리시스템";

      // 각 측정항목별로 행 생성
      for (const m of measurements) {
        const itemInfo = itemMap.get(m.itemKey);
        const itemName = itemInfo?.name || m.itemKey;
        const limit = itemInfo?.limit || "";

        rows.push([
          dateStr,             // 측정일자
          customerName,        // 고객사
          stackName,           // 배출구명
          weather,             // 기상
          temperature,         // 기온℃
          humidity,            // 습도％
          pressure,            // 기압mmHg
          windDir,             // 풍향
          windSpeed,           // 풍속m／sec
          gasVel,              // 가스속도m／s
          gasTemp,             // 가스온도℃
          moisture,            // 수분함량％
          o2Measured,          // 실측산소농도％
          o2Standard,          // 표준산소농도％
          flowRate,            // 배출가스유량S㎥／min
          itemName,            // 오염물질
          String(m.value),     // 농도
          String(limit),       // 배출허용기준농도
          "",                  // 배출허용기준체크
          company              // 측정업체
        ]);
      }
    }

    // CSV 생성
    const csvContent = [
      header.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const csvWithBOM = "\ufeff" + csvContent;

    // 파일명 생성
    const now = new Date();
    const filename = `임시측정데이터_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.csv`;

    // 응답 반환
    return new NextResponse(csvWithBOM, {
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (error: any) {
    console.error("CSV 다운로드 오류:", error);
    return NextResponse.json(
      { error: error.message || "다운로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
