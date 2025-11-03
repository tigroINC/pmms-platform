import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/org/draft-customers/[customerId]/stacks/create
 * 임시 굴뚝 단건 등록
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const userOrgId = (session.user as any).organizationId;
    const { customerId } = params;

    // 권한 체크: 환경측정기업 사용자만
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Customer 확인 (DRAFT 상태이고 내가 등록한 것)
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

    const body = await request.json();
    const {
      internalCode,
      internalName,
      location,
      height,
      diameter,
      coordinates,
      description,
    } = body;

    if (!internalCode) {
      return NextResponse.json(
        { error: "내부 코드는 필수입니다." },
        { status: 400 }
      );
    }

    // Transaction으로 Stack + StackCode 생성
    const result = await prisma.$transaction(async (tx) => {
      // Stack 생성 (DRAFT 상태)
      const stack = await tx.stack.create({
        data: {
          customerId,
          siteCode: internalCode, // 임시로 내부 코드 사용
          siteName: internalName || internalCode, // 임시로 내부 명칭 사용
          name: internalCode, // 기존 호환
          fullName: internalName || internalCode, // 기존 호환
          location: location || null,
          height: height ? parseFloat(height) : null,
          diameter: diameter ? parseFloat(diameter) : null,
          coordinates: coordinates ? JSON.stringify(coordinates) : null,
          description: description || null,
          status: "DRAFT",
          draftCreatedBy: userOrgId,
          draftCreatedAt: new Date(),
          isActive: true,
        },
      });

      // StackCode 생성
      const stackCode = await tx.stackCode.create({
        data: {
          stackId: stack.id,
          organizationId: userOrgId,
          internalCode,
          internalName: internalName || null,
          description: description || null,
          isPrimary: true,
          isActive: true,
          createdBy: userId,
        },
      });

      return { stack, stackCode };
    });

    return NextResponse.json({
      stackId: result.stack.id,
      status: "DRAFT",
      message: "임시 굴뚝이 등록되었습니다.",
    });
  } catch (error: any) {
    console.error(
      "[POST /api/org/draft-customers/[customerId]/stacks/create] Error:",
      error
    );
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
