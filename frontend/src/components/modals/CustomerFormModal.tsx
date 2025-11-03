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
    fullName: customer?.fullName || "",
    siteType: customer?.siteType || "",
    address: customer?.address || "",
    industry: customer?.industry || "",
    siteCategory: customer?.siteCategory || "",
    // 고객사 관리자 정보 (신규 등록 시에만)
    adminEmail: "",
    adminPassword: "",
    adminName: "",
    adminPhone: "",
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
        fullName: customer.fullName || "",
        siteType: customer.siteType || "",
        address: customer.address || "",
        industry: customer.industry || "",
        siteCategory: customer.siteCategory || "",
        adminEmail: "",
        adminPassword: "",
        adminName: "",
        adminPhone: "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        businessNumber: "",
        fullName: "",
        siteType: "",
        address: "",
        industry: "",
        siteCategory: "",
        adminEmail: "",
        adminPassword: "",
        adminName: "",
        adminPhone: "",
      });
    }
    setError("");
  }, [customer, isOpen]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

    if (!isEditMode) {
      if (!formData.adminEmail || !formData.adminPassword || !formData.adminName || !formData.adminPhone) {
        setError("고객사 관리자 정보(이메일, 비밀번호, 이름, 전화번호)는 필수입니다.");
        return;
      }
      if (formData.adminPassword.length < 8) {
        setError("비밀번호는 8자 이상이어야 합니다.");
        return;
      }
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
          fullName: "",
          siteType: "",
          address: "",
          industry: "",
          siteCategory: "",
          adminEmail: "",
          adminPassword: "",
          adminName: "",
          adminPhone: "",
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
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
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
                placeholder="예: 고려아연"
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
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              고객사 코드 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.code}
              onChange={(e) => handleChange("code", (e.target as HTMLInputElement).value)}
              placeholder="예: CUST001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              고객사명(정식) <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", (e.target as HTMLInputElement).value)}
              placeholder="예: 고려아연㈜온산제련소"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              사업장 구분 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.siteType}
              onChange={(e) => handleChange("siteType", (e.target as HTMLInputElement).value)}
              placeholder="예: -"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              주소 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", (e.target as HTMLInputElement).value)}
              placeholder="예: 울산광역시 울주군 온산읍 이진로 139"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              업종 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.industry}
              onChange={(e) => handleChange("industry", (e.target as HTMLInputElement).value)}
              placeholder="예: 연 및 아연 제련, 정련 및 합금 제조업"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              사업장 종별 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.siteCategory}
              onChange={(e) => handleChange("siteCategory", (e.target as HTMLInputElement).value)}
              placeholder="예: 1종"
            />
          </div>

          {!isEditMode && (
            <>
              <div className="border-t pt-4 mt-6">
                <h3 className="text-lg font-semibold mb-4">고객사 관리자 계정</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    value={formData.adminEmail}
                    onChange={(e) => handleChange("adminEmail", (e.target as HTMLInputElement).value)}
                    placeholder="admin@customer.com"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.adminName}
                    onChange={(e) => handleChange("adminName", (e.target as HTMLInputElement).value)}
                    placeholder="홍길동"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="password"
                    value={formData.adminPassword}
                    onChange={(e) => handleChange("adminPassword", (e.target as HTMLInputElement).value)}
                    placeholder="8자 이상"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    전화번호 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    value={formData.adminPhone}
                    onChange={(e) => handleChange("adminPhone", (e.target as HTMLInputElement).value)}
                    placeholder="010-1234-5678"
                    required
                  />
                </div>
              </div>
            </>
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
