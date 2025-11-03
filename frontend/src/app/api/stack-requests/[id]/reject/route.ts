import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 굴뚝 등록 요청 거부
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

    // 권한 체크: 고객사 관리자 또는 시스템 관리자
    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { reason } = body;

    // 요청 조회
    const stackRequest = await prisma.stackRequest.findUnique({
      where: { id: params.id },
    });

    if (!stackRequest) {
      return NextResponse.json(
        { error: "굴뚝 등록 요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (stackRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 요청입니다." },
        { status: 400 }
      );
    }

    // 거부 처리
    const updated = await prisma.stackRequest.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
        reviewedBy: userId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "REJECT_STACK_REQUEST",
        target: "StackRequest",
        targetId: params.id,
        details: JSON.stringify({
          customerId: stackRequest.customerId,
          organizationId: stackRequest.organizationId,
          reason: reason,
        }),
      },
    });

    return NextResponse.json({
      message: "굴뚝 등록 요청이 거부되었습니다.",
      stackRequest: updated,
    });
  } catch (error: any) {
    console.error("Reject stack request error:", error);
    return NextResponse.json(
      { error: "굴뚝 등록 요청 거부 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
