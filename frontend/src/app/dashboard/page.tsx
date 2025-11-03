"use client";
import StatCard from "@/components/ui/StatCard";
import BoazTrendChart from "@/components/charts/BoazTrendChart";
import { useEffect, useMemo, useRef, useState } from "react";
// Button removed: auto-apply filters, no manual 조회/초기화
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StackPickerModal from "@/components/StackPickerModal";
import { useStackSummary } from "@/hooks/useStackSummary";
import { useCustomers } from "@/hooks/useCustomers";
import { useMeasurementItems, useMeasurementHistory } from "@/hooks/useMeasurements";
import { useStacks } from "@/hooks/useStacks";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePrediction, PredictionData } from "@/hooks/usePrediction";
import Button from "@/components/ui/Button";
import { InsightReportResponse, isValidPdfResponse, validatePdfBase64 } from "@/types/insight";
import { useSession } from "next-auth/react";

// 카테고리형 필터 체크박스 컴포넌트
function CategoryCheckboxes({ itemKey, selected, onChange }: { itemKey: string; selected: string[]; onChange: (cats: string[]) => void }) {
  // 기상: 맑음, 흐림, 비, 눈
  // 풍향: 북, 북동, 동, 남동, 남, 남서, 서, 북서 (한글로 저장되어 있음)
  const options = itemKey === "weather" 
    ? ["맑음", "흐림", "비", "눈", "구름", "안개"]
    : (itemKey === "wind_dir" || itemKey === "wind_direction")
    ? ["북", "북동", "동", "남동", "남", "남서", "서", "북서"]
    : [];
  
  const toggleCategory = (cat: string) => {
    if (selected.includes(cat)) {
      onChange(selected.filter(c => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };
  
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <label key={opt} className="inline-flex items-center gap-1 text-xs cursor-pointer">
          <input 
            type="checkbox" 
            className="accent-blue-500"
            checked={selected.includes(opt)}
            onChange={() => toggleCategory(opt)}
          />
          <span className="text-gray-700 dark:text-gray-300">{opt}</span>
        </label>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { selectedOrg, loading: orgLoading } = useOrganization();
  const { list: customers } = useCustomers();
  const { items } = useMeasurementItems();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userCustomerId = (session?.user as any)?.customerId;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
  
  // 고객사 사용자의 환경측정기업 목록
  const [customerOrganizations, setCustomerOrganizations] = useState<any[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("전체");

  // 기본 날짜: 6개월 전 ~ 오늘
  const getDefaultDates = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(sixMonthsAgo),
      end: formatDate(today)
    };
  };

  const defaultDates = getDefaultDates();
  const [customer, setCustomer] = useState("전체");
  const [stacksSel, setStacksSel] = useState<string[]>([]); // empty = 전체
  const [item, setItem] = useState<string>("먼지");
  const [start, setStart] = useState(defaultDates.start);
  const [end, setEnd] = useState(defaultDates.end);
  const [applied, setApplied] = useState({ customer: "전체", stack: "전체", item: "먼지", start: defaultDates.start, end: defaultDates.end });
  const [chartType, setChartType] = useState<"line" | "bar" | "scatter">("scatter");
  const [showLimit30, setShowLimit30] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [showAverage, setShowAverage] = useState(false);
  
  // AutoML 예측 상태
  const { predict, loading: predictionLoading, error: predictionError, result: predictionResult } = usePrediction();
  const [aiPredictions, setAiPredictions] = useState<PredictionData[]>([]);
  const [predictionMessage, setPredictionMessage] = useState<string>("");
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [isAutoMLRunning, setIsAutoMLRunning] = useState(false);
  
  // 인사이트 보고서 상태
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightMessage, setInsightMessage] = useState<string>("");
  const [showInsightModal, setShowInsightModal] = useState(false);
  const [showStackModal, setShowStackModal] = useState(false);
  const [valueMin, setValueMin] = useState<string>("");
  const [valueMax, setValueMax] = useState<string>("");
  
  // 보조항목 목록 (items에서 category가 "보조항목"인 것들)
  const auxItems = useMemo(() => {
    return items
      .filter((item: any) => item.category === "보조항목")
      .filter((item: any) => {
        // wind_direction 중복 제거 (wind_dir만 사용)
        if (item.key === "wind_direction") return false;
        return true;
      })
      .map((item: any) => {
        // 기상, 풍향은 카테고리형으로 처리
        const isCategorical = item.key === "weather" || item.key === "wind_dir" || item.key === "wind_direction";
        return {
          name: item.name,
          itemKey: item.key,
          mode: isCategorical ? ("category" as const) : ("numeric" as const),
        };
      });
  }, [items]);
  
  type Cond = {
    id: string;
    itemKey: string;
    itemName: string;
    mode: "numeric" | "category";
    min?: string;
    max?: string;
    categories?: string[];
  };
  const [conds, setConds] = useState<Cond[]>([]);
  const addCond = () => {
    const first = auxItems[0];
    if (!first) return;
    const mode = first.mode;
    setConds((s) => [...s, { id: Math.random().toString(36).slice(2), itemKey: first.itemKey, itemName: first.name, mode }]);
  };
  const removeCond = (id: string) => setConds((s) => s.filter((c) => c.id !== id));
  const updateCond = (id: string, patch: Partial<Cond>) => setConds((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const resetConds = () => { setConds([]); setValueMin(""); setValueMax(""); };

  // 현재 선택(적용 전) 기준 고객사 ID
  const currentCustomerId = useMemo(() => {
    if (customer === "전체") return undefined;
    return customers.find((c) => c.name === customer)?.id;
  }, [customers, customer]);
  // 조회 적용된 고객사 ID
  const selectedCustomerId = useMemo(() => {
    if (applied.customer === "전체") return undefined;
    return customers.find((c) => c.name === applied.customer)?.id;
  }, [customers, applied.customer]);
  const selectedItem = useMemo(() => items.find((it) => it.name === applied.item), [items, applied.item]);
  // 스택 목록은 현재 선택된 고객사에 종속
  const { list: stackList } = useStacks(currentCustomerId);

  // 항목 목록을 현재 고객사/스택 선택에 종속(드롭다운용)
  // 보조항목 제외 (오염물질만 표시)
  const AUXILIARY_ITEM_KEYS = ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'];
  const [availableItems, setAvailableItems] = useState(items);
  useEffect(() => {
    const params = new URLSearchParams();
    if (currentCustomerId) params.set("customerId", currentCustomerId);
    if (stacksSel.length) stacksSel.forEach((s) => params.append("stack", s));
    fetch(`/api/items?${params.toString()}`)
      .then((r) => r.json())
      .then((json) => {
        const allItems = Array.isArray(json.data) ? json.data : [];
        // 보조항목 제외
        const pollutants = allItems.filter((item: any) => !AUXILIARY_ITEM_KEYS.includes(item.key));
        setAvailableItems(pollutants);
      })
      .catch(() => {
        // 에러 시에도 보조항목 제외
        const pollutants = items.filter((item: any) => !AUXILIARY_ITEM_KEYS.includes(item.key));
        setAvailableItems(pollutants);
      });
  }, [currentCustomerId, stacksSel, items]);

  // 고객사 사용자: 환경측정기업 목록 로드
  useEffect(() => {
    if (isCustomerUser) {
      fetch('/api/customer-organizations')
        .then(r => r.json())
        .then(json => {
          const orgs = json.organizations || [];
          setCustomerOrganizations(orgs);
        })
        .catch(err => console.error('Failed to fetch customer organizations:', err));
    }
  }, [isCustomerUser]);

  // 최소 필터 요건: 고객사 + 항목 선택 시 자동 조회
  useEffect(() => {
    // 초기 기본값 설정
    if (customers.length && customer === "전체") {
      if (isCustomerUser && userCustomerId) {
        // 고객사 사용자: 자신의 회사 자동 선택
        const myCustomer = customers.find((c) => c.id === userCustomerId);
        if (myCustomer) setCustomer(myCustomer.name);
      } else {
        // 환경측정기업: '고려아연' 우선, 없으면 첫 고객사
        const prefer = customers.find((c) => c.name.includes("고려아연")) || customers[0];
        if (prefer) setCustomer(prefer.name);
      }
    }
    if (items.length && (!item || item === "")) {
      const preferItem = items.find((it: any) => it.name === "먼지") || items[0];
      if (preferItem) setItem(preferItem.name);
    }
  }, [customers, items, isCustomerUser, userCustomerId]);

  useEffect(() => {
    // 고객사와 항목이 모두 선택되면 자동으로 적용 상태 반영
    if (customer !== "전체" && item) {
      const next = { customer, stack: stacksSel.join(","), item, start, end };
      const same =
        applied.customer === next.customer &&
        applied.stack === next.stack &&
        applied.item === next.item &&
        applied.start === next.start &&
        applied.end === next.end;
      if (!same) setApplied(next);
    }
  }, [customer, stacksSel, item, start, end]);

  const { data: history } = useMeasurementHistory({
    customerId: selectedCustomerId,
    stacks: applied.stack === "전체" || applied.stack === "" ? undefined : applied.stack.split(",").filter(Boolean),
    itemKey: selectedItem?.key,
    page: 1,
    pageSize: 999999,
    start: applied.start,
    end: applied.end,
    sort: { key: "measuredAt", dir: "asc" },
  });

  // Load auxiliary measurements for condition items
  const [condDataMap, setCondDataMap] = useState<Record<string, Map<string, any>>>({});
  const [condDataLoading, setCondDataLoading] = useState(false);
  
  useEffect(() => {
    (async () => {
      if (!conds.length) { 
        setCondDataMap({}); 
        setCondDataLoading(false);
        return; 
      }
      
      setCondDataLoading(true);
      const qsBase = new URLSearchParams();
      if (selectedCustomerId) qsBase.set("customerId", selectedCustomerId);
      if (applied.stack && applied.stack !== "" && applied.stack !== "전체") {
        applied.stack.split(",").filter(Boolean).forEach((s) => qsBase.append("stack", s));
      }
      if (applied.start) qsBase.set("start", applied.start);
      if (applied.end) qsBase.set("end", applied.end);
      
      try {
        const results = await Promise.all(conds.map(async (c) => {
          const qs = new URLSearchParams(qsBase);
          qs.set("itemKey", c.itemKey);
          const url = `/api/measurements?${qs.toString()}`;
          console.log(`[보조항목 API 호출] ${c.itemName} (${c.itemKey}):`, url);
          const res = await fetch(url);
          const json = await res.json();
          const arr = Array.isArray(json?.data) ? json.data : [];
          console.log(`[보조항목 데이터] ${c.itemName} (${c.itemKey}):`, arr.length, '건', arr.length > 0 ? `(샘플: ${JSON.stringify(arr[0])})` : '');
          const m = new Map<string, any>();
          for (const r of arr) {
            const d = r.measuredAt ? new Date(r.measuredAt) : null;
            const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
            const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
            const key = `${stackKey}|${minuteEpoch}`;
            const v = (r as any).value;
            m.set(key, v);
          }
          return [c.itemKey, m] as const;
        }));
        const mapObj: Record<string, Map<string, any>> = {};
        for (const [k, m] of results) mapObj[k] = m;
        setCondDataMap(mapObj);
        setCondDataLoading(false);
      } catch (err) {
        console.error('[보조항목 데이터 로드 실패]', err);
        setCondDataMap({});
        setCondDataLoading(false);
      }
    })();
  }, [JSON.stringify(conds), selectedCustomerId, applied.stack, applied.start, applied.end]);

  // Numeric value range filtering (applies to all chart types and CSV)
  const filteredHistory = useMemo(() => {
    const min = valueMin !== "" ? Number(valueMin) : undefined;
    const max = valueMax !== "" ? Number(valueMax) : undefined;
    const base = (history as any[]).filter((r) => {
      const v = Number(r.value);
      if (!Number.isFinite(v)) return false;
      if (min !== undefined && v < min) return false;
      if (max !== undefined && v > max) return false;
      return true;
    });
    
    // 보조항목 필터: 조건이 완전히 설정된 것만 적용
    const validConds = conds.filter((c) => {
      if (c.mode === "numeric") {
        // 숫자형: min과 max 모두 입력되어야 유효
        return c.min !== undefined && c.min !== "" && c.max !== undefined && c.max !== "";
      } else {
        // 카테고리형: 최소 1개 이상 선택되어야 유효
        return c.categories && c.categories.length > 0;
      }
    });
    
    // 유효한 조건이 없거나 데이터 로딩 중이면 필터링 안함
    if (!validConds.length || condDataLoading) return base;
    
    // 모든 조건의 데이터가 로드되었는지 확인
    const allDataReady = validConds.every(c => condDataMap[c.itemKey]);
    if (!allDataReady) {
      console.log('[보조항목 필터] 데이터 로딩 중...');
      return base; // 데이터 로딩 중이면 필터링 안함
    }
    
    // AND all condition items by same (stack, minute)
    const filtered = base.filter((r) => {
      const d = r.measuredAt ? new Date(r.measuredAt) : null;
      const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
      const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
      const key = `${stackKey}|${minuteEpoch}`;
      
      for (const c of validConds) {
        const m = condDataMap[c.itemKey];
        const v = m.get(key);
        
        // 해당 시점에 보조항목 데이터가 없으면 제외
        if (v === undefined || v === null) return false;
        
        if (c.mode === "numeric") {
          const num = Number(v);
          if (!Number.isFinite(num)) return false;
          const cmin = Number(c.min);
          const cmax = Number(c.max);
          if (num < cmin || num > cmax) return false;
        } else {
          const selected = c.categories || [];
          const sv = String(v).trim(); // 공백 제거
          console.log(`[카테고리 필터] ${c.itemName}: 값="${sv}", 선택됨=[${selected.join(', ')}], 매칭=${selected.includes(sv)}`);
          if (!selected.includes(sv)) return false;
        }
      }
      return true;
    });
    
    console.log(`[보조항목 필터] ${base.length}건 -> ${filtered.length}건`);
    return filtered;
  }, [history, valueMin, valueMax, JSON.stringify(conds), condDataMap]);

  const { data: stackSummary, loading: stackSummaryLoading } = useStackSummary({
    customerId: selectedCustomerId,
    itemKey: selectedItem?.key,
    start: applied.start,
    end: applied.end,
    open: showStackModal,
  });

  const scatterSeries = useMemo(() => {
    if (chartType !== "scatter") return undefined;
    const seen = new Set<string>();
    const uniq: any[] = [];
    for (const r of (filteredHistory as any[])) {
      const d = r.measuredAt ? new Date(r.measuredAt) : null;
      const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
      const valKey = typeof r.value === 'number' ? r.value.toFixed(3) : String(r.value);
      const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
      const itemKey = r.itemKey || r.item?.key || '';
      const key = r.id || `${stackKey}|${itemKey}|${minuteEpoch}|${valKey}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(r);
    }
    const labels = uniq.map((r) => {
      const dt = new Date(r.measuredAt);
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const mi = String(dt.getMinutes()).padStart(2, '0');
      return `${mm}/${dd} ${hh}:${mi}`;
    });
    const values = uniq.map((r) => Number(r.value));
    const times = uniq.map((r) => r.measuredAt);
    const stacks = uniq.map((r) => r.stack?.name || "");
    return { labels, values, times, stacks, payloads: uniq };
  }, [filteredHistory, chartType]);

  const chartData = useMemo(() => {
    // 실제 적용된 배출허용기준 가져오기 (우선순위: 굴뚝별 > 고객사별 > 전체)
    const actualLimit = (filteredHistory as any[])[0]?.item?.limit ?? selectedItem?.limit ?? 0;
    
    // If scatter: show raw measurement points (no monthly aggregation)
    if (chartType === "scatter") {
      const lbls = scatterSeries?.labels || [];
      const vals = scatterSeries?.values || [];
      return { labels: lbls, data: vals, limit: actualLimit };
    }

    function buildBuckets(rangeStart: { y: number; m: number }, rangeEnd: { y: number; m: number }) {
      const labels: string[] = [];
      const buckets: Record<string, number[]> = {};
      const d = new Date(rangeStart.y, rangeStart.m - 1, 1);
      const endD = new Date(rangeEnd.y, rangeEnd.m - 1, 1);
      while (d <= endD) {
        const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        labels.push(`${d.getMonth() + 1}월`);
        buckets[key] = [];
        d.setMonth(d.getMonth() + 1);
      }
      for (const r of filteredHistory as any[]) {
        const dt = new Date(r.measuredAt);
        const key = `${dt.getFullYear()}-${(dt.getMonth() + 1).toString().padStart(2, "0")}`;
        if (key in buckets) buckets[key].push(Number(r.value));
      }
      const data = Object.keys(buckets).map((k) => {
        const arr = buckets[k];
        if (arr.length === 0) return 0;
        const sum = arr.reduce((a, b) => a + b, 0);
        // keep precision to avoid rounding small values down to 0
        return sum / arr.length;
      });
      return { labels, data };
    }

    // 우선 현재 적용 기간으로 생성
    const sDate = new Date(applied.start);
    const eDate = new Date(applied.end);
    const sy = sDate.getFullYear();
    const sm = sDate.getMonth() + 1;
    const ey = eDate.getFullYear();
    const em = eDate.getMonth() + 1;
    let { labels, data } = buildBuckets({ y: sy, m: sm }, { y: ey, m: em });

    // 사용자가 설정한 기간 범위만 표시

    return {
      labels,
      data,
      limit: actualLimit,
    };
  }, [filteredHistory, applied.start, applied.end, selectedItem?.limit, chartType]);

  const summary = useMemo(() => {
    const values = (filteredHistory as any[]).map((r) => Number(r.value));
    const totalCount = values.length;
    const now = new Date();
    const monthCount = (filteredHistory as any[]).filter((r) => {
      const dt = new Date(r.measuredAt);
      return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    }).length;
    const exceed = (filteredHistory as any[]).filter((r) => selectedItem && Number(r.value) > (selectedItem.limit ?? Infinity)).length;
    const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { totalCount, monthCount, exceed, avg: Number(avg.toFixed(1)) };
  }, [filteredHistory, selectedItem]);

  const xTimes = useMemo(() => (chartType === "scatter" ? (scatterSeries?.times as any) : undefined), [scatterSeries, chartType]);
  const pointStacks = useMemo(() => (chartType === "scatter" ? (scatterSeries?.stacks as any) : undefined), [scatterSeries, chartType]);

  const monthTicks = useMemo(() => {
    if (chartType !== "scatter") return undefined;
    const out: number[] = [];
    const s = new Date(applied.start);
    const e = new Date(applied.end);
    const d = new Date(s.getFullYear(), s.getMonth(), 1);
    const endD = new Date(e.getFullYear(), e.getMonth(), 1);
    while (d <= endD) {
      out.push(d.getTime());
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }, [applied.start, applied.end, chartType]);

  const monthTickLabels = useMemo(() => {
    if (!monthTicks) return undefined;
    return monthTicks.map((ts) => {
      const dt = new Date(ts);
      return `${dt.getMonth() + 1}월`;
    });
  }, [monthTicks]);

  // Export/Print
  const chartCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const onExportCSV = () => {
    try {
      const rows = (filteredHistory as any[]).map((r) => ({
        measuredAt: r.measuredAt,
        customer: r.customer?.name || "",
        stackId: r.stack?.id || r.stackId || "",
        stackName: r.stack?.name || r.stackName || "",
        itemName: r.item?.name || "",
        itemKey: r.itemKey,
        unit: r.item?.unit ?? "",
        limit: r.item?.limit ?? "",
        value: r.value,
      }));
      const header = ["measuredAt","customer","stackId","stackName","itemName","itemKey","unit","limit","value"].join(",");
      const body = rows
        .map((o) => [o.measuredAt, o.customer, o.stackId, o.stackName, o.itemName, o.itemKey, o.unit, o.limit, o.value]
          .map((v) => (v !== undefined && v !== null ? String(v).replaceAll('"', '""') : ""))
          .map((v) => (v.includes(',') || v.includes('"') ? `"${v}"` : v))
          .join(","))
        .join("\n");
      const csv = header + "\n" + body;
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `boaz-data-${applied.item}-${applied.start}-${applied.end}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };
  const onPrintPDF = () => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const w = window.open("", "print");
    if (!w) return;
    const title = `월별 농도 추이 - ${applied.item}`;
    const period = `${applied.start} ~ ${applied.end}`;
    w.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>
        body{margin:24px;padding:0;background:#fff;color:#111;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial}
        .header{margin-bottom:12px}
        .title{font-size:18px;font-weight:600}
        .period{font-size:12px;color:#555}
        .imgwrap{display:flex;justify-content:center;align-items:center}
        img{max-width:100%;}
      </style>
      </head><body>
      <div class="header"><div class="title">${title}</div><div class="period">${period}</div></div>
      <div class="imgwrap"><img src="${dataUrl}"/></div>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  // 조건부 렌더링 (모든 훅 호출 후)
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  // 고객사 사용자는 Organization이 필요 없음
  if (!isCustomerUser && !selectedOrg) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">조직 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">통계 차트 대시보드</h1>

      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar: Filters */}
        <aside className="col-span-12 md:col-span-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="sticky top-20 p-4 space-y-4">
            <div className="space-y-1">
              {isCustomerUser ? (
                // 고객사 사용자: 환경측정기업 선택
                <>
                  <label className="text-sm">환경측정기업</label>
                  <Select 
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    value={selectedOrgFilter} 
                    onChange={(e)=>setSelectedOrgFilter((e.target as HTMLSelectElement).value)}
                  >
                    <option value="전체">통합 데이터 (전체)</option>
                    {customerOrganizations.map((org)=> (
                      <option key={org.id} value={org.id}>{org.nickname || org.name}</option>
                    ))}
                  </Select>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    특정 측정회사 또는 통합 데이터 선택
                  </div>
                </>
              ) : (
                // 환경측정기업 사용자: 고객사 선택
                <>
                  <label className="text-sm">고객사</label>
                  <Select 
                    className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    value={customer} 
                    onChange={(e)=>setCustomer((e.target as HTMLSelectElement).value)}
                  >
                    <option value="전체">전체</option>
                    {customers.map((c)=> (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </Select>
                </>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm">굴뚝</label>
              <div className="flex items-center gap-2">
                <button className="px-3 py-2 border rounded w-full border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700" onClick={()=> setShowStackModal(true)}>
                  스택 선택{stacksSel.length ? ` (${stacksSel.length})` : ""}
                </button>
              </div>
              {stacksSel.length > 0 && (
                <div className="text-xs text-gray-300 truncate">
                  {stacksSel.join(", ")}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm">항목</label>
              <Select className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={item} onChange={(e)=>setItem(((e.target as HTMLSelectElement).value))}>
                {availableItems.map((it: any)=> (
                  <option key={it.key} value={it.name}>{it.name}</option>
                ))}
              </Select>
            </div>
            {/* 기간 설정 - 반응형 */}
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-700">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">📅 기간 설정</label>
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-600 dark:text-gray-400">시작일</label>
                  <Input 
                    className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    type="date" 
                    value={start} 
                    onChange={(e)=>setStart((e.target as HTMLInputElement).value)} 
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-600 dark:text-gray-400">종료일</label>
                  <Input 
                    className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    type="date" 
                    value={end} 
                    onChange={(e)=>setEnd((e.target as HTMLInputElement).value)} 
                  />
                </div>
              </div>
            </div>

            {/* 값 범위 설정 - 반응형 */}
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-700">
              <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">📊 값 범위</label>
              <div className="flex flex-col gap-1">
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-600 dark:text-gray-400">최소값</label>
                  <Input 
                    className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    type="number" 
                    placeholder="0" 
                    value={valueMin} 
                    onChange={(e)=>setValueMin((e.target as HTMLInputElement).value)} 
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <label className="text-xs text-gray-600 dark:text-gray-400">최대값</label>
                  <Input 
                    className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" 
                    type="number" 
                    placeholder="100" 
                    value={valueMax} 
                    onChange={(e)=>setValueMax((e.target as HTMLInputElement).value)} 
                  />
                </div>
              </div>
            </div>
            
            {/* 보조항목 필터 */}
            <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-700">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">🌡️ 보조항목 필터</label>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700" onClick={addCond}>+ 항목 추가</button>
                <button className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700" onClick={resetConds}>초기화</button>
              </div>
              {conds.length === 0 && (
                <div className="text-xs text-gray-400">보조항목으로 필터링할 수 있습니다. 예) 풍속 0~5</div>
              )}
              <div className="space-y-2">
                {conds.map((c) => (
                  <div key={c.id} className="space-y-1 p-2 border border-gray-300 dark:border-gray-600 rounded">
                    <div className="space-y-1">
                      <Select
                        className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 text-xs"
                        value={c.itemName}
                        onChange={(e)=>{
                          const name = (e.target as HTMLSelectElement).value;
                          const it = auxItems.find((x: any)=>x.name===name);
                          if (it) {
                            updateCond(c.id, { itemKey: it.itemKey, itemName: it.name, mode: it.mode });
                          }
                        }}
                      >
                        {auxItems.map((it:any)=> (
                          <option key={it.itemKey} value={it.name}>{it.name}</option>
                        ))}
                      </Select>
                      <button className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-700" onClick={()=>removeCond(c.id)}>삭제</button>
                    </div>
                    {c.mode === "numeric" ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-600 dark:text-gray-400">최소</label>
                          <Input className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" type="number" value={c.min ?? ""} onChange={(e)=>updateCond(c.id,{ min: (e.target as HTMLInputElement).value })} />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-xs text-gray-600 dark:text-gray-400">최대</label>
                          <Input className="w-full text-xs sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" type="number" value={c.max ?? ""} onChange={(e)=>updateCond(c.id,{ max: (e.target as HTMLInputElement).value })} />
                        </div>
                      </div>
                    ) : (
                      <CategoryCheckboxes 
                        itemKey={c.itemKey}
                        selected={c.categories || []}
                        onChange={(cats) => updateCond(c.id, { categories: cats })}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main content: Stats + Chart */}
        <main className="col-span-12 md:col-span-10 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard title="총 측정 건수" value={summary.totalCount} sub={`${applied.start} ~ ${applied.end}`} />
            <StatCard title="이번 달 측정" value={summary.monthCount} />
            <StatCard title="기준 초과" value={summary.exceed} sub={`${applied.customer} / ${applied.item}`} />
            <StatCard title="평균 농도" value={summary.avg} sub={selectedItem?.unit || "mg/S㎥"} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">차트 유형</label>
                <Select className="min-w-[120px] bg-white dark:bg-gray-700" value={chartType} onChange={(e)=>setChartType((e.target as HTMLSelectElement).value as any)}>
                  <option value="line">Line</option>
                  <option value="bar">Bar</option>
                  <option value="scatter">Scatter</option>
                </Select>
              </div>
              <label className="text-sm inline-flex items-center gap-2">
                <input type="checkbox" className="accent-blue-500" checked={showLimit30} onChange={(e)=>setShowLimit30((e.target as HTMLInputElement).checked)} /> 30% 기준선
              </label>
              <label className="text-sm inline-flex items-center gap-2">
                <input type="checkbox" className="accent-blue-500" checked={showPrediction} onChange={(e)=>setShowPrediction((e.target as HTMLInputElement).checked)} /> 이동평균선
              </label>
              {chartType === 'scatter' && (
                <label className="text-sm inline-flex items-center gap-2">
                  <input type="checkbox" className="accent-blue-500" checked={showAverage} onChange={(e)=>setShowAverage((e.target as HTMLInputElement).checked)} /> 평균선
                </label>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="secondary"
                onClick={async () => {
                  if (!selectedCustomerId || !selectedItem?.key) {
                    alert('고객사와 항목을 선택해주세요.');
                    return;
                  }
                  
                  try {
                    setIsAutoMLRunning(true);
                    
                    // 고객사 전체 굴뚝 데이터를 사용하여 예측 (데이터 충분성 확보)
                    const result = await predict({
                      customer_id: selectedCustomerId,
                      stack: stackList[0]?.name || 'dummy', // stack은 사용되지 않음 (고객사 전체 데이터 사용)
                      item_key: selectedItem.key,
                      periods: 30
                    });
                    
                    if (result) {
                      setAiPredictions(result.predictions);
                      
                      // 예측 완료 메시지 설정 - 차트 툴팁과 동일한 형식
                      const message = `🤖 AI 예측 완료\n\n📊 예측 정보:\n• Prophet AutoML 모델 기반\n• 고객사 전체 굴뚝 데이터 학습\n• 과거 패턴 및 계절성 반영\n• 30일 미래 예측\n\n📈 모델 상세 정보:\n• 모델: ${result.model_info.model_type} (Meta Research)\n• 학습 데이터: ${result.training_samples}건\n• 예측 기간: 30일\n\n🎯 모델 정확도:\n• RMSE: ${result.accuracy_metrics?.rmse?.toFixed(2) || 'N/A'} mg/S㎥\n• MAE: ${result.accuracy_metrics?.mae?.toFixed(2) || 'N/A'} mg/S㎥\n• R²: ${result.accuracy_metrics?.r2?.toFixed(3) || 'N/A'}\n\n💡 설명:\nR² 값이 높을수록 모델의 설명력이 높으며,\nRMSE와 MAE는 예측 오차를 나타냅니다.\n\n✨ 차트의 초록색 예측선에 마우스를 올려\n각 예측 포인트의 상세 정보를 확인하세요!`;
                      
                      setPredictionMessage(message);
                      setShowPredictionModal(true);
                    } else {
                      const errorMsg = predictionError || '알 수 없는 오류가 발생했습니다.';
                      setPredictionMessage(`❌ 예측 실패\n\n${errorMsg}\n\n해당 고객사/항목의 측정 데이터가 부족할 수 있습니다.\n(최소 10개 이상 필요)`);
                      setShowPredictionModal(true);
                    }
                  } catch (err: any) {
                    setPredictionMessage(`❌ 예측 실패\n\n${err.message || '예측 중 오류가 발생했습니다.'}\n\n해당 고객사/항목의 측정 데이터가 부족할 수 있습니다.`);
                    setShowPredictionModal(true);
                  } finally {
                    setIsAutoMLRunning(false);
                  }
                }}
                disabled={isAutoMLRunning}
                title="고객사 전체 굴뚝 데이터를 사용하여 AI 예측을 수행합니다"
              >
                {isAutoMLRunning ? '🔄 예측 생성 중...' : '🤖 AutoML 예측'}
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!selectedCustomerId || !selectedItem?.key) {
                    alert('고객사와 항목을 선택해주세요.');
                    return;
                  }
                  
                  setInsightLoading(true);
                  setInsightMessage('🔄 인사이트 보고서 생성 중...\n\n예상 소요 시간: 약 10-15초\n\nAI 모델 학습 및 분석을 진행하고 있습니다.');
                  setShowInsightModal(true);
                  
                  try {
                    const res = await fetch('http://localhost:8000/api/predict/insight', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customer_id: selectedCustomerId,
                        stack: stackList[0]?.name || 'dummy',
                        item_key: selectedItem.key,
                        periods: 30
                      })
                    });
                    
                    if (!res.ok) throw new Error('보고서 생성 실패');
                    
                    const data: InsightReportResponse = await res.json();
                    
                    // ⚠️ CRITICAL: PDF 생성은 백엔드에서 필수로 수행됩니다.
                    // HTML fallback은 지원하지 않습니다.
                    // 타입 가드로 응답 검증
                    if (!isValidPdfResponse(data)) {
                      throw new Error('백엔드에서 유효하지 않은 응답을 받았습니다. PDF 데이터가 없습니다.');
                    }
                    
                    // PDF Base64 검증
                    validatePdfBase64(data.pdf_base64);
                    
                    // 예측 데이터 저장
                    setAiPredictions(data.predictions);
                    
                    // 완료 메시지 표시
                    setInsightMessage('✅ 보고서 생성 완료!\n\n새 탭에서 PDF 보고서를 여시겠습니까?');
                    
                    // PDF 표시 (백엔드에서 생성된 PDF만 지원)
                    if (confirm('📊 보고서가 생성되었습니다.\n\nPDF를 새 탭에서 여시겠습니까?')) {
                      try {
                        // Base64를 Blob으로 변환
                        const byteCharacters = atob(data.pdf_base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                        
                        // PDF를 새 탭에서 열기
                        const url = URL.createObjectURL(blob);
                        const newWindow = window.open(url, '_blank');
                        
                        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
                          alert('⚠️ 팝업이 차단되었습니다.\n\n브라우저 주소창 오른쪽의 팝업 차단 아이콘을 클릭하여\n이 사이트의 팝업을 허용해주세요.');
                        }
                      } catch (pdfError) {
                        console.error('PDF 표시 오류:', pdfError);
                        alert('PDF 표시 중 오류가 발생했습니다.');
                      }
                    }
                  } catch (err: any) {
                    alert(`❌ 보고서 생성 실패\n\n${err.message}`);
                  } finally {
                    setInsightLoading(false);
                  }
                }}
                disabled={insightLoading}
                title="AI 기반 예측 인사이트 보고서를 생성합니다"
              >
                {insightLoading ? '보고서 생성 중...' : '📊 인사이트 보고서'}
              </Button>
              <Button variant="secondary" onClick={onExportCSV}>📥 엑셀 다운로드</Button>
              <Button variant="secondary" onClick={onPrintPDF}>🖨️ 그래프 PDF</Button>
            </div>
          </div>

          {chartData.data.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-gray-500 bg-white/50 dark:bg-white/5">
              표시할 데이터가 없습니다. 기간과 항목을 조정해 보세요.
            </div>
          ) : (
            <BoazTrendChart
              labels={chartData.labels}
              data={chartData.data}
              limit={chartData.limit}
              title={`월별 농도 추이 - ${applied.item}`}
              chartType={chartType}
              showLimit30={showLimit30}
              showPrediction={showPrediction}
              showAverage={showAverage}
              xTimes={xTimes}
              pointStacks={pointStacks as any}
              pointPayloads={chartType === 'scatter' ? (scatterSeries?.payloads as any) : undefined}
              height={560}
              exportRef={chartCanvasRef}
              monthTicks={chartType === 'scatter' ? monthTicks : undefined}
              monthTickLabels={chartType === 'scatter' ? monthTickLabels : undefined}
              aiPredictions={aiPredictions.length > 0 ? aiPredictions : undefined}
            />
          )}
        </main>
      </div>

      <StackPickerModal
        open={showStackModal}
        onClose={()=> setShowStackModal(false)}
        summaries={stackSummary}
        loading={stackSummaryLoading}
        initialSelectedNames={stacksSel}
        onApply={(names)=> { setStacksSel(names); setShowStackModal(false); }}
      />

      {/* 예측 메시지 모달 */}
      {showPredictionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPredictionModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <pre className="whitespace-pre-wrap text-base font-sans leading-relaxed text-gray-800 dark:text-gray-200">{predictionMessage}</pre>
            <div className="mt-8 flex justify-end">
              <Button variant="primary" onClick={() => setShowPredictionModal(false)}>확인</Button>
            </div>
          </div>
        </div>
      )}

      {/* 인사이트 메시지 모달 */}
      {showInsightModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInsightModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <pre className="whitespace-pre-wrap text-sm font-sans">{insightMessage}</pre>
            <div className="mt-6 flex justify-end">
              <Button variant="primary" onClick={() => setShowInsightModal(false)}>확인</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
