import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";

type UserRole = "SUPER_ADMIN" | "ORG_ADMIN" | "OPERATOR" | "CUSTOMER_ADMIN" | "CUSTOMER_USER";

type PageAuthOptions = {
  allowedRoles: UserRole[];
  redirectTo?: string; // 기본값: /dashboard
  onUnauthorized?: () => void;
};

/**
 * 페이지 권한 체크 훅
 * 새로고침 시에도 현재 페이지를 유지하면서 권한만 체크
 */
export function usePageAuth(options: PageAuthOptions) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 로딩 중이면 대기
    if (loading) return;

    // 로그인하지 않은 경우
    if (!user) {
      // 로그인 페이지로 리다이렉트 (현재 경로를 callbackUrl로 저장)
      const callbackUrl = encodeURIComponent(pathname || "/dashboard");
      router.push(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    // 권한 체크
    const hasPermission = options.allowedRoles.includes(user.role as UserRole);
    
    if (!hasPermission) {
      // 권한이 없는 경우
      if (options.onUnauthorized) {
        options.onUnauthorized();
      } else {
        // 기본 동작: 대시보드로 리다이렉트
        const redirectPath = options.redirectTo || "/dashboard";
        router.push(redirectPath);
      }
    }
  }, [user, loading, pathname, router, options.allowedRoles, options.redirectTo, options.onUnauthorized]);

  return {
    user,
    loading,
    hasPermission: user ? options.allowedRoles.includes(user.role as UserRole) : false,
  };
}

/**
 * 시스템 관리자 전용 페이지
 */
export function useAdminAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}

/**
 * 환경측정기업 페이지 (관리자 + 실무자)
 */
export function useOrgAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "ORG_ADMIN" as UserRole, "OPERATOR" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}

/**
 * 환경측정기업 관리자 전용 페이지
 */
export function useOrgAdminAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "ORG_ADMIN" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}

/**
 * 고객사 페이지 (관리자 + 일반 사용자)
 */
export function useCustomerAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "CUSTOMER_ADMIN" as UserRole, "CUSTOMER_USER" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}

/**
 * 고객사 관리자 전용 페이지
 */
export function useCustomerAdminAuth() {
  const options = useMemo(() => ({
    allowedRoles: ["SUPER_ADMIN" as UserRole, "CUSTOMER_ADMIN" as UserRole],
    redirectTo: "/dashboard",
  }), []);
  
  return usePageAuth(options);
}
