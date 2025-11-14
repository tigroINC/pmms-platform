"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  subscriptionPlan: string;
  isActive: boolean;
  hasContractManagement?: boolean; // 계약 관리 기능 활성화
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
  const searchParams = useSearchParams();

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

    // SUPER_ADMIN인 경우 모든 조직 목록 가져오기 (실제 조직 정보로 selectedOrg를 덮어씌움)
    if (isSuperAdmin) {
      fetchOrganizations();
    } else if (userOrgId) {
      // 일반 사용자는 자신의 조직만
      fetchUserOrganization(userOrgId);
    } else {
      setLoading(false);
    }
  }, [session, status, isSuperAdmin, userOrgId, isCustomerUser]);

  // URL 파라미터의 viewAsOrg를 한 번 반영 (시스템 보기 모드)
  useEffect(() => {
    if (!isSuperAdmin) return;

    const viewAsOrgId = searchParams.get("viewAsOrg");
    if (!viewAsOrgId) return;

    // 이미 동일 조직이 선택되어 있으면 변경 없음
    if (selectedOrg?.id === viewAsOrgId) return;

    // 조직 목록이 로드되어 있다면, 실제 조직 정보로 selectedOrg를 맞춤
    if (organizations.length) {
      const viewOrg = organizations.find((o) => o.id === viewAsOrgId);
      if (viewOrg) {
        setSelectedOrgState(viewOrg);
      }
    }
  }, [isSuperAdmin, selectedOrg?.id, organizations.length, searchParams]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations?status=APPROVED");

      if (!response.ok) {
        console.error("[OrganizationContext] /api/organizations error:", response.status);
        setOrganizations([]);
        return;
      }

      const data = await response.json();
      const orgs = data.organizations || [];
      setOrganizations(orgs);

      // 로컬 스토리지에서 마지막 선택 조직 복원 (일반 SUPER_ADMIN용)
      const savedOrgId = localStorage.getItem("selectedOrgId");
      if (savedOrgId) {
        const savedOrg = orgs.find((o: Organization) => o.id === savedOrgId);
        if (savedOrg) {
          setSelectedOrgState(savedOrg);
        } else if (orgs.length > 0) {
          // 저장된 조직이 없으면 첫 번째 조직 선택
          setSelectedOrgState(orgs[0]);
        }
      } else if (!selectedOrg && orgs.length > 0) {
        // 선택된 조직이 아직 없으면 첫 번째 조직 선택
        setSelectedOrgState(orgs[0]);
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
