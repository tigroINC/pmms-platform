"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface SearchConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onSuccess: () => void;
}

export default function SearchConnectionModal({
  isOpen,
  onClose,
  organizationId,
  onSuccess,
}: SearchConnectionModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedPublic, setSelectedPublic] = useState<any>(null);
  const [selectedInternal, setSelectedInternal] = useState<any>(null);

  if (!isOpen) return null;

  // 공개/내부 고객사 분리
  // 고객사(가입): CUSTOMER_ADMIN 관리자계정이 존재하는 고객사
  const publicCustomers = searchResults.filter(
    (c) => Array.isArray(c.users) && c.users.length > 0
  );
  // 고객사(내부): 우리 조직이 만들었고 AND 아직 우리 조직과 연결 안 된 고객사
  const internalCustomers = searchResults.filter((c) => {
    const isCreatedByUs = c.createdBy; // 우리 조직 사용자가 만든 것
    const isNotConnected = !c.organizations || c.organizations.length === 0; // 아직 연결 안 됨
    return isCreatedByUs && isNotConnected;
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert("검색어를 입력하세요.");
      return;
    }

    setSearching(true);
    try {
      const res = await fetch(
        `/api/customers?tab=search&organizationId=${organizationId}&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();
      if (res.ok) {
        setSearchResults(data.customers || []);
      } else {
        alert(data.error || "검색 실패");
      }
    } catch (error) {
      console.error("Search error:", error);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async (publicCustomer: any, internalCustomer?: any) => {
    const isMerge = !!internalCustomer;
    const message = isMerge
      ? `"${publicCustomer.name}" 고객사와 내부 고객사 정보를 병합하여 연결 요청을 보내시겠습니까?`
      : `"${publicCustomer.name}" 고객사에 연결 요청을 보내시겠습니까?`;

    if (!confirm(message)) {
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        customerId: publicCustomer.id,
        organizationId,
      };

      // 병합 연결인 경우 proposedData 추가
      if (internalCustomer) {
        payload.proposedData = {
          internalCustomerId: internalCustomer.id, // 병합 추적용
          code: internalCustomer.code,
          corporateNumber: internalCustomer.corporateNumber,
          fullName: internalCustomer.fullName,
          representative: internalCustomer.representative,
          siteType: internalCustomer.siteType,
          address: internalCustomer.address,
          businessType: internalCustomer.businessType,
          industry: internalCustomer.industry,
          siteCategory: internalCustomer.siteCategory,
        };
      }

      const res = await fetch("/api/customer-organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message || "연결 요청을 보냈습니다.");
        handleClose();
        onSuccess();
      } else {
        alert(data.error || "연결 요청 실패");
      }
    } catch (error) {
      console.error("Connection request error:", error);
      alert("연결 요청 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedPublic(null);
    setSelectedInternal(null);
    onClose();
  };

  const handleMatchConnect = () => {
    if (!selectedPublic) {
      alert("공개 고객사를 선택하세요.");
      return;
    }
    handleConnect(selectedPublic, selectedInternal);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            고객사 검색 및 연결
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-3">
            검색 → 해당 고객사(가입) 선택 → 내부등록된 고객이 있을 경우 같이 선택 → 연결요청
          </div>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
              placeholder="회사명 일부 또는 사업자번호(하이픈 유무 무관)로 검색하세요."
              className="flex-1"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "검색 중..." : "검색"}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              {searching ? "검색 중..." : "검색 결과가 없습니다."}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* 가입 고객사 */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  고객사(가입) ({publicCustomers.length})
                </h3>
                <div className="space-y-2">
                  {publicCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedPublic(customer)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedPublic?.id === customer.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{customer.name}</span>
                        {customer.siteType && (
                          <span className="text-xs text-gray-500">({customer.siteType})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.businessNumber || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 내부 고객사 */}
              <div>
                <h3 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
                  고객사(내부) ({internalCustomers.length})
                </h3>
                <div className="space-y-2">
                  {internalCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => setSelectedInternal(customer)}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        selectedInternal?.id === customer.id
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{customer.name}</span>
                        {customer.siteType && (
                          <span className="text-xs text-gray-500">({customer.siteType})</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {customer.businessNumber || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedPublic && selectedInternal && (
                <span>
                  💡 고객사(가입)과 고객사(내부)를 모두 선택할 경우 해당 정보가 병합 연결됩니다.
                </span>
              )}
              {selectedPublic && !selectedInternal && (
                <span>
                  💡 일반 연결: 선택한 가입 고객사에 연결 요청만 전송됩니다.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleClose}>
                닫기
              </Button>
              <Button
                onClick={handleMatchConnect}
                disabled={!selectedPublic || loading}
              >
                연결 요청
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
