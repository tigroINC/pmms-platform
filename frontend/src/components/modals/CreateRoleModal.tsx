"use client";

import { useState, useEffect } from "react";

interface Permission {
  code: string;
  name: string;
  category: string;
}

interface RoleTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  defaultPermissions: {
    permissionCode: string;
  }[];
}

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedTemplateId?: string;
}

// 권한 정의
const PERMISSIONS: Permission[] = [
  // 대시보드
  { code: "dashboard.view", name: "대시보드 조회", category: "대시보드" },
  { code: "dashboard.automl", name: "AutoML 예측", category: "대시보드" },
  { code: "dashboard.insight", name: "인사이트 보고서 생성", category: "대시보드" },
  { code: "dashboard.pollutants_only", name: "측정항목 오염물질만 표시", category: "대시보드" },
  
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
  
  // 임시고객사 관리
  { code: "draft_customer.view", name: "임시고객사 조회", category: "임시고객사" },
  { code: "draft_customer.create", name: "임시고객사 등록", category: "임시고객사" },
  { code: "draft_customer.confirm", name: "임시고객사 확정", category: "임시고객사" },
  { code: "draft_customer.delete", name: "임시고객사 삭제", category: "임시고객사" },
  
  // 굴뚝 관리
  { code: "stack.view", name: "굴뚝 조회", category: "굴뚝 관리" },
  { code: "stack.create", name: "굴뚝 등록", category: "굴뚝 관리" },
  { code: "stack.update", name: "굴뚝 수정", category: "굴뚝 관리" },
  { code: "stack.delete", name: "굴뚝 삭제", category: "굴뚝 관리" },
  
  // 굴뚝 요청 관리
  { code: "stack_request.view", name: "굴뚝 요청 조회", category: "굴뚝 요청" },
  { code: "stack_request.approve", name: "굴뚝 요청 승인", category: "굴뚝 요청" },
  { code: "stack_request.reject", name: "굴뚝 요청 거부", category: "굴뚝 요청" },
  
  // 마스터 - 측정항목
  { code: "master_item.view", name: "측정항목 조회", category: "마스터 - 측정항목" },
  { code: "master_item.create", name: "측정항목 등록", category: "마스터 - 측정항목" },
  { code: "master_item.update", name: "측정항목 수정", category: "마스터 - 측정항목" },
  { code: "master_item.delete", name: "측정항목 삭제", category: "마스터 - 측정항목" },
  { code: "master_item.reorder", name: "측정항목 순서변경", category: "마스터 - 측정항목" },
  
  // 마스터 - 허용기준
  { code: "master_limit.view", name: "허용기준 조회", category: "마스터 - 허용기준" },
  { code: "master_limit.create", name: "허용기준 등록", category: "마스터 - 허용기준" },
  { code: "master_limit.update", name: "허용기준 수정", category: "마스터 - 허용기준" },
  { code: "master_limit.delete", name: "허용기준 삭제", category: "마스터 - 허용기준" },
  
  // 측정 데이터
  { code: "measurement.view", name: "측정 데이터 조회", category: "측정 데이터" },
  { code: "measurement.create", name: "측정 데이터 입력", category: "측정 데이터" },
  { code: "measurement.update", name: "측정 데이터 수정", category: "측정 데이터" },
  { code: "measurement.delete", name: "측정 데이터 삭제", category: "측정 데이터" },
  { code: "measurement.import", name: "측정 데이터 가져오기", category: "측정 데이터" },
  { code: "measurement.export", name: "측정 데이터 내보내기", category: "측정 데이터" },
  
  // 사용자 관리
  { code: "user.view", name: "사용자 조회", category: "사용자 관리" },
  { code: "user.create", name: "사용자 등록", category: "사용자 관리" },
  { code: "user.update", name: "사용자 수정", category: "사용자 관리" },
  { code: "user.delete", name: "사용자 삭제", category: "사용자 관리" },
  { code: "user.role", name: "역할 관리", category: "사용자 관리" },
  
  // 직원 관리
  { code: "staff.view", name: "직원 조회", category: "직원 관리" },
  { code: "staff.invite", name: "직원 초대", category: "직원 관리" },
  { code: "staff.update", name: "직원 수정", category: "직원 관리" },
  { code: "staff.delete", name: "직원 삭제", category: "직원 관리" },
  { code: "staff.assign_customer", name: "고객사 담당 배정", category: "직원 관리" },
  
  // 보고서
  { code: "report.view", name: "보고서 조회", category: "보고서" },
  { code: "report.create", name: "보고서 생성", category: "보고서" },
  { code: "report.update", name: "보고서 수정", category: "보고서" },
  { code: "report.delete", name: "보고서 삭제", category: "보고서" },
  { code: "report.share", name: "보고서 고객공유", category: "보고서" },
  { code: "report.pdf", name: "보고서 PDF 생성", category: "보고서" },
  { code: "report.export", name: "보고서 Excel 내보내기", category: "보고서" },
  
  // 인사이트 보고서
  { code: "insight_report.view", name: "인사이트 보고서 조회", category: "인사이트 보고서" },
  { code: "insight_report.share", name: "인사이트 보고서 공유", category: "인사이트 보고서" },
  
  // 고객소통
  { code: "communication.view", name: "고객소통 조회", category: "고객소통" },
  { code: "communication.create", name: "고객소통 등록", category: "고객소통" },
  { code: "communication.update", name: "고객소통 수정", category: "고객소통" },
  { code: "communication.delete", name: "고객소통 삭제", category: "고객소통" },
  { code: "communication.reply", name: "고객소통 답변", category: "고객소통" },
  { code: "communication.assign", name: "고객소통 담당자 배정", category: "고객소통" },
  { code: "communication.note", name: "고객소통 내부메모", category: "고객소통" },
  { code: "communication.template", name: "고객소통 템플릿 관리", category: "고객소통" },
  
  // 설정
  { code: "settings.view", name: "설정 조회", category: "설정" },
  { code: "settings.update", name: "설정 변경", category: "설정" },
  
  // 계약 관리
  { code: "contract.view", name: "계약 조회", category: "계약 관리" },
  { code: "contract.create", name: "계약 등록", category: "계약 관리" },
  { code: "contract.update", name: "계약 수정", category: "계약 관리" },
  { code: "contract.delete", name: "계약 삭제", category: "계약 관리" },
];

