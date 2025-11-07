import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT: 채취환경 일괄 업데이트
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const body = await req.json();
    const { customerId, stackId, measurementDate, auxiliaryData } = body;

    // 필수 필드 검증
    if (!customerId || !stackId || !measurementDate || !auxiliaryData) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 날짜 범위 계산 (해당 날짜 00:00:00 ~ 23:59:59)
    const targetDate = new Date(measurementDate);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // 해당 날짜/굴뚝의 모든 임시데이터 조회
    const temps = await prisma.measurementTemp.findMany({
      where: {
        customerId,
        stackId,
        measurementDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (temps.length === 0) {
      return NextResponse.json(
        { message: "업데이트할 임시데이터가 없습니다", updatedCount: 0 },
        { status: 200 }
      );
    }

    // 각 임시데이터의 auxiliaryData 업데이트
    const updatePromises = temps.map((temp) => {
      const existingAux = temp.auxiliaryData ? JSON.parse(temp.auxiliaryData as string) : {};
      const mergedAux = { ...existingAux, ...auxiliaryData };

      return prisma.measurementTemp.update({
        where: { id: temp.id },
        data: {
          auxiliaryData: JSON.stringify(mergedAux),
        },
      });
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `${temps.length}건의 임시데이터에 채취환경이 업데이트되었습니다`,
      updatedCount: temps.length,
    });
  } catch (error: any) {
    console.error("채취환경 업데이트 오류:", error);
    return NextResponse.json(
      { error: error.message || "업데이트 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
