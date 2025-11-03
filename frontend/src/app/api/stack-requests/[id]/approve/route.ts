import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 굴뚝 등록 요청 승인
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
    const { action, existingStackId, isPrimary } = body;

    // action: "create_new" 또는 "assign_existing"
    if (!action) {
      return NextResponse.json(
        { error: "액션이 필요합니다." },
        { status: 400 }
      );
    }

    // 요청 조회
    const stackRequest = await prisma.stackRequest.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        organization: true,
      },
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

    let result;

    if (action === "create_new") {
      // 신규 굴뚝 생성
      result = await prisma.$transaction(async (tx) => {
        // 굴뚝 생성
        const newStack = await tx.stack.create({
          data: {
            customerId: stackRequest.customerId,
            name: stackRequest.stackName!,
            code: stackRequest.stackCode,
            location: stackRequest.location,
            height: stackRequest.height,
            diameter: stackRequest.diameter,
            coordinates: stackRequest.coordinates,
            description: stackRequest.description,
          },
        });

        // 담당 기업 지정
        await tx.stackOrganization.create({
          data: {
            stackId: newStack.id,
            organizationId: stackRequest.organizationId,
            status: "APPROVED",
            isPrimary: isPrimary !== undefined ? isPrimary : true,
            requestedBy: stackRequest.requestedBy,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        // 요청 상태 업데이트
        await tx.stackRequest.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            reviewedBy: userId,
            reviewedAt: new Date(),
          },
        });

        return { stack: newStack, type: "create_new" };
      });
    } else if (action === "assign_existing") {
      // 기존 굴뚝에 담당 추가
      if (!existingStackId) {
        return NextResponse.json(
          { error: "기존 굴뚝 ID가 필요합니다." },
          { status: 400 }
        );
      }

      result = await prisma.$transaction(async (tx) => {
        // 담당 기업 지정
        await tx.stackOrganization.create({
          data: {
            stackId: existingStackId,
            organizationId: stackRequest.organizationId,
            status: "APPROVED",
            isPrimary: isPrimary !== undefined ? isPrimary : false,
            requestedBy: stackRequest.requestedBy,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        // 요청 상태 업데이트
        await tx.stackRequest.update({
          where: { id: params.id },
          data: {
            status: "APPROVED",
            reviewedBy: userId,
            reviewedAt: new Date(),
          },
        });

        return { stackId: existingStackId, type: "assign_existing" };
      });
    } else {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "APPROVE_STACK_REQUEST",
        target: "StackRequest",
        targetId: params.id,
        details: JSON.stringify({
          action: action,
          customerId: stackRequest.customerId,
          organizationId: stackRequest.organizationId,
        }),
      },
    });

    return NextResponse.json({
      message: "굴뚝 등록 요청이 승인되었습니다.",
      result,
    });
  } catch (error: any) {
    console.error("Approve stack request error:", error);
    return NextResponse.json(
      { error: "굴뚝 등록 요청 승인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
