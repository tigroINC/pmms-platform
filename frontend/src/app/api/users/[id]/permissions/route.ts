import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 사용자 권한 조회
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

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        customRole: {
          include: {
            template: {
              include: {
                defaultPermissions: true,
              },
            },
            permissions: true,
          },
        },
        customPermissions: true,
        assignedCustomers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 권한 계산 - 배열 형태로 반환
    const permissionSet = new Set<string>();

    // 1. 시스템 기본 역할 권한
    const rolePermissionMap: Record<string, string[]> = {
      SUPER_ADMIN: ['*'], // 모든 권한
      ORG_ADMIN: [
        'customer.*', 'user.*', 'measurement.*', 'report.*',
        'stack.*', 'item.*', 'limit.*', 'connection.*', 'organization.*', 'assignment.*',
        'contract.*'
      ],
      OPERATOR: [
        'customer.view', 'measurement.create', 'measurement.update',
        'measurement.read', 'stack.read', 'item.read', 'limit.read', 'report.read'
      ],
      CUSTOMER_ADMIN: [
        'measurement.read', 'report.read', 'stack.read', 'stack.update',
        'user.create', 'user.read', 'user.update', 'connection.approve',
        'measurement.comment', 'alert.manage'
      ],
      CUSTOMER_USER: [
        'measurement.read', 'report.read', 'stack.read'
      ]
    };

    const systemPermissions = rolePermissionMap[user.role] || [];
    systemPermissions.forEach(p => permissionSet.add(p));

    // 2. 커스텀 역할 권한 (템플릿 + 역할 권한)
    if (user.customRole) {
      // 템플릿 기본 권한
      if (user.customRole.template) {
        user.customRole.template.defaultPermissions.forEach(p => {
          permissionSet.add(p.permissionCode);
        });
      }
      
      // 역할 레벨 권한 조정
      user.customRole.permissions.forEach(p => {
        if (p.granted) {
          permissionSet.add(p.permissionCode);
        } else {
          permissionSet.delete(p.permissionCode);
        }
      });
    }

    // 3. 사용자 개별 권한 (최우선)
    user.customPermissions.forEach(p => {
      if (p.granted) {
        permissionSet.add(p.permissionCode);
      } else {
        permissionSet.delete(p.permissionCode);
      }
    });

    // 상세 정보도 함께 반환
    const permissionsDetail = {
      // 시스템 기본 역할
      systemRole: user.role,
      
      // 커스텀 역할
      customRole: user.customRole ? {
        id: user.customRole.id,
        name: user.customRole.name,
        template: user.customRole.template,
        permissions: user.customRole.permissions,
      } : null,
      
      // 개별 권한
      customPermissions: user.customPermissions,
      
      // 접근 범위
      accessScope: user.accessScope,
      
      // 담당 고객사
      assignedCustomers: user.assignedCustomers.map(a => ({
        id: a.customer.id,
        name: a.customer.name,
        isPrimary: a.isPrimary,
      })),
    };

    return NextResponse.json({ 
      permissions: Array.from(permissionSet),
      detail: permissionsDetail 
    });
  } catch (error: any) {
    console.error("Get user permissions error:", error);
    return NextResponse.json(
      { error: "사용자 권한 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 사용자 권한 수정
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
    const currentUserId = (session.user as any).id;
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
    const { customRoleId, accessScope, customPermissions, assignedCustomers } = body;

    // 사용자 존재 확인
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });
    }

    // 트랜잭션으로 처리
    const result = await prisma.$transaction(async (tx) => {
      // 기본 정보 업데이트
      const updateData: any = {};
      if (customRoleId !== undefined) updateData.customRoleId = customRoleId;
      if (accessScope !== undefined) updateData.accessScope = accessScope;

      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
      });

      // 개별 권한 업데이트
      if (customPermissions) {
        // 기존 권한 삭제
        await tx.userPermission.deleteMany({
          where: { userId: id },
        });

        // 새 권한 추가
        if (customPermissions.length > 0) {
          await tx.userPermission.createMany({
            data: customPermissions.map((p: any) => ({
              userId: id,
              permissionCode: p.permissionCode,
              granted: p.granted,
              grantedBy: currentUserId,
              reason: p.reason,
            })),
          });
        }
      }

      // 담당 고객사 업데이트
      if (assignedCustomers) {
        // 기존 할당 삭제
        await tx.customerAssignment.deleteMany({
          where: { userId: id },
        });

        // 새 할당 추가
        if (assignedCustomers.length > 0) {
          await tx.customerAssignment.createMany({
            data: assignedCustomers.map((c: any) => ({
              userId: id,
              customerId: c.customerId,
              assignedBy: currentUserId,
            })),
          });
        }
      }

      // 활동 로그
      await tx.activityLog.create({
        data: {
          userId: currentUserId,
          action: "UPDATE_USER_PERMISSIONS",
          target: "User",
          targetId: id,
          details: JSON.stringify({
            userName: user.name,
            customRoleId,
            accessScope,
            customPermissionsCount: customPermissions?.length || 0,
            assignedCustomersCount: assignedCustomers?.length || 0,
          }),
        },
      });

      return updatedUser;
    });

    // 업데이트된 사용자 정보 조회
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        customRole: true,
        customPermissions: true,
        assignedCustomers: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "사용자 권한이 수정되었습니다.",
      user: updatedUser,
    });
  } catch (error: any) {
    console.error("Update user permissions error:", error);
    return NextResponse.json(
      { error: "사용자 권한 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
