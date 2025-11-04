"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * 클라이언트에서 사용자 권한을 체크하는 훅
 * 
 * 사용 예시:
 * const { hasPermission, loading } = usePermissions();
 * 
 * {hasPermission('customer.create') && <Button>신규 추가</Button>}
 * {hasPermission('customer.tab.internal') && <TabButton>내부</TabButton>}
 */
export function usePermissions() {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setPermissions(new Set());
      setLoading(false);
      return;
    }

    // SUPER_ADMIN은 모든 권한
    if (user.role === "SUPER_ADMIN") {
      setPermissions(new Set(["*"]));
      setLoading(false);
      return;
    }

    // 사용자 권한 조회
    const fetchPermissions = async () => {
      try {
        const res = await fetch(`/api/users/${user.id}/permissions`);
        if (res.ok) {
          const data = await res.json();
          setPermissions(new Set(data.permissions || []));
        }
      } catch (error) {
        console.error("권한 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id, user?.role]);

  /**
   * 특정 권한이 있는지 확인
   */
  const hasPermission = (permissionCode: string): boolean => {
    if (loading) return false;
    
    // SUPER_ADMIN은 모든 권한
    if (permissions.has("*")) return true;
    
    // 정확한 매치
    if (permissions.has(permissionCode)) return true;
    
    // 와일드카드 매치 (예: customer.* 가 있으면 customer.create 허용)
    const prefix = permissionCode.split(".")[0];
    if (permissions.has(`${prefix}.*`)) return true;
    
    return false;
  };

  /**
   * 여러 권한 중 하나라도 있는지 확인
   */
  const hasAnyPermission = (permissionCodes: string[]): boolean => {
    return permissionCodes.some(code => hasPermission(code));
  };

  /**
   * 모든 권한이 있는지 확인
   */
  const hasAllPermissions = (permissionCodes: string[]): boolean => {
    return permissionCodes.every(code => hasPermission(code));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    loading,
    permissions: Array.from(permissions),
  };
}
