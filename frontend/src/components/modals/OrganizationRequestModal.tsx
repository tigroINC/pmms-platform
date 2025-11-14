"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  address: string;
  phone: string;
}

interface OrganizationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function OrganizationRequestModal({
  isOpen,
  onClose,
  onSuccess,
}: OrganizationRequestModalProps) {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [contractStartDate, setContractStartDate] = useState("");
  const [contractEndDate, setContractEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timer = setTimeout(() => {
        searchOrganizations();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const searchOrganizations = async () => {
    try {
      setSearching(true);
      const customerId = (session?.user as any)?.customerId;
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(searchTerm)}&type=organization&customerId=${customerId}`);
      const data = await res.json();
      
      if (res.ok) {
        setSearchResults(data.companies || []);
      }
    } catch (error) {
      console.error("Error searching organizations:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleRequest = async () => {
    if (!selectedOrganization) {
      alert("환경측정기업을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      const customerId = (session?.user as any)?.customerId;
      
      const res = await fetch("/api/connection-requests/customer-to-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId,
          organizationId: selectedOrganization.id,
          contractStartDate: contractStartDate || null,
          contractEndDate: contractEndDate || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("연결 요청이 전송되었습니다.");
        onSuccess();
        handleClose();
      } else {
        alert(data.error || "요청 전송 실패");
      }
    } catch (error) {
      console.error("Error requesting connection:", error);
      alert("요청 전송 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchTerm("");
    setSearchResults([]);
    setSelectedOrganization(null);
    setContractStartDate("");
    setContractEndDate("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">환경측정기업 연결 요청</h2>

        {!selectedOrganization ? (
          <>
            {/* 검색 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                환경측정기업 검색
              </label>
              <input
                type="text"
                placeholder="기업명 또는 사업자등록번호 입력"
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
                {searchResults.map((org) => (
                  <div
                    key={org.id}
                    onClick={() => setSelectedOrganization(org)}
                    className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-gray-500">
                      {org.businessNumber} | {org.phone}
                    </div>
                    <div className="text-xs text-gray-400">{org.address}</div>
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
            {/* 선택된 환경측정기업 */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-lg">{selectedOrganization.name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {selectedOrganization.businessNumber}
                  </div>
                  <div className="text-sm text-gray-500">
                    {selectedOrganization.phone}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedOrganization.address}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrganization(null)}
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
              💡 연결 요청을 전송하면 환경측정기업 관리자가 승인할 수 있습니다.
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
          {selectedOrganization && (
            <button
              onClick={handleRequest}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "전송 중..." : "연결 요청"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
