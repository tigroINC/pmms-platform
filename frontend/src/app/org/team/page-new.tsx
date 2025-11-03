"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TeamManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">팀 관리</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">조직의 직원, 역할, 권한을 관리합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 직원 관리 카드 */}
        <Link href="/admin/users" className="block">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">직원 관리</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              조직 구성원의 가입 승인, 정보 수정, 활성화/비활성화를 관리합니다.
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
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center text-2xl">
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
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center text-2xl">
                🔐
              </div>
              <h2 className="ml-4 text-xl font-semibold text-gray-900 dark:text-white">권한 관리</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              사용자별로 커스텀 역할을 할당하고 개별 권한을 조정합니다.
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
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">팀 관리 안내</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
              <ul className="list-disc list-inside space-y-1">
                <li>직원 관리: 가입 승인, 사용자 정보 관리</li>
                <li>역할 관리: 역할 템플릿 기반 커스텀 역할 생성</li>
                <li>권한 관리: 사용자별 역할 할당 및 개별 권한 조정</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
