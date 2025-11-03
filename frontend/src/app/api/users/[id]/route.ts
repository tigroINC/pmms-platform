import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 사용자 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        organization: true,
        customer: true,
        assignedCustomers: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 본인 정보이거나 관리자만 조회 가능
    const sessionUser = session.user as any;
    if (
      sessionUser.id !== user.id &&
      !["SUPER_ADMIN", "ORG_ADMIN"].includes(sessionUser.role)
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { error: "사용자 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const sessionUser = session.user as any;
    const body = await request.json();
    const { action, ...updateData } = body;

    // 승인/거부는 관리자만 가능
    if (action === "approve" || action === "reject") {
      if (!["SUPER_ADMIN", "ADMIN"].includes(sessionUser.role)) {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }

      if (action === "approve") {
        const user = await prisma.user.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            isActive: true,
            approvedBy: sessionUser.id,
            approvedAt: new Date(),
          },
        });

        // 활동 로그
        await prisma.activityLog.create({
          data: {
            userId: sessionUser.id,
            action: "APPROVE_USER",
            target: "User",
            targetId: params.id,
            details: JSON.stringify({ userId: params.id, email: user.email }),
          },
        });

        return NextResponse.json({ message: "사용자가 승인되었습니다.", user });
      } else if (action === "reject") {
        const user = await prisma.user.update({
          where: { id: params.id },
          data: {
            status: "REJECTED",
            isActive: false,
            rejectedReason: updateData.reason || "관리자에 의해 거부됨",
          },
        });

        // 활동 로그
        await prisma.activityLog.create({
          data: {
            userId: sessionUser.id,
            action: "REJECT_USER",
            target: "User",
            targetId: params.id,
            details: JSON.stringify({
              userId: params.id,
              email: user.email,
              reason: updateData.reason,
            }),
          },
        });

        return NextResponse.json({ message: "사용자가 거부되었습니다.", user });
      }
    }

    // 일반 정보 수정은 본인이거나 관리자만 가능
    if (
      sessionUser.id !== params.id &&
      !["SUPER_ADMIN", "ORG_ADMIN"].includes(sessionUser.role)
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 역할 변경은 관리자만 가능
    if (updateData.role && !["SUPER_ADMIN", "ORG_ADMIN"].includes(sessionUser.role)) {
      delete updateData.role;
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: sessionUser.id,
        action: "UPDATE_USER",
        target: "User",
        targetId: params.id,
        details: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ message: "사용자 정보가 수정되었습니다.", user });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "사용자 정보 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자 삭제 (비활성화)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !["SUPER_ADMIN", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: false,
        status: "WITHDRAWN",
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE_USER",
        target: "User",
        targetId: params.id,
        details: JSON.stringify({ userId: params.id, email: user.email }),
      },
    });

    return NextResponse.json({ message: "사용자가 비활성화되었습니다." });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "사용자 비활성화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
