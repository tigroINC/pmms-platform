import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "확정할 항목을 선택해주세요." }, { status: 400 });
    }

    // 임시 데이터 조회
    const tempData = await prisma.measurementTemp.findMany({
      where: { id: { in: ids } },
      include: {
        customer: {
          include: {
            organizations: true,
          },
        },
        stack: true,
      },
    });

    if (tempData.length === 0) {
      return NextResponse.json({ error: "선택한 데이터를 찾을 수 없습니다." }, { status: 404 });
    }

    let successCount = 0;
    const errors: string[] = [];

    // 각 임시 데이터를 확정 데이터로 변환
    for (const temp of tempData) {
      try {
        // measurements 파싱
        const measurements = temp.measurements ? JSON.parse(temp.measurements as string) : [];
        
        if (measurements.length === 0) {
          console.log('[확정] 건너뜀 (측정값 없음):', temp.tempId);
          errors.push(`${temp.tempId}: 측정값이 없습니다 (채취환경만 있는 데이터).`);
          continue;
        }
        
        const firstMeasurement = measurements[0];
        const itemKey = firstMeasurement.itemKey;
        const measurementValue = firstMeasurement.value;
        
        console.log('[확정] 처리 중:', temp.tempId, 'itemKey:', itemKey, 'value:', measurementValue);
        
        // 측정항목 조회
        const item = await prisma.item.findFirst({
          where: { key: itemKey },
        });

        if (!item) {
          console.error('[확정] 측정항목 없음:', itemKey);
          errors.push(`${temp.tempId}: 측정항목 '${itemKey}'을 찾을 수 없습니다.`);
          continue;
        }
        
        console.log('[확정] 측정항목 찾음:', item.key, item.name);

        // auxiliaryData 파싱
        const auxData = temp.auxiliaryData ? JSON.parse(temp.auxiliaryData as string) : {};
        
        // organizationId 결정
        const orgId = Array.isArray(temp.customer.organizations) && temp.customer.organizations.length > 0
          ? temp.customer.organizations[0].organizationId
          : (session.user as any).organizationId || "";
        
        // 확정 데이터 생성
        await prisma.measurement.create({
          data: {
            customerId: temp.customerId,
            stackId: temp.stackId,
            itemKey: item.key,
            measuredAt: temp.measurementDate,
            value: Number(measurementValue),
            organizationId: orgId,
            weather: auxData.weather || null,
            temperatureC: auxData.temperatureC || null,
            humidityPct: auxData.humidityPct || null,
            pressureMmHg: auxData.pressureMmHg || null,
            windDirection: auxData.windDirection || null,
            windSpeedMs: auxData.windSpeedMs || null,
            gasVelocityMs: auxData.gasVelocityMs || null,
            gasTempC: auxData.gasTempC || null,
            moisturePct: auxData.moisturePct || null,
            oxygenMeasuredPct: auxData.oxygenMeasuredPct || null,
            oxygenStdPct: auxData.oxygenStdPct || null,
            flowSm3Min: auxData.flowSm3Min || null,
            measuringCompany: auxData.company || null,
          },
        });

        // 임시 데이터 삭제
        await prisma.measurementTemp.delete({
          where: { id: temp.id },
        });

        successCount++;
      } catch (error: any) {
        console.error(`확정 실패 (${temp.tempId}):`, error);
        errors.push(`${temp.tempId}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${successCount}건 확정 완료${errors.length > 0 ? `, ${errors.length}건 실패` : ""}`,
      count: successCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("확정 처리 오류:", error);
    return NextResponse.json(
      { error: error.message || "확정 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
