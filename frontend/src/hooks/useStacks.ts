import { useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSession } from "next-auth/react";

export function useStacks(customerId?: string) {
  const [list, setList] = useState<Array<{ id: string; name: string; code?: string; siteCode?: string; customerId: string; isActive: boolean }>>([]);
  const { selectedOrg } = useOrganization();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
  
  useEffect(() => {
    let mounted = true;
    
    // customerId가 없으면 데이터 로딩 안 함
    if (!customerId) {
      console.log("[useStacks] No customerId, skipping fetch");
      setList([]);
      return;
    }
    
    // 고객사 사용자가 아닌 경우에만 selectedOrg 체크
    if (!isCustomerUser && !selectedOrg?.id) {
      console.log("[useStacks] No selectedOrg, skipping fetch");
      setList([]);
      return;
    }
    
    const params = new URLSearchParams();
    params.set("customerId", customerId);
    if (selectedOrg?.id) {
      params.set("organizationId", selectedOrg.id);
    }
    
    console.log("[useStacks] Fetching with organizationId:", selectedOrg?.id, "customerId:", customerId);
    fetch(`/api/stacks?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => { 
        console.log("[useStacks] Response:", json);
        const allStacks = json.stacks || json.data || [];
        // 활성화된 굴뚝만 필터링
        const activeStacks = allStacks.filter((s: any) => s.isActive !== false);
        if (mounted) setList(activeStacks); 
      })
      .catch((err) => { 
        console.error("[useStacks] Error:", err);
        if (mounted) setList([]); 
      });
    return () => { mounted = false; };
  }, [customerId, selectedOrg, isCustomerUser]);
  return { list };
}
