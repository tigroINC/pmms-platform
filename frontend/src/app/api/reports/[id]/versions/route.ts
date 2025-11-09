import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 보고서 버전 이력 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = params;

    const currentReport = await prisma.report.findUnique({
      where: { id },
    });

    if (!currentReport) {
      return NextResponse.json({ error: "보고서를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 확인
    if (user.role === "CUSTOMER") {
      if (currentReport.customerId !== user.customerId) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    // 같은 고객사, 굴뚝, 측정일자의 모든 버전 조회
    const versions = await prisma.report.findMany({
      where: {
        customerId: currentReport.customerId,
        stackId: currentReport.stackId,
        measuredAt: currentReport.measuredAt,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        id: true,
        version: true,
        status: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: versions });
  } catch (error: any) {
    console.error("버전 이력 조회 오류:", error);
    return NextResponse.json(
      { error: error.message || "버전 이력 조회 실패" },
      { status: 500 }
    );
  }
}
