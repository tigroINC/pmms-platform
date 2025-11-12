"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";

type TempDataRow = {
  id: string;
  tempId: string;
  measuredAt: string;
  customer: string;
  stack: string;
  weather: string;
  temp: string;
  humidity: string;
  pressure: string;
  windDir: string;
  windSpeed: string;
  gasVel: string;
  gasTemp: string;
  moisture: string;
  o2Measured: string;
  o2Standard: string;
  flowRate: string;
  pollutant: string;
  value: number;
  limit: number | string;
  limitCheck: string;
  company: string;
  createdBy: string;
  createdAt: string;
};

export default function TempDataManagement() {
  const { user } = useAuth();
  const { selectedOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TempDataRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 검색 조건
  const [q, setQ] = useState("");
  const [fc, setFc] = useState("전체");
  const [fs, setFs] = useState("전체");
  const [showAuxOnly, setShowAuxOnly] = useState(false); // 채취환경만 있는 데이터 표시 여부
  const [start, setStart] = useState(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return oneMonthAgo.toISOString().split('T')[0];
  });
  const [end, setEnd] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const defaultDates = useMemo(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return {
      start: oneMonthAgo.toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    };
  }, []);

  const { list: customers } = useCustomers();
  const selectedCustomerId = useMemo(() => (fc === "전체" ? undefined : customers.find((c)=>c.name===fc)?.id), [fc, customers]);
  const { list: stacks } = useStacks(selectedCustomerId);

  // 선택된 항목
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedOrg?.id) params.append("organizationId", selectedOrg.id);
      if (start) params.append("startDate", `${start}T00:00:00`);
      if (end) params.append("endDate", `${end}T23:59:59`);
      if (selectedCustomerId) params.append("customerId", selectedCustomerId);
      if (fs !== "전체") {
        const stackId = stacks.find((s: any) => ((s.siteCode || s.name) === fs))?.id;
        if (stackId) params.append("stackId", stackId);
      }
      params.append("page", page.toString());
      params.append("limit", pageSize.toString());

      const url = `/api/measurements-temp?${params.toString()}`;
      console.log("[임시데이터] API 호출:", url);
      const res = await fetch(url);
      const json = await res.json();
      console.log("[임시데이터] API 응답:", json);

      if (res.ok) {
        const allData = json.data || [];
        
        // 1. 채취환경만 있는 데이터 필터링
        let filteredData = showAuxOnly 
          ? allData.filter((row: TempDataRow) => row.pollutant === "-")
          : allData.filter((row: TempDataRow) => row.pollutant !== "-");
        
        // 2. 검색어 필터링 (고객사, 굴뚝번호, 오염물질)
        if (q.trim()) {
          const searchLower = q.toLowerCase();
          filteredData = filteredData.filter((row: TempDataRow) => 
            row.customer.toLowerCase().includes(searchLower) ||
            row.stack.toLowerCase().includes(searchLower) ||
            row.pollutant.toLowerCase().includes(searchLower)
          );
        }
        
        setData(filteredData);
        setTotal(filteredData.length);
        console.log("[임시데이터] 로드 완료:", filteredData.length, "건 (전체:", allData.length, "건)");
      } else {
        console.error("데이터 조회 실패:", json.error);
        setData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error("데이터 조회 오류:", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, start, end, fc, fs, showAuxOnly, q]);

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((d) => d.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // 개별 선택
  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/measurements-temp/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchData();
      } else {
        const json = await res.json();
        alert(json.error || "삭제 실패");
      }
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  // 일괄 삭제
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}건을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch("/api/measurements-temp/batch-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      const json = await res.json();

      if (res.ok) {
        alert(json.message || "삭제되었습니다.");
        setSelectedIds(new Set());
        fetchData();
      } else {
        alert(json.error || "삭제 실패");
      }
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  // 확정 처리
  const handleConfirm = async () => {
    if (selectedIds.size === 0) {
      alert("확정할 항목을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedIds.size}건을 확정하시겠습니까?\n\n확정된 데이터는 측정 이력 및 대시보드에 반영됩니다.`)) return;

    setLoading(true);
    try {
      const res = await fetch("/api/measurements-temp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      const json = await res.json();
      console.log('[확정] 응답:', json);

      if (res.ok) {
        if (json.errors && json.errors.length > 0) {
          alert(json.message + "\n\n실패 내역:\n" + json.errors.join("\n"));
        } else {
          alert(json.message || "확정되었습니다.");
        }
        setSelectedIds(new Set());
        fetchData();
      } else {
        console.error('[확정] 실패:', json);
        alert(json.error || "확정 실패");
      }
    } catch (error: any) {
      alert(error.message || "확정 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Excel 다운로드
  const handleDownload = async () => {
    if (selectedIds.size === 0) {
      if (!confirm("전체 데이터를 다운로드하시겠습니까?")) return;
    }

    try {
      const res = await fetch("/api/measurements-temp/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const now = new Date();
        const filename = `임시측정데이터_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}.csv`;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const json = await res.json();
        alert(json.error || "다운로드 실패");
      }
    } catch (error: any) {
      alert(error.message || "다운로드 중 오류가 발생했습니다.");
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col" style={{ width: '200px', minWidth: '200px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색 (고객사/굴뚝번호/오염물질)</label>
            <Input 
              className="text-sm h-8"
              placeholder="검색어 입력"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">고객사</label>
            <Select className="text-sm h-8 w-full" value={fc} onChange={(e)=>{ setFc(e.target.value); setFs("전체"); setPage(1); }}>
              {["전체", ...customers.map(c=>c.name)].map((c)=> (<option key={c}>{c}</option>))}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">시작일</label>
            <Input 
              className="text-sm h-8"
              style={{ width: '144px', minWidth: '144px' }}
              type="date" 
              value={start} 
              onChange={(e)=>{ setStart(e.target.value); setPage(1); }} 
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
              onChange={(e)=>{ setEnd(e.target.value); setPage(1); }} 
            />
          </div>
          <div className="flex flex-col" style={{ width: '158px', minWidth: '158px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">한페이지당</label>
            <Select className="text-sm h-8 w-full" value={String(pageSize)} onChange={(e)=>{ const v=e.target.value; setPageSize(v==="ALL"?999999:Number(v)); setPage(1); }}>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
              <option value="ALL">전체</option>
            </Select>
          </div>
          <div className="flex items-center gap-2 ml-auto mb-1.5">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showAuxOnly} 
                onChange={(e) => setShowAuxOnly(e.target.checked)}
                className="accent-blue-500"
              />
              채취환경만 표시
              <span 
                className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-blue-500 rounded-full cursor-help"
                title="채취환경만 있는 데이터는 확정 시 제외됩니다.&#10;필요 시 체크하여 확인 후 삭제하세요."
              >
                ?
              </span>
            </label>
            <Button size="sm" variant="secondary" onClick={()=>{ setQ(""); setFc("전체"); setStart(defaultDates.start); setEnd(defaultDates.end); setShowAuxOnly(false); setPage(1); }}>초기화</Button>
            <Button size="sm" onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? "처리중..." : "확정"}
            </Button>
            <Button size="sm" onClick={handleDownload} className="bg-green-600 hover:bg-green-700">Excel</Button>
            <Button size="sm" variant="secondary" onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700 text-white">삭제</Button>
          </div>
        </div>
      </div>

      {/* Desktop Table - hidden on mobile */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        {data.length === 0 && !loading ? (
          <div className="p-6 text-sm text-gray-500">조건에 맞는 데이터가 없습니다.</div>
        ) : (
          <Table className="min-w-[1200px]">
            <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th className="bg-gray-50 dark:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="accent-blue-500"
                  />
                </Th>
                <Th className="bg-gray-50 dark:bg-gray-800">임시ID</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">측정일자</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">고객사</Th>
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
                <Th className="bg-gray-50 dark:bg-gray-800">농도</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출허용기준농도</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출허용기준체크</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">측정업체</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">입력자</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={24} className="text-center py-8 text-gray-500">
                    로딩 중...
                  </Td>
                </Tr>
              ) : (
                data.map((row: any, idx: number) => (
                  <Tr key={`${row.tempId}_${row.pollutant}_${idx}`}>
                    <Td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={(e) => handleSelect(row.id, e.target.checked)}
                        className="accent-blue-500"
                      />
                    </Td>
                    <Td className="font-mono text-xs" style={{ maxWidth: '100px' }}>
                      <div className="break-words">{row.tempId}</div>
                    </Td>
                    <Td style={{ maxWidth: '90px' }}>
                      <div className="text-xs break-words">{row.measuredAt}</div>
                    </Td>
                    <Td>{row.customer}</Td>
                    <Td>{row.stack}</Td>
                    <Td>{row.weather}</Td>
                    <Td>{row.temp}</Td>
                    <Td>{row.humidity}</Td>
                    <Td>{row.pressure}</Td>
                    <Td>{row.windDir}</Td>
                    <Td>{row.windSpeed}</Td>
                    <Td>{row.gasVel}</Td>
                    <Td>{row.gasTemp}</Td>
                    <Td>{row.moisture}</Td>
                    <Td>{row.o2Measured}</Td>
                    <Td>{row.o2Standard}</Td>
                    <Td>{row.flowRate}</Td>
                    <Td>{row.pollutant}</Td>
                    <Td>{row.value}</Td>
                    <Td>{row.limit ?? ""}</Td>
                    <Td>{row.limitCheck}</Td>
                    <Td>{row.company}</Td>
                    <Td>{row.createdBy}</Td>
                    <Td>
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        삭제
                      </button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        )}
        <div className="p-3 flex items-center justify-between text-xs text-gray-500">
          <div>총 {total}건 · {page}/{totalPages} 페이지</div>
          <div className="flex gap-2 items-center">
            <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1}>이전</Button>
            <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}>다음</Button>
          </div>
        </div>
      </div>

      {/* Mobile Card View - visible only on mobile */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            로딩 중...
          </div>
        ) : data.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            조건에 맞는 데이터가 없습니다.
          </div>
        ) : (
          <>
            {data.map((row: any, idx: number) => (
              <div key={`${row.tempId}_${row.pollutant}_${idx}`} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
                <div className="flex items-start justify-between mb-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={(e) => handleSelect(row.id, e.target.checked)}
                    className="accent-blue-500 mt-1"
                  />
                  <button
                    onClick={() => handleDelete(row.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    삭제
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">📍 고객사:</span> {row.customer}</div>
                  <div><span className="text-gray-500">🏭 굴뚝:</span> {row.stack}</div>
                  <div className="col-span-2"><span className="text-gray-500">📅 측정일:</span> {row.measuredAt}</div>
                  <div><span className="text-gray-500">🧪 오염물질:</span> {row.pollutant}</div>
                  <div><span className="text-gray-500">📊 농도:</span> {row.value}</div>
                  <div><span className="text-gray-500">⚠️ 기준:</span> {row.limit ?? "-"}</div>
                  <div><span className="text-gray-500">✅ 체크:</span> {row.limitCheck}</div>
                  <div><span className="text-gray-500">🌤️ 기상:</span> {row.weather || "-"}</div>
                  <div><span className="text-gray-500">🌡️ 기온:</span> {row.temp || "-"}℃</div>
                  <div><span className="text-gray-500">💧 습도:</span> {row.humidity || "-"}%</div>
                  <div><span className="text-gray-500">🎚️ 기압:</span> {row.pressure || "-"}mmHg</div>
                  <div><span className="text-gray-500">🧭 풍향:</span> {row.windDir || "-"}</div>
                  <div><span className="text-gray-500">💨 풍속:</span> {row.windSpeed || "-"}m/s</div>
                  <div><span className="text-gray-500">🔥 가스온도:</span> {row.gasTemp || "-"}℃</div>
                  <div><span className="text-gray-500">💨 가스속도:</span> {row.gasVel || "-"}m/s</div>
                  <div><span className="text-gray-500">💧 수분:</span> {row.moisture || "-"}%</div>
                  <div><span className="text-gray-500">🫧 실측O₂:</span> {row.o2Measured || "-"}%</div>
                  <div><span className="text-gray-500">🫧 표준O₂:</span> {row.o2Standard || "-"}%</div>
                  <div><span className="text-gray-500">🌊 유량:</span> {row.flowRate || "-"}S㎥/min</div>
                  <div><span className="text-gray-500">🏢 업체:</span> {row.company}</div>
                  <div><span className="text-gray-500">👤 입력자:</span> {row.createdBy}</div>
                  <div className="col-span-2 text-xs text-gray-400 font-mono break-all">ID: {row.tempId}</div>
                </div>
              </div>
            ))}
            <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-3 flex items-center justify-between text-xs text-gray-500">
              <div>총 {total}건 · {page}/{totalPages} 페이지</div>
              <div className="flex gap-2 items-center">
                <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1}>이전</Button>
                <Button variant="secondary" size="sm" onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages}>다음</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
