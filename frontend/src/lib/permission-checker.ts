import { prisma } from './prisma';
import { UserRole, AccessScope } from '@prisma/client';

/**
 * 사용자의 권한 확인
 * 우선순위: 사용자 개별 권한 > 커스텀 역할 권한 > 역할 템플릿 기본 권한 > 시스템 기본 역할
 */
export async function hasPermission(
  userId: string,
  permissionCode: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: {
          include: {
            template: {
              include: { defaultPermissions: true }
            },
            permissions: true
          }
        },
        customPermissions: true
      }
    });

    if (!user) {
      return false;
    }

    // 1. SUPER_ADMIN은 모든 권한
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // 2. 사용자 레벨 개별 권한 확인 (최우선)
    const userPermission = user.customPermissions.find(
      p => p.permissionCode === permissionCode
    );
    if (userPermission) {
      return userPermission.granted;
    }

    // 3. 커스텀 역할이 있는 경우
    if (user.customRole) {
      // 3-1. 역할 레벨 권한 조정 확인
      const rolePermission = user.customRole.permissions.find(
        p => p.permissionCode === permissionCode
      );
      if (rolePermission) {
        return rolePermission.granted;
      }

      // 3-2. 템플릿 기본 권한 확인
      if (user.customRole.template) {
        const hasTemplatePermission = user.customRole.template.defaultPermissions.some(
          p => p.permissionCode === permissionCode
        );
        if (hasTemplatePermission) {
          return true;
        }
      }
    }

    // 4. 시스템 기본 역할 권한 (fallback)
    return await checkSystemRolePermission(user.role as UserRole, permissionCode);
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * 시스템 기본 역할의 권한 확인
 */
async function checkSystemRolePermission(
  role: UserRole,
  permissionCode: string
): Promise<boolean> {
  // 역할별 기본 권한 매핑 (간소화)
  const rolePermissionMap: Record<UserRole, string[]> = {
    SUPER_ADMIN: ['*'], // 모든 권한
    ORG_ADMIN: [
      'customer.*', 'user.*', 'measurement.*', 'report.*',
      'stack.*', 'item.*', 'limit.*', 'connection.*', 'organization.*', 'assignment.*'
    ],
    OPERATOR: [
      'customer.read', 'measurement.create', 'measurement.update',
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

  const permissions = rolePermissionMap[role] || [];

  // 와일드카드 체크
  if (permissions.includes('*')) {
    return true;
  }

  // 정확한 매치
  if (permissions.includes(permissionCode)) {
    return true;
  }

  // 와일드카드 패턴 매치 (예: customer.*)
  return permissions.some(pattern => {
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      return permissionCode.startsWith(prefix + '.');
    }
    return false;
  });
}

/**
 * 사용자가 접근 가능한 고객사 목록 조회
 */
export async function getAccessibleCustomers(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      assignedCustomers: true
    }
  });

  if (!user) {
    return [];
  }

  const accessScope = user.accessScope as AccessScope;

  switch (accessScope) {
    case 'SYSTEM':
      // 모든 고객사 (SUPER_ADMIN)
      const allCustomers = await prisma.customer.findMany({
        select: { id: true }
      });
      return allCustomers.map(c => c.id);

    case 'ORGANIZATION':
      // 조직의 연결된 고객사 (ORG_ADMIN, OPERATOR)
      if (!user.organizationId) return [];
      
      // OPERATOR는 담당 고객사만
      if (user.role === 'OPERATOR' && user.assignedCustomers.length > 0) {
        return user.assignedCustomers.map(a => a.customerId);
      }
      
      // ORG_ADMIN은 조직 전체
      const orgCustomers = await prisma.customer.findMany({
        where: {
          organizations: {
            some: {
              organizationId: user.organizationId,
              status: 'APPROVED'
            }
          }
        },
        select: { id: true }
      });
      return orgCustomers.map(c => c.id);

    case 'SITE':
      // 자기 사업장만 (CUSTOMER_ADMIN, CUSTOMER_USER)
      return user.customerId ? [user.customerId] : [];

    default:
      return [];
  }
}

/**
 * 데이터 접근 권한 확인
 */
export async function canAccessCustomer(
  userId: string,
  customerId: string
): Promise<boolean> {
  const accessibleCustomers = await getAccessibleCustomers(userId);
  return accessibleCustomers.includes(customerId);
}

/**
 * 여러 권한 중 하나라도 있는지 확인
 */
export async function hasAnyPermission(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (await hasPermission(userId, code)) {
      return true;
    }
  }
  return false;
}

/**
 * 모든 권한이 있는지 확인
 */
export async function hasAllPermissions(
  userId: string,
  permissionCodes: string[]
): Promise<boolean> {
  for (const code of permissionCodes) {
    if (!(await hasPermission(userId, code))) {
      return false;
    }
  }
  return true;
}
