import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

type CreateNotificationParams = {
  userId: string | string[]; // 단일 또는 다수 사용자
  type: NotificationType;
  title: string;
  message: string;
  stackId?: string;
  customerId?: string;
  metadata?: any;
};

/**
 * 알림 생성 헬퍼 함수
 * 
 * @example
 * // 단일 사용자
 * await createNotification({
 *   userId: "user_123",
 *   type: "STACK_CREATED_BY_CUSTOMER",
 *   title: "고객사가 새 굴뚝을 등록했습니다",
 *   message: "고려아연에서 'S-101'를 등록했습니다.",
 *   stackId: "stack_123",
 *   customerId: "customer_123"
 * });
 * 
 * // 다수 사용자
 * await createNotification({
 *   userId: ["user_1", "user_2", "user_3"],
 *   type: "STACK_UPDATED_BY_CUSTOMER",
 *   title: "고객사가 굴뚝 정보를 수정했습니다",
 *   message: "고려아연에서 'S-101' 정보를 수정했습니다.",
 *   stackId: "stack_123",
 *   customerId: "customer_123",
 *   metadata: {
 *     changedFields: ["height", "location"],
 *     changeReason: "현장 재측정 결과 반영"
 *   }
 * });
 */
export async function createNotification(params: CreateNotificationParams) {
  const userIds = Array.isArray(params.userId) ? params.userId : [params.userId];
  
  // 빈 배열이면 알림 생성 안 함
  if (userIds.length === 0) {
    console.warn("[createNotification] No users to notify");
    return { count: 0 };
  }
  
  const notifications = userIds.map(userId => ({
    userId,
    type: params.type,
    title: params.title,
    message: params.message,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  }));
  
  try {
    const result = await prisma.notification.createMany({
      data: notifications,
    });
    
    console.log(`[createNotification] Created ${result.count} notifications for type: ${params.type}`);
    return result;
  } catch (error) {
    console.error("[createNotification] Error:", error);
    throw error;
  }
}

/**
 * 굴뚝 담당 환경측정기업의 관리자 ID 목록 조회
 * 
 * @param stackId 굴뚝 ID
 * @returns 담당 환경측정기업의 ORG_ADMIN 사용자 ID 배열
 */
export async function getStackOrganizationAdmins(stackId: string): Promise<string[]> {
  try {
    // 1. 굴뚝의 담당 환경측정기업 조회
    const stackOrgs = await prisma.stackOrganization.findMany({
      where: { stackId },
      select: { organizationId: true },
    });
    
    if (stackOrgs.length === 0) {
      console.warn(`[getStackOrganizationAdmins] No organizations found for stack: ${stackId}`);
      return [];
    }
    
    const organizationIds = stackOrgs.map(so => so.organizationId);
    
    // 2. 해당 환경측정기업의 ORG_ADMIN 조회
    const admins = await prisma.user.findMany({
      where: {
        role: "ORG_ADMIN",
        organizationId: { in: organizationIds },
        status: "APPROVED",
        isActive: true,
      },
      select: { id: true },
    });
    
    return admins.map(admin => admin.id);
  } catch (error) {
    console.error("[getStackOrganizationAdmins] Error:", error);
    return [];
  }
}

/**
 * 고객사의 관리자 ID 목록 조회
 * 
 * @param customerId 고객사 ID
 * @returns 고객사의 CUSTOMER_ADMIN 사용자 ID 배열
 */
export async function getCustomerAdmins(customerId: string): Promise<string[]> {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "CUSTOMER_ADMIN",
        customerId: customerId,
        status: "APPROVED",
        isActive: true,
      },
      select: { id: true },
    });
    
    if (admins.length === 0) {
      console.warn(`[getCustomerAdmins] No admins found for customer: ${customerId}`);
    }
    
    return admins.map(admin => admin.id);
  } catch (error) {
    console.error("[getCustomerAdmins] Error:", error);
    return [];
  }
}

