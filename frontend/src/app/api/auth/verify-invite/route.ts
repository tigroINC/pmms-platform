import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/auth/verify-invite - 초대 토큰 검증
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "토큰이 필요합니다." },
        { status: 400 }
      );
    }

    // 토큰으로 사용자 찾기
    const user = await prisma.user.findFirst({
      where: {
        inviteToken: token,
        inviteTokenExpiry: {
          gte: new Date(), // 만료되지 않은 토큰
        },
        status: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: {
          select: {
            name: true,
          },
        },
        customer: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "유효하지 않거나 만료된 초대 링크입니다." },
        { status: 404 }
      );
    }

    const roleNames: Record<string, string> = {
      ORG_ADMIN: "조직 관리자",
      OPERATOR: "실무자",
      CUSTOMER_ADMIN: "고객사 관리자",
      CUSTOMER_USER: "고객사 사용자",
    };

    // 고객사 직원인 경우 customer 정보, 환경측정기업 직원인 경우 organization 정보
    const companyName = user.customer?.name || user.organization?.name || "회사";

    return NextResponse.json({
      name: user.name,
      email: user.email,
      organizationName: companyName,
      roleName: roleNames[user.role] || user.role,
    });
  } catch (error: any) {
    console.error("Verify invite error:", error);
    return NextResponse.json(
      { error: "초대 정보 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
