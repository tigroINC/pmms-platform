import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/customer/stacks/pending-review
 * 검토 대기 굴뚝 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const customerId = (session.user as any).customerId;

    // 권한 체크: 고객사 사용자만
    if (userRole !== "CUSTOMER_ADMIN" && userRole !== "CUSTOMER_USER") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get("organizationId");

    // 필터 조건: 고객사가 확인하지 않은 굴뚝
    const where: any = {
      customerId,
      isVerified: false,
      isActive: true,
    };

    if (organizationId) {
      where.draftCreatedBy = organizationId;
    }

    // 미확인 굴뚝 조회
    const stacks = await prisma.stack.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    // draftCreatedBy로 Organization 정보 조회
    const organizationIds = [...new Set(stacks.map(s => s.draftCreatedBy).filter(Boolean))] as string[];
    const organizations = await prisma.organization.findMany({
      where: {
        id: { in: organizationIds },
      },
      select: {
        id: true,
        name: true,
      },
    });
    const orgMap = new Map(organizations.map(o => [o.id, o]));

    const result = stacks.map((s) => {
      const org = s.draftCreatedBy ? orgMap.get(s.draftCreatedBy) : null;
      return {
        stackId: s.id,
        site: {
          code: s.siteCode || s.name,
          name: s.siteName || s.fullName || s.name,
        },
        internal: org
          ? {
              code: s.code || "-",
              name: s.fullName,
              organization: {
                id: org.id,
                name: org.name,
              },
            }
          : null,
        physical: {
          location: s.location,
          height: s.height,
          diameter: s.diameter,
          coordinates: s.coordinates ? JSON.parse(s.coordinates) : null,
        },
        facilityType: s.facilityType,
        category: s.category,
        status: "PENDING_REVIEW",
        draftCreatedAt: s.draftCreatedAt?.toISOString(),
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({
      stacks: result,
      total: result.length,
    });
  } catch (error: any) {
    console.error("[GET /api/customer/stacks/pending-review] Error:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
