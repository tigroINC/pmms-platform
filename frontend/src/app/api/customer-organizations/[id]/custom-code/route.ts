import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 세컨 코드 설정 (환경측정기업만 가능)
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

    // 권한 체크: 환경측정기업 관리자만
    if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { customCode } = body;

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

    // 승인된 연결만 코드 설정 가능
    if (connection.status !== "APPROVED") {
      return NextResponse.json(
        { error: "승인된 연결만 코드를 설정할 수 있습니다." },
        { status: 400 }
      );
    }

    // 세컨 코드 업데이트
    const updated = await prisma.customerOrganization.update({
      where: { id: params.id },
      data: {
        customCode: customCode || null,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: userId,
        action: "UPDATE_CUSTOM_CODE",
        target: "CustomerOrganization",
        targetId: params.id,
        details: JSON.stringify({
          customerId: connection.customerId,
          customerName: connection.customer.name,
          customCode: customCode,
        }),
      },
    });

    return NextResponse.json({
      message: "고객사 코드가 설정되었습니다.",
      connection: updated,
    });
  } catch (error: any) {
    console.error("Update custom code error:", error);
    return NextResponse.json(
      { error: "코드 설정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
