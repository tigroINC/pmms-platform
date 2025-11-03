import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission, canAccessCustomer } from '@/lib/permission-checker';

/**
 * 권한 체크 미들웨어
 * API 라우트에서 사용
 */
export function requirePermission(permissionCode: string) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    const hasAccess = await hasPermission(userId, permissionCode);

    if (!hasAccess) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 권한 통과
    return null;
  };
}

/**
 * 여러 권한 중 하나라도 있으면 통과
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;

    for (const code of permissionCodes) {
      if (await hasPermission(userId, code)) {
        return null; // 권한 통과
      }
    }

    return NextResponse.json(
      { error: '권한이 없습니다.' },
      { status: 403 }
    );
  };
}

/**
 * 고객사 접근 권한 체크
 */
export async function checkCustomerAccess(
  userId: string,
  customerId: string
): Promise<boolean> {
  return await canAccessCustomer(userId, customerId);
}

/**
 * API 핸들러에서 사용할 권한 체크 헬퍼
 */
export async function checkPermission(
  permissionCode: string
): Promise<{ authorized: boolean; userId?: string; error?: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      authorized: false,
      error: NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    };
  }

  const userId = (session.user as any).id;
  const hasAccess = await hasPermission(userId, permissionCode);

  if (!hasAccess) {
    return {
      authorized: false,
      userId,
      error: NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    };
  }

  return { authorized: true, userId };
}
