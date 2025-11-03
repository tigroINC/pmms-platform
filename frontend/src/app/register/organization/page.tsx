"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface FieldConfig {
  required: string[];
  optional: string[];
}

export default function OrganizationRegisterPage() {
  const router = useRouter();
  const [fieldConfig, setFieldConfig] = useState<FieldConfig>({
    required: ["name", "businessNumber"],
    optional: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    // Organization 정보
    name: "",
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

  useEffect(() => {
    fetchFieldConfig();
  }, []);

  const fetchFieldConfig = async () => {
    try {
      const response = await fetch("/api/organizations/registration-fields");
      const data = await response.json();
      if (response.ok) {
        setFieldConfig(data);
      }
    } catch (error) {
      console.error("Fetch field config error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const isRequired = (field: string) => {
    return fieldConfig.required.includes(field);
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

    setLoading(true);

    try {
      const response = await fetch("/api/organizations/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    name: "법인명",
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-8">
            <div className="text-green-600 dark:text-green-400 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              회원가입 신청 완료
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              시스템 관리자의 승인을 기다려주세요.
              <br />
              승인이 완료되면 등록하신 이메일로 안내 드리겠습니다.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              로그인 페이지로 이동
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            환경측정기업 회원가입
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            환경측정기업 등록을 위한 정보를 입력해주세요
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 회사 정보 */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                회사 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(fieldLabels).map(([field, label]) => (
                  <div key={field} className={field === "address" ? "md:col-span-2" : ""}>
                    <label
                      htmlFor={field}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      {label}
                      {isRequired(field) && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <Input
                      id={field}
                      name={field}
                      type={field === "establishedDate" ? "date" : "text"}
                      value={(formData as any)[field]}
                      onChange={handleChange}
                      required={isRequired(field)}
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                관리자 정보
              </h2>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                기타 정보
              </h2>
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

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                {loading ? "처리 중..." : "회원가입 신청"}
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/login")}
                className="px-6 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3"
              >
                취소
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
