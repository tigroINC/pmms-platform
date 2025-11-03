import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 역할 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category) {
      where.category = category;
    }

    const templates = await prisma.roleTemplate.findMany({
      where,
      include: {
        defaultPermissions: {
          select: {
            id: true,
            permissionCode: true,
          },
        },
        _count: {
          select: {
            customRoles: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("Get role templates error:", error);
    return NextResponse.json(
      { error: "역할 템플릿 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
