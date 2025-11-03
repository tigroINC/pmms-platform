import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 계약 연장
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

    // 권한 체크
    if (
      userRole !== "ORG_ADMIN" &&
      userRole !== "CUSTOMER_ADMIN" &&
      userRole !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { contractEndDate } = body;

    if (!contractEndDate) {
      return NextResponse.json(
        { error: "계약 종료일이 필요합니다." },
        { status: 400 }
      );
    }

    // 연결 조회
    const connection = await prisma.customerOrganization.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        organization: true,
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "연결을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (connection.status !== "APPROVED") {
      return NextResponse.json(
        { error: "승인된 연결만 계약을 연장할 수 있습니다." },
        { status: 400 }
      );
    }

    // 계약 연장 및 알림 플래그 초기화
    const updated = await prisma.customerOrganization.update({
      where: { id: params.id },
      data: {
        contractEndDate: new Date(contractEndDate),
        notified30Days: false,
        notified7Days: false,
        notifiedExpiry: false,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "EXTEND_CONTRACT",
        target: "CustomerOrganization",
        targetId: params.id,
        details: JSON.stringify({
          customerId: connection.customerId,
          customerName: connection.customer.name,
          organizationId: connection.organizationId,
          organizationName: connection.organization.name,
          newContractEndDate: contractEndDate,
        }),
      },
    });

    return NextResponse.json({
      message: "계약이 연장되었습니다.",
      connection: updated,
    });
  } catch (error: any) {
    console.error("Extend contract error:", error);
    return NextResponse.json(
      { error: "계약 연장 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
