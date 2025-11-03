"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Organization = {
  id: string;
  name: string;
  businessNumber?: string;
};

type OrganizationPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (org: Organization) => void;
  currentOrgId?: string;
};

export default function OrganizationPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentOrgId,
}: OrganizationPickerModalProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.businessNumber?.includes(searchQuery)
      );
      setFilteredOrgs(filtered);
    } else {
      setFilteredOrgs(organizations);
    }
  }, [searchQuery, organizations]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/organizations");
      const data = await res.json();
      setOrganizations(data.data || []);
      setFilteredOrgs(data.data || []);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedOrg) {
      onSelect(selectedOrg);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-bold">환경측정기업 선택</h2>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b dark:border-gray-700">
          <Input
            placeholder="기업명 또는 사업자번호로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : filteredOrgs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOrgs.map((org) => (
                <div
                  key={org.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrg?.id === org.id
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  } ${
                    currentOrgId === org.id
                      ? "bg-gray-100 dark:bg-gray-700"
                      : ""
                  }`}
                  onClick={() => setSelectedOrg(org)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{org.name}</div>
                      {org.businessNumber && (
                        <div className="text-sm text-gray-500">
                          사업자번호: {org.businessNumber}
                        </div>
                      )}
                    </div>
                    {currentOrgId === org.id && (
                      <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded">
                        현재
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t dark:border-gray-700 flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedOrg}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
