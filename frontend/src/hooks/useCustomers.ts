import { useEffect, useState, useCallback } from "react";
import type { Customer } from "@/types";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSession } from "next-auth/react";

export function useCustomers() {
  const [list, setList] = useState<Customer[]>([]);
  const { selectedOrg } = useOrganization();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userCustomerId = (session?.user as any)?.customerId;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
  
  const fetchCustomers = useCallback(() => {
    // 고객사 사용자: 자신의 고객사만 조회
    if (isCustomerUser && userCustomerId) {
      console.log("[useCustomers] Customer user, fetching own customer:", userCustomerId);
      fetch(`/api/customers/${userCustomerId}`)
        .then((r) => r.json())
        .then((json) => {
          console.log("[useCustomers] Customer response:", json);
          const customer = json.customer || json.data;
          setList(customer ? [customer] : []);
        })
        .catch((err) => {
          console.error("[useCustomers] Error:", err);
          setList([]);
        });
      return;
    }
    
    // 환경측정기업 사용자: 조직의 모든 고객사 조회
    if (!selectedOrg?.id) {
      console.log("[useCustomers] No selectedOrg, skipping fetch");
      setList([]);
      return;
    }
    
    const params = new URLSearchParams();
    params.append("organizationId", selectedOrg.id);
    params.append("tab", "all"); // 전체 고객사 (내부관리 + 연결된 고객)
    
    console.log("[useCustomers] Fetching with organizationId:", selectedOrg.id);
    fetch(`/api/customers?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        console.log("[useCustomers] Response:", json);
        setList(json.customers || json.data || []);
      })
      .catch((err) => {
        console.error("[useCustomers] Error:", err);
        setList([]);
      });
  }, [selectedOrg, isCustomerUser, userCustomerId]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return { list, refetch: fetchCustomers };
}
