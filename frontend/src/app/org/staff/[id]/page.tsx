"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import AssignCustomersModal from "@/components/staff/AssignCustomersModal";

interface StaffDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  isActive: boolean;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  assignedCustomers: Array<{
    id: string;
    customer: {
      id: string;
      name: string;
      businessNumber: string;
    };
    isPrimary: boolean;
  }>;
}

export default function StaffDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id as string;

  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    department: "",
    position: "",
    role: "",
  });

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
      fetchStaffDetail();
    }
  }, [session, status, router, staffId]);

  const fetchStaffDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/org/staff/${staffId}`);
      const data = await response.json();

      if (response.ok) {
        setStaff(data.staff);
        setFormData({
          name: data.staff.name || "",
          phone: data.staff.phone || "",
          department: data.staff.department || "",
          position: data.staff.position || "",
          role: data.staff.role || "",
        });
      } else {
        alert(data.error || "직원 정보를 불러오는데 실패했습니다.");
        router.push("/org/staff");
      }
    } catch (error) {
      console.error("Fetch staff detail error:", error);
      alert("직원 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/org/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("저장되었습니다.");
        setEditing(false);
        fetchStaffDetail();
      } else {
        alert(data.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleToggleActive = async () => {
    if (!staff) return;

    const action = staff.isActive ? "비활성화" : "활성화";
    if (!confirm(`이 직원을 ${action}하시겠습니까?`)) return;

    try {
      const endpoint = staff.isActive ? "deactivate" : "activate";
      const response = await fetch(`/api/org/staff/${staffId}/${endpoint}`, {
        method: "PATCH",
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchStaffDetail();
      } else {
        alert(data.error || `${action}에 실패했습니다.`);
      }
    } catch (error) {
      console.error("Toggle active error:", error);
      alert(`${action} 중 오류가 발생했습니다.`);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;

    // 담당 고객사가 있는 경우 삭제 불가
    if (staff.assignedCustomers.length > 0) {
      alert(`담당 고객사가 ${staff.assignedCustomers.length}개 있는 직원은 삭제할 수 없습니다.\n먼저 담당 고객사를 해제해주세요.`);
      return;
    }

    if (!confirm(`"${staff.name}" 직원을 완전히 삭제하시겠습니까?\n\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/org/staff/${staffId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        alert("삭제되었습니다.");
        router.push("/org/staff");
      } else {
        alert(data.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      SUPER_ADMIN: "bg-purple-100 text-purple-800",
      ORG_ADMIN: "bg-red-100 text-red-800",
      OPERATOR: "bg-blue-100 text-blue-800",
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

  if (!staff) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">직원 상세</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              직원 정보 및 담당 고객사 관리
            </p>
          </div>
          <Link href="/org/staff">
            <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              ← 목록으로
            </button>
          </Link>
        </div>

        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">기본 정보</h2>
            {!editing ? (
              <Button onClick={() => setEditing(true)}>수정</Button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: staff.name || "",
                      phone: staff.phone || "",
                      department: staff.department || "",
                      position: staff.position || "",
                      role: staff.role || "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  취소
                </button>
                <Button onClick={handleSave}>저장</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이름
              </label>
              {editing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <div className="text-gray-900 dark:text-white">{staff.name}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                이메일
              </label>
              <div className="text-gray-900 dark:text-white">{staff.email}</div>
              <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                전화번호
              </label>
              {editing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              ) : (
                <div className="text-gray-900 dark:text-white">{staff.phone || "-"}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                역할
              </label>
              {editing ? (
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="ORG_ADMIN">조직 관리자</option>
                  <option value="OPERATOR">실무자</option>
                </select>
              ) : (
                <div>{getRoleBadge(staff.role)}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                부서
              </label>
              {editing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="개발팀"
                />
              ) : (
                <div className="text-gray-900 dark:text-white">{staff.department || "-"}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                직책
              </label>
              {editing ? (
                <Input
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="팀장"
                />
              ) : (
                <div className="text-gray-900 dark:text-white">{staff.position || "-"}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                상태
              </label>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                staff.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }`}>
                {staff.isActive ? "활성" : "비활성"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                가입일
              </label>
              <div className="text-gray-900 dark:text-white">
                {new Date(staff.createdAt).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>

        {/* 담당 고객사 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              담당 고객사 ({staff.assignedCustomers.length}개)
            </h2>
            <Button onClick={() => setShowAssignModal(true)}>
              담당 할당
            </Button>
          </div>

          {staff.assignedCustomers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              담당 고객사가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {staff.assignedCustomers.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {assignment.customer.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {assignment.customer.businessNumber}
                    </div>
                  </div>
                  {assignment.isPrimary && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded text-xs font-medium">
                      주 담당
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 계정 관리 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            계정 관리
          </h2>
          
          <div className="space-y-4">
            {/* 비활성화/활성화 */}
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-md">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">
                  {staff.isActive ? "계정 비활성화" : "계정 활성화"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {staff.isActive 
                    ? "비활성화하면 로그인할 수 없습니다. 데이터는 유지됩니다."
                    : "활성화하면 다시 로그인할 수 있습니다."}
                </p>
              </div>
              <button
                onClick={handleToggleActive}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  staff.isActive
                    ? "bg-orange-600 hover:bg-orange-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                {staff.isActive ? "비활성화" : "활성화"}
              </button>
            </div>

            {/* 삭제 - 비활성화 상태에서만 표시 */}
            {!staff.isActive && (
              <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-md">
                <div>
                  <h3 className="font-medium text-red-900 dark:text-red-200">
                    계정 삭제
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    ⚠️ 삭제하면 모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                  {staff.assignedCustomers.length > 0 && (
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      담당 고객사 {staff.assignedCustomers.length}개를 먼저 해제해야 삭제할 수 있습니다.
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDelete}
                  disabled={staff.assignedCustomers.length > 0}
                  className="px-4 py-2 rounded-md whitespace-nowrap bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 담당 고객사 할당 모달 */}
      {showAssignModal && (
        <AssignCustomersModal
          isOpen={showAssignModal}
          staffId={staffId}
          currentAssignments={staff.assignedCustomers}
          onClose={() => setShowAssignModal(false)}
          onSuccess={() => {
            setShowAssignModal(false);
            fetchStaffDetail();
          }}
        />
      )}
    </div>
  );
}
