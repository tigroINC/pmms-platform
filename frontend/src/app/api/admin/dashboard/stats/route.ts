import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    // 환경측정기업 통계
    const organizationsTotal = await prisma.organization.count();
    const organizationsPending = await prisma.organization.count({
      where: { isActive: false },
    });
    const organizationsActive = await prisma.organization.count({
      where: { isActive: true },
    });

    // 고객회사 통계
    const customersTotal = await prisma.customer.count();
    const customersPending = await prisma.customer.count({
      where: { isActive: false },
    });
    const customersActive = await prisma.customer.count({
      where: { isActive: true },
    });

    // 사용자 통계
    const usersTotal = await prisma.user.count();
    const usersPending = await prisma.user.count({
      where: { status: "PENDING" },
    });
    const usersActive = await prisma.user.count({
      where: { isActive: true },
    });

    // 역할 통계
    const rolesTotal = await prisma.customRole.count();
    const rolesActive = await prisma.customRole.count({
      where: { isActive: true },
    });
    const rolesInactive = await prisma.customRole.count({
      where: { isActive: false },
    });

    // 권한 통계 (커스텀 역할이 할당된 사용자 수)
    const usersWithCustomRoles = await prisma.user.count({
      where: { customRoleId: { not: null } },
    });
    const usersWithDefaultRoles = await prisma.user.count({
      where: { customRoleId: null },
    });
    const totalPermissions = await prisma.userPermission.count();

    // 최근 활동 로그 (최근 10개)
    const recentActivities = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedActivities = recentActivities.map((log) => ({
      id: log.id,
      action: getActionLabel(log.action),
      details: `${log.user?.name || "알 수 없음"} - ${log.details || ""}`,
      createdAt: log.createdAt.toISOString(),
    }));

    return NextResponse.json({
      organizations: {
        total: organizationsTotal,
        pending: organizationsPending,
        active: organizationsActive,
      },
      customers: {
        total: customersTotal,
        pending: customersPending,
        active: customersActive,
      },
      users: {
        total: usersTotal,
        pending: usersPending,
        active: usersActive,
      },
      roles: {
        total: rolesTotal,
        active: rolesActive,
        inactive: rolesInactive,
      },
      permissions: {
        usersWithCustomRoles,
        usersWithDefaultRoles,
        totalPermissions,
      },
      recentActivities: formattedActivities,
    });
  } catch (error: any) {
    console.error("Fetch dashboard stats error:", error);
    return NextResponse.json(
      { error: "통계 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    LOGIN: "로그인",
    LOGOUT: "로그아웃",
    REGISTER: "회원가입",
    REGISTER_OPERATOR: "임직원 가입 신청",
    REGISTER_ORGANIZATION: "환경측정기업 등록 신청",
    REGISTER_CUSTOMER: "고객회사 등록 신청",
    APPROVE_USER: "사용자 승인",
    REJECT_USER: "사용자 거부",
    APPROVE_ORGANIZATION: "환경측정기업 승인",
    APPROVE_CUSTOMER: "고객회사 승인",
    CREATE_MEASUREMENT: "측정 데이터 생성",
    UPDATE_MEASUREMENT: "측정 데이터 수정",
    DELETE_MEASUREMENT: "측정 데이터 삭제",
  };
  return labels[action] || action;
}
