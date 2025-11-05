import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canViewCommunication,
  canUpdateCommunication,
  canDeleteCommunication,
} from "@/lib/permissions/communication";

/**
 * GET /api/communications/[id]
 * 커뮤니케이션 상세 조회
 */
export async function GET(
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

    const communication = await prisma.communication.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        measurement: {
          select: {
            id: true,
            measuredAt: true,
            stack: { select: { name: true } }
          }
        },
        stack: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true, role: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        attachments: {
          include: {
            uploadedBy: { select: { id: true, name: true } }
          },
          orderBy: { uploadedAt: "desc" }
        },
        replies: {
          include: {
            createdBy: { select: { id: true, name: true, role: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        notes: {
          include: {
            createdBy: { select: { id: true, name: true } },
            mentionedUser: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: "desc" }
        },
      },
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
    const canView = await canViewCommunication(user, communication);
    if (!canView) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    // 내부 메모 필터링: 자신의 조직/고객사 메모만 표시
    const isCustomer = user.role === "CUSTOMER_ADMIN" || user.role === "CUSTOMER_USER";
    const filteredNotes = communication.notes.filter((note: any) => {
      if (isCustomer) {
        // 고객사 사용자: 자신의 고객사 메모만
        return note.customerId === communication.customerId;
      } else {
        // 환경측정기업: 자신의 조직 메모만
        return note.organizationId === user.organizationId;
      }
    });

    return NextResponse.json({
      ...communication,
      notes: filteredNotes,
    });
  } catch (error: any) {
    console.error("Communication detail error:", error);
    return NextResponse.json(
      { error: "상세 조회 실패", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/communications/[id]
 * 커뮤니케이션 수정
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
    const body = await request.json();

    const communication = await prisma.communication.findUnique({
      where: { id },
      select: { createdById: true, createdAt: true, isDeleted: true }
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
    const canUpdate = await canUpdateCommunication(user, communication);
    if (!canUpdate) {
      return NextResponse.json(
        { error: "수정 권한이 없습니다. 작성자 본인만 24시간 이내 수정 가능합니다." },
        { status: 403 }
      );
    }

    // 수정 가능한 필드만 업데이트
    const updateData: any = {};
    if (body.contactAt) updateData.contactAt = new Date(body.contactAt);
    if (body.channel) updateData.channel = body.channel;
    if (body.direction) updateData.direction = body.direction;
    if (body.subject !== undefined) updateData.subject = body.subject;
    if (body.content) updateData.content = body.content;
    if (body.priority) updateData.priority = body.priority;
    if (body.assignedToId !== undefined) updateData.assignedToId = body.assignedToId;
    if (body.isShared !== undefined) updateData.isShared = body.isShared;

    const updated = await prisma.communication.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Communication update error:", error);
    return NextResponse.json(
      { error: "수정 실패", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/communications/[id]
 * 커뮤니케이션 삭제 (Soft Delete)
 */
export async function DELETE(
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

    const communication = await prisma.communication.findUnique({
      where: { id },
      select: { createdById: true, createdAt: true, isDeleted: true }
    });

    if (!communication) {
      return NextResponse.json(
        { error: "커뮤니케이션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (communication.isDeleted) {
      return NextResponse.json(
        { error: "이미 삭제된 커뮤니케이션입니다" },
        { status: 410 }
      );
    }

    // 권한 체크
    const canDelete = await canDeleteCommunication(user, communication);
    if (!canDelete) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다. 작성자 본인만 24시간 이내 삭제 가능합니다." },
        { status: 403 }
      );
    }

    // Soft Delete
    await prisma.communication.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user.id,
      },
    });

    return NextResponse.json({ message: "삭제되었습니다" });
  } catch (error: any) {
    console.error("Communication delete error:", error);
    return NextResponse.json(
      { error: "삭제 실패", details: error.message },
      { status: 500 }
    );
  }
}
