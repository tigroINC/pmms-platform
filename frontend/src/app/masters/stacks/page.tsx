"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import StackFormModal from "@/components/modals/StackFormModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import { HelpCircle, X } from "lucide-react";

type Stack = {
  id: string;
  name: string;
  code: string | null;
  fullName: string | null;
  facilityType: string | null;
  height: number | null;
  diameter: number | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
  customer: { id: string; name: string; code: string | null; isActive: boolean };
  _count?: { measurements: number };
};

// 굴뚝 행 컴포넌트
function StackRow({ stack, role, onRefetch, onEdit }: { stack: Stack; role: string; onRefetch: () => void; onEdit: (stack: Stack) => void }) {
  const [loading, setLoading] = useState(false);

  const toggleActive = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/stacks/${stack.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !stack.isActive }),
      });
      if (res.ok) {
        onRefetch();
      } else {
        alert("상태 변경 실패");
      }
    } catch (err) {
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const hasMeasurements = stack._count?.measurements && stack._count.measurements > 0;
    if (hasMeasurements) {
      alert("측정 기록이 있는 굴뚝은 삭제할 수 없습니다. 비활성화를 사용하세요.");
      return;
    }

    if (!confirm(`"${stack.name}" 굴뚝을 삭제하시겠습니까?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/stacks/${stack.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefetch();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (err) {
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const isActive = stack.isActive !== false;
  const isCustomerActive = stack.customer.isActive !== false;

  return (
    <Tr className={!isActive || !isCustomerActive ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""}>
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
      <Td className="font-mono text-xs break-words">{stack.name}</Td>
      <Td className="font-mono text-xs break-words">{stack.code || "-"}</Td>
      <Td className="text-sm break-words">{stack.fullName || "-"}</Td>
      <Td className="text-sm break-words">{stack.facilityType || "-"}</Td>
      <Td className="text-center break-words">{stack.height ?? "-"}</Td>
      <Td className="text-center break-words">{stack.diameter ?? "-"}</Td>
      <Td className="text-center break-words">{stack.category || "-"}</Td>
      <Td className="break-words">
        <span className="font-medium">{stack.customer.name}</span>
        {stack.customer.code && (
          <span className="text-xs text-gray-500"> ({stack.customer.code})</span>
        )}
        {!isCustomerActive && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ml-1">
            비활성
          </span>
        )}
      </Td>
      <Td className="text-center text-sm break-words">
        {new Date(stack.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
      </Td>
      {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
        <Td>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(stack)}
              disabled={loading}
              className="text-xs text-green-600 hover:underline disabled:opacity-50"
            >
              수정
            </button>
            <button
              onClick={toggleActive}
              disabled={loading}
              className="text-xs text-blue-600 hover:underline disabled:opacity-50"
            >
              {isActive ? "비활성화" : "활성화"}
            </button>
            {!isActive && !stack._count?.measurements && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                삭제
              </button>
            )}
          </div>
        </Td>
      )}
    </Tr>
  );
}

// 도움말 모달 컴포넌트
function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setIsOpen(true)}>
        <HelpCircle className="w-4 h-4 mr-1" />
        도움말
      </Button>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">굴뚝 관리 도움말</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <section>
                <h3 className="font-semibold text-base mb-2">📋 기본 기능</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>담당 고객사의 모든 굴뚝 정보를 조회하고 관리할 수 있습니다</li>
                  <li>검색 기능으로 굴뚝번호, 코드, 명칭, 배출시설, 고객사로 검색 가능합니다</li>
                  <li>고객사 필터로 특정 고객사의 굴뚝만 조회할 수 있습니다</li>
                  <li>확인필요 항목이 우선 정렬되며, 날짜 최신순으로 표시됩니다</li>
                  <li>Excel 버튼으로 목록을 다운로드할 수 있습니다</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">➕ 굴뚝 신규 추가</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>"+ 신규 추가" 버튼을 클릭하여 새로운 굴뚝을 등록할 수 있습니다.</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">필수 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>고객사</strong>: 굴뚝이 속한 고객사 선택</li>
                      <li><strong>굴뚝번호</strong>: 환경측정기업 내부 코드 (예: S-001)</li>
                      <li><strong>현장 명칭</strong>: 굴뚝의 명칭 (예: 1호 소각로)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
                    <p className="font-medium text-gray-900 dark:text-gray-300 mb-2">선택 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>굴뚝코드, 배출시설 종류, 높이, 안지름, 종별 등</li>
                    </ul>
                  </div>
                  <p className="text-sm italic">💡 등록한 굴뚝은 고객사의 검토대기 탭에 표시되며, 고객사에 알림이 전송됩니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">✏️ 굴뚝 정보 수정</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>"수정" 버튼을 클릭하여 굴뚝 정보를 수정할 수 있습니다.</p>
                  <p className="text-sm italic">⚠️ 수정 시 고객사에 알림이 전송되며, 모든 수정 이력이 자동으로 기록됩니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">📤 일괄업로드</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>"일괄업로드" 버튼을 클릭하여 CSV 파일로 여러 굴뚝을 한 번에 등록할 수 있습니다.</p>
                  <p className="text-sm italic">💡 양식 다운로드 후 작성하여 업로드하세요.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">🔔 알림 기능</h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                  <li>고객사가 굴뚝 정보를 수정하면 실시간 알림을 받습니다</li>
                  <li>고객사가 굴뚝 확인 완료 시 알림을 받습니다</li>
                  <li>우측 상단 알림 아이콘에서 확인할 수 있습니다</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function StacksPage() {
  const { user } = useAuth();
  const role = user?.role;
  const [list, setList] = useState<Stack[]>([]);
  const [q, setQ] = useState("");
  const [customerFilter, setCustomerFilter] = useState("전체");
  const [showInactive, setShowInactive] = useState(false);
  const [showInactiveStacks, setShowInactiveStacks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStack, setEditingStack] = useState<Stack | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  const handleEdit = (stack: Stack) => {
    setEditingStack(stack);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingStack(null);
  };

  useEffect(() => {
    fetchStacks();
  }, []);

  const fetchStacks = async () => {
    try {
      const res = await fetch("/api/stacks");
      const json = await res.json();
      setList(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const customers = useMemo(() => {
    const uniqueCustomers = Array.from(
      new Map(list.map((s) => [s.customer.id, s.customer])).values()
    );
    return uniqueCustomers.sort((a, b) => {
      if (a.code === 'CUST999') return 1;
      if (b.code === 'CUST999') return -1;
      return (a.code || a.name).localeCompare(b.code || b.name);
    });
  }, [list]);

  const filtered = useMemo(() => {
    return list
      .filter((s: any) => {
        if (!q) {
          const matchesCustomer = customerFilter === "전체" || s.customer.name === customerFilter;
          const matchesCustomerActive = showInactive ? true : s.customer.isActive !== false;
          const matchesStackActive = showInactiveStacks ? true : s.isActive !== false;
          return matchesCustomer && matchesCustomerActive && matchesStackActive;
        }

        const searchLower = q.toLowerCase();
        const matchesSearch =
          (s.name && s.name.toLowerCase().includes(searchLower)) ||
          (s.code && s.code.toLowerCase().includes(searchLower)) ||
          (s.fullName && s.fullName.toLowerCase().includes(searchLower)) ||
          (s.facilityType && s.facilityType.toLowerCase().includes(searchLower)) ||
          (s.customer.name && s.customer.name.toLowerCase().includes(searchLower)) ||
          (s.customer.code && s.customer.code.toLowerCase().includes(searchLower));

        const matchesCustomer = customerFilter === "전체" || s.customer.name === customerFilter;
        const matchesCustomerActive = showInactive ? true : s.customer.isActive !== false;
        const matchesStackActive = showInactiveStacks ? true : s.isActive !== false;
        return matchesSearch && matchesCustomer && matchesCustomerActive && matchesStackActive;
      })
      .sort((a: any, b: any) => {
        // 1. 확인상태 (확인필요 우선)
        if (a.isVerified !== b.isVerified) {
          return a.isVerified ? 1 : -1;
        }
        // 2. 날짜 최신순
        const dateA = a.verifiedAt || a.createdAt || a.id;
        const dateB = b.verifiedAt || b.createdAt || b.id;
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        // 3. 고객사 (환경측정기업 입장에서는 고객사)
        const customerCompare = (a.customer.code || a.customer.name).localeCompare(b.customer.code || b.customer.name);
        if (customerCompare !== 0) return customerCompare;
        // 4. 굴뚝명칭
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [list, q, customerFilter, showInactive, showInactiveStacks]);

  const handleBulkUpload = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      const text = await file.text();
      const res = await fetch("/api/stacks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      
      const data = await res.json();
      console.log("[handleBulkUpload] API 응답:", { ok: res.ok, data });
      
      if (res.ok && data.success) {
        fetchStacks();
        
        // 에러가 있으면 상세 메시지 표시
        if (data.errors && data.errors.length > 0) {
          const errorDetails = data.errors.join('\n');
          return {
            success: true,
            message: `${data.message}\n\n실패 상세:\n${errorDetails}`,
            count: data.count,
          };
        }
        
        return {
          success: true,
          message: data.message || "업로드 성공",
          count: data.count,
        };
      } else {
        return {
          success: false,
          message: data.error || data.message || "업로드 실패",
        };
      }
    } catch (error: any) {
      console.error("[handleBulkUpload] 예외:", error);
      return {
        success: false,
        message: error.message || "오류 발생",
      };
    }
  };

  const onExport = () => {
    const header = ["굴뚝번호", "굴뚝코드", "굴뚝 정식 명칭", "배출시설 종류", "굴뚝 높이(m)", "굴뚝 안지름(m)", "굴뚝 종별(종)", "고객사", "고객사코드", "생성일"];
    const body = filtered.map((s: any) => [
      s.name || "",
      s.code || "",
      s.fullName || "",
      s.facilityType || "",
      s.height || "",
      s.diameter || "",
      s.category || "",
      s.customer.name || "",
      s.customer.code || "",
      new Date(s.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"` ).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stacks_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">굴뚝 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <Input
              className="text-sm h-8"
              style={{ width: '352px', minWidth: '352px' }}
              value={q}
              onChange={(e) => setQ((e.target as HTMLInputElement).value)}
              placeholder="굴뚝번호, 코드, 명칭, 배출시설, 고객사 등"
            />
          </div>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">고객사</label>
            <select
              className="text-sm h-8 w-full border rounded px-2 bg-white dark:bg-gray-800"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
            >
              <option>전체</option>
              {customers.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer mb-1.5 whitespace-nowrap ml-auto">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            비활성 고객사
          </label>
          <label className="flex items-center gap-1.5 text-xs cursor-pointer mb-1.5 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactiveStacks}
              onChange={(e) => setShowInactiveStacks(e.target.checked)}
              className="rounded"
            />
            비활성 굴뚝
          </label>
          <div className="flex gap-1.5 mb-1.5">
            <HelpModal />
            {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
              <>
                <Button size="sm" variant="secondary" onClick={onExport}>Excel</Button>
                <Button size="sm" variant="secondary" onClick={() => setShowBulkUploadModal(true)}>일괄업로드</Button>
                <Button size="sm" onClick={() => setIsModalOpen(true)}>+ 신규 추가</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 일괄 작업 버튼 (검색/필터 결과가 있을 때만 표시) */}
      {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && filtered.length > 0 && (q || customerFilter !== "전체") && (
        <div className="flex gap-2 items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            검색 결과 {filtered.length}건
          </span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                if (!confirm(`검색된 ${filtered.length}개 굴뚝을 모두 비활성화하시겠습니까?`)) return;
                
                let successCount = 0;
                for (const stack of filtered) {
                  try {
                    const res = await fetch(`/api/stacks/${stack.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isActive: false }),
                    });
                    if (res.ok) successCount++;
                  } catch (err) {
                    console.error(`Failed to deactivate stack ${stack.id}:`, err);
                  }
                }
                alert(`${successCount}개 굴뚝을 비활성화했습니다.`);
                fetchStacks();
              }}
            >
              전체 비활성화
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                const hasAnyMeasurements = filtered.some(s => s._count?.measurements && s._count.measurements > 0);
                if (hasAnyMeasurements) {
                  alert("측정 기록이 있는 굴뚝이 포함되어 있어 삭제할 수 없습니다. 비활성화를 사용하세요.");
                  return;
                }
                
                if (!confirm(`검색된 ${filtered.length}개 굴뚝을 모두 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
                
                let successCount = 0;
                for (const stack of filtered) {
                  try {
                    const res = await fetch(`/api/stacks/${stack.id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) successCount++;
                  } catch (err) {
                    console.error(`Failed to delete stack ${stack.id}:`, err);
                  }
                }
                alert(`${successCount}개 굴뚝을 삭제했습니다.`);
                fetchStacks();
              }}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              전체 삭제
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="w-full table-fixed">
          <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th className="bg-gray-50 dark:bg-gray-800">상태</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">굴뚝번호</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">굴뚝코드</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">굴뚝 정식 명칭</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">배출시설 종류</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">높이(m)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">안지름(m)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">종별</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">고객사</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">생성일</Th>
                {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={(role === "SUPER_ADMIN" || role === "ORG_ADMIN") ? 11 : 10} className="text-center text-gray-500 py-8">
                    등록된 굴뚝이 없습니다
                  </Td>
                </Tr>
              ) : (
                filtered.map((s: any) => (
                  <StackRow key={s.id} stack={s} role={role} onRefetch={fetchStacks} onEdit={handleEdit} />
                ))
              )}
            </Tbody>
          </Table>
        </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            등록된 굴뚝이 없습니다
          </div>
        ) : (
          filtered.map((s: any) => {
            const isActive = s.isActive !== false;
            const isCustomerActive = s.customer.isActive !== false;
            return (
              <div key={s.id} className={`rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2 ${!isActive || !isCustomerActive ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                    {isActive ? "활성" : "비활성"}
                  </span>
                  {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(s)} className="text-xs text-blue-600 hover:underline">수정</button>
                      <button onClick={async () => {
                        try {
                          const res = await fetch(`/api/stacks/${s.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ isActive: !s.isActive }),
                          });
                          if (res.ok) fetchStacks();
                          else alert("상태 변경 실패");
                        } catch (err) {
                          alert("오류 발생");
                        }
                      }} className="text-xs text-blue-600 hover:underline">
                        {isActive ? "비활성화" : "활성화"}
                      </button>
                      {!isActive && !s._count?.measurements && (
                        <button onClick={async () => {
                          if (!confirm(`"${s.name}" 굴뚝을 삭제하시겠습니까?`)) return;
                          try {
                            const res = await fetch(`/api/stacks/${s.id}`, { method: "DELETE" });
                            if (res.ok) fetchStacks();
                            else alert("삭제 실패");
                          } catch (err) {
                            alert("오류 발생");
                          }
                        }} className="text-xs text-gray-600 hover:underline">삭제</button>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">🏭 번호:</span> {s.name}</div>
                  <div><span className="text-gray-500">📋 코드:</span> {s.code || "-"}</div>
                  <div className="col-span-2"><span className="text-gray-500">📍 정식명:</span> {s.fullName || "-"}</div>
                  <div className="col-span-2"><span className="text-gray-500">⚙️ 시설:</span> {s.facilityType || "-"}</div>
                  <div><span className="text-gray-500">📏 높이:</span> {s.height ?? "-"}m</div>
                  <div><span className="text-gray-500">⭕ 안지름:</span> {s.diameter ?? "-"}m</div>
                  <div><span className="text-gray-500">🏷️ 종별:</span> {s.category || "-"}</div>
                  <div><span className="text-gray-500">📅 생성:</span> {new Date(s.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</div>
                  <div className="col-span-2">
                    <span className="text-gray-500">🏢 고객사:</span> {s.customer.name}
                    {s.customer.code && <span className="text-xs text-gray-500"> ({s.customer.code})</span>}
                    {!isCustomerActive && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ml-1">비활성</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 굴뚝 등록/수정 모달 */}
      <StackFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStack(null);
        }}
        onSuccess={() => {
          fetchStacks();
          setIsModalOpen(false);
          setEditingStack(null);
        }}
        stack={editingStack}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        title="굴뚝 일괄업로드"
        templateHeaders={["고객사코드", "굴뚝번호", "굴뚝코드", "굴뚝 정식 명칭", "배출시설 종류", "위치", "굴뚝 높이(m)", "굴뚝 안지름(m)", "굴뚝 종별(종)"]}
        exampleRow={["CUST001", "ST-001", "C-ST01001", "1호 소각로 굴뚝", "소각시설", "공장동 옥상", "25.5", "0.8", "1종"]}
        templateFileName="굴뚝_일괄업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="고객사코드와 굴뚝번호는 필수 항목입니다. 고객사코드는 기존에 등록된 고객사의 코드여야 합니다."
      />
    </section>
  );
}
