"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Customer {
  id: string;
  name: string;
  businessNumber: string;
  address: string;
}

interface CustomerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CustomerInviteModal({
  isOpen,
  onClose,
  onSuccess,
}: CustomerInviteModalProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchCustomers();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchCustomers = async () => {
    try {
      setSearching(true);
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(searchTerm)}&type=customer`);
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedCustomer) {
      alert("고객사를 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const organizationId = (session?.user as any)?.organizationId;
      
      const res = await fetch("/api/connection-requests/org-to-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          organizationId: organizationId,
          contractStartDate: contractStartDate || null,
          contractEndDate: contractEndDate || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("고객사 초대가 전송되었습니다.");
        onSuccess();
        handleClose();
      } else {
        alert(data.error || "초대 전송 실패");
      }
    } catch (error) {
      console.error("Error inviting customer:", error);
      alert("초대 전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedCustomer(null);
    setContractStartDate("");
    setContractEndDate("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">고객사 초대</h2>

        {!selectedCustomer ? (
          <>
            {/* 검색 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객사 검색
              </label>
              <input
                type="text"
                placeholder="고객사명 또는 사업자등록번호 입력"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
              {searching && (
                <p className="text-sm text-gray-500 mt-2">검색 중...</p>
              )}
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="mb-4 border rounded max-h-60 overflow-y-auto">
                {searchResults.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-gray-500">
                      {customer.businessNumber} | {customer.address}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchTerm.length >= 2 && !searching && searchResults.length === 0 && (
              <p className="text-sm text-gray-500 mb-4">검색 결과가 없습니다.</p>
            )}
          </>
        ) : (
          <>
            {/* 선택된 고객사 */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">{selectedCustomer.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedCustomer.businessNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedCustomer.address}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* 계약 기간 (선택사항) */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계약 기간 (선택사항)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">시작일</label>
                  <input
                    type="date"
                    value={contractStartDate}
                    onChange={(e) => setContractStartDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">종료일</label>
                  <input
                    type="date"
                    value={contractEndDate}
                    onChange={(e) => setContractEndDate(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* 안내 메시지 */}
            <div className="mb-4 p-3 bg-blue-50 rounded text-sm text-blue-800">
              💡 초대를 전송하면 고객사 관리자가 승인할 수 있습니다.
            </div>
          </>
        )}

        {/* 버튼 */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            disabled={loading}
          >
            취소
          </button>
          {selectedCustomer && (
            <button
              onClick={handleInvite}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "전송 중..." : "초대 전송"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
