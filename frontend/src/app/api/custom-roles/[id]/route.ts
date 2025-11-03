import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 커스텀 역할 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const { id } = params;

    const customRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        permissions: {
          select: {
            id: true,
            permissionCode: true,
            granted: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!customRole) {
      return NextResponse.json({ error: "역할을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ customRole });
  } catch (error: any) {
    console.error("Get custom role error:", error);
    return NextResponse.json(
      { error: "커스텀 역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 커스텀 역할 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const { id } = params;

    // 권한 체크
    if (
      userRole !== "SUPER_ADMIN" &&
      userRole !== "ORG_ADMIN" &&
      userRole !== "CUSTOMER_SITE_ADMIN" &&
      userRole !== "CUSTOMER_GROUP_ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, permissions } = body;

    // 역할 존재 확인
    const existingRole = await prisma.customRole.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "역할을 찾을 수 없습니다." }, { status: 404 });
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 역할 정보 업데이트
      const updatedRole = await tx.customRole.update({
        where: { id },
        data: {
          name,
          description,
        },
      });

      // 권한 업데이트 (기존 삭제 후 재생성)
      if (permissions) {
        await tx.customRolePermission.deleteMany({
          where: { roleId: id },
        });

        await tx.customRolePermission.createMany({
          data: permissions.map((p: any) => ({
            roleId: id,
            permissionCode: p.permissionCode,
            granted: p.granted ?? true,
          })),
        });
      }

      // 활동 로그
      await tx.activityLog.create({
        data: {
          userId,
          action: "UPDATE_CUSTOM_ROLE",
          target: "CustomRole",
          targetId: id,
          details: JSON.stringify({
            roleName: name,
            permissionsCount: permissions?.length || 0,
          }),
        },
      });

      return updatedRole;
    });

    // 업데이트된 역할 조회
    const customRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        template: true,
        permissions: true,
      },
    });

    return NextResponse.json({
      message: "커스텀 역할이 수정되었습니다.",
      customRole,
    });
  } catch (error: any) {
    console.error("Update custom role error:", error);
    return NextResponse.json(
      { error: "커스텀 역할 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 커스텀 역할 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const { id } = params;

    // 권한 체크
    if (
      userRole !== "SUPER_ADMIN" &&
      userRole !== "ORG_ADMIN" &&
      userRole !== "CUSTOMER_SITE_ADMIN" &&
      userRole !== "CUSTOMER_GROUP_ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 역할 존재 확인
    const existingRole = await prisma.customRole.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!existingRole) {
      return NextResponse.json({ error: "역할을 찾을 수 없습니다." }, { status: 404 });
    }

    // 사용 중인 역할인지 확인
    if (existingRole._count.users > 0) {
      return NextResponse.json(
        {
          error: `이 역할을 사용 중인 사용자가 ${existingRole._count.users}명 있습니다. 먼저 사용자의 역할을 변경해주세요.`,
        },
        { status: 400 }
      );
    }

    // 역할 삭제
    await prisma.customRole.delete({
      where: { id },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId,
        action: "DELETE_CUSTOM_ROLE",
        target: "CustomRole",
        targetId: id,
        details: JSON.stringify({
          roleName: existingRole.name,
        }),
      },
    });

    return NextResponse.json({
      message: "커스텀 역할이 삭제되었습니다.",
    });
  } catch (error: any) {
    console.error("Delete custom role error:", error);
    return NextResponse.json(
      { error: "커스텀 역할 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
