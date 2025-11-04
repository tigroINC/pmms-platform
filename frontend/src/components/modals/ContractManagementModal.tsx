"use client";
import { useState, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import Button from "@/components/ui/Button";

interface Customer {
  id: string;
  name: string;
  code?: string;
  businessNumber?: string;
}

interface Contract {
  id: string;
  startDate: Date;
  endDate: Date;
  memo?: string;
  status: string;
  daysRemaining: number;
}

interface CustomerWithContract {
  customer: Customer;
  contract: Contract | null;
}

interface ContractManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContractManagementModal({ isOpen, onClose }: ContractManagementModalProps) {
  const { hasPermission } = usePermissions();
  const [customers, setCustomers] = useState<CustomerWithContract[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    startDate: "",
    endDate: "",
    memo: "",
  });
  
  // 권한 체크
  const canView = hasPermission("contract.view");
  const canCreate = hasPermission("contract.create");
  const canUpdate = hasPermission("contract.update");
  const canDelete = hasPermission("contract.delete");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/contracts/customers");
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      } else {
        alert(data.error || "고객사 목록 조회 실패");
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
      alert("고객사 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customerId: string, contract: Contract | null) => {
    setEditingId(customerId);
    if (contract) {
      setEditForm({
        startDate: new Date(contract.startDate).toISOString().split("T")[0],
        endDate: new Date(contract.endDate).toISOString().split("T")[0],
        memo: contract.memo || "",
      });
    } else {
      setEditForm({
        startDate: "",
        endDate: "",
        memo: "",
      });
    }
  };

  const handleSave = async (customerId: string) => {
    if (!editForm.startDate || !editForm.endDate) {
      alert("계약 시작일과 종료일을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
          memo: editForm.memo,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("계약이 저장되었습니다.");
        setEditingId(null);
        fetchCustomers();
      } else {
        alert(data.error || "저장 실패");
      }
    } catch (error) {
      console.error("Save contract error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contractId: string) => {
    if (!confirm("계약을 삭제하시겠습니까?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/contracts/${contractId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("계약이 삭제되었습니다.");
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      console.error("Delete contract error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (contract: Contract | null) => {
    if (!contract) {
      return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">미등록</span>;
    }
    
    const { daysRemaining } = contract;
    if (daysRemaining < 0) {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">만료</span>;
    } else if (daysRemaining <= 7) {
      return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200">긴급</span>;
    } else if (daysRemaining <= 28) {
      return <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200">주의</span>;
    }
    return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">정상</span>;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">계약 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              총 {customers.length}개 고객사 (잔여일 짧은 순)
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">연결된 고객사가 없습니다.</div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">고객사</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">계약 시작일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">계약 종료일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">잔여일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">메모</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {customers.map(({ customer, contract }) => {
                    const isEditing = editingId === customer.id;
                    
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                          {customer.name}
                          {customer.code && (
                            <span className="ml-2 text-xs text-gray-500">({customer.code})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm.startDate}
                              onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                              className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600"
                            />
                          ) : contract ? (
                            <span className="text-gray-600 dark:text-gray-300">
                              {new Date(contract.startDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editForm.endDate}
                              onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                              className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600"
                            />
                          ) : contract ? (
                            <span className="text-gray-600 dark:text-gray-300">
                              {new Date(contract.endDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {contract ? (
                            <span className={contract.daysRemaining < 0 ? "text-red-600 font-semibold" : contract.daysRemaining <= 28 ? "text-orange-600 font-semibold" : "text-gray-600 dark:text-gray-300"}>
                              {contract.daysRemaining < 0 ? `${Math.abs(contract.daysRemaining)}일 초과` : `${contract.daysRemaining}일`}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getStatusBadge(contract)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.memo}
                              onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                              placeholder="메모"
                              className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600"
                            />
                          ) : (
                            <span className="text-gray-600 dark:text-gray-300">
                              {contract?.memo || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {isEditing ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(customer.id)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 font-medium"
                                disabled={loading}
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              {(canCreate || canUpdate) && (
                                <button
                                  onClick={() => handleEdit(customer.id, contract)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                                >
                                  {contract ? "수정" : "등록"}
                                </button>
                              )}
                              {canDelete && contract && (
                                <button
                                  onClick={() => handleDelete(contract.id)}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400"
                                >
                                  삭제
                                </button>
                              )}
                              {!canCreate && !canUpdate && !canDelete && <span className="text-gray-400">조회만</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {customers.map(({ customer, contract }) => {
                const isEditing = editingId === customer.id;
                return (
                  <div key={customer.id} className="rounded-lg border bg-gray-50 dark:bg-gray-700 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        {customer.code && <div className="text-xs text-gray-500">({customer.code})</div>}
                      </div>
                      {getStatusBadge(contract)}
                    </div>
                    
                    {isEditing ? (
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-500">시작일</label>
                          <input
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                            className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">종료일</label>
                          <input
                            type="date"
                            value={editForm.endDate}
                            onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                            className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600 mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">메모</label>
                          <input
                            type="text"
                            value={editForm.memo}
                            onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                            placeholder="메모"
                            className="border rounded px-2 py-1 text-sm w-full dark:bg-gray-700 dark:border-gray-600 mt-1"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => handleSave(customer.id)}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            disabled={loading}
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-gray-500">📅 시작:</span> {contract ? new Date(contract.startDate).toLocaleDateString() : "-"}</div>
                        <div><span className="text-gray-500">📅 종료:</span> {contract ? new Date(contract.endDate).toLocaleDateString() : "-"}</div>
                        <div><span className="text-gray-500">⏱️ 잔여:</span> {contract ? (contract.daysRemaining < 0 ? `${Math.abs(contract.daysRemaining)}일 초과` : `${contract.daysRemaining}일`) : "-"}</div>
                        <div className="col-span-2"><span className="text-gray-500">📝 메모:</span> {contract?.memo || "-"}</div>
                        <div className="col-span-2 flex gap-2 pt-2">
                          {(canCreate || canUpdate) && (
                            <button
                              onClick={() => handleEdit(customer.id, contract)}
                              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                            >
                              {contract ? "수정" : "등록"}
                            </button>
                          )}
                          {canDelete && contract && (
                            <button
                              onClick={() => handleDelete(contract.id)}
                              className="flex-1 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
