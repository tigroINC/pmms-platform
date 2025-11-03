"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  subscriptionPlan: string;
  isActive: boolean;
}

interface OrganizationContextType {
  selectedOrg: Organization | null;
  setSelectedOrg: (org: Organization | null) => void;
  organizations: Organization[];
  loading: boolean;
  isSuperAdmin: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedOrg, setSelectedOrgState] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = (session?.user as any)?.role === "SUPER_ADMIN";
  const userRole = (session?.user as any)?.role;
  const userOrgId = (session?.user as any)?.organizationId;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }

    // 고객사 사용자는 Organization이 필요 없음
    if (isCustomerUser) {
      setLoading(false);
      return;
    }

    // 시스템 보기 모드 확인 (SUPER_ADMIN만)
    const viewAsOrgId = isSuperAdmin ? sessionStorage.getItem("viewAsOrganization") : null;
    console.log("[OrganizationContext] Initial check - viewAsOrgId:", viewAsOrgId, "isSuperAdmin:", isSuperAdmin);

    // SUPER_ADMIN인 경우 모든 조직 목록 가져오기
    if (isSuperAdmin) {
      fetchOrganizations();
    } else if (userOrgId) {
      // 일반 사용자는 자신의 조직만
      fetchUserOrganization(userOrgId);
    } else {
      setLoading(false);
    }
  }, [session, status, isSuperAdmin, userOrgId, isCustomerUser]);

  // 세션 스토리지 변경 감지 (시스템 보기 모드)
  useEffect(() => {
    if (!isSuperAdmin) return;

    // 페이지 로드 시 즉시 확인
    const viewAsOrgId = sessionStorage.getItem("viewAsOrganization");
    if (viewAsOrgId && selectedOrg?.id !== viewAsOrgId) {
      fetchOrganizations();
    }

    // 주기적으로 확인
    const interval = setInterval(() => {
      const currentViewAsOrgId = sessionStorage.getItem("viewAsOrganization");
      if (currentViewAsOrgId && selectedOrg?.id !== currentViewAsOrgId) {
        fetchOrganizations();
      } else if (!currentViewAsOrgId && selectedOrg) {
        // viewAsOrganization이 제거되었으면 일반 모드로 복귀
        const savedOrgId = localStorage.getItem("selectedOrgId");
        if (savedOrgId && selectedOrg.id !== savedOrgId) {
          fetchOrganizations();
        }
      }
    }, 500); // 500ms로 더 빠르게 체크

    return () => clearInterval(interval);
  }, [isSuperAdmin, selectedOrg]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations?status=APPROVED");
      const data = await response.json();
      if (response.ok) {
        const orgs = data.organizations || [];
        setOrganizations(orgs);
        
        // 시스템 관리자의 "시스템 보기" 모드 확인
        const viewAsOrgId = sessionStorage.getItem("viewAsOrganization");
        console.log("[OrganizationContext] viewAsOrgId:", viewAsOrgId);
        if (viewAsOrgId) {
          const viewOrg = orgs.find((o: Organization) => o.id === viewAsOrgId);
          console.log("[OrganizationContext] viewOrg found:", viewOrg);
          if (viewOrg) {
            console.log("[OrganizationContext] Setting selectedOrg to:", viewOrg.name);
            setSelectedOrgState(viewOrg);
            return;
          }
        }
        
        // 로컬 스토리지에서 마지막 선택 조직 복원
        const savedOrgId = localStorage.getItem("selectedOrgId");
        if (savedOrgId) {
          const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);
          if (savedOrg) {
            setSelectedOrgState(savedOrg);
          } else if (orgs.length > 0) {
            // 저장된 조직이 없으면 첫 번째 조직 선택
            setSelectedOrgState(orgs[0]);
          }
        } else if (orgs.length > 0) {
          // 저장된 조직이 없으면 첫 번째 조직 선택
          setSelectedOrgState(orgs[0]);
        }
      }
    } catch (error) {
      console.error("Fetch organizations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserOrganization = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`);
      const data = await response.json();
      if (response.ok) {
        const org = data.organization;
        setOrganizations([org]);
        setSelectedOrgState(org);
      }
    } catch (error) {
      console.error("Fetch user organization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const setSelectedOrg = (org: Organization | null) => {
    setSelectedOrgState(org);
    if (org) {
      localStorage.setItem("selectedOrgId", org.id);
    } else {
      localStorage.removeItem("selectedOrgId");
    }
  };

  return (
    <OrganizationContext.Provider
      value={{
        selectedOrg,
        setSelectedOrg,
        organizations,
        loading,
        isSuperAdmin,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }
  return context;
}
