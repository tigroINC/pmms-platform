import { useEffect, useState } from "react";

export type StackSummary = {
  stackId: string;
  stackName: string;
  avg: number;
  count: number;
  exceedCount: number;
  lastMeasuredAt?: string | null;
  limit?: number | null;
};

export function useStackSummary(params: { customerId?: string; itemKey?: string; start?: string; end?: string; open?: boolean }) {
  const { customerId, itemKey, start, end, open } = params || {};
  const [data, setData] = useState<StackSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!open || !customerId || !itemKey || !start || !end) {
      setData([]);
      return;
    }
    setLoading(true);
    const q = new URLSearchParams();
    q.set("customerId", customerId);
    q.set("itemKey", itemKey);
    q.set("start", start);
    q.set("end", end);
    fetch(`/api/stacks/summary?${q.toString()}`)
      .then((r) => r.json())
      .then((json) => { if (mounted) setData(Array.isArray(json.data) ? json.data : []); })
      .catch(() => { if (mounted) setData([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [customerId, itemKey, start, end, open]);

  return { data, loading };
}
