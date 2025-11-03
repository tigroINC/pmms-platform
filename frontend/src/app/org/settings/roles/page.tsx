"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CreateRoleModal from "@/components/modals/CreateRoleModal";

interface RoleTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  category: string;
  defaultPermissions: {
    id: string;
    permissionCode: string;
  }[];
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  template: {
    id: string;
    code: string;
    name: string;
  } | null;
  permissions: {
    id: string;
    permissionCode: string;
    granted: boolean;
  }[];
  _count: {
    users: number;
  };
}

export default function RolesManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"templates" | "custom">("custom");
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

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
  }, [session, status, router, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "templates") {
        await fetchTemplates();
      } else {
        await fetchCustomRoles();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/role-templates");
      const data = await res.json();
      if (res.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
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

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm("이 역할을 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/custom-roles/${roleId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("역할이 삭제되었습니다.");
        fetchCustomRoles();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      ORGANIZATION: "bg-blue-100 text-blue-800",
      CUSTOMER: "bg-green-100 text-green-800",
    };
    const labels = {
      ORGANIZATION: "환경측정업체",
      CUSTOMER: "고객사",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[category as keyof typeof styles]}`}>
        {labels[category as keyof typeof labels]}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">역할 관리</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              사용자 역할 및 권한 관리
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button>← 대시보드로</Button>
          </Link>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("custom")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "custom"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              🎭 커스텀 역할
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "templates"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              📋 역할 템플릿
            </button>
          </nav>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-6 flex items-center gap-4">
          <Input
            type="text"
            placeholder="역할 이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-80"
          />
          {activeTab === "custom" && (
            <Button onClick={() => setShowCreateModal(true)}>
              + 역할 생성
            </Button>
          )}
        </div>

        {/* 커스텀 역할 목록 */}
        {activeTab === "custom" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">역할명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">설명</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">기반 템플릿</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">권한 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">사용자 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customRoles
                  .filter((role) => 
                    search === "" || 
                    role.name.toLowerCase().includes(search.toLowerCase()) ||
                    role.description?.toLowerCase().includes(search.toLowerCase())
                  )
                  .map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {role.name}
                      </td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                        {role.description || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {role.template ? role.template.name : "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {role.permissions.filter(p => p.granted).length}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {role._count.users}명
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/org/settings/roles/${role.id}`)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            disabled={role._count.users > 0}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

      {/* 역할 템플릿 목록 */}
      {activeTab === "templates" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                </div>
                {getCategoryBadge(template.category)}
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">권한:</span> {template.defaultPermissions.length}개
                </div>
              </div>

              <button
                onClick={() => {
                  // 템플릿 기반으로 역할 생성 모달 열기
                  setShowCreateModal(true);
                }}
                className="w-full bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
              >
                이 템플릿으로 역할 생성
              </button>
            </div>
          ))}
        </div>
      )}

        {/* 역할 생성 모달 */}
        <CreateRoleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCustomRoles();
          }}
        />
      </div>
    </div>
  );
}
