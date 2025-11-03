import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/org/staff/[id]/activate - 직원 활성화
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = session.user as any;
    const userRole = user.role;

    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: params.id },
      select: { name: true },
    });

    if (!staff) {
      return NextResponse.json({ error: "직원을 찾을 수 없습니다." }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { isActive: true },
    });

    // 활동 로그 기록
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "ACTIVATE_STAFF",
        details: `${staff.name} 활성화`,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "직원이 활성화되었습니다." });
  } catch (error: any) {
    console.error("Activate staff error:", error);
    return NextResponse.json(
      { error: "활성화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
