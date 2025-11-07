"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";
import { useMeasurementItems } from "@/hooks/useMeasurements";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import LimitFormModal from "@/components/modals/LimitFormModal";
import LimitsHelpModal from "@/components/modals/LimitsHelpModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";

interface EmissionLimit {
  id: string;
  itemKey: string;
  limit: number;
  region: string | null;
  customerId: string | null;
  stackId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function LimitsPage() {
  const { user } = useAuth();
  const role = user?.role;
  const { list: customers } = useCustomers();
  const { items } = useMeasurementItems();
  
  const [limits, setLimits] = useState<EmissionLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterScope, setFilterScope] = useState<"all" | "global" | "customer" | "stack">("all");
  const [showInactive, setShowInactive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<any>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  const { list: stacks } = useStacks();

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/limits");
      const json = await res.json();
      setLimits(Array.isArray(json.data) ? json.data : []);
    } catch (error) {
      console.error("Failed to fetch limits:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (itemKey: string) => {
    const item = items.find((i: any) => i.key === itemKey);
    return item ? item.name : itemKey;
  };

  const getItemUnit = (itemKey: string) => {
    const item = items.find((i: any) => i.key === itemKey);
    return item ? item.unit : "-";
  };

  const getItemCategory = (itemKey: string) => {
    const item = items.find((i: any) => i.key === itemKey);
    return item ? item.category : "";
  };

  const getItemOrder = (itemKey: string) => {
    const item = items.find((i: any) => i.key === itemKey);
    return item ? (item.order ?? 0) : 0;
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return "전체";
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.name : customerId;
  };

  const getStackName = (stackId: string | null) => {
    if (!stackId) return "-";
    const stack = stacks.find((s) => s.id === stackId);
    return stack ? stack.name : stackId;
  };

  const getScope = (limit: EmissionLimit) => {
    if (limit.stackId) return "굴뚝별";
    if (limit.customerId) return "고객사별";
    return "전체";
  };

  // 실제 EmissionLimit 데이터만 사용
  const mergedLimits = useMemo(() => {
    return limits;
  }, [limits]);

  const filtered = useMemo(() => {
    const filteredItems = mergedLimits.filter((limit) => {
      // 활성/비활성 필터
      const matchesActive = showInactive ? true : limit.isActive !== false;
      
      // 범위 필터
      let matchesScope = true;
      if (filterScope === "global") matchesScope = !limit.customerId && !limit.stackId;
      else if (filterScope === "customer") matchesScope = !!limit.customerId && !limit.stackId;
      else if (filterScope === "stack") matchesScope = !!limit.stackId;
      
      // 검색 필터
      if (!search) return matchesActive && matchesScope;
      
      const searchLower = search.toLowerCase();
      const matchesSearch =
        getItemName(limit.itemKey).toLowerCase().includes(searchLower) ||
        limit.itemKey.toLowerCase().includes(searchLower) ||
        getCustomerName(limit.customerId).toLowerCase().includes(searchLower) ||
        getStackName(limit.stackId).toLowerCase().includes(searchLower);
      
      return matchesActive && matchesScope && matchesSearch;
    });

    // 측정항목과 동일한 정렬 기준 적용
    const sortByOrder = (a: any, b: any) => {
      const aOrder = getItemOrder(a.itemKey);
      const bOrder = getItemOrder(b.itemKey);
      if (aOrder === 0 && bOrder !== 0) return 1;
      if (aOrder !== 0 && bOrder === 0) return -1;
      if (aOrder === bOrder) return getItemName(a.itemKey).localeCompare(getItemName(b.itemKey));
      return aOrder - bOrder;
    };

    // 오염물질과 채취환경 분리
    const pollutants = filteredItems.filter(limit => getItemCategory(limit.itemKey) === "오염물질");
    const auxiliary = filteredItems.filter(limit => getItemCategory(limit.itemKey) === "채취환경");
    const others = filteredItems.filter(limit => {
      const cat = getItemCategory(limit.itemKey);
      return cat !== "오염물질" && cat !== "채취환경";
    });
    
    // 각각 정렬
    pollutants.sort(sortByOrder);
    auxiliary.sort(sortByOrder);
    others.sort(sortByOrder);
    
    // 오염물질 → 채취환경 → 기타 순서
    return [...pollutants, ...auxiliary, ...others];
  }, [mergedLimits, search, filterScope, showInactive, items]);

  const handleEdit = (limit: EmissionLimit) => {
    setEditingLimit(limit);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLimit(null);
  };

  const toggleActive = async (limit: EmissionLimit) => {
    try {
      const res = await fetch(`/api/limits/${limit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !limit.isActive }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "상태 변경 실패");
      }
      fetchLimits();
    } catch (err: any) {
      alert(err.message || "상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (limit: EmissionLimit) => {
    if (!confirm(`${getItemName(limit.itemKey)} 기준을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/limits?id=${limit.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "삭제 실패");
      }
      alert("삭제되었습니다.");
      fetchLimits();
    } catch (err: any) {
      alert(err.message || "삭제 중 오류가 발생했습니다.");
    }
  };



  const handleExport = () => {
    const header = ["범위", "고객사", "굴뚝", "구분", "항목코드", "항목명", "단위", "설정기준", "지역구분"];
    const rows = filtered.map((limit) => [
      getScope(limit),
      getCustomerName(limit.customerId),
      getStackName(limit.stackId),
      getItemCategory(limit.itemKey) || "-",
      limit.itemKey,
      getItemName(limit.itemKey),
      getItemUnit(limit.itemKey),
      limit.limit,
      limit.region || "-",
    ]);
    const csv = [header, ...rows]
      .map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `배출허용기준_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const text = await file.text();
      const res = await fetch("/api/limits/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        fetchLimits();
        return {
          success: true,
          message: data.message || "업로드 성공",
          count: data.count,
        };
      } else {
        return {
          success: false,
          message: data.error || "업로드 실패",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "업로드 중 오류가 발생했습니다.",
      };
    }
  };

  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">배출허용기준 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <Input
              className="text-sm h-8"
              style={{ width: '352px', minWidth: '352px' }}
              value={search}
              onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
              placeholder="항목명, 항목코드, 고객사, 굴뚝 등"
            />
          </div>
          <div className="flex gap-1.5 mb-1.5">
            <button
              onClick={() => setFilterScope("all")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filterScope === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              모두보기
            </button>
            <button
              onClick={() => setFilterScope("global")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filterScope === "global"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              공통기준
            </button>
            <button
              onClick={() => setFilterScope("customer")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filterScope === "customer"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              고객사별
            </button>
            <button
              onClick={() => setFilterScope("stack")}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                filterScope === "stack"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              굴뚝별
            </button>
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
            <Button size="sm" variant="secondary" onClick={() => setShowHelpModal(true)}>❓ 도움말</Button>
            {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
              <>
                <Button size="sm" variant="secondary" onClick={handleExport}>Excel</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkUploadModal(true)}>일괄업로드</Button>
                <Button size="sm" onClick={() => { setEditingLimit(null); setIsModalOpen(true); }}>+ 신규 추가</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="min-w-[1200px]">
          <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
            <Tr>
              <Th className="bg-gray-50 dark:bg-gray-800">상태</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">범위</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">고객사</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">굴뚝</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">구분</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목코드</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">항목명</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">단위</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">설정기준</Th>
              <Th className="bg-gray-50 dark:bg-gray-800">지역구분</Th>
              {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>}
            </Tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={(role === "SUPER_ADMIN" || role === "ORG_ADMIN") ? 11 : 10} className="text-center text-gray-500 py-8">
                  설정된 배출허용기준이 없습니다
                </Td>
              </Tr>
            ) : (
              filtered.map((limit) => {
                const isActive = limit.isActive !== false;
                return (
                  <Tr key={limit.id} className={!isActive ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""}>
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
                    <Td>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          limit.stackId
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                            : limit.customerId
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {getScope(limit)}
                      </span>
                    </Td>
                    <Td>{getCustomerName(limit.customerId)}</Td>
                    <Td>{getStackName(limit.stackId)}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded text-xs ${
                        getItemCategory(limit.itemKey) === "오염물질"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                          : getItemCategory(limit.itemKey) === "채취환경"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                      }`}>
                        {getItemCategory(limit.itemKey) || "-"}
                      </span>
                    </Td>
                    <Td className="font-mono text-xs">{limit.itemKey}</Td>
                    <Td className="font-medium">
                      {getItemName(limit.itemKey)}
                      {(limit as any).isDefault && (
                        <span className="ml-2 inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
                          기본값
                        </span>
                      )}
                    </Td>
                    <Td className="text-center">{getItemUnit(limit.itemKey)}</Td>
                    <Td className="font-semibold">{limit.limit}</Td>
                    <Td className="text-sm">{limit.region || "-"}</Td>
                    {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                      <Td>
                        <div className="flex gap-2 whitespace-nowrap">
                          <button
                            onClick={() => handleEdit(limit)}
                            className="text-xs text-green-600 hover:underline"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => toggleActive(limit)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {isActive ? "비활성화" : "활성화"}
                          </button>
                          {!isActive && (
                            <button
                              onClick={() => handleDelete(limit)}
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
              })
            )}
          </Tbody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            설정된 배출허용기준이 없습니다
          </div>
        ) : (
          filtered.map((limit) => {
            const isActive = limit.isActive !== false;
            return (
              <div key={limit.id} className={`rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2 ${!isActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                      {isActive ? "활성" : "비활성"}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      limit.stackId ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" :
                      limit.customerId ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {getScope(limit)}
                    </span>
                  </div>
                  {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(limit)} className="text-xs text-blue-600 hover:underline">수정</button>
                      <button onClick={() => toggleActive(limit)} className="text-xs text-blue-600 hover:underline">
                        {isActive ? "비활성화" : "활성화"}
                      </button>
                      {!isActive && (
                        <button onClick={() => handleDelete(limit)} className="text-xs text-gray-600 hover:underline">삭제</button>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">📍 고객사:</span> {getCustomerName(limit.customerId)}</div>
                  <div><span className="text-gray-500">🏭 굴뚝:</span> {getStackName(limit.stackId)}</div>
                  <div>
                    <span className="text-gray-500">🏷️ 구분:</span>{" "}
                    <span className={`px-2 py-1 rounded text-xs ${
                      getItemCategory(limit.itemKey) === "오염물질" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                      getItemCategory(limit.itemKey) === "채취환경" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {getItemCategory(limit.itemKey) || "-"}
                    </span>
                  </div>
                  <div><span className="text-gray-500">📋 코드:</span> {limit.itemKey}</div>
                  <div className="col-span-2">
                    <span className="text-gray-500">📝 항목:</span> {getItemName(limit.itemKey)}
                    {(limit as any).isDefault && (
                      <span className="ml-2 inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">기본값</span>
                    )}
                  </div>
                  <div><span className="text-gray-500">📏 단위:</span> {getItemUnit(limit.itemKey)}</div>
                  <div><span className="text-gray-500">⚠️ 기준:</span> <span className="font-semibold">{limit.limit}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">🗺️ 지역:</span> {limit.region || "-"}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 수정/추가 모달 */}
      <LimitFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchLimits();
          handleCloseModal();
        }}
        limit={editingLimit}
      />

      {/* 도움말 모달 */}
      <LimitsHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />

      {/* 일괄업로드 모달 */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        title="배출허용기준 일괄업로드"
        templateHeaders={["범위", "고객사코드", "굴뚝번호", "항목코드", "설정기준", "지역구분"]}
        exampleRow={["공통", "", "", "dust", "20", "일반지역"]}
        templateFileName="배출허용기준_일괄업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="범위는 '공통', '고객사별', '굴뚝별' 중 하나입니다. 고객사별은 고객사코드 필수, 굴뚝별은 고객사코드와 굴뚝번호 모두 필수입니다."
      />
    </section>
  );
}
