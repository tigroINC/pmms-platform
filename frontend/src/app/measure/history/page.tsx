"use client";
import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { sortBy } from "@/utils/table";
import { useMeasurementHistory, useMeasurementItems } from "@/hooks/useMeasurements";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";
import { useOrganization } from "@/contexts/OrganizationContext";
import MeasurementEditModal from "@/components/modals/MeasurementEditModal";
import { useSession } from "next-auth/react";

type Row = any;

export default function MeasureHistoryPage() {
  const { selectedOrg, loading: orgLoading } = useOrganization();
  const { list: customerList } = useCustomers();
  const { items: itemList } = useMeasurementItems();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const isCustomerUser = userRole === "CUSTOMER_ADMIN" || userRole === "CUSTOMER_USER";
  // 기본 조회 기간 계산 함수: 6개월 vs 올해 1월 1일 중 더 긴 기간
  const getDefaultDates = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    const thisYearStart = new Date(today.getFullYear(), 0, 1); // 올해 1월 1일
    
    // 두 날짜 중 더 이른 날짜 선택 (더 긴 기간)
    const startDate = sixMonthsAgo < thisYearStart ? sixMonthsAgo : thisYearStart;
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  };
  
  const defaultDates = useMemo(() => getDefaultDates(), []);
  
  const [q, setQ] = useState("");
  const [fc, setFc] = useState("선택");
  const [fs, setFs] = useState("전체");
  const [fi, setFi] = useState("전체");
  const [start, setStart] = useState(defaultDates.start);
  const [end, setEnd] = useState(defaultDates.end);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [sortKey, setSortKey] = useState<"measuredAt" | "customer" | "stack" | "value">("measuredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);
  
  // 고객사 사용자의 환경측정기업 목록 및 선택
  const [customerOrganizations, setCustomerOrganizations] = useState<any[]>([]);
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>("전체");
  
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

  const selectedCustomerId = useMemo(() => {
    if (fc === "선택") return null; // "선택" 상태에서는 데이터 로딩 안 함
    if (fc === "전체") return undefined; // "전체" 선택 시 모든 고객사 데이터 로딩
    return customerList.find((c)=>c.name===fc)?.id;
  }, [fc, customerList]);
  const { list: stackList } = useStacks(selectedCustomerId);

  const selectedStacks = useMemo(() => (fs === "전체" ? undefined : fs), [fs]);
  const selectedItemKey = useMemo(() => (fi === "전체" ? undefined : (itemList.find((it)=>it.name===fi)?.key || fi)), [fi, itemList]);

  // Load main measurements according to filters
  const { data: mainData, mutate } = useMeasurementHistory({
    customerId: selectedCustomerId,
    stack: selectedStacks,
    itemKey: selectedItemKey,
    start: start || undefined,
    end: end || undefined,
    sort: { key: "measuredAt", dir: "asc" },
    page: 1,
    pageSize: 999999, // fetch all then client paginate
  });

  // auxMap 제거: 모든 기상 데이터는 이미 오염물질 행의 컬럼에 있음

  // Build rows in upload-template-like columns
  const rows = useMemo(() => {
    console.log("[MeasureHistory] Building rows - mainData:", mainData);
    if (!Array.isArray(mainData)) return [];
    
    // 1단계: 동일 시간대의 기상 데이터를 매핑
    const weatherByTime = new Map<string, any>();
    (mainData as any[]).forEach((r) => {
      const d = r.measuredAt ? new Date(r.measuredAt) : null;
      const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
      const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
      const key = `${stackKey}|${minuteEpoch}`;
      
      // 기상 데이터가 있는 행을 찾아서 저장
      if (r.weather || r.temperatureC !== null || r.humidityPct !== null) {
        if (!weatherByTime.has(key)) {
          weatherByTime.set(key, {
            weather: r.weather,
            temperatureC: r.temperatureC,
            humidityPct: r.humidityPct,
            pressureMmHg: r.pressureMmHg,
            windDirection: r.windDirection,
            windSpeedMs: r.windSpeedMs,
            gasVelocityMs: r.gasVelocityMs,
            gasTempC: r.gasTempC,
            moisturePct: r.moisturePct,
            oxygenMeasuredPct: r.oxygenMeasuredPct,
            oxygenStdPct: r.oxygenStdPct,
            flowSm3Min: r.flowSm3Min,
          });
        }
      }
    });
    
    // 2단계: 각 행에 기상 데이터 적용
    const arr = (mainData as any[]).map((r) => {
      const d = r.measuredAt ? new Date(r.measuredAt) : null;
      const minuteEpoch = d ? Math.floor(d.getTime() / 60000) : r.measuredAt;
      const stackKey = r.stack?.id || r.stackId || r.stack?.name || '';
      const key = `${stackKey}|${minuteEpoch}`;
      const itemName = r.item?.name || r.itemName || r.itemKey;
      const limit = r.item?.limit;
      
      // 기상 데이터: 1) row의 컬럼, 2) 동일 시간대 다른 행 순서로 확인
      const weatherData = weatherByTime.get(key) || {};
      const getWeatherValue = (colName: string) => {
        // 1순위: 현재 행의 값
        const colValue = r[colName];
        if (colValue !== null && colValue !== undefined) return colValue;
        // 2순위: 동일 시간대 다른 행의 값
        const weatherValue = weatherData[colName];
        if (weatherValue !== null && weatherValue !== undefined) return weatherValue;
        return "";
      };
      
      return {
        // 원본 데이터 보존 (수정 기능을 위해 필수)
        id: r.id,
        customerId: r.customerId,
        stackId: r.stackId,
        itemKey: r.itemKey,
        isActive: r.isActive,
        originalData: r, // 전체 원본 데이터 보존
        // 표시용 데이터
        measuredAt: d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` : "",
        customer: r.customer?.name ?? "",
        stack: r.stack?.name ?? r.stack ?? "",
        weather: getWeatherValue("weather"),
        temp: getWeatherValue("temperatureC"),
        humidity: getWeatherValue("humidityPct"),
        pressure: getWeatherValue("pressureMmHg"),
        windDir: getWeatherValue("windDirection"),
        windSpeed: getWeatherValue("windSpeedMs"),
        gasVel: getWeatherValue("gasVelocityMs"),
        gasTemp: getWeatherValue("gasTempC"),
        moisture: getWeatherValue("moisturePct"),
        o2Measured: getWeatherValue("oxygenMeasuredPct"),
        o2Standard: getWeatherValue("oxygenStdPct"),
        flowRate: getWeatherValue("flowSm3Min"),
        pollutant: itemName,
        value: r.value,
        limit,
        limitCheck: limit && r.value > limit ? "초과" : "적합",
        company: r.customer?.organizations?.[0]?.organization?.name || r.organization?.name || r.company || "",
      };
    });
    console.log("[MeasureHistory] Built rows:", arr.length);
    return arr;
  }, [mainData]);

  const filtered = useMemo(() => {
    console.log("[MeasureHistory] Filtering - rows:", rows.length, "rows sample:", rows[0], "fc:", fc, "fs:", fs, "fi:", fi);
    let arr = rows.filter((r: any) => {
      // 활성/비활성 필터
      const matchesActive = showInactive ? true : r.isActive !== false;
      if (!matchesActive) return false;
      
      // 고객사 사용자: 환경측정기업 필터
      if (isCustomerUser && selectedOrgFilter !== "전체") {
        const orgName = customerOrganizations.find(org => org.id === selectedOrgFilter)?.name;
        if (orgName && r.company !== orgName) return false;
      }
      
      if (fc !== "전체" && fc !== "선택" && r.customer !== fc) return false;
      if (fs !== "전체" && r.stack !== fs) return false;
      if (fi !== "전체" && r.pollutant !== fi) return false;
      // 날짜 비교: measuredAt은 "YYYY-MM-DD HH:MM" 형식, start/end는 "YYYY-MM-DD" 형식
      if (start && r.measuredAt && r.measuredAt.substring(0, 10) < start) return false;
      if (end && r.measuredAt && r.measuredAt.substring(0, 10) > end) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          r.customer?.toLowerCase().includes(s) ||
          r.stack?.toLowerCase().includes(s) ||
          r.pollutant?.toLowerCase().includes(s)
        );
      }
      return true;
    });
    console.log("[MeasureHistory] Filtered result:", arr.length, "sample:", arr[0]);
    return arr;
  }, [rows, q, fc, fs, fi, start, end, showInactive, isCustomerUser, selectedOrgFilter, customerOrganizations]);

  const sorted = useMemo(() => {
    console.log("[MeasureHistory] Sorting - filtered sample:", filtered[0], "sortKey:", sortKey, "sortDir:", sortDir);
    const result = sortBy(filtered, sortKey, sortDir);
    console.log("[MeasureHistory] Sorted result length:", result.length);
    return result;
  }, [filtered, sortKey, sortDir]);
  const total = sorted.length;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, totalPages || 1);
  const paged = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  console.log("[MeasureHistory] Pagination - sorted:", sorted.length, "paged:", paged.length, "page:", currentPage, "pageSize:", pageSize);

  const onExport = () => {
    const header = ["측정일자", "고객사", "굴뚝번호", "기상", "기온℃", "습도％", "기압mmHg", "풍향", "풍속m/sec", "가스속도m/s", "가스온도℃", "수분함량％", "실측산소농도％", "표준산소농도％", "배출가스유량S㎥/min", "오염물질", "농도", "배출허용기준농도", "배출허용기준체크", "측정업체"];
    const body = sorted.map((r: any) => [
      r.measuredAt, r.customer, r.stack, r.weather, r.temp, r.humidity, r.pressure, r.windDir, r.windSpeed, r.gasVel, r.gasTemp, r.moisture, r.o2Measured, r.o2Standard, r.flowRate, r.pollutant, r.value, r.limit ?? "", r.limitCheck, r.company
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `측정이력_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (measurement: any) => {
    setEditingMeasurement(measurement.originalData || measurement);
    setEditModalOpen(true);
  };

  const toggleActive = async (measurement: any) => {
    try {
      const res = await fetch(`/api/measurements/${measurement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !measurement.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "상태 변경 실패");
      }
      mutate();
    } catch (err: any) {
      alert(err.message || "상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (measurement: any) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/measurements/${measurement.id}`, { method: "DELETE" });
      if (res.ok) {
        alert("삭제되었습니다.");
        mutate();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (err) {
      alert("오류 발생");
    }
  };

  const handleModalClose = () => {
    setEditModalOpen(false);
    setEditingMeasurement(null);
    mutate();
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
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">측정 이력</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          {isCustomerUser && (
            <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">환경측정기업</label>
              <Select className="text-sm h-8 w-full" value={selectedOrgFilter} onChange={(e)=>{ setSelectedOrgFilter((e.target as HTMLSelectElement).value); setPage(1); }}>
                <option value="전체">통합 데이터 (전체)</option>
                {customerOrganizations.map((org)=> (
                  <option key={org.id} value={org.id}>{org.nickname || org.name}</option>
                ))}
              </Select>
            </div>
          )}
          {!isCustomerUser && (
            <div className="flex flex-col">
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
              <Input 
                className="text-sm h-8"
                style={{ width: '176px', minWidth: '176px' }}
                value={q} 
                onChange={(e)=>{ setQ((e.target as HTMLInputElement).value); setPage(1); }} 
                placeholder="굴뚝/오염물질" 
              />
            </div>
          )}
          {!isCustomerUser && (
            <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">고객사</label>
              <Select className="text-sm h-8 w-full" value={fc} onChange={(e)=>{ setFc((e.target as HTMLSelectElement).value); setFs("전체"); setPage(1); }}>
                {["선택", "전체", ...customerList.map(c=>c.name)].map((c)=> (<option key={c}>{c}</option>))}
              </Select>
            </div>
          )}
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">굴뚝명</label>
            <Select className="text-sm h-8 w-full" value={fs} onChange={(e)=>{ setFs((e.target as HTMLSelectElement).value); setPage(1); }}>
              {["전체", ...(selectedCustomerId ? stackList.map(s=>s.name) : Array.from(new Set(rows.map((r:any)=>r.stack))))].map((s)=> (<option key={s}>{s}</option>))}
            </Select>
          </div>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">오염물질</label>
            <Select className="text-sm h-8 w-full" value={fi} onChange={(e)=>{ setFi((e.target as HTMLSelectElement).value); setPage(1); }}>
              {["전체", ...itemList.map(i=>i.name)].map((n)=> (<option key={n}>{n}</option>))}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">시작일</label>
            <Input 
              className="text-sm h-8"
              style={{ width: '144px', minWidth: '144px' }}
              type="date" 
              value={start} 
              onChange={(e)=>{ setStart((e.target as HTMLInputElement).value); setPage(1); }} 
            />
          </div>
          <span className="text-xs text-gray-500 mb-1.5">~</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">종료일</label>
            <Input 
              className="text-sm h-8"
              style={{ width: '144px', minWidth: '144px' }}
              type="date" 
              value={end} 
              onChange={(e)=>{ setEnd((e.target as HTMLInputElement).value); setPage(1); }} 
            />
          </div>
          <div className="flex flex-col" style={{ width: '158px', minWidth: '158px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">한페이지당</label>
            <Select className="text-sm h-8 w-full" value={String(pageSize)} onChange={(e)=>{ setPageSize(Number((e.target as HTMLSelectElement).value)); setPage(1); }}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </Select>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer mb-1.5 whitespace-nowrap ml-auto">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            비활성 표시
          </label>
          <div className="flex gap-1.5 mb-1.5">
            <Button size="sm" variant="secondary" onClick={()=>{ setQ(""); setFc("전체"); setFs("전체"); setFi("전체"); setStart(defaultDates.start); setEnd(defaultDates.end); setPage(1); }}>초기화</Button>
            <Button size="sm" onClick={onExport}>Excel</Button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        {paged.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">조건에 맞는 데이터가 없습니다.</div>
        ) : (
          <Table className="min-w-[1200px]">
            <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th className="bg-gray-50 dark:bg-gray-800">상태</Th>
                <Th onClick={()=>{ setSortKey("measuredAt"); setSortDir(d=> sortKey==="measuredAt" ? (d==="asc"?"desc":"asc") : "desc"); }} className="cursor-pointer bg-gray-50 dark:bg-gray-800">측정일자 {sortKey==="measuredAt"? (sortDir==="asc"?"▲":"▼"):""}</Th>
                {!isCustomerUser && <Th className="bg-gray-50 dark:bg-gray-800">고객사</Th>}
                <Th className="bg-gray-50 dark:bg-gray-800">굴뚝번호</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">기상</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">기온℃</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">습도％</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">기압mmHg</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">풍향</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">풍속m／sec</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">가스속도m／s</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">가스온도℃</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">수분함량％</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">실측산소농도％</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">표준산소농도％</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출가스유량S㎥／min</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">오염물질</Th>
                <Th onClick={()=>{ setSortKey("value"); setSortDir(d=> sortKey==="value" ? (d==="asc"?"desc":"asc") : "desc"); }} className="cursor-pointer bg-gray-50 dark:bg-gray-800">농도 {sortKey==="value"? (sortDir==="asc"?"▲":"▼"):""}</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출허용기준농도</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출허용기준체크</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">측정업체</Th>
                {!isCustomerUser && <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {paged.map((r: any, idx: number) => {
                const isActive = r.isActive !== false;
                return (
                  <Tr key={`${r.stack}_${r.measuredAt}_${idx}`} className={!isActive ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""}>
                    <Td>
                      {isActive ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
                          활성
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs">
                          비활성
                        </span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap">{r.measuredAt}</Td>
                    {!isCustomerUser && <Td>{r.customer}</Td>}
                    <Td>{r.stack}</Td>
                    <Td>{r.weather}</Td>
                    <Td>{r.temp}</Td>
                    <Td>{r.humidity}</Td>
                    <Td>{r.pressure}</Td>
                    <Td>{r.windDir}</Td>
                    <Td>{r.windSpeed}</Td>
                    <Td>{r.gasVel}</Td>
                    <Td>{r.gasTemp}</Td>
                    <Td>{r.moisture}</Td>
                    <Td>{r.o2Measured}</Td>
                    <Td>{r.o2Standard}</Td>
                    <Td>{r.flowRate}</Td>
                    <Td>{r.pollutant}</Td>
                    <Td>{r.value}</Td>
                    <Td>{r.limit ?? ""}</Td>
                    <Td>{r.limitCheck}</Td>
                    <Td>{r.company}</Td>
                    {!isCustomerUser && (
                      <Td>
                        <div className="flex gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(r)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => toggleActive(r)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {isActive ? "비활성화" : "활성화"}
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => handleDelete(r)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </Td>
                    )}
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
        <div className="p-3 flex items-center justify-between text-xs text-gray-500">
          <div>총 {total}건 · {currentPage}/{totalPages} 페이지</div>
          <div className="flex gap-2 items-center">
            <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={currentPage===1}>이전</Button>
            <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}>다음</Button>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paged.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            조건에 맞는 데이터가 없습니다.
          </div>
        ) : (
          <>
            {paged.map((r: any, idx: number) => {
              const isActive = r.isActive !== false;
              return (
                <div key={`${r.stack}_${r.measuredAt}_${idx}`} className={`rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2 ${!isActive ? "opacity-50" : ""}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {isActive ? "활성" : "비활성"}
                    </span>
                    {!isCustomerUser && (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(r)} className="text-xs text-green-600 hover:underline">수정</button>
                        <button onClick={() => toggleActive(r)} className="text-xs text-blue-600 hover:underline">
                          {isActive ? "비활성화" : "활성화"}
                        </button>
                        {!isActive && (
                          <button onClick={() => handleDelete(r)} className="text-xs text-red-600 hover:underline">삭제</button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="col-span-2"><span className="text-gray-500">📅 측정일:</span> {r.measuredAt}</div>
                    {!isCustomerUser && <div><span className="text-gray-500">📍 고객사:</span> {r.customer}</div>}
                    <div><span className="text-gray-500">🏭 굴뚝:</span> {r.stack}</div>
                    <div><span className="text-gray-500">🧪 오염물질:</span> {r.pollutant}</div>
                    <div><span className="text-gray-500">📊 농도:</span> {r.value}</div>
                    <div><span className="text-gray-500">⚠️ 기준:</span> {r.limit ?? "-"}</div>
                    <div><span className="text-gray-500">✅ 체크:</span> {r.limitCheck}</div>
                    <div><span className="text-gray-500">🌤️ 기상:</span> {r.weather || "-"}</div>
                    <div><span className="text-gray-500">🌡️ 기온:</span> {r.temp || "-"}℃</div>
                    <div><span className="text-gray-500">💧 습도:</span> {r.humidity || "-"}%</div>
                    <div><span className="text-gray-500">🎚️ 기압:</span> {r.pressure || "-"}mmHg</div>
                    <div><span className="text-gray-500">🧭 풍향:</span> {r.windDir || "-"}</div>
                    <div><span className="text-gray-500">💨 풍속:</span> {r.windSpeed || "-"}m/s</div>
                    <div><span className="text-gray-500">🔥 가스온도:</span> {r.gasTemp || "-"}℃</div>
                    <div><span className="text-gray-500">💨 가스속도:</span> {r.gasVel || "-"}m/s</div>
                    <div><span className="text-gray-500">💧 수분:</span> {r.moisture || "-"}%</div>
                    <div><span className="text-gray-500">🫧 실측O₂:</span> {r.o2Measured || "-"}%</div>
                    <div><span className="text-gray-500">🫧 표준O₂:</span> {r.o2Standard || "-"}%</div>
                    <div><span className="text-gray-500">🌊 유량:</span> {r.flowRate || "-"}S㎥/min</div>
                    <div><span className="text-gray-500">🏢 업체:</span> {r.company}</div>
                  </div>
                </div>
              );
            })}
            <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-3 flex items-center justify-between text-xs text-gray-500">
              <div>총 {total}건 · {currentPage}/{totalPages} 페이지</div>
              <div className="flex gap-2 items-center">
                <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={currentPage===1}>이전</Button>
                <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={currentPage===totalPages}>다음</Button>
              </div>
            </div>
          </>
        )}
      </div>

      <MeasurementEditModal
        isOpen={editModalOpen}
        onClose={handleModalClose}
        measurement={editingMeasurement}
        onSuccess={mutate}
      />
    </section>
  );
}