/**
 * 고객사 굴뚝 등록 시 알림 생성
 * 담당 환경측정기업의 관리자에게 알림
 */
export async function notifyStackCreatedByCustomer(params: {
  stackId: string;
  stackName: string;
  customerId: string;
  customerName: string;
  needsInternalCode: boolean;
}) {
  const adminIds = await getStackOrganizationAdmins(params.stackId);
  
  if (adminIds.length === 0) {
    console.warn("[notifyStackCreatedByCustomer] No admins to notify");
    return;
  }
  
  return await createNotification({
    userId: adminIds,
    type: "STACK_CREATED_BY_CUSTOMER",
    title: "고객사가 새 굴뚝을 등록했습니다",
    message: `${params.customerName}에서 '${params.stackName}'를 등록했습니다.${params.needsInternalCode ? ' 내부코드를 지정해주세요.' : ''}`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      customerName: params.customerName,
      needsInternalCode: params.needsInternalCode,
    },
  });
}

/**
 * 고객사 굴뚝 수정 시 알림 생성
 * 담당 환경측정기업의 관리자에게 알림
 */
export async function notifyStackUpdatedByCustomer(params: {
  stackId: string;
  stackName: string;
  customerId: string;
  customerName: string;
  changedFields: string[];
  changeReason?: string;
}) {
  const adminIds = await getStackOrganizationAdmins(params.stackId);
  
  if (adminIds.length === 0) {
    console.warn("[notifyStackUpdatedByCustomer] No admins to notify");
    return;
  }
  
  return await createNotification({
    userId: adminIds,
    type: "STACK_UPDATED_BY_CUSTOMER",
    title: "고객사가 굴뚝 정보를 수정했습니다",
    message: `${params.customerName}에서 '${params.stackName}' 정보를 수정했습니다. 변경 내용을 확인해주세요.`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      customerName: params.customerName,
      changedFields: params.changedFields,
      changeReason: params.changeReason,
    },
  });
}

/**
 * 환경측정기업 굴뚝 등록 시 알림 생성
 * 고객사 관리자에게 알림
 */
export async function notifyStackCreatedByOrg(params: {
  stackId: string;
  stackName: string;
  customerId: string;
  organizationName: string;
  internalCode?: string;
}) {
  const adminIds = await getCustomerAdmins(params.customerId);
  
  if (adminIds.length === 0) {
    console.warn("[notifyStackCreatedByOrg] No admins to notify");
    return;
  }
  
  return await createNotification({
    userId: adminIds,
    type: "STACK_CREATED_BY_ORG",
    title: "새 굴뚝이 등록되었습니다",
    message: `${params.organizationName}에서 '${params.stackName}'를 등록했습니다. 정보를 확인해주세요.`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      organizationName: params.organizationName,
      internalCode: params.internalCode,
      needsVerification: true,
    },
  });
}

/**
 * 고객사 굴뚝 확인 완료 시 알림 생성
 * 담당 환경측정기업의 관리자에게 알림
 */
export async function notifyStackVerifiedByCustomer(params: {
  stackId: string;
  stackName: string;
  customerId: string;
  customerName: string;
  verifiedBy: string;
}) {
  const adminIds = await getStackOrganizationAdmins(params.stackId);
  
  if (adminIds.length === 0) {
    console.warn("[notifyStackVerifiedByCustomer] No admins to notify");
    return;
  }
  
  return await createNotification({
    userId: adminIds,
    type: "STACK_VERIFIED_BY_CUSTOMER",
    title: "고객사가 굴뚝 정보를 확인했습니다",
    message: `${params.customerName}에서 '${params.stackName}' 정보를 확인 완료했습니다.`,
    stackId: params.stackId,
    customerId: params.customerId,
    metadata: {
      stackName: params.stackName,
      customerName: params.customerName,
      verifiedBy: params.verifiedBy,
      verifiedAt: new Date().toISOString(),
    },
  });
}
