"use client";
import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { usePermissions } from "@/hooks/usePermissions";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import CustomerFormModal from "@/components/modals/CustomerFormModal";
import CreateInvitationModal from "@/components/modals/CreateInvitationModal";
import BulkUploadModal from "@/components/modals/BulkUploadModal";
import ContractManagementModal from "@/components/modals/ContractManagementModal";
import SearchConnectionModal from "@/components/modals/SearchConnectionModal";
import CustomerManagementHelpModal from "@/components/modals/CustomerManagementHelpModal";

type TabType = "all" | "internal" | "connected" | "search";

// 고객사 행 컴포넌트
function CustomerRow({ 
  customer, 
  role, 
  onRefetch,
  onEdit,
  activeTab,
  onCreateInvitation,
  onRequestConnection,
  isGrouped = false,
  isFirstInGroup = false,
  isLastInGroup = false,
  groupSize = 1,
  isReadOnly = false
}: { 
  customer: any; 
  role: string; 
  onRefetch: () => void;
  onEdit: (customer: any) => void;
  activeTab?: string;
  onCreateInvitation?: (customer: any) => void;
  onRequestConnection?: (customer: any) => void;
  isGrouped?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  groupSize?: number;
  isReadOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  const toggleActive = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !customer.isActive }),
      });
      if (res.ok) {
        onRefetch();
      } else {
        alert("상태 변경 실패");
      }
    } catch (err) {
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const hasMeasurements = customer._count?.measurements > 0;
    if (hasMeasurements) {
      alert("측정 기록이 있는 고객사는 삭제할 수 없습니다. 비활성화를 사용하세요.");
      return;
    }

    if (!confirm(`"${customer.name}" 고객사를 삭제하시겠습니까?\n\n굴뚝: ${customer._count?.stacks || 0}개도 함께 삭제됩니다.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRefetch();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (err) {
      alert("오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const isActive = customer.isActive !== false;
  
  // 그룹 스타일링
  const groupBorderClass = isGrouped 
    ? isFirstInGroup 
      ? "border-l-4 border-l-blue-400" 
      : isLastInGroup 
        ? "border-l-4 border-l-blue-200" 
        : "border-l-4 border-l-blue-300"
    : "";

  // 연결 상태 확인
  const connectionStatus = customer.organizations?.[0]?.status;
  const requestedBy = customer.organizations?.[0]?.requestedBy;
  const isPending = connectionStatus === "PENDING";
  const isRejected = connectionStatus === "REJECTED";
  
  // 연결 상태 뱃지 결정
  const getConnectionBadge = () => {
    // 내부 탭이거나, 연결 정보가 없거나, DISCONNECTED 상태인 경우
    if (activeTab === "internal" || !customer.organizations || customer.organizations.length === 0 || connectionStatus === "DISCONNECTED") {
      return (
        <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs">
          내부
        </span>
      );
    }
    
    if (connectionStatus === "APPROVED") {
      return (
        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
          연결
        </span>
      );
    }
    
    if (isPending && requestedBy === "ORGANIZATION") {
      return (
        <span 
          className="inline-flex flex-col items-center justify-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs leading-tight cursor-help"
          title="우리가 연결요청을 보낸 상태"
        >
          <div>연결</div>
          <div>요청</div>
        </span>
      );
    }
    
    if (isPending && requestedBy === "CUSTOMER") {
      return (
        <span 
          className="inline-flex flex-col items-center justify-center px-2 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs leading-tight cursor-help"
          title="고객사가 연결요청을 한 상태"
        >
          <div>승인</div>
          <div>대기</div>
        </span>
      );
    }
    
    if (connectionStatus === "REJECTED" && requestedBy === "ORGANIZATION") {
      return (
        <span 
          className="inline-flex flex-col items-center justify-center px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs leading-tight cursor-help"
          title="우리 요청이 거절당한 상태"
        >
          <div>거절</div>
          <div>됨</div>
        </span>
      );
    }
    
    if (connectionStatus === "REJECTED" && requestedBy === "CUSTOMER") {
      return (
        <span 
          className="inline-flex flex-col items-center justify-center px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs leading-tight cursor-help"
          title="우리가 거절한 상태"
        >
          <div>거절</div>
          <div>함</div>
        </span>
      );
    }
    
    return null;
  };
  
  return (
    <Tr className={`${!isActive || isRejected ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""} ${groupBorderClass}`}>
      <Td>
        {getConnectionBadge()}
      </Td>
      <Td className="font-mono text-xs break-words">
        {customer.code || "-"}
        {isGrouped && isFirstInGroup && (
          <span className="ml-2 text-xs text-blue-600">({groupSize}개 사업장)</span>
        )}
      </Td>
      <Td className="break-words">{customer.name}</Td>
      <Td className="font-mono text-xs break-words">{customer.businessNumber || "-"}</Td>
      <Td className="break-words">{customer.fullName || customer.name}</Td>
      <Td className="break-words">{customer.representative || "-"}</Td>
      <Td className="break-words">{customer._siteType || customer.siteType || "-"}</Td>
      <Td className="break-words">{customer.address || "-"}</Td>
      <Td className="break-words">{customer.businessType || "-"}</Td>
      <Td className="break-words">{customer.industry || "-"}</Td>
      <Td className="break-words">{customer.siteCategory || "-"}</Td>
      <Td className="font-mono text-xs break-words">{customer.corporateNumber || "-"}</Td>
      <Td className="text-center">{customer._count?.stacks ?? 0}</Td>
      {!isReadOnly && (
        <Td>
          <div className="flex gap-2">
            {isPending ? (
              // PENDING 상태: 연결 탭에서만 액션 표시
              activeTab === "connected" ? (
                requestedBy === "ORGANIZATION" ? (
                  // 우리가 요청한 경우: 요청 취소
                  <button
                    onClick={async () => {
                      if (!confirm("연결 요청을 취소하시겠습니까?")) return;
                      try {
                        const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}`, {
                          method: "DELETE",
                        });
                        if (res.ok) {
                          alert("연결 요청이 취소되었습니다.");
                          onRefetch();
                        } else {
                          const data = await res.json();
                          alert(data.error || "요청 취소 실패");
                        }
                      } catch (error) {
                        alert("요청 취소 중 오류가 발생했습니다.");
                      }
                    }}
                    disabled={loading}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    요청 취소
                  </button>
                ) : (
                  // 고객사가 요청한 경우: 승인/거부
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm("연결 요청을 승인하시겠습니까?")) return;
                        try {
                          const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}/approve`, {
                            method: "PATCH",
                          });
                          if (res.ok) {
                            alert("연결이 승인되었습니다.");
                            onRefetch();
                          } else {
                            const data = await res.json();
                            alert(data.error || "승인 실패");
                          }
                        } catch (error) {
                          alert("승인 중 오류가 발생했습니다.");
                        }
                      }}
                      disabled={loading}
                      className="text-xs text-green-600 hover:underline disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("연결 요청을 거부하시겠습니까?")) return;
                        try {
                          const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}/reject`, {
                            method: "PATCH",
                          });
                          if (res.ok) {
                            alert("연결이 거부되었습니다.");
                            onRefetch();
                          } else {
                            const data = await res.json();
                            alert(data.error || "거부 실패");
                          }
                        } catch (error) {
                          alert("거부 중 오류가 발생했습니다.");
                        }
                      }}
                      disabled={loading}
                      className="text-xs text-red-600 hover:underline disabled:opacity-50"
                    >
                      거부
                    </button>
                  </div>
                )
              ) : null
            ) : isRejected ? (
              // REJECTED 상태: 연결 탭에서만 액션 표시
              activeTab === "connected" ? (
                requestedBy === "ORGANIZATION" ? (
                  // 우리 요청이 거절당함: 재요청, 내부상태로 전환
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!confirm("연결을 재요청하시겠습니까?")) return;
                        try {
                          const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: "PENDING" }),
                          });
                          if (res.ok) {
                            alert("연결 요청을 다시 보냈습니다.");
                            onRefetch();
                          } else {
                            const data = await res.json();
                            alert(data.error || "재요청 실패");
                          }
                        } catch (error) {
                          alert("재요청 중 오류가 발생했습니다.");
                        }
                      }}
                      disabled={loading}
                      className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                    >
                      재요청
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm("내부 상태로 전환하시겠습니까?")) return;
                        try {
                          const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}`, {
                            method: "DELETE",
                          });
                          if (res.ok) {
                            alert("내부 상태로 전환되었습니다.");
                            onRefetch();
                          } else {
                            const data = await res.json();
                            alert(data.error || "전환 실패");
                          }
                        } catch (error) {
                          alert("전환 중 오류가 발생했습니다.");
                        }
                      }}
                      disabled={loading}
                      className="text-xs text-gray-600 hover:underline disabled:opacity-50"
                    >
                      내부상태로 전환
                    </button>
                  </div>
                ) : (
                  // 우리가 거절함: 삭제
                  <button
                    onClick={async () => {
                      if (!confirm("거절 기록을 삭제하시겠습니까?")) return;
                      try {
                        const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}`, {
                          method: "DELETE",
                        });
                        if (res.ok) {
                          alert("삭제되었습니다.");
                          onRefetch();
                        } else {
                          const data = await res.json();
                          alert(data.error || "삭제 실패");
                        }
                      } catch (error) {
                        alert("삭제 중 오류가 발생했습니다.");
                      }
                    }}
                    disabled={loading}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    삭제
                  </button>
                )
              ) : null
            ) : (
              // APPROVED 또는 연결 안 된 상태: 기존 버튼들 표시
              <>
                <button
                  onClick={() => onEdit(customer)}
                  disabled={loading}
                  className="text-xs text-green-600 hover:underline disabled:opacity-50"
                >
                  수정
                </button>
                <button
                  onClick={toggleActive}
                  disabled={loading}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                >
                  {isActive ? "비활성화" : "활성화"}
                </button>
                {!isActive && !customer._count?.measurements && (
                  <button
                    onClick={handleDelete}
                    disabled={loading}
                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    삭제
                  </button>
                )}
                {activeTab === "internal" && onCreateInvitation && (
                  <button
                    onClick={() => onCreateInvitation(customer)}
                    disabled={loading}
                    className="text-xs text-purple-600 hover:underline disabled:opacity-50"
                  >
                    초대 링크
                  </button>
                )}
                {activeTab === "connected" && customer.organizations?.[0] && connectionStatus === "APPROVED" && (
                  <button
                    onClick={async () => {
                      if (!confirm("연결을 해제하시겠습니까?")) return;
                      try {
                        const res = await fetch(`/api/customer-organizations/${customer.organizations[0].id}`, {
                          method: "DELETE",
                        });
                        if (res.ok) {
                          alert("연결이 해제되었습니다.");
                          onRefetch();
                        } else {
                          const data = await res.json();
                          alert(data.error || "연결 해제 실패");
                        }
                      } catch (error) {
                        alert("연결 해제 중 오류가 발생했습니다.");
                      }
                    }}
                    disabled={loading}
                    className="text-xs text-orange-600 hover:underline disabled:opacity-50"
                  >
                    연결 해제
                  </button>
                )}
              </>
            )}
          </div>
        </Td>
      )}
    </Tr>
  );
}

