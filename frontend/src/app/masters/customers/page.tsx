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

type TabType = "all" | "internal" | "connected" | "search";

// 고객사 행 컴포넌트
function CustomerRow({ 
  customer, 
  role, 
  onRefetch,
  onEdit,
  activeTab,
  onCreateInvitation,
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

  return (
    <Tr className={`${!isActive ? "opacity-50 bg-gray-50 dark:bg-gray-900/20" : ""} ${groupBorderClass}`}>
      <Td>
        {isActive ? (
          <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs">
            활성
          </span>
        ) : (
          <span className="inline-block px-2 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 text-xs">
            비활성
          </span>
        )}
      </Td>
      <Td className="font-mono text-xs">
        {customer.code || "-"}
        {isGrouped && isFirstInGroup && (
          <span className="ml-2 text-xs text-blue-600">({groupSize}개 사업장)</span>
        )}
      </Td>
      <Td className="font-medium">{customer.fullName || customer.name}</Td>
      <Td>{customer.name}</Td>
      <Td>{customer.siteType || "-"}</Td>
      <Td className="text-sm">{customer.address || "-"}</Td>
      <Td className="text-sm">{customer.industry || "-"}</Td>
      <Td>{customer.siteCategory || "-"}</Td>
      <Td className="text-center">{customer._count?.stacks ?? 0}</Td>
      {!isReadOnly && (
        <Td>
          <div className="flex gap-2">
            {/* 권한 체크는 부모 컴포넌트에서 전달받은 isReadOnly로 처리 */}
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
  const { selectedOrg, loading: orgLoading } = useOrganization();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  useEffect(() => {
    if (selectedOrg) {
      fetchCustomers();
    }
  }, [activeTab, selectedOrg]);

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

  const filtered = useMemo(() => {
    return customers
      .filter((c: any) => {
        if (!q) {
          const matchesActive = showInactive ? true : c.isActive !== false;
          return matchesActive;
        }
        
        const searchLower = q.toLowerCase();
        const matchesSearch = 
          (c.code && c.code.toLowerCase().includes(searchLower)) ||
          (c.name && c.name.toLowerCase().includes(searchLower)) ||
          (c.fullName && c.fullName.toLowerCase().includes(searchLower)) ||
          (c.siteType && c.siteType.toLowerCase().includes(searchLower)) ||
          (c.address && c.address.toLowerCase().includes(searchLower)) ||
          (c.industry && c.industry.toLowerCase().includes(searchLower)) ||
          (c.siteCategory && c.siteCategory.toLowerCase().includes(searchLower));
        
        const matchesActive = showInactive ? true : c.isActive !== false;
        return matchesSearch && matchesActive;
      })
      .sort((a: any, b: any) => {
        if (a.code === 'CUST999') return 1;
        if (b.code === 'CUST999') return -1;
        return (a.code || a.name).localeCompare(b.code || b.name);
      });
  }, [customers, q, showInactive]);

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
    const header = ["고객사코드", "고객사명(정식)", "고객사명(약칭)", "사업장구분", "주소", "업종", "사업장종별", "굴뚝수"];
    const body = filtered.map((c: any) => [
      c.code || "",
      c.fullName || c.name,
      c.name,
      c.siteType || "-",
      c.address || "-",
      c.industry || "-",
      c.siteCategory || "-",
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
            {hasPermission('customer.tab.search') && (
              <button
                onClick={() => setActiveTab("search")}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  activeTab === "search"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                🔍 검색
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
                placeholder="코드, 고객사명, 주소, 업종 등" 
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
                {hasPermission('customer.create') && (
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>+ 신규 추가</Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border overflow-x-auto max-h-[calc(100vh-180px)] overflow-y-auto">
        <Table className="min-w-[1200px]">
          <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th className="bg-gray-50 dark:bg-gray-800">상태</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">고객사코드</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">고객사명(정식)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">고객사명(약칭)</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">사업장구분</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">주소</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">업종</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">사업장종별</Th>
                <Th className="bg-gray-50 dark:bg-gray-800">굴뚝수</Th>
                {!isReadOnly && <Th className="bg-gray-50 dark:bg-gray-800">액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={10} className="text-center text-gray-500 py-8">
                    로딩 중...
                  </Td>
                </Tr>
              ) : filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={10} className="text-center text-gray-500 py-8">
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
                      <div className="col-span-2"><span className="text-gray-500">🏭 정식명:</span> {c.fullName || c.name}</div>
                      <div><span className="text-gray-500">📍 약칭:</span> {c.name}</div>
                      <div><span className="text-gray-500">🏗️ 구분:</span> {c.siteType || "-"}</div>
                      <div className="col-span-2"><span className="text-gray-500">📍 주소:</span> {c.address || "-"}</div>
                      <div><span className="text-gray-500">🏢 업종:</span> {c.industry || "-"}</div>
                      <div><span className="text-gray-500">⚙️ 종별:</span> {c.siteCategory || "-"}</div>
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
        templateHeaders={["고객사코드", "고객사명(약칭)", "고객사명(정식)", "사업장구분", "주소", "업종", "사업장종별"]}
        exampleRow={["CUST001", "고려아연", "고려아연 주식회사", "본사", "서울시 강남구", "제조업", "1종"]}
        templateFileName="고객사_일괄업로드_양식.csv"
        onUpload={handleBulkUpload}
        parseInstructions="고객사명(약칭)은 필수 항목입니다. 나머지 항목은 선택사항입니다."
      />

      <ContractManagementModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
      />
    </section>
  );
}
