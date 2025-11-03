"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";

interface DashboardStats {
  organizations: {
    total: number;
    pending: number;
    active: number;
  };
  customers: {
    total: number;
    pending: number;
    active: number;
  };
  users: {
    total: number;
    pending: number;
    active: number;
  };
  roles: {
    total: number;
    active: number;
    inactive: number;
  };
  permissions: {
    usersWithCustomRoles: number;
    usersWithDefaultRoles: number;
    totalPermissions: number;
  };
  recentActivities: Array<{
    id: string;
    action: string;
    details: string;
    createdAt: string;
  }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchStats();
      }
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  const totalPending = stats.organizations.pending + stats.customers.pending + stats.users.pending;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                대시보드
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                전체 시스템 현황 및 관리 기능
              </p>
            </div>
            
            {/* 알림 */}
            {totalPending > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  승인 대기 {totalPending}건
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
          {/* 환경측정기업 통계 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                환경측정기업
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  전체
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.organizations.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  승인 대기
                </span>
                <span className={`font-semibold ${stats.organizations.pending > 0 ? 'text-yellow-600 dark:text-yellow-400 animate-pulse' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {stats.organizations.pending}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 dark:text-green-400">
                  활성
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.organizations.active}
                </span>
              </div>
            </div>
            <Link
              href="/admin/organizations"
              className="mt-4 block w-full text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              환경측정기업 관리
            </Link>
          </div>

          {/* 고객회사 통계 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                고객회사
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  전체
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.customers.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  승인 대기
                </span>
                <span className={`font-semibold ${stats.customers.pending > 0 ? 'text-yellow-600 dark:text-yellow-400 animate-pulse' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {stats.customers.pending}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 dark:text-green-400">
                  활성
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.customers.active}
                </span>
              </div>
            </div>
            <Link
              href="/admin/customers"
              className="mt-4 block w-full text-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
            >
              고객회사 관리
            </Link>
          </div>

          {/* 사용자 통계 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                사용자
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  전체
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.users.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-yellow-600 dark:text-yellow-400">
                  승인 대기
                </span>
                <span className={`font-semibold ${stats.users.pending > 0 ? 'text-yellow-600 dark:text-yellow-400 animate-pulse' : 'text-yellow-600 dark:text-yellow-400'}`}>
                  {stats.users.pending}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 dark:text-green-400">
                  활성
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.users.active}
                </span>
              </div>
            </div>
            <Link
              href="/admin/users"
              className="mt-4 block w-full text-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
            >
              사용자 관리
            </Link>
          </div>

          {/* 역할 관리 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                역할 관리
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  전체
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.roles.total}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-600 dark:text-green-400">
                  활성
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {stats.roles.active}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  비활성
                </span>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  {stats.roles.inactive}
                </span>
              </div>
            </div>
            <Link
              href="/org/settings/roles"
              className="mt-4 block w-full text-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
            >
              역할 관리
            </Link>
          </div>

          {/* 권한 관리 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                권한 관리
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  커스텀 역할
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.permissions.usersWithCustomRoles}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-600 dark:text-blue-400">
                  기본 역할
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {stats.permissions.usersWithDefaultRoles}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-purple-600 dark:text-purple-400">
                  개별 권한
                </span>
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  {stats.permissions.totalPermissions}
                </span>
              </div>
            </div>
            <Link
              href="/org/settings/users"
              className="mt-4 block w-full text-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md transition-colors"
            >
              권한 관리
            </Link>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            최근 활동
          </h2>
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(activity.createdAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              최근 활동이 없습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
