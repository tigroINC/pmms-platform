import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 환경측정기업 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // PENDING, APPROVED, REJECTED
    const search = searchParams.get("search");
    const plan = searchParams.get("plan");

    const where: any = {};

    // 고객사는 활성화된 조직만 조회
    if (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") {
      where.isActive = true;
    } else {
      // 승인 상태 필터 (Organization의 isActive로 판단)
      if (status === "PENDING") {
        where.isActive = false;
      } else if (status === "APPROVED") {
        where.isActive = true;
      }
    }

    // 검색 (회사명, 사업자등록번호)
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { businessNumber: { contains: search } },
      ];
    }

    // 구독 플랜 필터
    if (plan) {
      where.subscriptionPlan = plan;
    }

    const organizations = await prisma.organization.findMany({
      where,
      include: {
        users: {
          where: { role: "ORG_ADMIN" },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            customers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ organizations });
  } catch (error: any) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      { error: "환경측정기업 목록 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
