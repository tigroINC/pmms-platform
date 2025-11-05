import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canChangeStatus } from "@/lib/permissions/communication";

/**
 * PATCH /api/communications/[id]/status
 * 커뮤니케이션 상태 변경
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const user = session.user as any;
    const { id } = params;
    const { status } = await request.json();

    if (!status || !["PENDING", "COMPLETED", "REFERENCE"].includes(status)) {
      return NextResponse.json(
        { error: "유효하지 않은 상태입니다" },
        { status: 400 }
      );
    }

    const communication = await prisma.communication.findUnique({
      where: { id },
      select: {
        createdById: true,
        assignedToId: true,
        isDeleted: true,
        createdBy: { select: { role: true } }
      }
    });

    if (!communication) {
      return NextResponse.json(
        { error: "커뮤니케이션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (communication.isDeleted) {
      return NextResponse.json(
        { error: "삭제된 커뮤니케이션입니다" },
        { status: 410 }
      );
    }

    // 권한 체크
    const canChange = await canChangeStatus(user, communication);
    if (!canChange) {
      return NextResponse.json(
        { error: "상태 변경 권한이 없습니다" },
        { status: 403 }
      );
    }

    // 상태 변경
    const updated = await prisma.$transaction(async (tx) => {
      const comm = await tx.communication.update({
        where: { id },
        data: { status },
        include: {
          customer: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true, role: true } },
        },
      });

      // 고객사가 등록한 커뮤니케이션이 완료된 경우 알림
      if (
        status === "COMPLETED" &&
        (comm.createdBy.role === "CUSTOMER_ADMIN" || comm.createdBy.role === "CUSTOMER_USER")
      ) {
        await tx.notification.create({
          data: {
            userId: comm.createdById,
            type: "COMMUNICATION_STATUS_CHANGED",
            title: "요청하신 사항이 처리되었습니다",
            message: `${comm.subject || comm.content.substring(0, 50)}에 대한 답변이 완료되었습니다`,
            customerId: comm.customerId,
            metadata: JSON.stringify({ communicationId: comm.id }),
          },
        });
      }

      return comm;
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Communication status change error:", error);
    return NextResponse.json(
      { error: "상태 변경 실패", details: error.message },
      { status: 500 }
    );
  }
}
