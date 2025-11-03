"use client";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import StackFormModal from "@/components/modals/StackFormModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";

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
      <Td className="font-mono text-xs whitespace-nowrap">{stack.name}</Td>
      <Td className="font-mono text-xs whitespace-nowrap">{stack.code || "-"}</Td>
      <Td className="text-sm max-w-[200px]">
        <div className="line-clamp-2">{stack.fullName || "-"}</div>
      </Td>
      <Td className="text-sm max-w-[150px]">
        <div className="line-clamp-2">{stack.facilityType || "-"}</div>
      </Td>
      <Td className="text-center whitespace-nowrap">{stack.height ?? "-"}</Td>
      <Td className="text-center whitespace-nowrap">{stack.diameter ?? "-"}</Td>
      <Td className="text-center whitespace-nowrap">{stack.category || "-"}</Td>
      <Td className="max-w-[150px]">
        <div className="line-clamp-2">
          <span className="font-medium">{stack.customer.name}</span>
          {stack.customer.code && (
            <span className="text-xs text-gray-500"> ({stack.customer.code})</span>
          )}
          {!isCustomerActive && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 ml-1">
              비활성
            </span>
          )}
        </div>
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
        // 고객사 코드 순, 같은 고객사 내에서는 굴뚝 코드 순
        const customerCompare = (a.customer.code || a.customer.name).localeCompare(b.customer.code || b.customer.name);
        if (customerCompare !== 0) return customerCompare;
        return (a.code || a.name).localeCompare(b.code || b.name);
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
      
      if (res.ok) {
        fetchStacks();
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
        message: error.message || "오류 발생",
      };
    }
  };

  const onExport = () => {
    const header = ["굴뚝번호", "굴뚝코드", "굴뚝 정식 명칭", "배출시설 종류", "굴뚝 높이(m)", "굴뚝 안지름(m)", "굴뚝 종별(종)", "고객사", "고객사코드"];
    const body = filtered.map((s: any) => [
      s.name || "",
      s.code || "",
      s.fullName || "",
      s.facilityType || "",
      s.height || "",
      s.diameter || "",
      s.category || "",
      s.customer.name || "",
      s.customer.code || ""
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

      {/* 굴뚝 목록 테이블 */}
      <div className="rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="min-w-[1400px]">
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
                {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={(role === "SUPER_ADMIN" || role === "ORG_ADMIN") ? 10 : 9} className="text-center text-gray-500 py-8">
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
