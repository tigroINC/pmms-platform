import { prisma } from "@/lib/prisma";

export interface User {
  id: string;
  role: string;
  customerId?: string | null;
}

export interface CreateCommunicationInput {
  customerId: string;
  measurementId?: string;
  stackId?: string;
  contactAt: Date | string;
  channel: string;
  direction: string;
  subject?: string;
  content: string;
  status?: string;
  priority?: string;
  assignedToId?: string;
}

export interface PermissionResult {
  allowed: boolean;
  data?: any;
  error?: string;
}

/**
 * 커뮤니케이션 생성 권한 체크
 */
export async function canCreateCommunication(
  user: User,
  data: CreateCommunicationInput
): Promise<PermissionResult> {
  
  // SUPER_ADMIN: 모든 고객사 대상 가능
  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true };
  }
  
  // CUSTOMER (고객사): 자동 제한 적용
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    if (!user.customerId) {
      return { allowed: false, error: '소속 고객사 정보가 없습니다' };
    }
    
    // 강제 설정
    return {
      allowed: true,
      data: {
        ...data,
        customerId: user.customerId, // 강제로 본인 회사
        direction: 'OUTBOUND',        // 발신만 가능
        createdById: user.id,
      }
    };
  }
  
  // STAFF (환경측정기업): 담당 고객사만
  if (user.role === 'ORG_ADMIN' || user.role === 'OPERATOR') {
    // 조직 정보 가져오기
    const userWithOrg = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        organization: {
          select: { name: true }
        }
      }
    });
    
    // ORG_ADMIN은 모든 고객사 가능
    if (user.role === 'ORG_ADMIN') {
      return { 
        allowed: true,
        data: {
          ...data,
          direction: data.direction || 'INBOUND',
          contactOrg: userWithOrg?.organization?.name || data.contactOrg,
        }
      };
    }
    
    // OPERATOR는 담당 고객사만
    const hasAccess = await prisma.customerAssignment.findFirst({
      where: {
        userId: user.id,
        customerId: data.customerId
      }
    });
    
    if (!hasAccess) {
      return { allowed: false, error: '담당 고객사가 아닙니다' };
    }
    
    return { 
      allowed: true,
      data: {
        ...data,
        direction: data.direction || 'INBOUND',
        contactOrg: userWithOrg?.organization?.name || data.contactOrg,
      }
    };
  }
  
  return { allowed: false, error: '권한이 없습니다' };
}

/**
 * 커뮤니케이션 조회 권한 체크
 */
export async function canViewCommunication(
  user: User,
  communication: { customerId: string; createdById: string }
): Promise<boolean> {
  
  if (user.role === 'SUPER_ADMIN') return true;
  
  // 고객사: 자사 커뮤니케이션만
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    return communication.customerId === user.customerId;
  }
  
  // ORG_ADMIN: 모든 고객사
  if (user.role === 'ORG_ADMIN') {
    return true;
  }
  
  // OPERATOR: 담당 고객사만
  if (user.role === 'OPERATOR') {
    const hasAccess = await prisma.customerAssignment.findFirst({
      where: {
        userId: user.id,
        customerId: communication.customerId
      }
    });
    
    return !!hasAccess;
  }
  
  return false;
}

/**
 * 커뮤니케이션 수정 권한 체크
 */
export async function canUpdateCommunication(
  user: User,
  communication: { createdById: string; createdAt: Date }
): Promise<boolean> {
  
  if (user.role === 'SUPER_ADMIN') return true;
  
  // 고객사는 수정 불가
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    return false;
  }
  
  // 작성자 본인만 수정 가능
  if (communication.createdById === user.id) {
    // 24시간 이내만 수정 가능
    const hoursSinceCreation = 
      (Date.now() - communication.createdAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      return false;
    }
    return true;
  }
  
  return false;
}

/**
 * 커뮤니케이션 삭제 권한 체크
 */
export async function canDeleteCommunication(
  user: User,
  communication: { createdById: string; createdAt: Date }
): Promise<boolean> {
  
  if (user.role === 'SUPER_ADMIN') return true;
  
  // 고객사는 삭제 불가
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    return false;
  }
  
  // 작성자 본인만 + 24시간 이내만
  if (communication.createdById === user.id) {
    const hoursSinceCreation = 
      (Date.now() - communication.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  }
  
  return false;
}

/**
 * 커뮤니케이션 상태 변경 권한 체크
 */
export async function canChangeStatus(
  user: User,
  communication: { createdById: string; assignedToId?: string | null }
): Promise<boolean> {
  
  if (user.role === 'SUPER_ADMIN') return true;
  
  // 고객사는 상태 변경 불가
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    return false;
  }
  
  // 작성자 또는 담당자
  return communication.createdById === user.id || 
         communication.assignedToId === user.id;
}

/**
 * 조회 가능한 커뮤니케이션 필터 조건 생성
 */
export async function buildCommunicationWhereClause(user: User) {
  
  // SUPER_ADMIN: 모든 데이터
  if (user.role === 'SUPER_ADMIN') {
    return { isDeleted: false };
  }
  
  // 고객사: 자사 데이터 중 공유된 것만
  if (user.role === 'CUSTOMER_ADMIN' || user.role === 'CUSTOMER_USER') {
    return {
      customerId: user.customerId,
      isShared: true,
      isDeleted: false
    };
  }
  
  // ORG_ADMIN: 모든 고객사
  if (user.role === 'ORG_ADMIN') {
    return { isDeleted: false };
  }
  
  // OPERATOR: 담당 고객사만
  if (user.role === 'OPERATOR') {
    const assignments = await prisma.customerAssignment.findMany({
      where: { userId: user.id },
      select: { customerId: true }
    });
    
    const customerIds = assignments.map(a => a.customerId);
    
    return {
      customerId: { in: customerIds },
      isDeleted: false
    };
  }
  
  // 기본: 접근 불가
  return { id: 'NONE' };
}
