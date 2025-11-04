"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { HelpCircle } from "lucide-react";
import OrganizationPickerModal from "@/components/modals/OrganizationPickerModal";
import { useCustomerAuth } from "@/hooks/usePageAuth";

type PendingStack = {
  stackId: string;
  site: {
    code: string;
    name: string;
  };
  internal: {
    code: string;
    name: string | null;
    organization: {
      id: string;
      name: string;
    };
  } | null;
  physical: {
    location: string | null;
    height: number | null;
    diameter: number | null;
    coordinates: any;
  };
  facilityType: string | null;
  category: string | null;
  status: string;
  draftCreatedAt: string | null;
  createdAt: string;
};

type ConfirmedStack = {
  id: string;
  name: string;
  code: string | null;
  fullName: string | null;
  facilityType: string | null;
  category: string | null;
  height: number | null;
  diameter: number | null;
  location: string | null;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: string | null;
  createdAt: string;
  status?: string | null;
  organizations?: Array<{
    organization: {
      id: string;
      name: string;
    };
  }>;
  organizationNames?: string[];
  _count?: { measurements: number };
};

export default function CustomerStacksPage() {
  const { user, loading: authLoading } = useCustomerAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">("confirmed");
  const [pendingStacks, setPendingStacks] = useState<PendingStack[]>([]);
  const [confirmedStacks, setConfirmedStacks] = useState<ConfirmedStack[]>([]);
  const [selectedStacks, setSelectedStacks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [editingStackId, setEditingStackId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);

  // 초기 로드 시 두 탭 모두 데이터 가져오기
  useEffect(() => {
    if (authLoading || !user) return;
    
    // 두 탭 모두 데이터 가져오기
    fetchPendingStacks();
    fetchConfirmedStacks();
  }, [user, authLoading]);

  // 탭 변경 시 해당 탭만 새로고침
  useEffect(() => {
    if (!user) return;
    if (activeTab === "pending") {
      fetchPendingStacks();
    } else if (activeTab === "confirmed") {
      fetchConfirmedStacks();
    }
  }, [activeTab]);

  const fetchPendingStacks = async () => {
    try {
      const res = await fetch("/api/customer/stacks/pending-review");
      const data = await res.json();
      console.log("Pending stacks data:", data);
      setPendingStacks(data.stacks || []);
    } catch (error) {
      console.error("Failed to fetch pending stacks:", error);
    }
  };

  const fetchConfirmedStacks = async () => {
    try {
      const res = await fetch("/api/stacks");
      const data = await res.json();
      console.log("Confirmed stacks data:", data);
      // 활성화된 굴뚝만 필터링
      const active = (data.data || []).filter((s: any) => s.isActive);
      setConfirmedStacks(active);
    } catch (error) {
      console.error("Failed to fetch confirmed stacks:", error);
    }
  };

  const handleSelectAll = () => {
    if (selectedStacks.size === pendingStacks.length) {
      setSelectedStacks(new Set());
    } else {
      setSelectedStacks(new Set(pendingStacks.map((s) => s.stackId)));
    }
  };

  const handleToggleSelect = (stackId: string) => {
    const newSet = new Set(selectedStacks);
    if (newSet.has(stackId)) {
      newSet.delete(stackId);
    } else {
      newSet.add(stackId);
    }
    setSelectedStacks(newSet);
  };

  const handleVerify = async (stackId: string) => {
    try {
      const res = await fetch(`/api/customer/stacks/${stackId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "확인 완료되었습니다.");
        fetchConfirmedStacks();
      } else {
        alert(data.error || "확인 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleConfirm = async (stackId: string) => {
    if (!confirm("이 굴뚝을 확인 완료하시겠습니까?\n\n확인 완료 후 전체 탭에서 계속 표시되며, 검토대기 탭에서는 사라집니다.")) {
      return;
    }

    try {
      const res = await fetch(`/api/customer/stacks/${stackId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || "확인 완료되었습니다.");
        // 두 탭 모두 새로고침
        fetchPendingStacks();
        fetchConfirmedStacks();
      } else {
        alert(data.error || "확인 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedStacks.size === 0) {
      alert("확인할 굴뚝을 선택해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedStacks.size}개 굴뚝을 일괄 확인 완료하시겠습니까?\n\n확인 완료 후 전체 탭에서 계속 표시되며, 검토대기 탭에서는 사라집니다.`)) {
      return;
    }

    try {
      const stackIds = Array.from(selectedStacks);
      let successCount = 0;
      let failCount = 0;

      for (const stackId of stackIds) {
        const res = await fetch(`/api/customer/stacks/${stackId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      alert(`완료: ${successCount}건 성공, ${failCount}건 실패`);
      setSelectedStacks(new Set());
      fetchPendingStacks();
      fetchConfirmedStacks();
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleStartEdit = (stack: any) => {
    const stackId = stack.stackId || stack.id;
    setEditingStackId(stackId);
    setEditingData({
      code: stack.internal?.code || stack.code || "",
      fullName: stack.site?.name || stack.fullName || "",
      facilityType: stack.facilityType || "",
      category: stack.category || "",
      location: stack.physical?.location || stack.location || "",
      height: stack.physical?.height || stack.height || "",
      diameter: stack.physical?.diameter || stack.diameter || "",
      organizationId: stack.internal?.organization?.id || stack.organizationNames?.[0] || "",
      organizationName: stack.internal?.organization?.name || stack.organizationNames?.[0] || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingStackId(null);
    setEditingData(null);
    setSelectedOrganization(null);
  };

  const handleSaveEdit = async (stackId: string) => {
    if (!editingData) return;

    const changeReason = prompt("수정 사유를 입력하세요:");
    if (!changeReason) return;

    try {
      const res = await fetch(`/api/stacks/${stackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editingData.code,
          fullName: editingData.fullName,
          facilityType: editingData.facilityType,
          category: editingData.category,
          location: editingData.location,
          height: editingData.height ? parseFloat(editingData.height) : null,
          diameter: editingData.diameter ? parseFloat(editingData.diameter) : null,
          changeReason,
        }),
      });

      if (res.ok) {
        // 담당 환경측정기업 변경
        if (selectedOrganization && selectedOrganization.id !== editingData.organizationId) {
          await handleChangeOrganization(stackId, selectedOrganization.id);
        }

        alert("저장되었습니다.");
        handleCancelEdit();
        fetchPendingStacks();
        fetchConfirmedStacks();
      } else {
        const data = await res.json();
        alert(data.error || "저장 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleChangeOrganization = async (stackId: string, newOrgId: string) => {
    try {
      const res = await fetch(`/api/stacks/${stackId}/change-organization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: newOrgId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error("Failed to change organization:", error);
      throw error;
    }
  };

  const handleOrganizationSelect = (org: any) => {
    setSelectedOrganization(org);
    setEditingData({
      ...editingData,
      organizationId: org.id,
      organizationName: org.name,
    });
  };

  const handleExport = () => {
    const data = activeTab === "pending" ? pendingStacks : confirmedStacks;
    const header = ["굴뚝번호", "굴뚝코드", "정식명칭", "배출시설종류", "높이(m)", "안지름(m)", "종별", "확인상태", "담당환경측정회사", "생성일"];
    
    const body = data.map((stack: any) => [
      activeTab === "pending" ? stack.site?.code || "" : stack.name || "",
      activeTab === "pending" ? stack.internal?.code || "" : stack.code || "",
      activeTab === "pending" ? stack.site?.name || "" : stack.fullName || "",
      stack.facilityType || "",
      activeTab === "pending" ? stack.physical?.height || "" : stack.height || "",
      activeTab === "pending" ? stack.physical?.diameter || "" : stack.diameter || "",
      stack.category || "",
      activeTab === "pending" ? "확인필요" : (stack.isVerified ? "확인완료" : "확인필요"),
      activeTab === "pending" ? stack.internal?.organization?.name || "" : (stack.organizationNames?.join(", ") || ""),
      new Date(stack.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')
    ]);
    
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `굴뚝목록_${activeTab === "pending" ? "검토대기" : "전체"}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeactivate = async (stackId: string) => {
    if (!confirm("이 굴뚝을 비활성화하시겠습니까?\n비활성화된 굴뚝은 '비활성화 보기'를 체크해야 표시됩니다.")) return;

    try {
      const res = await fetch(`/api/stacks/${stackId}/deactivate`, {
        method: "POST",
      });

      if (res.ok) {
        alert("비활성화되었습니다.");
        fetchPendingStacks();
        fetchConfirmedStacks();
      } else {
        const data = await res.json();
        alert(data.error || "비활성화 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleActivate = async (stackId: string) => {
    if (!confirm("이 굴뚝을 활성화하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/stacks/${stackId}/activate`, {
        method: "POST",
      });

      if (res.ok) {
        alert("활성화되었습니다.");
        fetchPendingStacks();
        fetchConfirmedStacks();
      } else {
        const data = await res.json();
        alert(data.error || "활성화 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (stackId: string, measurementCount: number) => {
    if (measurementCount > 0) {
      alert("측정 데이터가 있는 굴뚝은 삭제할 수 없습니다.\n먼저 관련 측정 데이터를 삭제해주세요.");
      return;
    }

    if (!confirm("이 굴뚝을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.")) return;

    try {
      const res = await fetch(`/api/stacks/${stackId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchPendingStacks();
        fetchConfirmedStacks();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };




  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">굴뚝 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          
          {/* 탭 */}
          <div className="flex gap-2 mb-1.5">
            <button
              onClick={() => setActiveTab("confirmed")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "confirmed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              전체 ({confirmedStacks.length})
            </button>
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                activeTab === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
            >
              검토대기 ({pendingStacks.length})
            </button>
          </div>
          
          {/* 검색 필터 */}
          <div className="flex flex-col" style={{ minWidth: '280px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <input
              type="text"
              placeholder="굴뚝번호, 코드, 명칭..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm h-8 px-3 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          {activeTab === "confirmed" && (
            <label className="flex items-center gap-2 text-sm mb-1.5">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="w-4 h-4"
              />
              비활성화 보기
            </label>
          )}
          
          <div className="flex gap-2 ml-auto mb-1.5">
            <Button size="sm" variant="secondary" onClick={handleExport}>
              Excel
            </Button>
            {activeTab === "pending" && user?.role === "CUSTOMER_ADMIN" && (
              <Button
                size="sm"
                onClick={handleBulkConfirm}
                disabled={selectedStacks.size === 0}
              >
                일괄확인완료 {selectedStacks.size > 0 && `(${selectedStacks.size})`}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowHelp(true)}
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              도움말
            </Button>
            <Button size="sm" onClick={() => router.push("/customer/stacks/create")}>
              + 굴뚝 직접 등록
            </Button>
          </div>
        </div>
      </div>

      {/* 도움말 모달 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">굴뚝 관리 도움말</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            
            <div className="space-y-6 text-sm">
              <section>
                <h3 className="font-semibold text-base mb-2">📋 메뉴 개요</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  자사의 모든 굴뚝 정보를 조회하고 관리할 수 있는 메뉴입니다. 환경측정기업이 등록한 굴뚝을 검토하거나, 직접 굴뚝을 등록할 수 있습니다.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">📑 탭 설명</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-medium mb-1">전체 굴뚝</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>자사의 모든 활성화된 굴뚝 목록을 확인할 수 있습니다</li>
                      <li>검색 기능으로 굴뚝번호, 코드, 명칭, 배출시설종류로 검색 가능합니다</li>
                      <li>각 굴뚝의 측정 건수와 생성일을 확인할 수 있습니다</li>
                      <li>확인 상태(확인완료/확인필요)를 표시하며, 확인필요 항목이 우선 정렬됩니다</li>
                      <li><strong>관리자</strong>는 "수정" 버튼으로 굴뚝 정보를 인라인 편집할 수 있습니다</li>
                      <li><strong>관리자</strong>는 담당 환경측정기업을 변경할 수 있습니다</li>
                      <li><strong>관리자</strong>는 굴뚝을 비활성화하거나 영구 삭제할 수 있습니다</li>
                      <li>Excel 버튼으로 목록을 다운로드할 수 있습니다</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-3">
                    <h4 className="font-medium mb-1">검토 대기</h4>
                    <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1">
                      <li>환경측정기업이 등록한 굴뚝 중 아직 확인하지 않은 목록입니다</li>
                      <li>검색 기능으로 빠르게 찾을 수 있습니다</li>
                      <li>정보를 검토한 후 <strong>"확인완료"</strong> 버튼을 클릭하여 승인할 수 있습니다</li>
                      <li>여러 굴뚝을 선택하여 일괄 확인 처리가 가능합니다</li>
                      <li>확인 완료된 굴뚝은 "전체 굴뚝" 탭으로 이동하며, 담당 환경측정기업에 알림이 전송됩니다</li>
                      <li>Excel 버튼으로 검토대기 목록을 다운로드할 수 있습니다</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">➕ 굴뚝 직접 등록</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>우측 상단의 "+ 굴뚝 직접 등록" 버튼을 클릭하여 새로운 굴뚝을 등록할 수 있습니다.</p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                    <p className="font-medium text-blue-900 dark:text-blue-300 mb-2">필수 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>현장 코드</strong>: 자사에서 사용하는 굴뚝 코드 (예: S-001)</li>
                      <li><strong>현장 명칭</strong>: 굴뚝의 명칭 (예: 1호 소각로)</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/20 p-3 rounded">
                    <p className="font-medium text-gray-900 dark:text-gray-300 mb-2">선택 입력 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>배출시설 종류, 높이, 안지름, 종별 등</li>
                    </ul>
                  </div>
                  <p className="text-sm italic">💡 직접 등록한 굴뚝은 즉시 활성화되어 측정 데이터 입력이 가능합니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">✏️ 굴뚝 정보 수정</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <p>전체 굴뚝 탭에서 "수정" 버튼을 클릭하여 굴뚝 정보를 수정할 수 있습니다.</p>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <p className="font-medium text-green-900 dark:text-green-300 mb-2">수정 가능 항목:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>굴뚝 코드, 정식 명칭, 배출시설 종류, 종별</li>
                      <li>높이, 안지름</li>
                    </ul>
                  </div>
                  <p className="text-sm italic">⚠️ 수정 시 반드시 <strong>수정 사유</strong>를 입력해야 하며, 모든 수정 이력이 자동으로 기록됩니다.</p>
                  <p className="text-sm italic">📌 굴뚝번호는 환경측정기업 전용 필드로 수정할 수 없습니다.</p>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">🔔 알림 기능</h3>
                <div className="space-y-2 text-gray-600 dark:text-gray-400">
                  <ul className="list-disc list-inside space-y-1">
                    <li>환경측정기업이 굴뚝을 등록하거나 수정하면 실시간 알림을 받습니다</li>
                    <li>고객사가 굴뚝 정보를 수정하면 담당 환경측정기업에게 알림이 전송됩니다</li>
                    <li>굴뚝 확인 완료 시 담당 환경측정기업에게 알림이 전송됩니다</li>
                    <li>우측 상단 알림 아이콘에서 확인할 수 있습니다</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="font-semibold text-base mb-2">❓ 자주 묻는 질문</h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium">Q. 굴뚝 정보에 오류가 있으면 어떻게 하나요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. "수정" 버튼을 클릭하여 직접 수정할 수 있습니다. 수정 사유를 입력하면 담당 환경측정기업에게 알림이 전송됩니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Q. 검토 대기 중인 굴뚝은 측정이 가능한가요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. 네, 가능합니다. 활성화된 모든 굴뚝은 검토 여부와 관계없이 측정 데이터 입력이 가능합니다.
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Q. 확인완료 버튼은 무엇인가요?</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                      A. 굴뚝 정보를 확인했음을 표시하는 기능입니다. 측정 가능 여부와는 무관하며, 정보 확인 여부만 표시합니다.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setShowHelp(false)}>닫기</Button>
            </div>
          </div>
        </div>
      )}


      {activeTab === "pending" && (
        <>
          {pendingStacks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                검토가 필요한 굴뚝이 없습니다.
              </p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedStacks.size === pendingStacks.length && pendingStacks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStacks(new Set(pendingStacks.map(s => s.stackId)));
                          } else {
                            setSelectedStacks(new Set());
                          }
                        }}
                        className="h-4 w-4"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      정식명칭
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      배출시설종류
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      높이(m)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      안지름(m)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      종별
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      확인 상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      담당환경측정회사
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      생성일
                    </th>
                    {user?.role === "CUSTOMER_ADMIN" && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        액션
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingStacks
                    .filter((stack) => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        stack.site.code?.toLowerCase().includes(q) ||
                        stack.internal?.code?.toLowerCase().includes(q) ||
                        stack.site.name?.toLowerCase().includes(q) ||
                        stack.facilityType?.toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => {
                      // 1. 생성일 최신순
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      if (dateA !== dateB) {
                        return dateB - dateA;
                      }
                      // 2. 굴뚝번호 순
                      return (a.site.code || "").localeCompare(b.site.code || "");
                    })
                    .map((stack) => (
                    <tr key={stack.stackId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStacks.has(stack.stackId)}
                          onChange={() => handleToggleSelect(stack.stackId)}
                          className="h-4 w-4"
                        />
                      </td>
                      {/* 굴뚝번호 */}
                      <td className="px-4 py-3 text-sm font-mono">{stack.site.code}</td>
                      {/* 굴뚝코드 */}
                      <td className="px-4 py-3 text-sm font-mono">
                        {editingStackId === stack.stackId ? (
                          <input
                            type="text"
                            value={editingData?.code || ""}
                            onChange={(e) => setEditingData({...editingData, code: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          stack.internal?.code || "-"
                        )}
                      </td>
                      {/* 정식명칭 */}
                      <td className="px-4 py-3 text-sm">
                        {editingStackId === stack.stackId ? (
                          <input
                            type="text"
                            value={editingData?.fullName || ""}
                            onChange={(e) => setEditingData({...editingData, fullName: e.target.value})}
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          stack.site.name || "-"
                        )}
                      </td>
                      {/* 배출시설종류 */}
                      <td className="px-4 py-3 text-sm">{stack.facilityType || "-"}</td>
                      {/* 높이 */}
                      <td className="px-4 py-3 text-sm text-center">
                        {editingStackId === stack.stackId ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData?.height || ""}
                            onChange={(e) => setEditingData({...editingData, height: e.target.value})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          stack.physical.height ?? "-"
                        )}
                      </td>
                      {/* 안지름 */}
                      <td className="px-4 py-3 text-sm text-center">
                        {editingStackId === stack.stackId ? (
                          <input
                            type="number"
                            step="0.1"
                            value={editingData?.diameter || ""}
                            onChange={(e) => setEditingData({...editingData, diameter: e.target.value})}
                            className="w-20 px-2 py-1 border rounded text-sm"
                          />
                        ) : (
                          stack.physical.diameter ?? "-"
                        )}
                      </td>
                      {/* 종별 */}
                      <td className="px-4 py-3 text-sm">{stack.category || "-"}</td>
                      {/* 확인 상태 */}
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          확인필요
                        </span>
                      </td>
                      {/* 담당환경측정회사 */}
                      <td className="px-4 py-3 text-sm">
                        {editingStackId === stack.stackId ? (
                          <button
                            onClick={() => setShowOrgPicker(true)}
                            className="text-blue-600 hover:underline"
                          >
                            {editingData?.organizationName || "-"}
                          </button>
                        ) : (
                          stack.internal?.organization.name || "-"
                        )}
                      </td>
                      {/* 생성일 */}
                      <td className="px-4 py-3 text-sm text-center">
                        {new Date(stack.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                      </td>
                      {user?.role === "CUSTOMER_ADMIN" && (
                        <td className="px-4 py-3 text-sm text-center">
                          <div className="flex gap-2 justify-center">
                            {editingStackId === stack.stackId ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(stack.stackId)}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={() => handleCancelEdit()}
                                  className="text-gray-600 hover:underline text-xs"
                                >
                                  취소
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(stack)}
                                className="text-green-600 hover:underline text-xs"
                              >
                                수정
                              </button>
                            )}
                            <button
                              onClick={() => handleConfirm(stack.stackId)}
                              className="text-blue-600 hover:underline text-xs"
                            >
                              확인완료
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {pendingStacks
                .filter((stack) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    stack.site.code?.toLowerCase().includes(q) ||
                    stack.internal?.code?.toLowerCase().includes(q) ||
                    stack.site.name?.toLowerCase().includes(q) ||
                    stack.facilityType?.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  // 1. 생성일 최신순
                  const dateA = new Date(a.createdAt).getTime();
                  const dateB = new Date(b.createdAt).getTime();
                  if (dateA !== dateB) {
                    return dateB - dateA;
                  }
                  // 2. 굴뚝번호 순
                  return (a.site.code || "").localeCompare(b.site.code || "");
                })
                .map((stack) => (
                  <div key={stack.stackId} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        확인필요
                      </span>
                      {user?.role === "CUSTOMER_ADMIN" && (
                        <button onClick={() => handleConfirm(stack.stackId)} className="text-xs text-blue-600 hover:underline">
                          확인완료
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">🏭 굴뚝번호:</span> {stack.site.code}</div>
                      <div><span className="text-gray-500">📋 굴뚝코드:</span> {stack.internal?.code || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📍 정식명칭:</span> {stack.site.name || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">⚙️ 배출시설:</span> {stack.facilityType || "-"}</div>
                      <div><span className="text-gray-500">📏 높이:</span> {stack.physical.height ?? "-"}m</div>
                      <div><span className="text-gray-500">⭕ 안지름:</span> {stack.physical.diameter ?? "-"}m</div>
                      <div><span className="text-gray-500">🏷️ 종별:</span> {stack.category || "-"}</div>
                      <div><span className="text-gray-500">🏢 담당:</span> {stack.internal?.organization.name || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📅 생성일:</span> {new Date(stack.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}</div>
                    </div>
                  </div>
                ))}
            </div>
            </>
          )}
        </>
      )}

      {activeTab === "confirmed" && (
        <>
          {confirmedStacks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                확정된 굴뚝이 없습니다.
              </p>
            </div>
          ) : (
            <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝번호
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      굴뚝코드
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      정식명칭
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      배출시설종류
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      높이(m)
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      안지름(m)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      종별
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      확인 상태
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      담당환경측정회사
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      측정 건수
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      생성일
                    </th>
                    {user?.role === "CUSTOMER_ADMIN" && (
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        액션
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {confirmedStacks
                    .filter((stack) => {
                      // 비활성화 필터
                      if (!showInactive && !stack.isActive) return false;
                      
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        stack.name?.toLowerCase().includes(q) ||
                        stack.code?.toLowerCase().includes(q) ||
                        stack.fullName?.toLowerCase().includes(q) ||
                        stack.facilityType?.toLowerCase().includes(q) ||
                        stack.location?.toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => {
                      // 1. 생성일 최신순
                      const dateA = new Date(a.createdAt).getTime();
                      const dateB = new Date(b.createdAt).getTime();
                      if (dateA !== dateB) {
                        return dateB - dateA;
                      }
                      // 2. 굴뚝번호 순
                      return (a.name || "").localeCompare(b.name || "");
                    })
                    .map((stack) => (
                      <tr key={stack.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        {/* 굴뚝번호 */}
                        <td className="px-4 py-3 text-sm font-mono">{stack.name}</td>
                        {/* 굴뚝코드 */}
                        <td className="px-4 py-3 text-sm font-mono">
                          {editingStackId === stack.id ? (
                            <input
                              type="text"
                              value={editingData?.code || ""}
                              onChange={(e) => setEditingData({...editingData, code: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.code || "-"
                          )}
                        </td>
                        {/* 정식명칭 */}
                        <td className="px-4 py-3 text-sm">
                          {editingStackId === stack.id ? (
                            <input
                              type="text"
                              value={editingData?.fullName || ""}
                              onChange={(e) => setEditingData({...editingData, fullName: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.fullName || "-"
                          )}
                        </td>
                        {/* 배출시설종류 */}
                        <td className="px-4 py-3 text-sm">
                          {editingStackId === stack.id ? (
                            <input
                              type="text"
                              value={editingData?.facilityType || ""}
                              onChange={(e) => setEditingData({...editingData, facilityType: e.target.value})}
                              className="w-full px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.facilityType || "-"
                          )}
                        </td>
                        {/* 높이 */}
                        <td className="px-4 py-3 text-sm text-center">
                          {editingStackId === stack.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editingData?.height || ""}
                              onChange={(e) => setEditingData({...editingData, height: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.height ?? "-"
                          )}
                        </td>
                        {/* 안지름 */}
                        <td className="px-4 py-3 text-sm text-center">
                          {editingStackId === stack.id ? (
                            <input
                              type="number"
                              step="0.1"
                              value={editingData?.diameter || ""}
                              onChange={(e) => setEditingData({...editingData, diameter: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.diameter ?? "-"
                          )}
                        </td>
                        {/* 종별 */}
                        <td className="px-4 py-3 text-sm">
                          {editingStackId === stack.id ? (
                            <input
                              type="text"
                              value={editingData?.category || ""}
                              onChange={(e) => setEditingData({...editingData, category: e.target.value})}
                              className="w-20 px-2 py-1 border rounded text-sm"
                            />
                          ) : (
                            stack.category || "-"
                          )}
                        </td>
                        {/* 확인 상태 */}
                        <td className="px-4 py-3 text-sm text-center">
                          {stack.isVerified ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              ✓ 확인완료
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              확인필요
                            </span>
                          )}
                        </td>
                        {/* 담당환경측정회사 */}
                        <td className="px-4 py-3 text-sm">
                          {editingStackId === stack.id ? (
                            <button
                              onClick={() => setShowOrgPicker(true)}
                              className="text-blue-600 hover:underline"
                            >
                              {editingData?.organizationName || "-"}
                            </button>
                          ) : (
                            stack.organizationNames && stack.organizationNames.length > 0
                              ? stack.organizationNames.join(", ")
                              : "-"
                          )}
                        </td>
                        {/* 측정 건수 */}
                        <td className="px-4 py-3 text-sm text-center">
                          {stack._count?.measurements || 0}
                        </td>
                        {/* 생성일 */}
                        <td className="px-4 py-3 text-sm text-center">
                          {new Date(stack.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '-').replace('.', '')}
                        </td>
                        {user?.role === "CUSTOMER_ADMIN" && (
                          <td className="px-4 py-3 text-sm text-center">
                            <div className="flex gap-2 justify-center flex-wrap">
                              {editingStackId === stack.id ? (
                                <>
                                  <button
                                    onClick={() => handleSaveEdit(stack.id)}
                                    className="text-blue-600 hover:underline text-xs"
                                  >
                                    저장
                                  </button>
                                  <button
                                    onClick={() => handleCancelEdit()}
                                    className="text-gray-600 hover:underline text-xs"
                                  >
                                    취소
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleStartEdit(stack)}
                                    className="text-green-600 hover:underline text-xs"
                                  >
                                    수정
                                  </button>
                                  {stack.isActive ? (
                                    <button
                                      onClick={() => handleDeactivate(stack.id)}
                                      className="text-orange-600 hover:underline text-xs"
                                    >
                                      비활성화
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleActivate(stack.id)}
                                        className="text-green-600 hover:underline text-xs"
                                      >
                                        활성화
                                      </button>
                                      <button
                                        onClick={() => handleDelete(stack.id, stack._count?.measurements || 0)}
                                        className={`text-xs hover:underline ${
                                          (stack._count?.measurements || 0) > 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-red-600"
                                        }`}
                                        disabled={(stack._count?.measurements || 0) > 0}
                                      >
                                        삭제
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {confirmedStacks
                .filter((stack) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    stack.name?.toLowerCase().includes(q) ||
                    stack.code?.toLowerCase().includes(q) ||
                    stack.fullName?.toLowerCase().includes(q) ||
                    stack.facilityType?.toLowerCase().includes(q)
                  );
                })
                .sort((a, b) => {
                  // 1. 생성일 최신순
                  const dateA = new Date(a.createdAt).getTime();
                  const dateB = new Date(b.createdAt).getTime();
                  if (dateA !== dateB) {
                    return dateB - dateA;
                  }
                  // 2. 굴뚝번호 순
                  return (a.name || "").localeCompare(b.name || "");
                })
                .map((stack) => (
                  <div key={stack.stackId} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        확정완료
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">🏭 굴뚝번호:</span> {stack.name || "-"}</div>
                      <div><span className="text-gray-500">📋 굴뚝코드:</span> {stack.code || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📍 정식명칭:</span> {stack.fullName || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">⚙️ 배출시설:</span> {stack.facilityType || "-"}</div>
                      <div><span className="text-gray-500">📏 높이:</span> {stack.height ?? "-"}m</div>
                      <div><span className="text-gray-500">⭕ 안지름:</span> {stack.diameter ?? "-"}m</div>
                      <div><span className="text-gray-500">🏷️ 종별:</span> {stack.category || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">🏢 담당:</span> {stack.organizationNames?.length > 0 ? stack.organizationNames.join(", ") : "-"}</div>
                      <div><span className="text-gray-500">📊 측정:</span> {stack._count?.measurements || 0}건</div>
                      <div><span className="text-gray-500">📅 생성:</span> {stack.createdAt ? new Date(stack.createdAt).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }) : "-"}</div>
                    </div>
                  </div>
                ))}
            </div>
            </>
          )}
        </>
      )}

      {/* 환경측정기업 선택 모달 */}
      <OrganizationPickerModal
        isOpen={showOrgPicker}
        onClose={() => setShowOrgPicker(false)}
        onSelect={handleOrganizationSelect}
        currentOrgId={editingData?.organizationId}
      />
    </section>
  );
}
