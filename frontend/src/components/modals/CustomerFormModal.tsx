"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  customer?: any; // 수정 시 기존 고객사 데이터
}

export default function CustomerFormModal({ isOpen, onClose, onSuccess, customer }: CustomerFormModalProps) {
  const isEditMode = !!customer;
  
  const [formData, setFormData] = useState({
    code: customer?.code || "",
    name: customer?.name || "",
    businessNumber: customer?.businessNumber || "",
    corporateNumber: customer?.corporateNumber || "",
    fullName: customer?.fullName || "",
    representative: customer?.representative || "",
    siteType: customer?.siteType || "",
    address: customer?.address || "",
    businessType: customer?.businessType || "",
    industry: customer?.industry || "",
    siteCategory: customer?.siteCategory || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // customer prop이 변경될 때 formData 업데이트
  useEffect(() => {
    if (customer) {
      setFormData({
        code: customer.code || "",
        name: customer.name || "",
        businessNumber: customer.businessNumber || "",
        corporateNumber: customer.corporateNumber || "",
        fullName: customer.fullName || "",
        representative: customer.representative || "",
        siteType: customer.siteType || "",
        address: customer.address || "",
        businessType: customer.businessType || "",
        industry: customer.industry || "",
        siteCategory: customer.siteCategory || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        businessNumber: "",
        corporateNumber: "",
        fullName: "",
        representative: "",
        siteType: "",
        address: "",
        businessType: "",
        industry: "",
        siteCategory: "",
      });
    }
    setError("");
  }, [customer, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // 신규 추가 시 사업자번호 입력하면 고객사코드에 자동 복사
      if (!isEditMode && field === "businessNumber" && value) {
        updated.code = value;
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.name) {
      setError("고객사명은 필수입니다.");
      return;
    }

    if (!isEditMode && !formData.businessNumber) {
      setError("사업자등록번호는 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const url = isEditMode ? `/api/customers/${customer.id}` : "/api/customers";
      const method = isEditMode ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      // 성공
      if (!isEditMode) {
        setFormData({
          code: "",
          name: "",
          businessNumber: "",
          corporateNumber: "",
          fullName: "",
          representative: "",
          siteType: "",
          address: "",
          businessType: "",
          industry: "",
          siteCategory: "",
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "고객사 정보 수정" : "신규 고객사 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                고객사명 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", (e.target as HTMLInputElement).value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                사업자등록번호 {!isEditMode && <span className="text-red-500">*</span>}
              </label>
              <Input
                value={formData.businessNumber}
                onChange={(e) => handleChange("businessNumber", (e.target as HTMLInputElement).value)}
                placeholder="123-45-67890"
                required={!isEditMode}
                disabled={isEditMode}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                고객사 코드 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange("code", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                고객사명(정식) <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                대표자 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.representative}
                onChange={(e) => handleChange("representative", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                사업장 구분 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.siteType}
                onChange={(e) => handleChange("siteType", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-sm font-medium">
                주소 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.address}
                onChange={(e) => handleChange("address", (e.target as HTMLInputElement).value)}
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                업태 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.businessType}
                onChange={(e) => handleChange("businessType", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                업종 <span className="text-gray-400">(선택)</span>
              </label>
              <textarea
                value={formData.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                사업장 종별 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.siteCategory}
                onChange={(e) => handleChange("siteCategory", (e.target as HTMLInputElement).value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                법인등록번호 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.corporateNumber}
                onChange={(e) => handleChange("corporateNumber", (e.target as HTMLInputElement).value)}
                placeholder="123456-1234567"
              />
            </div>
          </div>

          {!isEditMode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                💡 고객사 정보만 저장됩니다. 저장 후 <strong>초대 링크</strong>를 생성하여 고객사 관리자를 초대하세요.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
