"use client";
import StatCard from "@/components/ui/StatCard";
import PmmsTrendChart from "@/components/charts/PmmsTrendChart";  // ✅
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
import { usePermissions } from "@/hooks/usePermissions";

// 카테고리형 필터 체크박스 컴포넌트
function CategoryCheckboxes({ itemKey, selected, onChange, items }: { itemKey: string; selected: string[]; onChange: (cats: string[]) => void; items: any[] }) {
  // 항목의 options에서 선택지 가져오기
  const item = items.find((it: any) => it.key === itemKey);
  let options: string[] = [];
  
  if (item?.options) {
    try {
      options = JSON.parse(item.options);
    } catch (e) {
      console.error("Failed to parse options:", e);
    }
  }
  
  // 기본값 (옵션이 없을 경우)
  if (options.length === 0) {
    if (itemKey === "weather") {
      options = ["맑음", "흐림", "비", "눈", "구름", "안개"];
    } else if (itemKey === "wind_dir" || itemKey === "wind_direction") {
      options = ["북", "북동", "동", "남동", "남", "남서", "서", "북서"];
    }
  }
  
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
  
  // 고객사 사용자의 환경측정기업 목록
  const [customerOrganizations, setCustomerOrganizations] = useState<any[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("전체");

  // 시스템 보기 모드 확인
  const viewAsCustomerId = typeof window !== "undefined" ? sessionStorage.getItem("viewAsCustomer") : null;
  const isViewingAsCustomer = userRole === "SUPER_ADMIN" && !!viewAsCustomerId;
  
  // 고객사 사용자 또는 고객사 시스템 보기 모드
  const isCustomerUser = (userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER") || isViewingAsCustomer;

  // 기본 날짜: 6개월 vs 올해 1월 1일 중 더 긴 기간
  const getDefaultDates = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const thisYearStart = new Date(today.getFullYear(), 0, 1); // 올해 1월 1일
    
    // 두 날짜 중 더 이른 날짜 선택 (더 긴 기간)
    const startDate = sixMonthsAgo < thisYearStart ? sixMonthsAgo : thisYearStart;
    
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      start: formatDate(startDate),
      end: formatDate(today)
    };
  };

  const defaultDates = getDefaultDates();
  const [customer, setCustomer] = useState("");
  const [stacksSel, setStacksSel] = useState<string[]>([]); // empty = 전체
  const [item, setItem] = useState<string>("");
  const [start, setStart] = useState(defaultDates.start);
  const [end, setEnd] = useState(defaultDates.end);
  const [applied, setApplied] = useState({ customer: "", stack: "", item: "", start: defaultDates.start, end: defaultDates.end });
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
  
  // 보조항목 목록 (items에서 category가 "보조항목" 또는 "채취환경"인 것들)
  const auxItems = useMemo(() => {
    console.log('[auxItems] Total items:', items.length);
    console.log('[auxItems] Categories:', [...new Set(items.map((i: any) => i.category))]);
    
    return items
      .filter((item: any) => item.category === "보조항목" || item.category === "채취환경")
      .filter((item: any) => {
        // wind_direction 중복 제거 (wind_dir만 사용)
        if (item.key === "wind_direction") return false;
        return true;
      })
      .map((item: any) => {
        // inputType이 "select"이면 카테고리형, 아니면 숫자형
        const isCategorical = item.inputType === "select" || item.key === "weather" || item.key === "wind_dir" || item.key === "wind_direction";
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
    console.log('[addCond] auxItems:', auxItems);
    const first = auxItems[0];
    if (!first) {
      console.log('[addCond] No auxItems available');
      return;
    }
    const mode = first.mode;
    console.log('[addCond] Adding condition:', { itemKey: first.itemKey, itemName: first.name, mode });
    setConds((s) => [...s, { id: Math.random().toString(36).slice(2), itemKey: first.itemKey, itemName: first.name, mode }]);
  };
  const removeCond = (id: string) => setConds((s) => s.filter((c) => c.id !== id));
  const updateCond = (id: string, patch: Partial<Cond>) => setConds((s) => s.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const resetConds = () => { setConds([]); setValueMin(""); setValueMax(""); };

  // 현재 선택(적용 전) 기준 고객사 ID
  const currentCustomerId = useMemo(() => {
    if (!customer || customer === "전체") return undefined;
    return customers.find((c) => c.name === customer)?.id;
  }, [customers, customer]);
  // 조회 적용된 고객사 ID
  const selectedCustomerId = useMemo(() => {
    console.log("[Dashboard] Computing selectedCustomerId - applied.customer:", applied.customer, "applied.item:", applied.item);
    
    // 고객사 사용자는 자신의 고객사 ID를 사용
    if (isCustomerUser) {
      return viewAsCustomerId || userCustomerId;
    }
    // 환경측정기업 사용자: 측정항목만 선택되어도 조회 가능
    if (!applied.item) {
      console.log("[Dashboard] No item selected, returning null");
      return null; // 측정항목 미선택 시 데이터 로딩 안 함
    }
    // 고객사 미선택 또는 "전체" 선택 시 전체 데이터 조회
    if (!applied.customer || applied.customer === "전체") return undefined;
    const found = customers.find((c) => c.name === applied.customer);
    console.log("[Dashboard] Found customer ID:", found?.id);
    return found?.id;
  }, [customers, applied.customer, applied.item, isCustomerUser, viewAsCustomerId, userCustomerId]);
  const selectedItem = useMemo(() => items.find((it) => it.name === applied.item), [items, applied.item]);
  // 스택 목록은 현재 선택된 고객사에 종속
  const { list: stackList } = useStacks(currentCustomerId);

  // 항목 목록을 현재 고객사/스택 선택에 종속(드롭다운용)
  // 권한에 따라 오염물질만 표시 또는 전체 표시
  const AUXILIARY_ITEM_KEYS = ['weather', 'temp', 'humidity', 'pressure', 'wind_dir', 'wind_speed', 'gas_velocity', 'gas_temp', 'moisture', 'o2_measured', 'o2_standard', 'flow_rate'];
  const [availableItems, setAvailableItems] = useState(items);
  const { hasPermission } = usePermissions();
  const showPollutantsOnly = hasPermission('dashboard.pollutants_only');
  
  console.log('[Dashboard] showPollutantsOnly:', showPollutantsOnly);
  
  useEffect(() => {
    // 고객사/스택 선택 여부와 관계없이 전체 항목 표시
    // 권한에 따라서만 필터링
    const filteredItems = showPollutantsOnly 
      ? items.filter((item: any) => !AUXILIARY_ITEM_KEYS.includes(item.key))
      : items;
    
    console.log('[Dashboard] Available items count:', filteredItems.length);
    console.log('[Dashboard] showPollutantsOnly:', showPollutantsOnly);
    
    setAvailableItems(filteredItems);
  }, [items, showPollutantsOnly]);

  // 고객사 사용자: 환경측정기업 목록 로드
  useEffect(() => {
    if (isCustomerUser) {
      const url = viewAsCustomerId 
        ? `/api/customer-organizations?viewAsCustomer=${viewAsCustomerId}`
        : '/api/customer-organizations';
      
      fetch(url)
        .then(r => r.json())
        .then(json => {
          const orgs = json.organizations || [];
          setCustomerOrganizations(orgs);
        })
        .catch(err => console.error('Failed to fetch customer organizations:', err));
    }
  }, [isCustomerUser, viewAsCustomerId]);

  // 고객사 사용자만 자동 선택 (본인 회사)
  useEffect(() => {
    if (customers.length && customer === "" && isCustomerUser && userCustomerId) {
      const myCustomer = customers.find((c) => c.id === userCustomerId);
      if (myCustomer) setCustomer(myCustomer.name);
    }
  }, [customers, isCustomerUser, userCustomerId]);

  useEffect(() => {
    // 고객사와 항목이 모두 선택되면 자동으로 적용 상태 반영
    if (customer && customer !== "전체" && item) {
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

  const sortConfig = useMemo(() => ({ key: "measuredAt" as const, dir: "asc" as const }), []);
  const stacksArray = useMemo(() => 
    applied.stack === "전체" || applied.stack === "" ? undefined : applied.stack.split(",").filter(Boolean),
    [applied.stack]
  );

  // 고객사와 항목이 모두 선택되어야만 데이터 로딩
  const shouldLoadData = applied.customer && applied.item;
  
  const { data: history } = useMeasurementHistory({
    customerId: shouldLoadData ? selectedCustomerId : null,
    stacks: shouldLoadData ? stacksArray : undefined,
    itemKey: shouldLoadData ? selectedItem?.key : undefined,
    page: 1,
    pageSize: 999999,
    start: applied.start,
    end: applied.end,
    sort: sortConfig,
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
      
      // 고객사와 항목이 선택되지 않으면 보조항목 데이터도 로딩 안 함
      if (!shouldLoadData) {
        console.log('[보조항목 데이터] 고객사/항목 미선택, 로딩 스킵');
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
        // 보조항목 데이터는 history에서 직접 추출 (채취환경은 오염물질과 함께 저장됨)
        const results = conds.map((c) => {
          const sample = (history as any[])[0];
          console.log(`[보조항목 데이터 추출] ${c.itemName} (${c.itemKey})`);
          console.log(`[보조항목] history 샘플 전체 키:`, sample ? Object.keys(sample) : 'no data');
          
          const m = new Map<string, any>();
          
          // itemKey를 실제 필드명으로 매핑
          const fieldMap: Record<string, string> = {
            'MENV0001': 'weather',
            'MENV0002': 'temperatureC',
            'MENV0003': 'humidityPct',
            'MENV0004': 'pressureMmHg',
            'MENV0005': 'windDirection',
            'MENV0006': 'windSpeedMs',
            'MENV0007': 'gasVelocityMs',
            'MENV0008': 'gasTempC',
            'MENV0009': 'moisturePct',
            'MENV0010': 'oxygenMeasuredPct',
            'MENV0011': 'oxygenStdPct',
            'MENV0012': 'flowSm3Min',
          };
          
          const fieldName = fieldMap[c.itemKey] || c.itemKey;
          console.log(`[보조항목] ${c.itemKey} -> ${fieldName} 매핑`);
          
          for (const r of (history as any[])) {
            const d = r.measuredAt ? new Date(r.measuredAt) : null;
            const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
            const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
            const key = `${stackKey}|${minuteEpoch}`;
            
            // 매핑된 필드명으로 값 추출
            const v = (r as any)[fieldName];
            
            if (v !== undefined && v !== null && v !== '') {
              m.set(key, v);
            }
          }
          
          console.log(`[보조항목 데이터] ${c.itemName} (${c.itemKey}):`, m.size, '건', m.size > 0 ? `샘플 값: ${Array.from(m.values())[0]}` : '');
          return [c.itemKey, m] as const;
        });
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
  }, [history, valueMin, valueMax, JSON.stringify(conds), condDataLoading]);

  const { data: stackSummary, loading: stackSummaryLoading } = useStackSummary({
    customerId: selectedCustomerId,
    itemKey: selectedItem?.key,
    start: applied.start,
    end: applied.end,
    open: showStackModal,
  });

  const scatterSeries = useMemo(() => {
    if (chartType !== "scatter") return undefined;
    console.log("[Dashboard] scatterSeries - filteredHistory:", filteredHistory.length, "sample:", filteredHistory[0]);
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
      if (isNaN(dt.getTime())) {
        console.warn("[Dashboard] Invalid date:", r.measuredAt, "from record:", r.id);
      }
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      const hh = String(dt.getHours()).padStart(2, '0');
      const mi = String(dt.getMinutes()).padStart(2, '0');
      return `${mm}/${dd} ${hh}:${mi}`;
    });
    const values = uniq.map((r) => Number(r.value));
    const times = uniq.map((r) => r.measuredAt);
    const stacks = uniq.map((r) => r.stack?.name || "");
    console.log("[Dashboard] Chart data:", { labels: labels.length, values: values.length, labelsample: labels[0], valuesample: values[0] });
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
    // 마지막 틱을 다음 달 첫날로 추가하여 현재 달의 데이터가 범위 안에 들어오도록 함
    if (out.length > 0) {
      const lastTick = new Date(out[out.length - 1]);
      lastTick.setMonth(lastTick.getMonth() + 1);
      out.push(lastTick.getTime());
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
      a.download = `pmms-data-${applied.item}-${applied.start}-${applied.end}.csv`;
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
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">통계 차트 대시보드</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">고객사, 측정항목 등 조건을 선택하시면 자동으로 데이터가 로딩됩니다</p>
      </div>

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
                    <option value="">선택하세요</option>
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
                <button className="px-3 py-2 border rounded w-full border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm" onClick={()=> setShowStackModal(true)}>
                  굴뚝번호{stacksSel.length ? ` (${stacksSel.length})` : ""}
                </button>
              </div>
              {stacksSel.length > 0 && (
                <div className="text-xs text-gray-300 truncate">
                  {stacksSel.join(", ")}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-sm">측정항목</label>
              <Select className="bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600" value={item} onChange={(e)=>setItem(((e.target as HTMLSelectElement).value))}>
                <option value="">항목 선택</option>
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
                        items={items}
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
                    
                    // 로딩 모달 표시
                    setPredictionMessage('🤖 AI 모델 학습 중...\n\n과거 데이터를 분석하여 최적의 예측 모델을 생성하고 있습니다.\n\n⏱️ 최대 30초 소요될 수 있습니다.\n잠시만 기다려주세요!');
                    setShowPredictionModal(true);
                    
                    // 고객사 전체 굴뚝 데이터를 사용하여 예측 (데이터 충분성 확보)
                    const result = await predict({
                      customer_id: selectedCustomerId,
                      stack: stackList[0]?.name || 'dummy', // stack은 사용되지 않음 (고객사 전체 데이터 사용)
                      item_key: selectedItem.key,
                      periods: 30
                    });
                    
                    if (result) {
                      setAiPredictions(result.predictions);
                      
                      // 예측 결과 분석
                      const avgPrediction = result.predictions.reduce((sum: number, p: any) => sum + p.predicted_value, 0) / result.predictions.length;
                      const minPrediction = Math.min(...result.predictions.map((p: any) => p.predicted_value));
                      const maxPrediction = Math.max(...result.predictions.map((p: any) => p.predicted_value));
                      const historicalAvg = result.historical_avg || avgPrediction;
                      const diff = ((avgPrediction - historicalAvg) / historicalAvg) * 100;
                      
                      let interpretation = "";
                      if (Math.abs(diff) < 10) {
                        interpretation = "현재와 비슷한 수준이 유지될 것으로 보입니다.";
                      } else if (diff >= 10) {
                        interpretation = "최근 대비 상승 추세가 예상됩니다.";
                      } else {
                        interpretation = "최근 대비 하락 추세가 예상됩니다.";
                      }
                      
                      const message = `🤖 AI 예측 완료!\n\n📊 예측 결과 요약:\n향후 30일간 평균 ${avgPrediction.toFixed(2)} mg/S㎥ 수준이 예상됩니다.\n(변동 범위: ${minPrediction.toFixed(2)}~${maxPrediction.toFixed(2)} mg/S㎥)\n\n${interpretation}\n\n📈 아래 차트에서 초록색 예측선을 확인하세요!\n\n💡 본 예측 결과는 참고용으로만 활용하세요.\n\n────────────────────────\n학습 데이터: ${result.training_samples}건  |  예측 기간: 30일  |  분석 방법: AutoML`;
                      
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
                {isAutoMLRunning ? '예측 생성 중...' : 'AutoML 예측'}
              </Button>
              <Button
                variant="primary"
                onClick={async () => {
                  if (!selectedCustomerId || !selectedItem?.key) {
                    alert('고객사와 항목을 선택해주세요.');
                    return;
                  }
                  
                  // confirm으로 안내 및 확인
                  const confirmed = confirm(
                    '📊 인사이트 보고서 생성\n\n' +
                    '⚠️ 동일한 데이터에 대해 이미 생성된 보고서가 있다면\n' +
                    '   "보고서 메뉴 > 인사이트 보고서"에서 확인하세요.\n\n' +
                    '💡 신규 측정 데이터가 없으면 기존 보고서를 재사용합니다.\n' +
                    '⏱️ 예상 소요 시간: 약 30초\n\n' +
                    '계속 진행하시겠습니까?'
                  );
                  
                  if (!confirmed) return;
                  
                  setInsightLoading(true);
                  
                  try {
                    // 차트 이미지 캡처
                    let chartImage: string | null = null;
                    if (chartCanvasRef.current) {
                      try {
                        chartImage = chartCanvasRef.current.toDataURL('image/png').split(',')[1]; // Base64만 추출
                      } catch (err) {
                        console.warn('차트 이미지 캡처 실패:', err);
                      }
                    }
                    
                    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_AUTOML_API_URL || 'http://localhost:8000'}/api/predict/insight`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        customer_id: selectedCustomerId,
                        stack: stackList[0]?.name || 'dummy',
                        item_key: selectedItem.key,
                        item_name: selectedItem.name,
                        periods: 30,
                        chart_image: chartImage,
                        user_id: session?.user?.id
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
                    
                    // 로딩 종료
                    setInsightLoading(false);
                    
                    // PDF 자동 표시
                    if (true) {
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
                    setInsightLoading(false);
                    alert(`❌ 보고서 생성 실패\n\n${err.message}`);
                  }
                }}
                disabled={insightLoading}
                title="AI 기반 예측 인사이트 보고서를 생성합니다"
              >
                {insightLoading ? '보고서 생성 중...' : '인사이트 보고서'}
              </Button>
              <Button variant="secondary" onClick={onExportCSV}>엑셀 다운로드</Button>
              <Button variant="secondary" onClick={onPrintPDF}>그래프 PDF</Button>
            </div>
          </div>

          {chartData.data.length === 0 ? (
            <div className="rounded-lg border p-6 text-sm text-gray-500 bg-white/50 dark:bg-white/5">
              표시할 데이터가 없습니다. 기간과 항목을 조정해 보세요.
            </div>
          ) : (
            <PmmsTrendChart
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
