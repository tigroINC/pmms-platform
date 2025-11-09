"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SystemManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">시스템 관리</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">플랫폼 전체의 환경측정기업, 사용자, 역할, 권한을 관리합니다</p>
        </div>
        <Link href="/admin/dashboard">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            ← 대시보드로
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 환경측정기업 관리 카드 */}
        <Link href="/admin/organizations" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-2xl">
                🏢
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">환경측정기업</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              환경측정기업의 가입 승인, 정보 수정, 구독 관리를 수행합니다.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 사용자 관리 카드 */}
        <Link href="/admin/users" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">사용자 관리</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              계정 생명주기 및 시스템 기본 역할을 관리합니다. (가입 승인, 삭제, 역할 변경)
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 역할 관리 카드 */}
        <Link href="/org/settings/roles" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-2xl">
                🎭
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">역할 관리</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              역할 템플릿을 기반으로 커스텀 역할을 생성하고 권한을 설정합니다.
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 권한 관리 카드 */}
        <Link href="/org/settings/users" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center text-2xl">
                🔐
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">권한 관리</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              커스텀 역할 할당 및 세부 권한을 조정합니다. (접근 범위, 개별 권한 설정)
            </p>
            <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-8 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300">시스템 관리 안내</h3>
            <div className="mt-2 text-sm text-purple-700 dark:text-purple-400">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>환경측정기업 관리</strong>: 가입 승인, 회사 정보 관리, 구독 관리</li>
                <li><strong>사용자 관리</strong>: 계정 생명주기 및 시스템 기본 역할 관리 (가입 승인, 삭제, 역할 변경)</li>
                <li><strong>역할 관리</strong>: 역할 템플릿 기반 커스텀 역할 생성 및 권한 코드 설정</li>
                <li><strong>권한 관리</strong>: 커스텀 역할 할당 및 세부 권한 조정 (접근 범위, 개별 권한)</li>
              </ul>
              <p className="mt-3 text-xs text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/40 rounded p-2">
                💡 <strong>사용자 관리 vs 권한 관리</strong>: 사용자 관리는 시스템 기본 역할(ORG_ADMIN, OPERATOR 등)을 변경하고, 권한 관리는 커스텀 역할을 할당합니다. 두 기능은 별도로 관리되며 함께 사용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">환경측정기업</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              🏢
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">전체 사용자</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">커스텀 역할</p>
              <p className="text-3xl font-bold mt-2">-</p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              🎭
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
