"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import InviteStaffModal from "@/components/staff/InviteStaffModal";
import { useOrganization } from "@/contexts/OrganizationContext";

interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  department: string | null;
  position: string | null;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: {
    assignedCustomers: number;
  };
}

export default function StaffManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

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
      if (selectedOrg) {
        fetchStaff();
      }
    }
  }, [session, status, router, selectedOrg]);

  const fetchStaff = async () => {
    if (!selectedOrg) return;
    
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        role: roleFilter,
        organizationId: selectedOrg.id,
      });
      
      const response = await fetch(`/api/org/staff?${params}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data.staff || []);
      } else {
        alert(data.error || "직원 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch staff error:", error);
      alert("직원 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user && selectedOrg) {
      fetchStaff();
    }
  }, [search, statusFilter, roleFilter, selectedOrg]);

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      ORG_ADMIN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      OPERATOR: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    const labels: Record<string, string> = {
      SUPER_ADMIN: "시스템 관리자",
      ORG_ADMIN: "조직 관리자",
      OPERATOR: "실무자",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[role] || "bg-gray-100 text-gray-800"}`}>
        {labels[role] || role}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Compact Header */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <h1 className="text-lg font-semibold mb-2">직원 관리</h1>
        
        {/* 필터 */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <Input
              className="text-sm h-8"
              style={{ width: '352px', minWidth: '352px' }}
              type="text"
              placeholder="이름, 이메일 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm h-8 border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ALL">전체</option>
              <option value="ACTIVE">활성</option>
              <option value="INACTIVE">비활성</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">역할</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-sm h-8 border border-gray-300 dark:border-gray-600 rounded-md px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="ALL">전체</option>
              <option value="ORG_ADMIN">조직 관리자</option>
              <option value="OPERATOR">실무자</option>
            </select>
          </div>

          <div className="flex gap-1.5 mb-1.5 ml-auto">
            <Button size="sm" onClick={() => setShowInviteModal(true)}>
              + 직원 초대
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">이메일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">역할</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">부서/직책</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">담당 고객사</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">마지막 로그인</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">액션</th>
            </tr>
          </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    직원이 없습니다.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        member.isActive 
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}>
                        {member.isActive ? "활성" : "비활성"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {member.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(member.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.department && member.position 
                        ? `${member.department} / ${member.position}`
                        : member.department || member.position || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member._count.assignedCustomers}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {member.lastLoginAt 
                        ? new Date(member.lastLoginAt).toLocaleDateString('ko-KR')
                        : "없음"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link 
                        href={`/org/staff/${member.id}`}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        상세
                      </Link>
                    </td>
                  </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {staff.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            직원이 없습니다.
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.id} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  member.isActive 
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                    : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                }`}>
                  {member.isActive ? "활성" : "비활성"}
                </span>
                <Link 
                  href={`/org/staff/${member.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  상세
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2"><span className="text-gray-500">👤 이름:</span> <span className="font-medium">{member.name}</span></div>
                <div className="col-span-2"><span className="text-gray-500">📧 이메일:</span> {member.email}</div>
                <div><span className="text-gray-500">🏷️ 역할:</span> {getRoleBadge(member.role)}</div>
                <div><span className="text-gray-500">🏢 부서/직책:</span> {member.department && member.position ? `${member.department} / ${member.position}` : member.department || member.position || "-"}</div>
                <div><span className="text-gray-500">📍 담당:</span> {member._count.assignedCustomers}개</div>
                <div><span className="text-gray-500">🕐 로그인:</span> {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString('ko-KR') : "없음"}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 직원 초대 모달 */}
      {showInviteModal && (
        <InviteStaffModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            fetchStaff();
          }}
        />
      )}
    </section>
  );
}
