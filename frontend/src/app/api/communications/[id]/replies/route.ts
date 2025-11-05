import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewCommunication } from "@/lib/permissions/communication";

/**
 * POST /api/communications/[id]/replies
 * 답변 추가 (양방향 대화)
 */
export async function POST(
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
    const { content } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "답변 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const communication = await prisma.communication.findUnique({
      where: { id },
      select: {
        customerId: true,
        createdById: true,
        isDeleted: true,
        status: true,
        customer: { select: { name: true } },
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

    // 조회 권한 체크
    const canView = await canViewCommunication(user, communication);
    if (!canView) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 방향 결정
    const isCustomer = user.role === "CUSTOMER_ADMIN" || user.role === "CUSTOMER_USER";
    const direction = isCustomer ? "OUTBOUND" : "INBOUND";

    // 트랜잭션으로 답변 생성 + 상태 변경 + 알림
    const reply = await prisma.$transaction(async (tx) => {
      // 1. 답변 생성
      const newReply = await tx.communicationReply.create({
        data: {
          communicationId: id,
          content: content.trim(),
          direction,
          createdById: user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
        },
      });

      // 2. 상태 변경: 상대방이 답변한 경우에만 IN_PROGRESS로 변경
      const isCreatorCustomer = communication.createdBy.role === "CUSTOMER_ADMIN" || communication.createdBy.role === "CUSTOMER_USER";
      const isReplierCustomer = isCustomer;
      
      // 작성자와 답변자가 다른 쪽인 경우에만 대화중으로 변경
      if (isCreatorCustomer !== isReplierCustomer) {
        await tx.communication.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }

      // 3. 알림 생성 (상대방에게)
      if (isCustomer) {
        // 고객사가 답변 → 환경측정기업에 알림
        const orgUsers = await tx.user.findMany({
          where: {
            organizationId: { not: null },
            role: { in: ["ORG_ADMIN", "OPERATOR"] }
          },
          select: { id: true }
        });

        if (orgUsers.length > 0) {
          await tx.notification.createMany({
            data: orgUsers.map(u => ({
              userId: u.id,
              type: "COMMUNICATION_CLIENT_REQUEST",
              title: "고객사에서 답변했습니다",
              message: `${communication.customer.name} - ${content.substring(0, 50)}`,
              customerId: communication.customerId,
              metadata: JSON.stringify({ communicationId: id, replyId: newReply.id }),
            }))
          });
        }
      } else {
        // 환경측정기업이 답변 → 고객사에 알림
        const customerUsers = await tx.user.findMany({
          where: {
            customerId: communication.customerId,
            role: { in: ["CUSTOMER_ADMIN", "CUSTOMER_USER"] }
          },
          select: { id: true }
        });

        if (customerUsers.length > 0) {
          await tx.notification.createMany({
            data: customerUsers.map(u => ({
              userId: u.id,
              type: "COMMUNICATION_STATUS_CHANGED",
              title: "답변이 도착했습니다",
              message: `${content.substring(0, 50)}`,
              customerId: communication.customerId,
              metadata: JSON.stringify({ communicationId: id, replyId: newReply.id }),
            }))
          });
        }
      }

      return newReply;
    });

    return NextResponse.json(reply, { status: 201 });
  } catch (error: any) {
    console.error("Reply creation error:", error);
    return NextResponse.json(
      { error: "답변 추가 실패", details: error.message },
      { status: 500 }
    );
  }
}
