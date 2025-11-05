import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewCommunication } from "@/lib/permissions/communication";

/**
 * POST /api/communications/[id]/notes
 * 후속 메모 추가
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
    const { note, mentionedUserId } = await request.json();

    if (!note || !note.trim()) {
      return NextResponse.json(
        { error: "메모 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    const communication = await prisma.communication.findUnique({
      where: { id },
      select: {
        customerId: true,
        createdById: true,
        isDeleted: true,
        customer: { select: { name: true } }
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

    // 조회 권한 체크 (메모 추가는 조회 가능한 사람만)
    const canView = await canViewCommunication(user, communication);
    if (!canView) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 내부메모 소속 결정
    const isCustomer = user.role === "CUSTOMER_ADMIN" || user.role === "CUSTOMER_USER";
    const noteOrganizationId = isCustomer ? null : user.organizationId;
    const noteCustomerId = isCustomer ? communication.customerId : null;

    // 트랜잭션으로 메모 생성 + 알림
    const createdNote = await prisma.$transaction(async (tx) => {
      const newNote = await tx.communicationNote.create({
        data: {
          communicationId: id,
          note: note.trim(),
          organizationId: noteOrganizationId,
          customerId: noteCustomerId,
          mentionedUserId: mentionedUserId || null,
          createdById: user.id,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          mentionedUser: { select: { id: true, name: true } },
        },
      });

      // @멘션 알림
      if (mentionedUserId && mentionedUserId !== user.id) {
        await tx.notification.create({
          data: {
            userId: mentionedUserId,
            type: "COMMUNICATION_MENTION",
            title: "커뮤니케이션에서 회원님을 언급했습니다",
            message: `${user.name}님이 ${communication.customer.name} 커뮤니케이션에서 언급했습니다`,
            customerId: communication.customerId,
            metadata: JSON.stringify({
              communicationId: id,
              noteId: newNote.id
            }),
          },
        });
      }

      return newNote;
    });

    return NextResponse.json(createdNote, { status: 201 });
  } catch (error: any) {
    console.error("Communication note creation error:", error);
    return NextResponse.json(
      { error: "메모 추가 실패", details: error.message },
      { status: 500 }
    );
  }
}
