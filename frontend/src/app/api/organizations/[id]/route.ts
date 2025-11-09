import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 환경측정기업 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    const userOrgId = (session.user as any).organizationId;
    const userCustomerId = (session.user as any).customerId;
    const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";

    // 권한 체크: SUPER_ADMIN이거나 자신의 조직 정보를 조회하는 경우
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isOwnOrganization = userOrgId === params.id;
    
    // 고객사 사용자: 연결된 환경측정기업인지 확인
    let isConnectedOrganization = false;
    if (isCustomerUser && userCustomerId) {
      const connection = await prisma.customerOrganization.findFirst({
        where: {
          customerId: userCustomerId,
          organizationId: params.id,
          status: "APPROVED",
        },
      });
      isConnectedOrganization = !!connection;
    }

    if (!isSuperAdmin && !isOwnOrganization && !isConnectedOrganization) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // SUPER_ADMIN은 모든 정보 조회, 일반 사용자는 기본 정보만 조회
    const includeOptions = isSuperAdmin ? {
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          isActive: true,
          department: true,
          position: true,
          createdAt: true,
          lastLoginAt: true,
        },
      },
      customers: {
        where: { status: "APPROVED" },
        select: {
          id: true,
          status: true,
          proposedData: true,
          customer: {
            select: {
              id: true,
              name: true,
              code: true,
              businessNumber: true,
              isActive: true,
              createdAt: true,
            },
          },
        },
      },
      subscriptionHistory: {
        orderBy: { createdAt: "desc" as const },
        take: 10,
      },
      invoices: {
        orderBy: { issuedAt: "desc" as const },
        take: 10,
      },
      _count: {
        select: {
          users: true,
          customers: true,
        },
      },
    } : {
      // 일반 사용자는 기본 정보만
      _count: {
        select: {
          users: true,
          customers: true,
        },
      },
    };

    const organization = await prisma.organization.findUnique({
      where: { id: params.id },
      include: includeOptions,
    });

    if (!organization) {
      return NextResponse.json(
        { error: "환경측정기업을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error: any) {
    console.error("Get organization error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "환경측정기업 조회 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

// 환경측정기업 승인/거부/수정
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
    const userOrgId = (session.user as any).organizationId;
    const isSuperAdmin = userRole === "SUPER_ADMIN";
    const isOrgAdmin = userRole === "ORG_ADMIN" && userOrgId === params.id;

    if (!isSuperAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    const body = await request.json();
    const { action, ...updateData } = body;

    // 승인/거부는 SUPER_ADMIN만 가능
    if (action === "approve" && !isSuperAdmin) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 승인 처리
    if (action === "approve") {
      const result = await prisma.$transaction(async (tx) => {
        // Organization 활성화
        const organization = await tx.organization.update({
          where: { id: params.id },
          data: {
            isActive: true,
            subscriptionStatus: "ACTIVE",
            subscriptionStartAt: new Date(),
          },
        });

        // ORG_ADMIN 계정 활성화
        await tx.user.updateMany({
          where: {
            organizationId: params.id,
            role: "ORG_ADMIN",
          },
          data: {
            status: "APPROVED",
            isActive: true,
          },
        });

        // 활동 로그
        try {
          await tx.activityLog.create({
            data: {
              userId: (session.user as any).id,
              action: "APPROVE_ORGANIZATION",
              target: "Organization",
              targetId: params.id,
              details: JSON.stringify({
                organizationName: organization.name,
              }),
            },
          });
        } catch (logError) {
          console.error("ActivityLog 생성 실패 (무시):", logError);
          // 로그 실패는 무시하고 계속 진행
        }

        return organization;
      });

      return NextResponse.json({
        message: "환경측정기업이 승인되었습니다.",
        organization: result,
      });
    }

    // 거부 처리 (SUPER_ADMIN만)
    if (action === "reject" && !isSuperAdmin) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    if (action === "reject") {
      const result = await prisma.$transaction(async (tx) => {
        // Organization 비활성화
        const organization = await tx.organization.update({
          where: { id: params.id },
          data: {
            isActive: false,
            subscriptionStatus: "CANCELLED",
          },
        });

        // ORG_ADMIN 계정 거부
        await tx.user.updateMany({
          where: {
            organizationId: params.id,
            role: "ORG_ADMIN",
          },
          data: {
            status: "REJECTED",
            isActive: false,
          },
        });

        // 활동 로그
        try {
          await tx.activityLog.create({
            data: {
              userId: (session.user as any).id,
              action: "REJECT_ORGANIZATION",
              target: "Organization",
              targetId: params.id,
              details: JSON.stringify({
                organizationName: organization.name,
              }),
            },
          });
        } catch (logError) {
          console.error("ActivityLog 생성 실패 (무시):", logError);
          // 로그 실패는 무시하고 계속 진행
        }

        return organization;
      });

      return NextResponse.json({
        message: "환경측정기업이 거부되었습니다.",
        organization: result,
      });
    }

    // 일반 정보 수정
    // isActive가 문자열로 올 수 있으므로 boolean으로 변환
    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive === true || updateData.isActive === "true";
    }
    
    const organization = await prisma.organization.update({
      where: { id: params.id },
      data: updateData,
    });

    // 활동 로그
    try {
      await prisma.activityLog.create({
        data: {
          userId: (session.user as any).id,
          action: "UPDATE_ORGANIZATION",
          target: "Organization",
          targetId: params.id,
          details: JSON.stringify(updateData),
        },
      });
    } catch (logError) {
      console.error("ActivityLog 생성 실패 (무시):", logError);
      // 로그 실패는 무시하고 계속 진행
    }

    return NextResponse.json({
      message: "환경측정기업 정보가 수정되었습니다.",
      organization,
    });
  } catch (error: any) {
    console.error("Update organization error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "환경측정기업 처리 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}

// 환경측정기업 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await prisma.organization.delete({
      where: { id: params.id },
    });

    // 활동 로그
    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: "DELETE_ORGANIZATION",
        target: "Organization",
        targetId: params.id,
      },
    });

    return NextResponse.json({ message: "환경측정기업이 삭제되었습니다." });
  } catch (error: any) {
    console.error("Delete organization error:", error);
    return NextResponse.json(
      { error: "환경측정기업 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
