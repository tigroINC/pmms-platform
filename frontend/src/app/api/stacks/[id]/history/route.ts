import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 굴뚝 변경 이력 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const history = await prisma.stackHistory.findMany({
      where: {
        stackId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'desc',
      },
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Get stack history error:", error);
    return NextResponse.json(
      { error: "이력 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
