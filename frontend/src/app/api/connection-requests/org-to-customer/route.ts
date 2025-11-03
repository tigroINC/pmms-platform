import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 환경측정기업 → 고객사 연결 초대
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // 권한 체크: 환경측정기업 관리자 또는 시스템 관리자
    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { customerId, organizationId, contractStartDate, contractEndDate } = body;

    if (!customerId || !organizationId) {
      return NextResponse.json(
        { error: "고객사 ID와 환경측정기업 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 고객사 존재 확인
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "고객사를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 연결 초대가 있는지 확인
    const existing = await prisma.customerOrganization.findUnique({
      where: {
        customerId_organizationId: {
          customerId: customerId,
          organizationId: organizationId,
        },
      },
    });

    if (existing) {
      if (existing.status === "APPROVED") {
        return NextResponse.json(
          { error: "이미 연결된 고객사입니다." },
          { status: 400 }
        );
      } else if (existing.status === "PENDING") {
        return NextResponse.json(
          { error: "이미 연결 초대가 진행 중입니다." },
          { status: 400 }
        );
      }
    }

    // 연결 초대 생성
    const connection = await prisma.customerOrganization.create({
      data: {
        customerId: customerId,
        organizationId: organizationId,
        status: "PENDING",
        requestedBy: "ORGANIZATION",
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "INVITE_CONNECTION",
        target: "CustomerOrganization",
        targetId: connection.id,
        details: JSON.stringify({
          customerId: customerId,
          customerName: customer.name,
          organizationId: organizationId,
        }),
      },
    });

    return NextResponse.json({
      message: "연결 초대가 전송되었습니다.",
      connection,
    });
  } catch (error: any) {
    console.error("Invite connection error:", error);
    return NextResponse.json(
      { error: "연결 초대 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
