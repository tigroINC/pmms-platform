import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/org/draft-customers/create
 * 환경측정기업이 임시 고객 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const userOrgId = (session.user as any).organizationId;

    // 권한 체크: 환경측정기업 사용자만
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, businessNumber, address, phone } = body;

    if (!name) {
      return NextResponse.json({ error: "고객사명은 필수입니다." }, { status: 400 });
    }

    // 중복 체크 (같은 조직 내에서 같은 이름)
    const existing = await prisma.customer.findFirst({
      where: {
        name,
        draftCreatedBy: userOrgId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 등록된 고객사입니다." },
        { status: 400 }
      );
    }

    // Customer 생성 (DRAFT 상태)
    const customer = await prisma.customer.create({
      data: {
        name,
        businessNumber: businessNumber || null,
        address: address || null,
        phone: phone || null,
        status: "DRAFT",
        draftCreatedBy: userOrgId,
        draftCreatedAt: new Date(),
        createdBy: userId,
        isPublic: false,
        isActive: true,
      },
    });

    return NextResponse.json({
      customerId: customer.id,
      status: "DRAFT",
      message: "임시 고객이 등록되었습니다.",
    });
  } catch (error: any) {
    console.error("[POST /api/org/draft-customers/create] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
