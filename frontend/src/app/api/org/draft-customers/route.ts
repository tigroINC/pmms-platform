import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/org/draft-customers
 * 임시 고객 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;

    // 권한 체크: 환경측정기업 사용자만
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // DRAFT 상태의 고객사 조회
    const customers = await prisma.customer.findMany({
      where: {
        status: "DRAFT",
        draftCreatedBy: userOrgId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            stacks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const result = customers.map((c) => ({
      customerId: c.id,
      name: c.name,
      businessNumber: c.businessNumber,
      address: c.address,
      phone: c.phone,
      status: "DRAFT",
      stackCount: c._count.stacks,
      createdAt: c.createdAt.toISOString(),
    }));

    return NextResponse.json({ customers: result });
  } catch (error: any) {
    console.error("[GET /api/org/draft-customers] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
