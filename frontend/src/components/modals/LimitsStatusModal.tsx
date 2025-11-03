"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";

interface EmissionLimit {
  id: string;
  itemKey: string;
  limit: number;
  region: string | null;
  customerId: string | null;
  stackId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LimitsStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: any[];
  stacks: any[];
  items: any[];
}

export default function LimitsStatusModal({
  isOpen,
  onClose,
  customers,
  stacks,
  items,
}: LimitsStatusModalProps) {
  const [limits, setLimits] = useState<EmissionLimit[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "global" | "customer" | "stack">("all");

  useEffect(() => {
    if (isOpen) {
      fetchLimits();
    }
  }, [isOpen]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("이 기준을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/limits?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        alert("삭제되었습니다.");
        fetchLimits();
      } else {
        const json = await res.json();
        alert(json.error || "삭제 실패");
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getItemName = (itemKey: string) => {
    const item = items.find((i: any) => i.key === itemKey);
    return item ? item.name : itemKey;
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

  const filteredLimits = limits.filter((limit) => {
    if (filter === "all") return true;
    if (filter === "global") return !limit.customerId && !limit.stackId;
    if (filter === "customer") return limit.customerId && !limit.stackId;
    if (filter === "stack") return limit.stackId;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">배출허용기준 설정 현황</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
            >
              전체 ({limits.length})
            </button>
            <button
              onClick={() => setFilter("global")}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                filter === "global"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
            >
              전체 기준 ({limits.filter((l) => !l.customerId && !l.stackId).length})
            </button>
            <button
              onClick={() => setFilter("customer")}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                filter === "customer"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
            >
              고객사별 ({limits.filter((l) => l.customerId && !l.stackId).length})
            </button>
            <button
              onClick={() => setFilter("stack")}
              className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                filter === "stack"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white hover:bg-gray-400 dark:hover:bg-gray-500"
              }`}
            >
              굴뚝별 ({limits.filter((l) => l.stackId).length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">로딩 중...</div>
          ) : filteredLimits.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              설정된 기준이 없습니다
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <Thead className="bg-gray-50 dark:bg-white/10">
                  <Tr>
                    <Th>범위</Th>
                    <Th>고객사</Th>
                    <Th>굴뚝</Th>
                    <Th>항목</Th>
                    <Th>기준값</Th>
                    <Th>지역</Th>
                    <Th>수정일</Th>
                    <Th>액션</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredLimits.map((limit) => (
                    <Tr key={limit.id}>
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
                      <Td className="font-medium">{getItemName(limit.itemKey)}</Td>
                      <Td className="font-semibold">{limit.limit}</Td>
                      <Td>{limit.region || "-"}</Td>
                      <Td className="text-sm text-gray-500">
                        {new Date(limit.updatedAt).toLocaleDateString()}
                      </Td>
                      <Td>
                        <button
                          onClick={() => handleDelete(limit.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          삭제
                        </button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
