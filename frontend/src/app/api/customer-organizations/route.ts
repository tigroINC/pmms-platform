import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 고객사의 연결된 환경측정기업 목록 조회
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userCustomerId = (session.user as any).customerId;
    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";

    if (!isCustomerUser || !userCustomerId) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 고객사의 연결된 환경측정기업 목록 조회 (APPROVED 상태만)
    const customerOrganizations = await prisma.customerOrganization.findMany({
      where: {
        customerId: userCustomerId,
        status: "APPROVED",
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            businessNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const organizations = customerOrganizations.map((co) => ({
      id: co.organization.id,
      name: co.organization.name,
      businessNumber: co.organization.businessNumber,
      nickname: co.nickname,
    }));

    return NextResponse.json({ organizations });
  } catch (error: any) {
    console.error("Get customer organizations error:", error);
    return NextResponse.json(
      { error: "환경측정기업 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
