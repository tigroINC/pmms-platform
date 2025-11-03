import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/org/draft-customers/[customerId]/stacks/bulk-create
 * 임시 굴뚝 일괄 등록
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

    const body = await request.json();
    const { stacks } = body;

    if (!Array.isArray(stacks) || stacks.length === 0) {
      return NextResponse.json(
        { error: "굴뚝 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    let created = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: string }> = [];

    // 각 굴뚝을 순차적으로 처리
    for (let i = 0; i < stacks.length; i++) {
      const stackData = stacks[i];
      try {
        if (!stackData.internalCode) {
          throw new Error("내부 코드는 필수입니다.");
        }

        // Transaction으로 Stack + StackCode 생성
        await prisma.$transaction(async (tx) => {
          const stack = await tx.stack.create({
            data: {
              customerId,
              siteCode: stackData.internalCode,
              siteName: stackData.internalName || stackData.internalCode,
              name: stackData.internalCode,
              fullName: stackData.internalName || stackData.internalCode,
              location: stackData.location || null,
              height: stackData.height ? parseFloat(stackData.height) : null,
              diameter: stackData.diameter ? parseFloat(stackData.diameter) : null,
              coordinates: stackData.coordinates
                ? JSON.stringify(stackData.coordinates)
                : null,
              description: stackData.description || null,
              status: "DRAFT",
              draftCreatedBy: userOrgId,
              draftCreatedAt: new Date(),
              isActive: true,
            },
          });

          await tx.stackCode.create({
            data: {
              stackId: stack.id,
              organizationId: userOrgId,
              internalCode: stackData.internalCode,
              internalName: stackData.internalName || null,
              description: stackData.description || null,
              isPrimary: true,
              isActive: true,
              createdBy: userId,
            },
          });
        });

        created++;
      } catch (error: any) {
        failed++;
        errors.push({
          index: i,
          error: error.message || "등록 실패",
        });
      }
    }

    return NextResponse.json({
      created,
      failed,
      errors,
      message: `${created}개 등록 완료, ${failed}개 실패`,
    });
  } catch (error: any) {
    console.error(
      "[POST /api/org/draft-customers/[customerId]/stacks/bulk-create] Error:",
      error
    );
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
