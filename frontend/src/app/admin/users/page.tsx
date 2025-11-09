"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AdminHeader from "@/components/layout/AdminHeader";
import Link from "next/link";
import HelpModal from "@/components/modals/HelpModal";

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  status: string;
  isActive: boolean;
  companyName: string | null;
  department: string | null;
  position: string | null;
  createdAt: string;
  organization: any;
  customer: any;
  customRole?: {
    id: string;
    name: string;
  } | null;
}

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showInactive, setShowInactive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (!["SUPER_ADMIN", "ORG_ADMIN"].includes(userRole)) {
        router.push("/dashboard");
      } else {
        fetchUsers();
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
    }
  }, [search, statusFilter, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (roleFilter !== "ALL") params.append("role", roleFilter);
      if (search) params.append("search", search);

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users);
      } else {
        alert(data.error || "사용자 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch users error:", error);
      alert("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    if (!confirm("이 사용자를 승인하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (userId: string) => {
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "거부에 실패했습니다.");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`이 사용자를 ${currentStatus ? "비활성화" : "활성화"}하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Toggle active error:", error);
      alert("상태 변경 중 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("이 사용자를 삭제하시겠습니까? (복구 불가)")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const handleChangeRole = async (userId: string, newRole: string, currentRole: string) => {
    if (newRole === currentRole) return;

    if (!confirm(`역할을 ${getRoleName(newRole)}로 변경하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "역할 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Change role error:", error);
      alert("역할 변경 중 오류가 발생했습니다.");
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm("이 사용자의 비밀번호를 초기화하시겠습니까?\n초기화 후 기본 비밀번호는 12345678입니다.")) return;

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchUsers();
      } else {
        alert(data.error || "비밀번호 초기화에 실패했습니다.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      alert("비밀번호 초기화 중 오류가 발생했습니다.");
    }
  };

  const getRoleOptions = (currentRole: string) => {
    // 환경측정기업 역할군
    const orgRoles = [
      { value: "ORG_ADMIN", label: "환경측정기업 관리자" },
      { value: "OPERATOR", label: "환경측정기업 임직원" },
    ];
    
    // 고객사 역할군
    const customerRoles = [
      { value: "CUSTOMER_ADMIN", label: "고객사 관리자" },
      { value: "CUSTOMER_USER", label: "고객사 사용자" },
    ];
    
    // SUPER_ADMIN은 모든 역할 선택 가능
    const allRoles = [
      { value: "SUPER_ADMIN", label: "시스템 관리자" },
      ...orgRoles,
      ...customerRoles,
    ];
    
    // 현재 역할이 환경측정기업 계열이면 환경측정기업 역할만
    if (["ORG_ADMIN", "OPERATOR"].includes(currentRole)) {
      return orgRoles;
    }
    
    // 현재 역할이 고객사 계열이면 고객사 역할만
    if (["CUSTOMER_ADMIN", "CUSTOMER_USER"].includes(currentRole)) {
      return customerRoles;
    }
    
    // SUPER_ADMIN이면 모든 역할 선택 가능
    return allRoles;
  };

  const getRoleName = (role: string) => {
    const roles: any = {
      SUPER_ADMIN: "시스템 관리자",
      ORG_ADMIN: "환경측정기업 관리자",
      OPERATOR: "환경측정기업 임직원",
      CUSTOMER_ADMIN: "고객사 관리자",
      CUSTOMER_USER: "고객사 사용자",
    };
    return roles[role] || role;
  };

  const getRoleBadge = (role: string) => {
    const colors: any = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      ORG_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      OPERATOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      CUSTOMER_ADMIN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      CUSTOMER_USER: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[role] || colors.CUSTOMER_USER;
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      SUSPENDED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      WITHDRAWN: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[status] || colors.PENDING;
  };

  const filtered = users.filter((user) => {
    // PENDING 상태의 사용자는 항상 표시 (승인 대기 중이므로)
    if (user.status === "PENDING") return true;
    // 그 외의 경우 비활성 표시 옵션에 따라 필터링
    if (!showInactive && !user.isActive) return false;
    return true;
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">사용자 관리</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              회원 가입 승인 및 사용자 정보를 관리합니다.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowHelp(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
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

      {/* 필터 및 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 통계 */}
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">전체 </span>
              <span className="font-bold text-gray-900 dark:text-white">{users.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">승인대기 </span>
              <span className="font-bold text-yellow-600">{users.filter((u) => u.status === "PENDING").length}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* 검색 및 필터 */}
          <Input
            type="text"
            placeholder="검색 (이메일, 이름, 회사명)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">승인 대기</option>
            <option value="APPROVED">승인됨</option>
            <option value="REJECTED">거부됨</option>
            <option value="SUSPENDED">정지됨</option>
            <option value="WITHDRAWN">탈퇴</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">전체 역할</option>
            <option value="SUPER_ADMIN">시스템 관리자</option>
            <option value="ORG_ADMIN">공급회사 관리자</option>
            <option value="OPERATOR">공급회사 임직원</option>
            <option value="CUSTOMER_ADMIN">고객사 관리자</option>
            <option value="CUSTOMER_USER">고객사 사용자</option>
          </select>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">비활성 표시</span>
          </label>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)]">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  이메일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  역할
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  회사/부서
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((user) => (
                <tr
                  key={user.id}
                  className={!user.isActive ? "opacity-50" : ""}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                        user.status
                      )}`}
                    >
                      {user.status === "PENDING" && "승인대기"}
                      {user.status === "APPROVED" && "승인됨"}
                      {user.status === "REJECTED" && "거부됨"}
                      {user.status === "SUSPENDED" && "정지"}
                      {user.status === "WITHDRAWN" && "탈퇴"}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {(session?.user as any)?.role === "SUPER_ADMIN" && user.status === "APPROVED" ? (
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value, user.role)}
                          className={`px-2 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getRoleBadge(user.role)}`}
                        >
                          {getRoleOptions(user.role).map((role) => (
                            <option key={role.value} value={role.value}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {getRoleName(user.role)}
                        </span>
                      )}
                      {user.customRole && (
                        <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 rounded">
                          커스텀: {user.customRole.name}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {user.companyName || "-"}
                    {user.department && ` / ${user.department}`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {user.status === "PENDING" && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleApprove(user.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded text-left"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded text-left"
                        >
                          거부
                        </button>
                      </div>
                    )}
                    {user.status === "APPROVED" && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleToggleActive(user.id, user.isActive)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded text-left"
                        >
                          {user.isActive ? "비활성화" : "활성화"}
                        </button>
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 rounded text-left"
                        >
                          비밀번호 초기화
                        </button>
                        {!user.isActive && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded text-left"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            사용자가 없습니다.
          </div>
        ) : (
          filtered.map((user) => (
            <div key={user.id} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                  {user.status === "PENDING" && "승인 대기"}
                  {user.status === "APPROVED" && "승인됨"}
                  {user.status === "REJECTED" && "거부됨"}
                  {user.status === "SUSPENDED" && "정지"}
                  {user.status === "WITHDRAWN" && "탈퇴"}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                  {getRoleName(user.role)}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="font-medium text-lg">{user.name}</div>
                <div><span className="text-gray-500">📧 이메일:</span> {user.email}</div>
                <div><span className="text-gray-500">🏢 회사:</span> {user.companyName || "-"}</div>
                {user.department && <div><span className="text-gray-500">📍 부서:</span> {user.department}</div>}
                {user.customRole && (
                  <div><span className="text-gray-500">🎯 커스텀 역할:</span> {user.customRole.name}</div>
                )}
                <div><span className="text-gray-500">📅 가입일:</span> {new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="flex flex-col gap-2 pt-2">
                  {user.status === "PENDING" && (
                    <>
                      <button onClick={() => handleApprove(user.id)} className="w-full px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded text-sm">
                        승인
                      </button>
                      <button onClick={() => handleReject(user.id)} className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm">
                        거부
                      </button>
                    </>
                  )}
                  {user.status === "APPROVED" && (
                    <>
                      <button onClick={() => handleToggleActive(user.id, user.isActive)} className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm">
                        {user.isActive ? "비활성화" : "활성화"}
                      </button>
                      <button onClick={() => handleResetPassword(user.id)} className="w-full px-3 py-2 bg-yellow-500 text-white hover:bg-yellow-600 rounded text-sm">
                        비밀번호 초기화
                      </button>
                      {!user.isActive && (
                        <button onClick={() => handleDelete(user.id)} className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm">
                          삭제
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>

      {/* 도움말 모달 */}
      <HelpModal
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
        title="사용자 관리 가이드"
        sections={[
          {
            title: "개요",
            content: (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-4 rounded">
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">📌 이 페이지의 목적</h4>
                  <p className="text-blue-800 dark:text-blue-300">
                    사용자 관리 페이지는 <strong>계정 생명주기</strong>와 <strong>시스템 기본 역할</strong>을 관리하는 곳입니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">주요 기능</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>가입 승인/거부</strong>: 신규 회원 가입 요청을 검토하고 승인 또는 거부
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>시스템 역할 변경</strong>: 사용자의 기본 역할을 변경 (환경측정기업/고객사 내에서만)
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>계정 활성화/비활성화</strong>: 사용자의 로그인 권한 제어
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <div>
                        <strong>사용자 삭제</strong>: 비활성화된 계정을 완전히 삭제
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            ),
          },
          {
            title: "가입 승인",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">📝 가입 승인 프로세스</h4>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <div>
                      <h5 className="font-semibold mb-1">신규 가입 확인</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        상태 필터를 "승인 대기"로 설정하여 신규 가입 요청 확인
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <div>
                      <h5 className="font-semibold mb-1">정보 검토</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        이메일, 이름, 회사명, 역할 등 사용자 정보 확인
                      </p>
                      <ul className="mt-2 text-xs space-y-1 text-gray-500 dark:text-gray-500">
                        <li>• 환경측정기업: 사업자등록번호 확인 필수</li>
                        <li>• 고객사: 연결된 환경측정기업 확인</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <div>
                      <h5 className="font-semibold mb-1">승인 또는 거부</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        액션 컬럼에서 "승인" 또는 "거부" 버튼 클릭
                      </p>
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
                        ⚠️ 거부 시 사유를 입력해야 합니다. 사용자에게 거부 사유가 전달됩니다.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">💡 승인 기준</h5>
                  <ul className="text-sm space-y-1">
                    <li>• 실제 존재하는 회사인지 확인</li>
                    <li>• 업무용 이메일 주소 사용 여부</li>
                    <li>• 환경측정기업의 경우 사업자등록번호 검증</li>
                    <li>• 고객사의 경우 환경측정기업과의 계약 관계 확인</li>
                  </ul>
                </div>
              </div>
            ),
          },
          {
            title: "역할 변경",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🎭 시스템 역할 변경</h4>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 p-4 rounded">
                  <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-2">중요: 시스템 역할이란?</h5>
                  <p className="text-purple-800 dark:text-purple-300 text-sm">
                    시스템 역할은 플랫폼에서 제공하는 <strong>기본 역할</strong>입니다. 각 역할은 미리 정의된 권한 세트를 가지고 있습니다.
                  </p>
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold">환경측정기업 역할</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="border dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded text-xs font-medium">
                          ORG_ADMIN
                        </span>
                        <span className="text-sm font-semibold">환경측정기업 관리자</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        자사 직원 관리, 고객사 관리, 측정 데이터 관리 등 모든 권한 보유
                      </p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-medium">
                          OPERATOR
                        </span>
                        <span className="text-sm font-semibold">환경측정기업 임직원</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        담당 고객사의 측정 데이터 입력 및 조회 권한
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="font-semibold">고객사 역할</h5>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="border dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded text-xs font-medium">
                          CUSTOMER_ADMIN
                        </span>
                        <span className="text-sm font-semibold">고객사 관리자</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        자사 직원 관리, 자사 측정 데이터 조회, 굴뚝 정보 관리
                      </p>
                    </div>
                    
                    <div className="border dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded text-xs font-medium">
                          CUSTOMER_USER
                        </span>
                        <span className="text-sm font-semibold">고객사 사용자</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        자사 측정 데이터 조회만 가능 (읽기 전용)
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">⚠️ 역할 변경 제한사항</h5>
                  <ul className="text-sm space-y-1">
                    <li>• 환경측정기업 역할 ↔ 고객사 역할 간 변경 불가</li>
                    <li>• 환경측정기업 내에서만 변경 가능: ORG_ADMIN ↔ OPERATOR</li>
                    <li>• 고객사 내에서만 변경 가능: CUSTOMER_ADMIN ↔ CUSTOMER_USER</li>
                    <li>• SUPER_ADMIN은 모든 역할로 변경 가능</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">📝 역할 변경 방법</h5>
                  <ol className="text-sm space-y-2">
                    <li>1. 역할 컬럼에서 드롭다운 메뉴 클릭</li>
                    <li>2. 변경할 역할 선택</li>
                    <li>3. 확인 메시지에서 "확인" 클릭</li>
                    <li>4. 변경 완료 후 자동으로 목록 새로고침</li>
                  </ol>
                </div>
              </div>
            ),
          },
          {
            title: "계정 관리",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🔐 계정 활성화/비활성화</h4>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-4 rounded">
                    <h5 className="font-semibold mb-2">비활성화</h5>
                    <p className="text-sm mb-2">사용자의 로그인을 일시적으로 차단합니다.</p>
                    <ul className="text-sm space-y-1">
                      <li>• 계정 데이터는 유지됩니다</li>
                      <li>• 로그인 불가능</li>
                      <li>• 언제든지 다시 활성화 가능</li>
                      <li>• 비활성화 상태에서만 삭제 가능</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded">
                    <h5 className="font-semibold mb-2">활성화</h5>
                    <p className="text-sm mb-2">비활성화된 사용자를 다시 활성화합니다.</p>
                    <ul className="text-sm space-y-1">
                      <li>• 로그인 가능</li>
                      <li>• 모든 권한 복구</li>
                      <li>• 기존 데이터 유지</li>
                    </ul>
                  </div>
                </div>

                <h4 className="font-semibold text-lg mt-6">🗑️ 사용자 삭제</h4>
                
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                  <h5 className="font-semibold text-red-900 dark:text-red-200 mb-2">⚠️ 주의사항</h5>
                  <ul className="text-sm space-y-1 text-red-800 dark:text-red-300">
                    <li>• <strong>영구 삭제</strong>되며 복구 불가능</li>
                    <li>• 비활성화 상태에서만 삭제 가능</li>
                    <li>• 관련 데이터도 함께 삭제될 수 있음</li>
                    <li>• 삭제 전 반드시 데이터 백업 권장</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">📝 삭제 절차</h5>
                  <ol className="text-sm space-y-2">
                    <li>1. 먼저 사용자를 비활성화</li>
                    <li>2. 비활성화 후 "삭제" 버튼 표시됨</li>
                    <li>3. "삭제" 버튼 클릭</li>
                    <li>4. 확인 메시지에서 최종 확인</li>
                    <li>5. 삭제 완료</li>
                  </ol>
                </div>
              </div>
            ),
          },
          {
            title: "vs 권한 관리",
            content: (
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">🔄 사용자 관리 vs 권한 관리</h4>
                
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm mb-3">
                    두 메뉴는 서로 다른 목적을 가지고 있으며, <strong>함께 사용</strong>할 수 있습니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4">
                    <h5 className="font-bold text-blue-900 dark:text-blue-200 mb-3 flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      사용자 관리 (이 페이지)
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
                          <li>• 활성화/비활성화</li>
                          <li>• <strong className="text-blue-600">시스템 기본 역할 변경</strong></li>
                        </ul>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                        <strong>관리 대상:</strong> 시스템 역할
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          ORG_ADMIN, OPERATOR, CUSTOMER_ADMIN, CUSTOMER_USER
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-2 border-purple-300 dark:border-purple-700 rounded-lg p-4">
                    <h5 className="font-bold text-purple-900 dark:text-purple-200 mb-3 flex items-center gap-2">
                      <span className="text-2xl">🔐</span>
                      권한 관리
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                        <strong>목적:</strong> 세부 권한 설정
                      </div>
                      <div className="space-y-1">
                        <strong>주요 기능:</strong>
                        <ul className="ml-4 space-y-1">
                          <li>• <strong className="text-purple-600">커스텀 역할 할당</strong></li>
                          <li>• 접근 범위 조정</li>
                          <li>• 개별 권한 설정</li>
                          <li>• 권한 오버라이드</li>
                        </ul>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                        <strong>관리 대상:</strong> 커스텀 역할
                        <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                          조직별로 생성한 역할 (예: 선임 실무자, 지역 관리자)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-3">💡 사용 시나리오</h5>
                  
                  <div className="space-y-3">
                    <div className="border-l-4 border-green-500 pl-3">
                      <strong className="text-green-700 dark:text-green-400">시나리오 1: 기본 역할만 사용</strong>
                      <p className="text-sm mt-1">
                        사용자 관리에서 시스템 역할만 설정하고 권한 관리는 사용하지 않음
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        → 시스템 기본 권한만 적용됨
                      </p>
                    </div>

                    <div className="border-l-4 border-blue-500 pl-3">
                      <strong className="text-blue-700 dark:text-blue-400">시나리오 2: 커스텀 역할 추가</strong>
                      <p className="text-sm mt-1">
                        사용자 관리에서 시스템 역할 설정 + 권한 관리에서 커스텀 역할 할당
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        → 커스텀 역할의 권한이 시스템 역할 권한을 오버라이드
                      </p>
                    </div>

                    <div className="border-l-4 border-purple-500 pl-3">
                      <strong className="text-purple-700 dark:text-purple-400">시나리오 3: 세부 권한 조정</strong>
                      <p className="text-sm mt-1">
                        특정 사용자에게만 추가 권한 부여 또는 일부 권한 제한
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        → 권한 관리에서 개별 권한 조정
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                  <h5 className="font-semibold mb-2">🎯 권장 워크플로우</h5>
                  <ol className="text-sm space-y-2">
                    <li>
                      <strong>1단계:</strong> 사용자 관리에서 가입 승인 및 시스템 역할 설정
                    </li>
                    <li>
                      <strong>2단계:</strong> 기본 권한으로 충분하면 완료
                    </li>
                    <li>
                      <strong>3단계:</strong> 추가 권한이 필요하면 권한 관리에서 커스텀 역할 할당
                    </li>
                    <li>
                      <strong>4단계:</strong> 필요시 개별 권한 세부 조정
                    </li>
                  </ol>
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
