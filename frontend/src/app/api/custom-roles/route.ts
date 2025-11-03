import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 커스텀 역할 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const organizationId = (session.user as any).organizationId;
    const customerId = (session.user as any).customerId;

    const where: any = {};

    // 환경측정업체 사용자
    if (organizationId) {
      where.organizationId = organizationId;
    }
    // 고객사 사용자
    else if (customerId) {
      where.customerId = customerId;
    }
    // SUPER_ADMIN은 모든 역할 조회
    else if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const customRoles = await prisma.customRole.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            code: true,
            name: true,
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
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ customRoles });
  } catch (error: any) {
    console.error("Get custom roles error:", error);
    return NextResponse.json(
      { error: "커스텀 역할 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 커스텀 역할 생성
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    const organizationId = (session.user as any).organizationId;
    const customerId = (session.user as any).customerId;

    // 권한 체크: 관리자만
    if (
      userRole !== "SUPER_ADMIN" &&
      userRole !== "ORG_ADMIN" &&
      userRole !== "CUSTOMER_SITE_ADMIN" &&
      userRole !== "CUSTOMER_GROUP_ADMIN"
    ) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, templateId, permissions } = body;

    if (!name) {
      return NextResponse.json({ error: "역할 이름은 필수입니다." }, { status: 400 });
    }

    // 중복 체크
    const existing = await prisma.customRole.findFirst({
      where: {
        name,
        organizationId: organizationId || null,
        customerId: customerId || null,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 존재하는 역할 이름입니다." },
        { status: 400 }
      );
    }

    // 역할 생성
    const customRole = await prisma.customRole.create({
      data: {
        name,
        description,
        templateId,
        organizationId,
        customerId,
        createdBy: userId,
        permissions: {
          create: permissions?.map((p: any) => ({
            permissionCode: p.permissionCode,
            granted: p.granted ?? true,
          })) || [],
        },
      },
      include: {
        template: true,
        permissions: true,
      },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId,
        action: "CREATE_CUSTOM_ROLE",
        target: "CustomRole",
        targetId: customRole.id,
        details: JSON.stringify({
          roleName: name,
          templateId,
          permissionsCount: permissions?.length || 0,
        }),
      },
    });

    return NextResponse.json({
      message: "커스텀 역할이 생성되었습니다.",
      customRole,
    });
  } catch (error: any) {
    console.error("Create custom role error:", error);
    return NextResponse.json(
      { error: "커스텀 역할 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
