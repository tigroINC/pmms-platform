import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/org/draft-customers/[customerId]/stacks
 * 임시 굴뚝 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const { customerId } = params;

    // 권한 체크
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Customer 확인
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        status: "DRAFT",
        draftCreatedBy: userOrgId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "임시 고객을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // DRAFT 굴뚝 조회
    const stacks = await prisma.stack.findMany({
      where: {
        customerId,
        status: "DRAFT",
        draftCreatedBy: userOrgId,
        isActive: true,
      },
      include: {
        stackCodes: {
          where: {
            organizationId: userOrgId,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const result = stacks.map((s) => {
      const code = s.stackCodes[0];
      return {
        stackId: s.id,
        internal: {
          code: code?.internalCode || s.siteCode,
          name: code?.internalName || s.siteName,
        },
        physical: {
          location: s.location,
          height: s.height,
          diameter: s.diameter,
          coordinates: s.coordinates ? JSON.parse(s.coordinates) : null,
        },
        description: code?.description || s.description,
        status: "DRAFT",
        createdAt: s.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ stacks: result });
  } catch (error: any) {
    console.error(
      "[GET /api/org/draft-customers/[customerId]/stacks] Error:",
      error
    );
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
