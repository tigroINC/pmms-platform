import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 사용자 역할 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const targetUserId = params.id;

    // 권한 체크
    if (userRole !== "SUPER_ADMIN" && userRole !== "ORG_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { customRoleId } = body;

    // 대상 사용자 확인
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // SUPER_ADMIN은 역할 변경 불가
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "시스템 관리자의 역할은 변경할 수 없습니다." },
        { status: 400 }
      );
    }

    // 커스텀 역할이 지정된 경우 존재 확인
    if (customRoleId) {
      const customRole = await prisma.customRole.findUnique({
        where: { id: customRoleId },
      });

      if (!customRole) {
        return NextResponse.json(
          { error: "커스텀 역할을 찾을 수 없습니다." },
          { status: 404 }
        );
      }
    }

    // 역할 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: targetUserId },
      data: {
        customRoleId: customRoleId || null,
      },
      include: {
        customRole: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId,
        action: "UPDATE_USER_ROLE",
        target: "User",
        targetId: targetUserId,
        details: JSON.stringify({
          userName: targetUser.name,
          customRoleId: customRoleId || null,
        }),
      },
    });

    return NextResponse.json({
      message: "사용자 역할이 변경되었습니다.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update user role error:", error);
    return NextResponse.json(
      { error: "사용자 역할 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
