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

    // 필터 조건
    const where: any = {
      customerId,
      status: "PENDING_REVIEW" as any,
    };

    if (organizationId) {
      where.draftCreatedBy = organizationId;
    }

    // PENDING_REVIEW 굴뚝 조회
    const stacks = await prisma.stack.findMany({
      where,
      include: {
        stackCodes: {
          where: {
            organizationId: organizationId || undefined,
          },
          include: {
            organization: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        draftCreatedAt: "desc",
      },
    });

    const result = stacks.map((s) => {
      const code = s.stackCodes[0];
      return {
        stackId: s.id,
        site: {
          code: s.siteCode,
          name: s.siteName,
        },
        internal: code
          ? {
              code: code.internalCode,
              name: code.internalName,
              organization: {
                id: code.organization.id,
                name: code.organization.name,
              },
            }
          : null,
        physical: {
          location: s.location,
          height: s.height,
          diameter: s.diameter,
          coordinates: s.coordinates ? JSON.parse(s.coordinates) : null,
        },
        status: "PENDING_REVIEW",
        draftCreatedAt: s.draftCreatedAt?.toISOString(),
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
