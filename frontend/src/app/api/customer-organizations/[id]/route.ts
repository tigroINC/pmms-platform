import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 연결 해제 (고객사 관리자 또는 시스템 관리자만)
export async function DELETE(
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

    // 권한 체크: 고객사 관리자 또는 시스템 관리자만
    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
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

    // 연결 해제 (상태를 DISCONNECTED로 변경)
    const updated = await prisma.customerOrganization.update({
      where: { id: params.id },
      data: {
        status: "DISCONNECTED",
        isActive: false,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "DISCONNECT_CONNECTION",
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
      message: "연결이 해제되었습니다. 기존 데이터는 읽기 전용으로 유지됩니다.",
      connection: updated,
    });
  } catch (error: any) {
    console.error("Disconnect connection error:", error);
    return NextResponse.json(
      { error: "연결 해제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

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
