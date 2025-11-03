import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/org/draft-customers/[customerId]/stacks/[stackId]
 * 임시 굴뚝 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { customerId: string; stackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const userOrgId = (session.user as any).organizationId;
    const { customerId, stackId } = params;

    // 권한 체크
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Stack 확인 (DRAFT 상태이고 내가 등록한 것)
    const stack = await prisma.stack.findFirst({
      where: {
        id: stackId,
        customerId,
        status: "DRAFT" as any,
        draftCreatedBy: userOrgId,
      },
    });

    if (!stack) {
      return NextResponse.json(
        { error: "임시 굴뚝을 찾을 수 없습니다." },
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

    // Transaction으로 Stack + StackCode 수정
    await prisma.$transaction(async (tx) => {
      // Stack 수정
      await tx.stack.update({
        where: { id: stackId },
        data: {
          siteCode: internalCode || stack.siteCode,
          siteName: internalName || stack.siteName,
          name: internalCode || stack.name,
          fullName: internalName || stack.fullName,
          location: location !== undefined ? location : stack.location,
          height: height !== undefined ? parseFloat(height) : stack.height,
          diameter: diameter !== undefined ? parseFloat(diameter) : stack.diameter,
          coordinates:
            coordinates !== undefined
              ? JSON.stringify(coordinates)
              : stack.coordinates,
          description: description !== undefined ? description : stack.description,
        },
      });

      // StackCode 수정
      await tx.stackCode.updateMany({
        where: {
          stackId,
          organizationId: userOrgId,
        },
        data: {
          internalCode: internalCode || undefined,
          internalName: internalName !== undefined ? internalName : undefined,
          description: description !== undefined ? description : undefined,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "임시 굴뚝이 수정되었습니다.",
    });
  } catch (error: any) {
    console.error(
      "[PATCH /api/org/draft-customers/[customerId]/stacks/[stackId]] Error:",
      error
    );
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/org/draft-customers/[customerId]/stacks/[stackId]
 * 임시 굴뚝 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { customerId: string; stackId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const { customerId, stackId } = params;

    // 권한 체크
    if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // Stack 확인
    const stack = await prisma.stack.findFirst({
      where: {
        id: stackId,
        customerId,
        status: "DRAFT" as any,
        draftCreatedBy: userOrgId,
      },
    });

    if (!stack) {
      return NextResponse.json(
        { error: "임시 굴뚝을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 삭제 (StackCode는 CASCADE로 자동 삭제)
    await prisma.stack.delete({
      where: { id: stackId },
    });

    return NextResponse.json({
      success: true,
      message: "임시 굴뚝이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error(
      "[DELETE /api/org/draft-customers/[customerId]/stacks/[stackId]] Error:",
      error
    );
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
