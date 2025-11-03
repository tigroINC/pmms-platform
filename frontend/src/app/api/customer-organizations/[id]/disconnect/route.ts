import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 연결 해제 (고객사 관리자 또는 시스템 관리자만)
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
