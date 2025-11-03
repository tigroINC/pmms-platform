"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

type Company = {
  id: string;
  name: string;
  businessNumber: string;
  address?: string;
  type: string;
};

interface CompanyRegistrationModalProps {
  userType: "organization" | "customer";
  onClose: () => void;
  onSuccess: (company: Company) => void;
  initialName?: string; // 검색 화면에서 입력한 회사명
}

export function CompanyRegistrationModal({
  userType,
  onClose,
  onSuccess,
  initialName = "",
}: CompanyRegistrationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialName,
    businessNumber: "",
    corporateNumber: "",
    businessType: "",
    address: "",
    phone: "",
    representative: "",
    website: "",
    fax: "",
    establishedDate: "",
    // 관리자 정보
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: "",
    adminName: "",
    adminPhone: "",
    adminDepartment: "",
    adminPosition: "",
    // 기타
    registrationReason: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 비밀번호 확인
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 비밀번호 강도 확인
    if (formData.adminPassword.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }

    // 확인 모달 표시
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      const endpoint =
        userType === "organization"
          ? "/api/organizations/register"
          : "/api/customers/register";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // 생성된 회사 정보를 반환
        const company: Company = {
          id: data.data?.id || data.organization?.id || data.customer?.id,
          name: formData.name,
          businessNumber: formData.businessNumber,
          address: formData.address,
          type: userType,
        };
        onSuccess(company);
      } else {
        setError(data.error || "회사 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("회사 등록 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: userType === "organization" ? "법인명" : "고객사명",
    businessNumber: "사업자등록번호",
    corporateNumber: "법인등록번호",
    businessType: "업종",
    address: "주소",
    phone: "전화번호",
    representative: "대표자명",
    website: "홈페이지",
    fax: "팩스번호",
    establishedDate: "설립일",
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />
        
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {userType === "organization" ? "환경측정업체" : "고객사"} 신규 등록
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* 회사 정보 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                회사 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <div key={field} className={field === "address" ? "md:col-span-2" : ""}>
                    <label
                      htmlFor={field}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {label}
                      {(field === "name" || field === "businessNumber") && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <Input
                      id={field}
                      name={field}
                      type={field === "establishedDate" ? "date" : "text"}
                      value={(formData as any)[field]}
                      onChange={handleChange}
                      required={field === "name" || field === "businessNumber"}
                      className="w-full"
                      placeholder={
                        field === "businessNumber"
                          ? "123-45-67890"
                          : field === "corporateNumber"
                          ? "123456-1234567"
                          : ""
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 관리자 정보 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                관리자 정보
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="adminEmail"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="adminEmail"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    required
                    className="w-full"
                    placeholder="admin@company.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminName"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="adminName"
                    name="adminName"
                    type="text"
                    value={formData.adminName}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminPassword"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="adminPassword"
                    name="adminPassword"
                    type="password"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    required
                    className="w-full"
                    placeholder="8자 이상"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminPasswordConfirm"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="adminPasswordConfirm"
                    name="adminPasswordConfirm"
                    type="password"
                    value={formData.adminPasswordConfirm}
                    onChange={handleChange}
                    required
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminPhone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    휴대폰 번호 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="adminPhone"
                    name="adminPhone"
                    type="tel"
                    value={formData.adminPhone}
                    onChange={handleChange}
                    required
                    className="w-full"
                    placeholder="010-1234-5678"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminDepartment"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    부서
                  </label>
                  <Input
                    id="adminDepartment"
                    name="adminDepartment"
                    type="text"
                    value={formData.adminDepartment}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>

                <div>
                  <label
                    htmlFor="adminPosition"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    직책
                  </label>
                  <Input
                    id="adminPosition"
                    name="adminPosition"
                    type="text"
                    value={formData.adminPosition}
                    onChange={handleChange}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* 기타 정보 */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                기타 정보
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="registrationReason"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    가입 사유
                  </label>
                  <textarea
                    id="registrationReason"
                    name="registrationReason"
                    value={formData.registrationReason}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="notes"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    요청 사항
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm font-medium text-red-800 dark:text-red-200">
                  {error}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                등록 신청
              </Button>
              <Button
                type="button"
                onClick={onClose}
                className="px-8 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3"
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/70 transition-opacity"
              onClick={() => !loading && setShowConfirmModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  신규 등록 신청 확인
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    시스템 관리자에게 아래의 내용으로 신규 등록 신청이 됩니다.
                    <br />
                    승인 후 해당 업체의 다른 사용자들이 가입할 수 있습니다.
                  </p>
                </div>

                {/* 업체 정보 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    {userType === "organization" ? "환경측정업체" : "고객사"} 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">
                        {userType === "organization" ? "법인명" : "고객사명"}:
                      </span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">사업자등록번호:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.businessNumber}
                      </span>
                    </div>
                    {formData.corporateNumber && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">법인등록번호:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.corporateNumber}
                        </span>
                      </div>
                    )}
                    {formData.businessType && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">업종:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.businessType}
                        </span>
                      </div>
                    )}
                    {formData.address && (
                      <div className="col-span-2">
                        <span className="text-gray-500 dark:text-gray-400">주소:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.address}
                        </span>
                      </div>
                    )}
                    {formData.phone && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">전화번호:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.phone}
                        </span>
                      </div>
                    )}
                    {formData.representative && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">대표자명:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.representative}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 관리자 정보 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                    관리자 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">이름:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.adminName}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">이메일:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.adminEmail}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">휴대폰:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {formData.adminPhone}
                      </span>
                    </div>
                    {formData.adminDepartment && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">부서:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.adminDepartment}
                        </span>
                      </div>
                    )}
                    {formData.adminPosition && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">직책:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                          {formData.adminPosition}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {formData.registrationReason && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      가입 사유
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {formData.registrationReason}
                    </p>
                  </div>
                )}

                {formData.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      요청 사항
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      {formData.notes}
                    </p>
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                    <div className="text-sm font-medium text-red-800 dark:text-red-200">
                      {error}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-4">
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  {loading ? "처리 중..." : "확인"}
                </Button>
                <Button
                  onClick={() => !loading && setShowConfirmModal(false)}
                  disabled={loading}
                  className="px-8 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
