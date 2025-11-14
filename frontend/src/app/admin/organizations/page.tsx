"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import AdminHeader from "@/components/layout/AdminHeader";
import Link from "next/link";
import Input from "@/components/ui/Input";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  corporateNumber?: string;
  businessType?: string;
  address?: string;
  phone?: string;
  email?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  hasContractManagement: boolean; // 계약 관리 기능
  createdAt: string;
  users: any[];
  _count: {
    users: number;
    customers: number;
  };
}

export default function OrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [editingOrgId, setEditingOrgId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchOrganizations();
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrganizations();
    }
  }, [search, statusFilter, planFilter]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (planFilter !== "ALL") params.append("plan", planFilter);
      if (search) params.append("search", search);

      const response = await fetch(`/api/organizations?${params}`);
      const data = await response.json();

      if (response.ok) {
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error("Fetch organizations error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("이 공급회사를 승인하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchOrganizations();
      } else {
        alert(data.error || "승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("이 공급회사를 거부하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchOrganizations();
      } else {
        alert(data.error || "거부에 실패했습니다.");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const handleViewSystem = (organizationId: string) => {
    // 시스템 보기 모드: URL 파라미터로 조회 대상 조직을 명시적으로 전달
    router.push(`/dashboard?viewAsOrg=${organizationId}`);
  };

  const handleToggleContractManagement = async (id: string, currentValue: boolean) => {
    if (!confirm(`계약 관리 기능을 ${currentValue ? "비활성화" : "활성화"}하시겠습니까?`)) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasContractManagement: !currentValue }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || "설정이 변경되었습니다.");
        fetchOrganizations();
      } else {
        alert(data.error || "설정 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Toggle contract management error:", error);
      alert("설정 변경 중 오류가 발생했습니다.");
    }
  };

  const handleEditRow = (org: Organization) => {
    setEditingOrgId(org.id);
    setEditForm({
      subscriptionPlan: org.subscriptionPlan,
      subscriptionStatus: org.subscriptionStatus,
      isActive: org.isActive
    });
  };

  const handleSaveRow = async (orgId: string) => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      const data = await response.json();

      if (response.ok) {
        alert("구독 정보가 수정되었습니다.");
        setEditingOrgId(null);
        setEditForm({});
        fetchOrganizations();
      } else {
        alert(data.error || "수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save subscription error:", error);
      alert("수정 중 오류가 발생했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setEditingOrgId(null);
    setEditForm({});
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  const getPlanBadge = (plan: string) => {
    const colors: any = {
      FREE: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      BASIC: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      PLUS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      MASTER: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      STANDARD: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      PREMIUM: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
      ENTERPRISE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[plan] || colors.FREE;
  };

  const getSubscriptionStatusBadge = (status: string) => {
    const colors: any = {
      ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      TRIAL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      EXPIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      SUSPENDED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      CANCELLED: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return colors[status] || colors.TRIAL;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              환경측정기업 관리
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              환경측정기업 등록 승인 및 관리
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button>← 대시보드로</Button>
          </Link>
        </div>

      {/* 필터 및 통계 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* 통계 */}
          <div className="flex gap-4">
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">전체 </span>
              <span className="font-bold text-gray-900 dark:text-white">{organizations.length}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">승인대기 </span>
              <span className="font-bold text-yellow-600">{organizations.filter((o) => !o.isActive).length}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* 검색 및 필터 */}
          <Input
            type="text"
            placeholder="회사명 또는 사업자등록번호 검색"
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
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white"
          >
            <option value="ALL">전체 플랜</option>
            <option value="FREE">FREE</option>
            <option value="BASIC">BASIC</option>
            <option value="PLUS">PLUS</option>
            <option value="MASTER">MASTER</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  회사명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사업자등록번호
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  관리자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  구독플랜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  구독상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  사용자/고객사
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  활성상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {organizations.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {org.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {org.businessType || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {org.businessNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {org.users[0] ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.users[0].name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org.users[0].email}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrgId === org.id ? (
                      <select
                        value={editForm.subscriptionPlan}
                        onChange={(e) => setEditForm({...editForm, subscriptionPlan: e.target.value})}
                        className="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="FREE">FREE</option>
                        <option value="BASIC">BASIC</option>
                        <option value="PLUS">PLUS</option>
                        <option value="MASTER">MASTER</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(org.subscriptionPlan)}`}>
                        {org.subscriptionPlan}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrgId === org.id ? (
                      <select
                        value={editForm.subscriptionStatus}
                        onChange={(e) => setEditForm({...editForm, subscriptionStatus: e.target.value})}
                        className="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="TRIAL">TRIAL</option>
                        <option value="EXPIRED">EXPIRED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getSubscriptionStatusBadge(org.subscriptionStatus)}`}>
                        {org.subscriptionStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {org._count.users} / {org._count.customers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrgId === org.id ? (
                      <select
                        value={editForm.isActive ? "true" : "false"}
                        onChange={(e) => setEditForm({...editForm, isActive: e.target.value === "true"})}
                        className="px-2 py-1 text-xs border rounded dark:bg-gray-700 dark:border-gray-600"
                      >
                        <option value="true">활성</option>
                        <option value="false">비활성</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(org.isActive)}`}>
                        {org.isActive ? "활성" : "비활성"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingOrgId === org.id ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleSaveRow(org.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded text-left"
                        >
                          저장
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded text-left"
                        >
                          취소
                        </button>
                      </div>
                    ) : !org.isActive ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleApprove(org.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded text-left"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(org.id)}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded text-left"
                        >
                          거부
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => router.push(`/admin/organizations/${org.id}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded text-left"
                        >
                          상세
                        </button>
                        <button
                          onClick={() => handleViewSystem(org.id)}
                          className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 rounded text-left"
                        >
                          시스템 보기
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {organizations.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            등록된 공급회사가 없습니다.
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {organizations.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            등록된 공급회사가 없습니다.
          </div>
        ) : (
          organizations.map((org) => (
            <div key={org.id} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(org.isActive)}`}>
                  {org.isActive ? "활성" : "승인 대기"}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(org.subscriptionPlan)}`}>
                  {org.subscriptionPlan}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="font-medium text-lg">{org.name}</div>
                <div><span className="text-gray-500">🏢 업태:</span> {org.businessType || "-"}</div>
                <div><span className="text-gray-500">💼 사업자:</span> {org.businessNumber || "-"}</div>
                {org.users[0] && (
                  <div>
                    <span className="text-gray-500">👤 관리자:</span> {org.users[0].name}
                    <div className="text-xs text-gray-500 ml-6">{org.users[0].email}</div>
                  </div>
                )}
                <div><span className="text-gray-500">👥 사용자/고객사:</span> {org._count.users} / {org._count.customers}</div>
                <div><span className="text-gray-500">📅 등록일:</span> {new Date(org.createdAt).toLocaleDateString()}</div>
                <div className="flex flex-col gap-2 pt-2">
                  {!org.isActive ? (
                    <>
                      <button onClick={() => handleApprove(org.id)} className="w-full px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded text-sm">
                        승인
                      </button>
                      <button onClick={() => handleReject(org.id)} className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm">
                        거부
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => router.push(`/admin/organizations/${org.id}`)} className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm">
                        상세
                      </button>
                      <button onClick={() => handleViewSystem(org.id)} className="w-full px-3 py-2 bg-purple-500 text-white hover:bg-purple-600 rounded text-sm">
                        시스템 보기
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </div>
    </div>
  );
}
