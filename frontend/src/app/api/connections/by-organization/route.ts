import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 환경측정기업의 연결된 고객사 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: "환경측정기업 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const connections = await prisma.customerOrganization.findMany({
      where: {
        organizationId: organizationId,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
            address: true,
            industry: true,
          },
        },
      },
      orderBy: [
        { status: "asc" }, // PENDING 먼저
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ connections });
  } catch (error: any) {
    console.error("Get organization customers error:", error);
    return NextResponse.json(
      { error: "연결 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
