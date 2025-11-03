"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import HelpModal from "@/components/modals/HelpModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  customRole: {
    id: string;
    name: string;
  } | null;
  accessScope: string;
  isActive: boolean;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
}

export default function UsersPermissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchData();
    }
  }, [session, status, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchCustomRoles()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchCustomRoles = async () => {
    try {
      const res = await fetch("/api/custom-roles");
      const data = await res.json();
      if (res.ok) {
        setCustomRoles(data.customRoles || []);
      }
    } catch (error) {
      console.error("Error fetching custom roles:", error);
    }
  };

  const handleRoleChange = async (userId: string, customRoleId: string | null) => {
    try {
      const res = await fetch(`/api/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customRoleId }),
      });

      if (res.ok) {
        alert("역할이 변경되었습니다.");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "역할 변경 실패");
      }
    } catch (error) {
      console.error("Error changing role:", error);
      alert("역할 변경 중 오류가 발생했습니다.");
    }
  };

  const getRoleBadge = (role: string) => {
    const styles: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800",
      ORG_ADMIN: "bg-blue-100 text-blue-800",
      OPERATOR: "bg-green-100 text-green-800",
      CUSTOMER_GROUP_ADMIN: "bg-yellow-100 text-yellow-800",
      CUSTOMER_SITE_ADMIN: "bg-orange-100 text-orange-800",
      CUSTOMER_USER: "bg-gray-100 text-gray-800",
    };
    
    const labels: Record<string, string> = {
      SUPER_ADMIN: "시스템 관리자",
      ORG_ADMIN: "조직 관리자",
      OPERATOR: "실무자",
      CUSTOMER_GROUP_ADMIN: "그룹 관리자",
      CUSTOMER_SITE_ADMIN: "사업장 관리자",
      CUSTOMER_USER: "일반 사용자",
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[role] || "bg-gray-100 text-gray-800"}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getAccessScopeBadge = (scope: string) => {
    const labels: Record<string, string> = {
      SYSTEM: "시스템 전체",
      ORGANIZATION: "조직 전체",
      GROUP: "그룹",
      SITE: "사업장",
      ASSIGNED: "담당",
      SELF: "본인",
    };

    return (
      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
        {labels[scope] || scope}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AdminHeader />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">사용자 권한 관리</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              사용자별 역할 및 권한 설정
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              도움말
            </button>
            <Link href="/admin/dashboard">
              <Button>← 대시보드로</Button>
            </Link>
          </div>
        </div>

        {/* 검색 필터 */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="사용자 이름 또는 이메일 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
        </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시스템 역할</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">커스텀 역할</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">접근 범위</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users
              .filter((user) =>
                search === "" ||
                user.name.toLowerCase().includes(search.toLowerCase()) ||
                user.email.toLowerCase().includes(search.toLowerCase())
              )
              .map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.customRole?.id || ""}
                      onChange={(e) => handleRoleChange(user.id, e.target.value || null)}
                      className="border rounded px-2 py-1 text-sm"
                      disabled={user.role === "SUPER_ADMIN"}
                    >
                      <option value="">기본 역할 사용</option>
                      {customRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAccessScopeBadge(user.accessScope)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPermissionModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={user.role === "SUPER_ADMIN"}
                    >
                      개별 권한 설정
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* 개별 권한 설정 모달 */}
      {showPermissionModal && selectedUser && (
        <UserPermissionModal
          user={selectedUser}
          onClose={() => {
            setShowPermissionModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowPermissionModal(false);
            setSelectedUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* 도움말 모달 */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="권한 관리 가이드"
        sections={[
          {
            title: "개요",
            content: (
              <div className="space-y-4">
                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 p-4 rounded">
                  <h4 className="font-bold text-purple-900 dark:text-purple-200 mb-2">📌 이 페이지의 목적</h4>
                  <p className="text-purple-800 dark:text-purple-300">
                    권한 관리 페이지는 <strong>커스텀 역할 할당</strong>과 <strong>세부 권한 설정</strong>을 관리하는 곳입니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">주요 기능</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>커스텀 역할 할당</strong>: 조직별로 생성한 역할을 사용자에게 할당
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>접근 범위 조정</strong>: 사용자가 접근할 수 있는 데이터 범위 설정
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>개별 권한 설정</strong>: 특정 사용자에게만 추가 권한 부여 또는 제한
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded">
                  <h5 className="font-semibold mb-2">💡 사용자 관리와의 차이</h5>
                  <p className="text-sm">
                    <strong>사용자 관리</strong>는 시스템 기본 역할(ORG_ADMIN, OPERATOR 등)을 변경하고,
                    <strong className="text-purple-600"> 권한 관리(이 페이지)</strong>는 커스텀 역할을 할당하여 세부 권한을 조정합니다.
                  </p>
                </div>
              </div>
            ),
          },
          {
            title: "커스텀 역할",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🎭 커스텀 역할이란?</h4>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 p-4 rounded">
                  <p className="text-purple-800 dark:text-purple-300 text-sm">
                    커스텀 역할은 <strong>조직별로 생성한 맞춤형 역할</strong>입니다. 시스템 기본 역할의 권한을 기반으로 하되, 
                    조직의 필요에 따라 권한을 추가하거나 제한할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold">커스텀 역할 예시</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="border dark:border-gray-700 rounded-lg p-3 bg-blue-50 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">👔</span>
                        <span className="text-sm font-semibold">선임 실무자</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        기본 OPERATOR 권한 + 측정 데이터 승인 권한 + 보고서 작성 권한
                      </p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-3 bg-green-50 dark:bg-green-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🌍</span>
                        <span className="text-sm font-semibold">지역 관리자</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        특정 지역 고객사만 관리 + 해당 지역 직원 관리 권한
                      </p>
                    </div>

                    <div className="border dark:border-gray-700 rounded-lg p-3 bg-orange-50 dark:bg-orange-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">📊</span>
                        <span className="text-sm font-semibold">데이터 분석가</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        모든 측정 데이터 조회 권한 + 통계 분석 권한 (수정 권한 없음)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">📝 커스텀 역할 할당 방법</h5>
                  <ol className="text-sm space-y-2">
                    <li>1. 커스텀 역할 컬럼에서 드롭다운 메뉴 클릭</li>
                    <li>2. 할당할 커스텀 역할 선택 (또는 "기본 역할 사용" 선택)</li>
                    <li>3. 자동으로 저장됨</li>
                  </ol>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    💡 커스텀 역할은 "역할 관리" 메뉴에서 생성할 수 있습니다.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">⚠️ 주의사항</h5>
                  <ul className="text-sm space-y-1">
                    <li>• SUPER_ADMIN에게는 커스텀 역할을 할당할 수 없습니다</li>
                    <li>• 커스텀 역할이 없으면 시스템 기본 역할의 권한이 적용됩니다</li>
                    <li>• 커스텀 역할을 할당하면 시스템 역할의 권한을 오버라이드합니다</li>
                  </ul>
                </div>
              </div>
            ),
          },
          {
            title: "접근 범위",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🎯 접근 범위(Access Scope)</h4>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    접근 범위는 사용자가 <strong>어떤 데이터에 접근할 수 있는지</strong>를 정의합니다.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-xs font-bold">SYSTEM</span>
                      <span className="font-semibold text-sm">시스템 전체</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      모든 조직, 모든 고객사의 데이터에 접근 가능 (SUPER_ADMIN 전용)
                    </p>
                  </div>

                  <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs font-bold">ORGANIZATION</span>
                      <span className="font-semibold text-sm">조직 전체</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      자신이 속한 조직의 모든 고객사 데이터에 접근 가능 (ORG_ADMIN 기본값)
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-orange-600 text-white rounded text-xs font-bold">ASSIGNED</span>
                      <span className="font-semibold text-sm">담당</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      자신에게 할당된 고객사의 데이터만 접근 가능 (OPERATOR 기본값)
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-500 bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-gray-600 text-white rounded text-xs font-bold">SELF</span>
                      <span className="font-semibold text-sm">본인</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      자신의 데이터만 접근 가능 (고객사 사용자 기본값)
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: "개별 권한",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🔧 개별 권한 설정</h4>
                
                <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 p-4 rounded">
                  <h5 className="font-bold text-orange-900 dark:text-orange-200 mb-2">개별 권한이란?</h5>
                  <p className="text-orange-800 dark:text-orange-300 text-sm">
                    특정 사용자에게만 <strong>추가 권한을 부여</strong>하거나 <strong>일부 권한을 제한</strong>할 수 있는 기능입니다.
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">📝 개별 권한 설정 방법</h5>
                  <ol className="text-sm space-y-2">
                    <li>1. 액션 컬럼에서 "개별 권한 설정" 버튼 클릭</li>
                    <li>2. 권한 설정 모달에서 권한 코드 선택</li>
                    <li>3. 권한 부여(Grant) 또는 거부(Deny) 선택</li>
                    <li>4. 저장 버튼 클릭</li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">🎯 권한 적용 순서</h5>
                  <ol className="text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">1.</span>
                      <div>
                        <strong>개별 권한</strong> (최우선)
                        <p className="text-xs text-gray-600 dark:text-gray-400">특정 사용자에게 설정한 권한</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">2.</span>
                      <div>
                        <strong>커스텀 역할 권한</strong>
                        <p className="text-xs text-gray-600 dark:text-gray-400">할당된 커스텀 역할의 권한</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-blue-600">3.</span>
                      <div>
                        <strong>시스템 역할 권한</strong> (기본값)
                        <p className="text-xs text-gray-600 dark:text-gray-400">ORG_ADMIN, OPERATOR 등의 기본 권한</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <h5 className="font-semibold">사용 예시</h5>
                  
                  <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <strong className="text-green-700 dark:text-green-400 text-sm">예시 1: 추가 권한 부여</strong>
                    <p className="text-sm mt-1">
                      일반 OPERATOR에게 보고서 승인 권한 추가
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <strong className="text-red-700 dark:text-red-400 text-sm">예시 2: 권한 제한</strong>
                    <p className="text-sm mt-1">
                      특정 관리자의 삭제 권한만 제한
                    </p>
                  </div>
                </div>
              </div>
            ),
          },
          {
            title: "vs 사용자 관리",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🔄 권한 관리 vs 사용자 관리</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
                    <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🔐</span>
                      권한 관리 (이 페이지)
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                        <strong>목적:</strong> 세부 권한 설정
                      </div>
                      <div className="space-y-1">
                        <strong>주요 기능:</strong>
                        <ul className="ml-4 space-y-1">
                          <li>• 커스텀 역할 할당</li>
                          <li>• 접근 범위 조정</li>
                          <li>• 개별 권한 설정</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                    <h5 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      사용자 관리
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                        <strong>목적:</strong> 계정 생명주기 관리
                      </div>
                      <div className="space-y-1">
                        <strong>주요 기능:</strong>
                        <ul className="ml-4 space-y-1">
                          <li>• 가입 승인/거부</li>
                          <li>• 사용자 삭제</li>
                          <li>• 시스템 역할 변경</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">🎯 권장 워크플로우</h5>
                  <ol className="text-sm space-y-2">
                    <li><strong>1단계:</strong> 사용자 관리에서 가입 승인 및 시스템 역할 설정</li>
                    <li><strong>2단계:</strong> 기본 권한으로 충분하면 완료</li>
                    <li><strong>3단계:</strong> 추가 권한 필요 시 권한 관리에서 커스텀 역할 할당</li>
                    <li><strong>4단계:</strong> 필요시 개별 권한 세부 조정</li>
                  </ol>
                </div>
              </div>
            ),
          },
        ]}
      />
      </div>
    </div>
  );
}

// 개별 권한 설정 모달 컴포넌트
function UserPermissionModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUserPermissions();
  }, [user.id]);

  const fetchUserPermissions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${user.id}/permissions`);
      const data = await res.json();
      
      if (res.ok) {
        const permMap: Record<string, boolean> = {};
        data.permissions.forEach((p: any) => {
          permMap[p.permissionCode] = p.granted;
        });
        setPermissions(permMap);
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permissionsList = Object.entries(permissions).map(([code, granted]) => ({
        permissionCode: code,
        granted,
      }));

      const res = await fetch(`/api/users/${user.id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: permissionsList }),
      });

      if (res.ok) {
        alert("권한이 저장되었습니다.");
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.error || "권한 저장 실패");
      }
    } catch (error) {
      console.error("Error saving permissions:", error);
      alert("권한 저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const PERMISSION_CATEGORIES = [
    {
      name: "고객사 관리",
      permissions: [
        { code: "customer.view", name: "고객사 조회" },
        { code: "customer.create", name: "고객사 등록" },
        { code: "customer.update", name: "고객사 수정" },
        { code: "customer.delete", name: "고객사 삭제" },
      ],
    },
    {
      name: "측정 데이터",
      permissions: [
        { code: "measurement.view", name: "측정 데이터 조회" },
        { code: "measurement.create", name: "측정 데이터 입력" },
        { code: "measurement.update", name: "측정 데이터 수정" },
        { code: "measurement.delete", name: "측정 데이터 삭제" },
      ],
    },
    {
      name: "사용자 관리",
      permissions: [
        { code: "user.view", name: "사용자 조회" },
        { code: "user.create", name: "사용자 등록" },
        { code: "user.update", name: "사용자 수정" },
        { code: "user.delete", name: "사용자 삭제" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
          개별 권한 설정: {user.name}
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-500">로딩 중...</div>
        ) : (
          <>
            <div className="mb-4 p-4 bg-blue-50 rounded">
              <p className="text-sm text-blue-800">
                💡 개별 권한은 역할 권한보다 우선 적용됩니다. 
                특정 권한만 추가하거나 제거할 때 사용하세요.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {PERMISSION_CATEGORIES.map((category) => (
                <div key={category.name} className="border rounded p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{category.name}</h3>
                  <div className="space-y-2">
                    {category.permissions.map((perm) => (
                      <label
                        key={perm.code}
                        className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={permissions[perm.code] || false}
                          onChange={(e) => {
                            setPermissions({
                              ...permissions,
                              [perm.code]: e.target.checked,
                            });
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                disabled={saving}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                disabled={saving}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
