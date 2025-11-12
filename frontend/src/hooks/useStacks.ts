import { useEffect, useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";

export function useStacks(customerId?: string) {
  const [list, setList] = useState<Array<{ id: string; name: string; siteCode?: string; customerId: string; isActive: boolean }>>([]);
  const { selectedOrg } = useOrganization();
  
  useEffect(() => {
    let mounted = true;
    
    if (!selectedOrg?.id) {
      console.log("[useStacks] No selectedOrg, skipping fetch");
      setList([]);
      return;
    }
    
    const params = new URLSearchParams();
    if (customerId) params.set("customerId", customerId);
    params.set("organizationId", selectedOrg.id);
    
    console.log("[useStacks] Fetching with organizationId:", selectedOrg.id, "customerId:", customerId);
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
  }, [customerId, selectedOrg]);
  return { list };
}
