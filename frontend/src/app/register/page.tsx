"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { CompanyRegistrationModal } from "@/components/modals/CompanyRegistrationModal";

type UserType = "organization" | "customer" | null;
type Company = {
  id: string;
  name: string;
  businessNumber: string;
  address?: string;
  type: string;
  isActive?: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"select" | "search" | "form">("select");
  const [userType, setUserType] = useState<UserType>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searching, setSearching] = useState(false);
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    phone: "",
    department: "",
    position: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 회사 검색
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `/api/companies/search?q=${encodeURIComponent(searchQuery)}&type=${userType}`
        );
        const data = await response.json();
        setSearchResults(data.companies || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, userType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep("search");
  };

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setStep("form");
  };

  const handleNewCompany = () => {
    setShowNewCompanyModal(true);
  };

  const handleCompanyCreated = (company: Company) => {
    // 신규 업체 등록 시 관리자 정보가 곧 사용자 정보이므로
    // 바로 성공 화면으로 이동 (승인 대기)
    setShowNewCompanyModal(false);
    setSuccess(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // 비밀번호 확인
    if (formData.password !== formData.passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다.");
      setLoading(false);
      return;
    }

    // 비밀번호 강도 검증
    if (formData.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      setLoading(false);
      return;
    }

    try {
      let endpoint = "";
      let payload: any = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        department: formData.department,
        position: formData.position,
      };

      if (userType === "organization") {
        // 환경측정업체 임직원 등록
        endpoint = "/api/operators/register";
        payload.businessNumber = selectedCompany?.businessNumber;
      } else if (userType === "customer") {
        // 고객사 사용자 등록
        endpoint = "/api/auth/register";
        payload.companyName = selectedCompany?.name;
        payload.businessNumber = selectedCompany?.businessNumber;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "회원가입에 실패했습니다.");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
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
              관리자의 승인을 기다려주세요.
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

  // Step 1: 사용자 유형 선택
  if (step === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              회원가입
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              가입 유형을 선택해주세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => handleUserTypeSelect("organization")}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500 text-center"
            >
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                환경측정업체
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                측정 대행 업체 소속 임직원
              </p>
            </button>

            <button
              onClick={() => handleUserTypeSelect("customer")}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500 text-center"
            >
              <div className="text-4xl mb-4">🏭</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                고객사
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                측정 의뢰 고객사 임직원
              </p>
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              ← 로그인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: 회사 검색
  if (step === "search") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full space-y-8">
          <div>
            <button
              onClick={() => {
                setStep("select");
                setUserType(null);
                setSearchQuery("");
                setSearchResults([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 mb-4"
            >
              ← 뒤로 가기
            </button>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              {userType === "organization" ? "소속 환경측정업체" : "소속 고객사"} 검색
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              회사명 또는 사업자등록번호를 입력하세요
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="회사명 또는 사업자등록번호 입력"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-lg"
                autoFocus
              />
              {searching && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>

            {searchResults.length > 0 && (
              <div className="border border-gray-200 dark:border-gray-700 rounded-md divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
                {searchResults.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanySelect(company)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </div>
                      {company.isActive === false && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                          승인 대기 중
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {company.businessNumber}
                    </div>
                    {company.address && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {company.address}
                      </div>
                    )}
                    {company.isActive === false && (
                      <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                        💡 임시 등록 가능 - 회사 승인 시 관리자가 확인합니다
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleNewCompany}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3"
              >
                + 회사 신규 등록
              </Button>
            </div>
          </div>
        </div>

        {showNewCompanyModal && (
          <CompanyRegistrationModal
            userType={userType!}
            onClose={() => setShowNewCompanyModal(false)}
            onSuccess={handleCompanyCreated}
            initialName={searchQuery}
          />
        )}
      </div>
    );
  }

  // Step 3: 사용자 정보 입력 폼

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => {
              setStep("search");
              setSelectedCompany(null);
            }}
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 mb-4"
          >
            ← 뒤로 가기
          </button>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            사용자 정보 입력
          </h2>
          <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <span className="font-semibold">선택한 회사:</span> {selectedCompany?.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedCompany?.businessNumber}
                </div>
              </div>
              {selectedCompany?.isActive === false && (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  승인 대기 중
                </span>
              )}
            </div>
            {selectedCompany?.isActive === false && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  💡 <strong>임시 등록 안내:</strong> 이 회사는 현재 시스템 관리자의 승인을 기다리고 있습니다.
                  <br />
                  회원가입을 진행하시면 임시 등록되며, 회사 승인 시 해당 회사의 관리자가 귀하의 가입 신청을 확인하고 승인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="example@company.com"
                value={formData.email}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호 <span className="text-red-500">*</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="최소 8자 이상"
                value={formData.password}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                비밀번호 확인 <span className="text-red-500">*</span>
              </label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                placeholder="비밀번호 재입력"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="홍길동"
                value={formData.name}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전화번호
              </label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>


            {/* 부서 */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                부서
              </label>
              <Input
                id="department"
                name="department"
                type="text"
                placeholder="환경관리팀"
                value={formData.department}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* 직책 */}
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                직책
              </label>
              <Input
                id="position"
                name="position"
                type="text"
                placeholder="대리"
                value={formData.position}
                onChange={handleChange}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </h3>
                </div>
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
