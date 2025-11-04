import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 환경측정기업의 관리자 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const organizationId = params.id;

    // 해당 조직의 ORG_ADMIN 역할 사용자 조회
    const managers = await prisma.user.findMany({
      where: {
        organizationId,
        role: "ORG_ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ managers });
  } catch (error: any) {
    console.error("Get organization managers error:", error);
    return NextResponse.json(
      { error: "관리자 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
