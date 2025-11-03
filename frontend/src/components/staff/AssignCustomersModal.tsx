"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Customer {
  id: string;
  name: string;
  businessNumber: string;
}

interface Assignment {
  id: string;
  customer: Customer;
  isPrimary: boolean;
}

interface AssignCustomersModalProps {
  isOpen: boolean;
  staffId: string;
  currentAssignments: Assignment[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignCustomersModal({
  isOpen,
  staffId,
  currentAssignments,
  onClose,
  onSuccess,
}: AssignCustomersModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [primaryCustomerId, setPrimaryCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
      // 현재 할당된 고객사 설정
      const assigned = new Set(currentAssignments.map(a => a.customer.id));
      setSelectedCustomers(assigned);
      const primary = currentAssignments.find(a => a.isPrimary);
      setPrimaryCustomerId(primary?.customer.id || null);
    }
  }, [isOpen, currentAssignments]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      if (response.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  };

  const handleToggleCustomer = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
      if (primaryCustomerId === customerId) {
        setPrimaryCustomerId(null);
      }
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const handleSetPrimary = (customerId: string) => {
    if (selectedCustomers.has(customerId)) {
      setPrimaryCustomerId(customerId);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/org/staff/${staffId}/assign-customers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerIds: Array.from(selectedCustomers),
          primaryCustomerId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("담당 고객사가 할당되었습니다.");
        onSuccess();
      } else {
        alert(data.error || "할당에 실패했습니다.");
      }
    } catch (error) {
      console.error("Assign customers error:", error);
      alert("할당 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.businessNumber.includes(search)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            담당 고객사 할당
          </h2>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* 검색 */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="고객사명 또는 사업자등록번호 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* 선택 정보 */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              선택: {selectedCustomers.size}개
              {primaryCustomerId && " (주 담당 설정됨)"}
            </div>
          </div>

          {/* 고객사 목록 */}
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                고객사가 없습니다.
              </div>
            ) : (
              filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <label className="flex items-center flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => handleToggleCustomer(customer.id)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.businessNumber}
                      </div>
                    </div>
                  </label>

                  {selectedCustomers.has(customer.id) && (
                    <button
                      onClick={() => handleSetPrimary(customer.id)}
                      className={`ml-3 px-3 py-1 rounded text-xs font-medium ${
                        primaryCustomerId === customer.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                      }`}
                    >
                      {primaryCustomerId === customer.id ? "주 담당" : "주 담당 설정"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 안내 메시지 */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              💡 주 담당으로 설정된 고객사는 알림 및 보고서에서 기본 담당자로 표시됩니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            취소
          </button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1"
          >
            {loading ? "저장 중..." : "저장"}
          </Button>
        </div>
      </div>
    </div>
  );
}
