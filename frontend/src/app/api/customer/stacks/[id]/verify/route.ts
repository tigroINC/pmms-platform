import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStackVerifiedByCustomer } from "@/lib/notification-helper";

/**
 * POST /api/customer/stacks/[id]/verify
 * 굴뚝 정보 확인 완료 (선택적)
 */
export async function POST(
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
    const customerId = (session.user as any).customerId;

    // 권한 체크: 고객사 관리자만 확인 가능
    if (userRole !== "CUSTOMER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { id } = params;

    // 굴뚝 조회
    const stack = await prisma.stack.findUnique({
      where: { id },
    });

    if (!stack) {
      return NextResponse.json({ error: "굴뚝을 찾을 수 없습니다." }, { status: 404 });
    }

    // 자사 굴뚝인지 확인
    if (stack.customerId !== customerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 이미 확인 완료된 경우
    if (stack.isVerified && stack.status === "CONFIRMED") {
      return NextResponse.json({
        message: "이미 확인 완료된 굴뚝입니다.",
        data: stack,
      });
    }

    // Transaction으로 확인 완료 처리
    const updated = await prisma.$transaction(async (tx) => {
      // 1. 굴뚝 상태 업데이트
      const updatedStack = await tx.stack.update({
        where: { id },
        data: {
          isVerified: true,
          verifiedBy: userId,
          verifiedAt: new Date(),
          status: "CONFIRMED",
        },
        include: {
          customer: {
            select: {
              name: true,
            },
          },
        },
      });

      // 2. PENDING_REVIEW였던 경우 StackOrganization 생성
      if (stack.status === "PENDING_REVIEW" && stack.draftCreatedBy) {
        const existingOrg = await tx.stackOrganization.findFirst({
          where: {
            stackId: id,
            organizationId: stack.draftCreatedBy,
          },
        });

        if (!existingOrg) {
          await tx.stackOrganization.create({
            data: {
              stackId: id,
              organizationId: stack.draftCreatedBy,
              status: "APPROVED",
              isPrimary: true,
              requestedBy: userId,
              approvedBy: userId,
              approvedAt: new Date(),
            },
          });
        }
      }

      return updatedStack;
    });

    // 알림 생성: 담당 환경측정기업에 알림
    try {
      await notifyStackVerifiedByCustomer({
        stackId: id,
        stackName: updated.name,
        customerId: updated.customerId,
        customerName: updated.customer.name,
        verifiedBy: userId,
      });
    } catch (notifyError) {
      console.error("[POST /api/customer/stacks/[id]/verify] Notification error:", notifyError);
      // 알림 실패해도 확인은 성공
    }

    // 이력 기록
    await prisma.stackHistory.create({
      data: {
        stackId: id,
        changedBy: userId,
        fieldName: "isVerified",
        previousValue: "false",
        newValue: "true",
        changeReason: "고객사 확인 완료",
      },
    });

    // 알림 생성: 담당 환경측정기업 관리자에게
    try {
      await notifyStackVerifiedByCustomer({
        stackId: updated.id,
        stackName: updated.name,
        customerId: updated.customerId,
        customerName: updated.customer.name,
        verifiedBy: (session.user as any).name || "Unknown",
      });
    } catch (notifyError) {
      console.error("[POST /api/customer/stacks/[id]/verify] Notification error:", notifyError);
      // 알림 실패해도 확인은 성공
    }

    return NextResponse.json({
      message: "굴뚝 정보 확인이 완료되었습니다.",
      data: updated,
    });
  } catch (error: any) {
    console.error("[POST /api/customer/stacks/[id]/verify] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
