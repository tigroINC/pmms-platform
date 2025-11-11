import { useEffect, useMemo, useState } from "react";
import type { MeasurementItem } from "@/types";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSession } from "next-auth/react";

export type HistoryQuery = {
  customerId?: string;
  stack?: string;
  stacks?: string[]; // multiple stack names
  itemKey?: string;
  page?: number;
  pageSize?: number; // 50, 100, 200, or a very large number for ALL
  sort?: { key: "measuredAt" | "customerId" | "itemKey" | "value"; dir: "asc" | "desc" };
  start?: string; // ISO date string
  end?: string;   // ISO date string
};

export function useMeasurementItems() {
  const [items, setItems] = useState<MeasurementItem[]>([]);
  useEffect(() => {
    let mounted = true;
    fetch("/api/items")
      .then((r) => r.json())
      .then((json) => { if (mounted) setItems(json.data || []); })
      .catch(() => { if (mounted) setItems([]); });
    return () => { mounted = false; };
  }, []);
  return { items };
}

export function useMeasurementHistory(query: HistoryQuery = {}) {
  const { customerId, stack, stacks, itemKey, page = 1, pageSize = 50, sort, start, end } = query;
  const [raw, setRaw] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedOrg } = useOrganization();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";

  const mutate = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    let mounted = true;
    const ctrl = new AbortController();
    
    // 고객사 사용자는 selectedOrg 체크를 건너뜀
    if (!isCustomerUser && !selectedOrg?.id) {
      console.log("[useMeasurementHistory] No selectedOrg, skipping fetch");
      setRaw([]);
      return;
    }
    
    const params = new URLSearchParams();
    if (customerId) params.set("customerId", customerId);
    if (stacks && stacks.length) {
      stacks.forEach((s) => params.append("stack", s));
    } else if (stack) {
      params.set("stack", stack);
    }
    if (itemKey) params.set("itemKey", itemKey);
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    
    // 환경측정기업 사용자만 organizationId 전달
    if (selectedOrg?.id) {
      params.set("organizationId", selectedOrg.id);
    }
    
    console.log("[useMeasurementHistory] Fetching with params:", params.toString());
    fetch(`/api/measurements?${params.toString()}`, { signal: ctrl.signal })
      .then((r) => {
        console.log("[useMeasurementHistory] Fetch completed, parsing JSON...");
        return r.json();
      })
      .then((json) => { 
        console.log("[useMeasurementHistory] Response:", json);
        const data = Array.isArray(json.measurements) ? json.measurements : Array.isArray(json.data) ? json.data : [];
        console.log("[useMeasurementHistory] Parsed data length:", data.length);
        if (mounted) setRaw(data); 
      })
      .catch((err) => { 
        // AbortError는 무시 (컴포넌트 언마운트 시 정상적인 동작)
        if (err.name === 'AbortError') {
          console.log("[useMeasurementHistory] Request aborted (component unmounted)");
        } else {
          console.error("[useMeasurementHistory] Error:", err);
        }
        if (mounted) setRaw([]); 
      });
    return () => { mounted = false; ctrl.abort(); };
  }, [customerId, stack, (stacks || []).join('|'), itemKey, start, end, refreshKey, selectedOrg?.id, isCustomerUser]);

  const filtered = raw; // API에서 1차 필터 적용됨

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { key, dir } = sort;
    const arr = [...filtered];
    arr.sort((a: any, b: any) => {
      const av = a[key];
      const bv = b[key];
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sort]);

  const total = sorted.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const data = pageSize >= 999999 ? sorted : sorted.slice(startIdx, endIdx);

  return { data, total, page, pageSize, mutate };
}