export default function CustomersPage() {
  const { user } = useAuth();
  const role = user?.role;
  const isReadOnly = role === "OPERATOR"; // OPERATOR는 읽기 전용
  const { selectedOrg, setSelectedOrg, loading: orgLoading } = useOrganization();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // 조직 정보 새로고침 (계약관리 기능 활성화 상태 반영)
  const refreshOrganization = async () => {
    if (!selectedOrg?.id) return;
    try {
      const res = await fetch(`/api/organizations/${selectedOrg.id}`);
      const data = await res.json();
      if (res.ok && data.organization) {
        setSelectedOrg(data.organization);
      }
    } catch (error) {
      console.error("조직 정보 새로고침 실패:", error);
    }
  };

  useEffect(() => {
    if (selectedOrg) {
      refreshOrganization();
      fetchCustomers();
    }
  }, [activeTab, selectedOrg?.id]);


  const fetchCustomers = async () => {
    if (!selectedOrg) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?tab=${activeTab}&organizationId=${selectedOrg.id}`);
      const data = await res.json();
      if (res.ok) {
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  const handleCreateInvitation = (customer: any) => {
    setSelectedCustomer(customer);
    setShowInvitationModal(true);
  };

  const handleRequestConnection = async (customer: any) => {
    if (!confirm(`"${customer.name}" 고객사에 연결 요청을 보내시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch("/api/customer-organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerId: customer.id,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || "연결 요청을 보냈습니다.");
        fetchCustomers();
      } else {
        alert(data.error || "연결 요청 실패");
      }
    } catch (error) {
      console.error("Connection request error:", error);
      alert("연결 요청 중 오류가 발생했습니다.");
    }
  };

  const filtered = useMemo(() => {
    // 연결 탭과 전체 탭일 때는 각 연결을 별도 행으로 확장
    let expandedCustomers = customers;
    if (activeTab === "connected" || activeTab === "all") {
      expandedCustomers = customers.flatMap((c: any) => {
        if (c.organizations && c.organizations.length > 1) {
          // 여러 연결이 있으면 각각을 별도 행으로
          return c.organizations.map((org: any) => ({
            ...c,
            organizations: [org],
            _connectionId: org.id,
            _siteType: org.proposedData?.siteType,
          }));
        }
        return [c];
      });
    }
    
    return expandedCustomers
      .filter((c: any) => {
        if (!q) {
          const matchesActive = showInactive ? true : c.isActive !== false;
          return matchesActive;
        }
        
        const searchLower = q.toLowerCase();
        const matchesSearch = 
          (c.code && c.code.toLowerCase().includes(searchLower)) ||
          (c.name && c.name.toLowerCase().includes(searchLower)) ||
          (c.businessNumber && c.businessNumber.toLowerCase().includes(searchLower)) ||
          (c.fullName && c.fullName.toLowerCase().includes(searchLower)) ||
          (c.representative && c.representative.toLowerCase().includes(searchLower)) ||
          (c.siteType && c.siteType.toLowerCase().includes(searchLower)) ||
          (c.address && c.address.toLowerCase().includes(searchLower)) ||
          (c.businessType && c.businessType.toLowerCase().includes(searchLower)) ||
          (c.industry && c.industry.toLowerCase().includes(searchLower)) ||
          (c.siteCategory && c.siteCategory.toLowerCase().includes(searchLower)) ||
          (c.corporateNumber && c.corporateNumber.toLowerCase().includes(searchLower));
        
        const matchesActive = showInactive ? true : c.isActive !== false;
        return matchesSearch && matchesActive;
      })
      .sort((a: any, b: any) => {
        if (a.code === 'CUST999') return 1;
        if (b.code === 'CUST999') return -1;
        return (a.code || a.name).localeCompare(b.code || b.name);
      });
  }, [customers, q, showInactive, activeTab]);

  // 같은 코드를 가진 고객사 그룹핑
  const grouped = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filtered.forEach((c: any) => {
      const key = c.code || c.name; // 코드가 없으면 name을 키로 사용
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    });
    return groups;
  }, [filtered]);

  const handleBulkUpload = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
    try {
      console.log("[고객사 일괄업로드] 파일 읽기 시작:", file.name);
      const text = await file.text();
      console.log("[고객사 일괄업로드] CSV 내용:", text.substring(0, 200));
      
      const res = await fetch("/api/customers/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText: text }),
      });
      
      console.log("[고객사 일괄업로드] API 응답 상태:", res.status);
      const data = await res.json();
      console.log("[고객사 일괄업로드] API 응답 데이터:", data);
      
      if (res.ok) {
        await fetchCustomers();
        return {
          success: true,
          message: data.message || "업로드 성공",
          count: data.count,
        };
      } else {
        console.error("[고객사 일괄업로드] API 오류:", data.error);
        return {
          success: false,
          message: data.error || "업로드 실패",
        };
      }
    } catch (error: any) {
      console.error("[고객사 일괄업로드] 예외 발생:", error);
      return {
        success: false,
        message: error.message || "오류 발생",
      };
    }
  };

  const onExport = () => {
    const header = ["\uace0\uac1d\uc0ac\ucf54\ub4dc", "\uace0\uac1d\uc0ac\uba85(\uc57d\uce6d)", "\uc0ac\uc5c5\uc790\ubc88\ud638", "\uace0\uac1d\uc0ac\uba85(\uc815\uc2dd)", "\ub300\ud45c\uc790", "\uc0ac\uc5c5\uc7a5\uad6c\ubd84", "\uc8fc\uc18c", "\uc5c5\ud0dc", "\uc5c5\uc885", "\uc0ac\uc5c5\uc7a5\uc885\ubcc4", "\ubc95\uc778\ub4f1\ub85d\ubc88\ud638", "\uad74\ub69d\uc218"];
    const body = filtered.map((c: any) => [
      c.code || "",
      c.name,
      c.businessNumber || "-",
      c.fullName || c.name,
      c.representative || "-",
      c.siteType || "-",
      c.address || "-",
      c.businessType || "-",
      c.industry || "-",
      c.siteCategory || "-",
      c.corporateNumber || "-",
      c._count?.stacks ?? 0
    ]);
    const csv = [header, ...body].map((cols) => cols.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 조건부 렌더링 (모든 훅 호출 후)
  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!selectedOrg) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">조직 정보를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">고객사 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          
          {/* 탭 - 권한 체크 */}
          <div className="flex gap-2 mb-1.5">
            {hasPermission('customer.tab.all') && (
              <button
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                📊 전체
              </button>
            )}
            {hasPermission('customer.tab.internal') && (
              <button
                onClick={() => setActiveTab("internal")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "internal"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                📋 내부
              </button>
            )}
            {hasPermission('customer.tab.connected') && (
              <button
                onClick={() => setActiveTab("connected")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "connected"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                🤝 연결
              </button>
            )}
          </div>
          
          {/* 검색 필터 - 권한 체크 */}
          {hasPermission('customer.search') && (
            <div className="flex flex-col" style={{ minWidth: '280px' }}>
              <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
              <Input 
                className="text-sm h-8"
                value={q} 
                onChange={(e) => setQ((e.target as HTMLInputElement).value)} 
                placeholder="코드, 고객사명, 대표자, 주소, 업태, 업종 등" 
              />
            </div>
          )}
          
          {hasPermission('customer.filter') && (
            <label className="flex items-center gap-1.5 text-xs cursor-pointer mb-1.5 whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded"
              />
              비활성 표시
            </label>
          )}
          
          <div className="flex gap-1.5 ml-auto mb-1.5">
            <Button size="sm" variant="secondary" onClick={() => setShowHelpModal(true)}>❓ 도움말</Button>
            {!isReadOnly && (
              <>
                {hasPermission('customer.export') && (
                  <Button size="sm" variant="secondary" onClick={onExport}>Excel</Button>
                )}
                {hasPermission('customer.bulk_upload') && (
                  <Button size="sm" variant="secondary" onClick={() => setShowBulkUploadModal(true)}>일괄업로드</Button>
                )}
                {selectedOrg?.hasContractManagement && hasPermission('contract.view') && (
                  <Button size="sm" variant="secondary" onClick={() => setShowContractModal(true)}>계약관리</Button>
                )}
                {activeTab === "connected" && hasPermission('customer.create') && (
                  <Button size="sm" onClick={() => setShowSearchModal(true)}>🔍 신규검색연결</Button>
                )}
                {activeTab !== "connected" && hasPermission('customer.create') && (
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>+ 신규 추가</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="w-full table-fixed">
          <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[3%]">연결상태</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[6%]">고객사코드</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[7%]">고객사명(약칭)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[5%]">사업자번호</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[8%]">고객사명(정식)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[4%]">대표자</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[5%]">사업장구분</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[9%]">주소</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[4%]">업태</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[7%]">업종</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[4%]">사업장종별</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[6%]">법인등록번호</Th>
                <Th className="bg-gray-50 dark:bg-gray-800 w-[3%]">굴뚝수</Th>
                {!isReadOnly && <Th className="bg-gray-50 dark:bg-gray-800 w-[10%]">액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={14} className="text-center text-gray-500 py-8">
                    로딩 중...
                  </Td>
                </Tr>
              ) : filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={14} className="text-center text-gray-500 py-8">
                    {activeTab === "all" && "등록된 고객사가 없습니다"}
                    {activeTab === "internal" && "내부 관리 고객사가 없습니다"}
                    {activeTab === "connected" && "연결된 고객사가 없습니다"}
                    {activeTab === "search" && "검색 가능한 고객사가 없습니다"}
                  </Td>
                </Tr>
              ) : (
                Object.entries(grouped).map(([groupKey, customers]) => (
                  <>
                    {customers.map((c: any, idx: number) => (
                      <CustomerRow
                        key={c.id}
                        customer={c}
                        role={role}
                        onRefetch={fetchCustomers}
                        onEdit={handleEdit}
                        activeTab={activeTab}
                        onCreateInvitation={handleCreateInvitation}
                        onRequestConnection={handleRequestConnection}
                        isGrouped={customers.length > 1}
                        isFirstInGroup={idx === 0}
                        isLastInGroup={idx === customers.length - 1}
                        groupSize={customers.length}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </>
                ))
              )}
            </Tbody>
          </Table>
        </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            로딩 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            {activeTab === "all" && "등록된 고객사가 없습니다"}
            {activeTab === "internal" && "내부 관리 고객사가 없습니다"}
            {activeTab === "connected" && "연결된 고객사가 없습니다"}
            {activeTab === "search" && "검색 가능한 고객사가 없습니다"}
          </div>
        ) : (
          Object.entries(grouped).map(([groupKey, customers]) => (
            <div key={groupKey}>
              {customers.map((c: any, idx: number) => {
                const isActive = c.isActive !== false;
                const isGrouped = customers.length > 1;
                const isFirstInGroup = idx === 0;
                return (
                  <div key={c.id} className={`rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2 ${!isActive ? "opacity-50" : ""} ${isGrouped ? "border-l-4 border-l-blue-400" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${isActive ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"}`}>
                        {isActive ? "활성" : "비활성"}
                      </span>
                      {!isReadOnly && (
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(c)} className="text-xs text-green-600 hover:underline">수정</button>
                          <button onClick={async () => {
                            try {
                              const res = await fetch(`/api/customers/${c.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ isActive: !c.isActive }),
                              });
                              if (res.ok) fetchCustomers();
                              else alert("상태 변경 실패");
                            } catch (err) {
                              alert("오류 발생");
                            }
                          }} className="text-xs text-blue-600 hover:underline">
                            {isActive ? "비활성화" : "활성화"}
                          </button>
                          {!isActive && !c._count?.measurements && (
                            <button onClick={async () => {
                              const hasMeasurements = c._count?.measurements > 0;
                              if (hasMeasurements) {
                                alert("측정 기록이 있는 고객사는 삭제할 수 없습니다.");
                                return;
                              }
                              if (!confirm(`"${c.name}" 고객사를 삭제하시겠습니까?`)) return;
                              try {
                                const res = await fetch(`/api/customers/${c.id}`, { method: "DELETE" });
                                if (res.ok) fetchCustomers();
                                else alert("삭제 실패");
                              } catch (err) {
                                alert("오류 발생");
                              }
                            }} className="text-xs text-red-600 hover:underline">삭제</button>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">📋 코드:</span> {c.code || "-"}</div>
                      {isGrouped && isFirstInGroup && (
                        <div className="text-blue-600"><span className="text-gray-500">🏢 사업장:</span> {customers.length}개</div>
                      )}
                      <div className="col-span-2"><span className="text-gray-500">📍 약칭:</span> {c.name}</div>
                      <div className="col-span-2"><span className="text-gray-500">🔢 사업자번호:</span> {c.businessNumber || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">🏭 정식명:</span> {c.fullName || c.name}</div>
                      <div><span className="text-gray-500">👤 대표자:</span> {c.representative || "-"}</div>
                      <div><span className="text-gray-500">🏗️ 구분:</span> {c.siteType || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📍 주소:</span> {c.address || "-"}</div>
                      <div><span className="text-gray-500">💼 업태:</span> {c.businessType || "-"}</div>
                      <div><span className="text-gray-500">🏢 업종:</span> {c.industry || "-"}</div>
                      <div><span className="text-gray-500">⚙️ 종별:</span> {c.siteCategory || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">🏛️ 법인등록번호:</span> {c.corporateNumber || "-"}</div>
                      <div><span className="text-gray-500">🏭 굴뚝:</span> {c._count?.stacks ?? 0}개</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* 고객사 등록/수정 모달 */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={() => {
          fetchCustomers();
          handleCloseModal();
        }}
        customer={editingCustomer}
      />

      <CreateInvitationModal
        isOpen={showInvitationModal}
        onClose={() => setShowInvitationModal(false)}
        customer={selectedCustomer}
        onSuccess={fetchCustomers}
      />

      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        title="고객사 일괄업로드"
        templateHeaders={["고객사코드", "고객사명(약칭)", "사업자번호", "고객사명(정식)", "대표자", "사업장구분", "주소", "업태", "업종", "사업장종별", "법인등록번호"]}
        exampleRow={["CUST001", "AA제조", "123-45-67890", "주식회사 AA제조", "홍길동", "본사", "서울시 강남구", "제조", "제조업", "1종", "123456-1234567"]}
        templateFileName="고객사_일괄업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="고객사명(약칭)은 필수 항목입니다. 나머지 항목은 선택사항입니다."
      />

      <ContractManagementModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />

      <SearchConnectionModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        organizationId={selectedOrg?.id || ""}
        onSuccess={fetchCustomers}
      />

      <CustomerManagementHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </section>
  );
}
