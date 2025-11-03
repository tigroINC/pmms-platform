import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 고객회사 관리자 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { newAdminId } = body;

    if (!newAdminId) {
      return NextResponse.json(
        { error: "새 관리자 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 새 관리자가 해당 고객사에 속하는지 확인
    const newAdmin = await prisma.user.findUnique({
      where: { id: newAdminId },
    });

    if (!newAdmin || newAdmin.customerId !== params.id) {
      return NextResponse.json(
        { error: "유효하지 않은 사용자입니다." },
        { status: 400 }
      );
    }

    if (newAdmin.status !== "APPROVED" || !newAdmin.isActive) {
      return NextResponse.json(
        { error: "승인되고 활성화된 사용자만 관리자로 지정할 수 있습니다." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 기존 관리자를 CUSTOMER_USER로 변경
      await tx.user.updateMany({
        where: {
          customerId: params.id,
          role: "CUSTOMER_ADMIN",
        },
        data: {
          role: "CUSTOMER_USER",
        },
      });

      // 새 관리자를 CUSTOMER_ADMIN으로 변경
      const updatedUser = await tx.user.update({
        where: { id: newAdminId },
        data: {
          role: "CUSTOMER_ADMIN",
        },
      });

      // 활동 로그
      await tx.activityLog.create({
        data: {
          userId: (session.user as any).id,
          action: "CHANGE_CUSTOMER_ADMIN",
          target: "Customer",
          targetId: params.id,
          details: JSON.stringify({
            newAdminId: newAdminId,
            newAdminName: updatedUser.name,
            newAdminEmail: updatedUser.email,
          }),
        },
      });

      return updatedUser;
    });

    return NextResponse.json({
      message: "관리자가 변경되었습니다.",
      newAdmin: result,
    });
  } catch (error: any) {
    console.error("Change admin error:", error);
    return NextResponse.json(
      { error: "관리자 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
