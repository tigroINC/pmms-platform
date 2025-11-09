"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";

interface Permission {
  code: string;
  name: string;
  category: string;
}

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  template: {
    id: string;
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

// 권한 정의
const PERMISSIONS: Permission[] = [
  // 고객사 관리 - 탭
  { code: "customer.tab.all", name: "전체탭 보기", category: "고객사 관리" },
  { code: "customer.tab.internal", name: "내부탭 보기", category: "고객사 관리" },
  { code: "customer.tab.connected", name: "연결탭 보기", category: "고객사 관리" },
  { code: "customer.tab.search", name: "검색탭 보기", category: "고객사 관리" },
  
  // 고객사 관리 - 기본 기능
  { code: "customer.view", name: "고객사 조회", category: "고객사 관리" },
  { code: "customer.create", name: "고객사 등록", category: "고객사 관리" },
  { code: "customer.update", name: "고객사 수정", category: "고객사 관리" },
  { code: "customer.delete", name: "고객사 삭제", category: "고객사 관리" },
  { code: "customer.activate", name: "활성화/비활성화", category: "고객사 관리" },
  
  // 고객사 관리 - 고급 기능
  { code: "customer.search", name: "검색 기능", category: "고객사 관리" },
  { code: "customer.filter", name: "필터 기능", category: "고객사 관리" },
  { code: "customer.bulk_upload", name: "일괄업로드", category: "고객사 관리" },
  { code: "customer.export", name: "Excel 내보내기", category: "고객사 관리" },
  { code: "customer.invite", name: "고객사 초대", category: "고객사 관리" },
  
  // 굴뚝 관리
  { code: "stack.view", name: "굴뚝 조회", category: "굴뚝 관리" },
  { code: "stack.create", name: "굴뚝 등록", category: "굴뚝 관리" },
  { code: "stack.update", name: "굴뚝 수정", category: "굴뚝 관리" },
  { code: "stack.delete", name: "굴뚝 삭제", category: "굴뚝 관리" },
  
  // 측정 데이터
  { code: "measurement.view", name: "측정 데이터 조회", category: "측정 데이터" },
  { code: "measurement.create", name: "측정 데이터 입력", category: "측정 데이터" },
  { code: "measurement.update", name: "측정 데이터 수정", category: "측정 데이터" },
  { code: "measurement.delete", name: "측정 데이터 삭제", category: "측정 데이터" },
  { code: "measurement.export", name: "측정 데이터 내보내기", category: "측정 데이터" },
  
  // 사용자 관리
  { code: "user.view", name: "사용자 조회", category: "사용자 관리" },
  { code: "user.create", name: "사용자 등록", category: "사용자 관리" },
  { code: "user.update", name: "사용자 수정", category: "사용자 관리" },
  { code: "user.delete", name: "사용자 삭제", category: "사용자 관리" },
  { code: "user.role", name: "역할 관리", category: "사용자 관리" },
  
  // 보고서
  { code: "report.view", name: "보고서 조회", category: "보고서" },
  { code: "report.create", name: "보고서 생성", category: "보고서" },
  { code: "report.update", name: "보고서 수정", category: "보고서" },
  { code: "report.delete", name: "보고서 삭제", category: "보고서" },
  
  // 설정
  { code: "settings.view", name: "설정 조회", category: "설정" },
  { code: "settings.update", name: "설정 변경", category: "설정" },
  
  // 계약 관리
  { code: "contract.view", name: "계약 조회", category: "계약 관리" },
  { code: "contract.create", name: "계약 등록", category: "계약 관리" },
  { code: "contract.update", name: "계약 수정", category: "계약 관리" },
  { code: "contract.delete", name: "계약 삭제", category: "계약 관리" },
];

export default function EditRolePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const roleId = params.id as string;

  const [role, setRole] = useState<CustomRole | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      fetchRole();
    }
  }, [session, status, router, roleId]);

  const fetchRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/custom-roles/${roleId}`);
      const data = await res.json();
      
      if (res.ok && data.customRole) {
        setRole(data.customRole);
        setName(data.customRole.name);
        setDescription(data.customRole.description || "");
        
        const grantedPermissions = new Set<string>(
          data.customRole.permissions
            .filter((p: any) => p.granted)
            .map((p: any) => p.permissionCode)
        );
        setSelectedPermissions(grantedPermissions);
      } else {
        alert("역할을 찾을 수 없습니다.");
        router.push("/org/settings/roles");
      }
    } catch (error) {
      console.error("Error fetching role:", error);
      alert("역할 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionCode: string) => {
    const newPermissions = new Set(selectedPermissions);
    if (newPermissions.has(permissionCode)) {
      newPermissions.delete(permissionCode);
    } else {
      newPermissions.add(permissionCode);
    }
    setSelectedPermissions(newPermissions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert("역할 이름을 입력해주세요.");
      return;
    }

    if (selectedPermissions.size === 0) {
      alert("최소 1개 이상의 권한을 선택해주세요.");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/custom-roles/${roleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          permissions: Array.from(selectedPermissions).map(code => ({
            permissionCode: code,
            granted: true,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("역할이 수정되었습니다!");
        router.push("/org/settings/roles");
      } else {
        alert(data.error || "역할 수정 실패");
      }
    } catch (error) {
      console.error("Error updating role:", error);
      alert("역할 수정 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!role) {
    return null;
  }

  // 권한을 카테고리별로 그룹화
  const permissionsByCategory = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push("/org/settings/roles")}
          className="text-blue-600 hover:text-blue-700 mb-2"
        >
          ← 역할 관리로 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">역할 수정</h1>
        <p className="text-gray-600 mt-1">
          {role._count.users}명의 사용자가 이 역할을 사용 중입니다.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          {/* 기본 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">기본 정보</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할 이름 *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="예: 현장 책임자"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={2}
                placeholder="역할에 대한 설명을 입력하세요"
              />
            </div>

            {role.template && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기반 템플릿
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded text-gray-700">
                  {role.template.name}
                </div>
              </div>
            )}
          </div>

          {/* 권한 선택 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              권한 선택 ({selectedPermissions.size}개 선택됨)
            </h3>

            <div className="space-y-4">
              {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                <div key={category} className="border rounded p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{category}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const categoryPermissions = permissions.map(p => p.code);
                        const allSelected = categoryPermissions.every(code => 
                          selectedPermissions.has(code)
                        );
                        
                        const newPermissions = new Set(selectedPermissions);
                        if (allSelected) {
                          categoryPermissions.forEach(code => newPermissions.delete(code));
                        } else {
                          categoryPermissions.forEach(code => newPermissions.add(code));
                        }
                        setSelectedPermissions(newPermissions);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {permissions.every(p => selectedPermissions.has(p.code))
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <label
                        key={permission.code}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissions.has(permission.code)}
                          onChange={() => handlePermissionToggle(permission.code)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{permission.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => router.push("/org/settings/roles")}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              disabled={saving}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={saving}
            >
              {saving ? "저장 중..." : "변경사항 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
