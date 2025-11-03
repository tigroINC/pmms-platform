import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyStackCreatedByCustomer } from "@/lib/notification-helper";

/**
 * POST /api/customer/stacks/create
 * 고객사 직접 굴뚝 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const customerId = (session.user as any).customerId;

    // 권한 체크
    if (userRole !== "CUSTOMER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { siteCode, siteName, location, height, diameter, coordinates } = body;

    if (!siteCode || !siteName) {
      return NextResponse.json(
        { error: "현장 코드와 명칭은 필수입니다." },
        { status: 400 }
      );
    }

    // 중복 체크
    const existing = await prisma.stack.findFirst({
      where: {
        customerId,
        siteCode,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 현장 코드입니다." },
        { status: 400 }
      );
    }

    // Stack 생성 (즉시 활성화 + 확인완료 + CONFIRMED 상태)
    const stack = await prisma.stack.create({
      data: {
        customerId,
        siteCode,
        siteName,
        name: siteCode, // 기존 호환
        fullName: siteName, // 기존 호환
        location: location || null,
        height: height ? parseFloat(height) : null,
        diameter: diameter ? parseFloat(diameter) : null,
        coordinates: coordinates ? JSON.stringify(coordinates) : null,
        isActive: true,
        isVerified: true, // 자체 등록은 즉시 확인완료
        verifiedBy: userId,
        verifiedAt: new Date(),
        status: "CONFIRMED", // 즉시 확정 상태
        createdBy: userId,
      },
      include: {
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    // 알림 생성: 담당 환경측정기업 관리자에게
    try {
      await notifyStackCreatedByCustomer({
        stackId: stack.id,
        stackName: stack.name,
        customerId: stack.customerId,
        customerName: stack.customer.name,
        needsInternalCode: true, // 고객사 등록 시 내부코드 없음
      });
    } catch (notifyError) {
      console.error("[POST /api/customer/stacks/create] Notification error:", notifyError);
      // 알림 실패해도 등록은 성공
    }

    return NextResponse.json({
      stackId: stack.id,
      message: "굴뚝이 등록되었습니다.",
    });
  } catch (error: any) {
    console.error("[POST /api/customer/stacks/create] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
