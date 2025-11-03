import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 연결 거부
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

    // 연결 요청 조회
    const connection = await prisma.customerOrganization.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        organization: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "연결 요청을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 권한 체크
    if (connection.requestedBy === "CUSTOMER") {
      // 고객사가 요청 → 환경측정기업 관리자 또는 시스템 관리자가 거부
      if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    } else {
      // 환경측정기업이 초대 → 고객사 관리자 또는 시스템 관리자가 거부
      if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
      }
    }

    if (connection.status !== "PENDING") {
      return NextResponse.json(
        { error: "이미 처리된 요청입니다." },
        { status: 400 }
      );
    }

    // 거부 처리
    const updated = await prisma.customerOrganization.update({
      where: { id: params.id },
      data: {
        status: "REJECTED",
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "REJECT_CONNECTION",
        target: "CustomerOrganization",
        targetId: params.id,
        details: JSON.stringify({
          customerId: connection.customerId,
          customerName: connection.customer.name,
          organizationId: connection.organizationId,
          organizationName: connection.organization.name,
        }),
      },
    });

    return NextResponse.json({
      message: "연결이 거부되었습니다.",
      connection: updated,
    });
  } catch (error: any) {
    console.error("Reject connection error:", error);
    return NextResponse.json(
      { error: "연결 거부 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
