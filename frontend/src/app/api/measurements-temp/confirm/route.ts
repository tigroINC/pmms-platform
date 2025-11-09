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
        customer: true,
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
        // 측정항목 조회
        const item = await prisma.item.findFirst({
          where: { name: temp.pollutant },
        });

        if (!item) {
          errors.push(`${temp.tempId}: 측정항목 '${temp.pollutant}'을 찾을 수 없습니다.`);
          continue;
        }

        // 확정 데이터 생성
        await prisma.measurement.create({
          data: {
            customerId: temp.customerId,
            stackId: temp.stackId,
            itemKey: item.key,
            measuredAt: temp.measuredAt,
            value: temp.value,
            weather: temp.weather,
            temp: temp.temp,
            humidity: temp.humidity,
            pressure: temp.pressure,
            windDir: temp.windDir,
            wind: temp.wind,
            gasVel: temp.gasVel,
            gasTemp: temp.gasTemp,
            moisture: temp.moisture,
            o2Measured: temp.o2Measured,
            o2Standard: temp.o2Standard,
            flow: temp.flow,
            company: temp.company,
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