export default function CreateRoleModal({
  isOpen,
  onClose,
  onSuccess,
  selectedTemplateId,
}: CreateRoleModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [templateId, setTemplateId] = useState(selectedTemplateId || "");
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    if (templateId && templates.length > 0) {
      loadTemplatePermissions(templateId);
    }
  }, [templateId, templates]);

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

  const loadTemplatePermissions = (tId: string) => {
    const template = templates.find(t => t.id === tId);
    if (template) {
      const permissions = new Set(
        template.defaultPermissions.map(p => p.permissionCode)
      );
      setSelectedPermissions(permissions);
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

    setLoading(true);

    try {
      const res = await fetch("/api/custom-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          templateId: templateId || null,
          permissions: Array.from(selectedPermissions).map(code => ({
            permissionCode: code,
            granted: true,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("역할이 생성되었습니다!");
        handleClose();
        onSuccess();
      } else {
        alert(data.error || "역할 생성 실패");
      }
    } catch (error) {
      console.error("Error creating role:", error);
      alert("역할 생성 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setTemplateId("");
    setSelectedPermissions(new Set());
    onClose();
  };

  if (!isOpen) return null;

  // 권한을 카테고리별로 그룹화
  const permissionsByCategory = PERMISSIONS.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">커스텀 역할 생성</h2>

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

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                기반 템플릿 (선택)
              </label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">템플릿 없음 (처음부터 설정)</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.defaultPermissions.length}개 권한)
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                템플릿을 선택하면 해당 권한이 자동으로 선택됩니다.
              </p>
            </div>
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
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              disabled={loading}
            >
              {loading ? "생성 중..." : "역할 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
