"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import OrganizationRequestModal from "@/components/modals/OrganizationRequestModal";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  phone: string;
  email: string;
  address: string;
}

interface Connection {
  id: string;
  status: string;
  requestedBy: string;
  customCode: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  daysRemaining: number | null;
  createdAt: string;
  organization: Organization;
  siteType: string | null;
}

export default function CustomerOrganizationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== "CUSTOMER_ADMIN" && userRole !== "CUSTOMER_USER" && userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchConnections();
    }
  }, [session, status, router]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const customerId = (session?.user as any)?.customerId;
      console.log("[Frontend] Fetching connections for customerId:", customerId);
      const res = await fetch(`/api/connections/by-customer?customerId=${customerId}`);
      const data = await res.json();
      
      if (res.ok) {
        console.log("[Frontend] Received connections:", data.connections?.length);
        console.log("[Frontend] First connection siteType:", data.connections?.[0]?.siteType);
        console.log("[Frontend] First connection proposedData:", data.connections?.[0]?.proposedData);
        console.log("[Frontend] Full first connection:", data.connections?.[0]);
        setConnections(data.connections || []);
      } else {
        console.error("Failed to fetch connections:", data.error);
        console.error("Error details:", data.details);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (connectionId: string) => {
    if (!confirm("이 연결 초대를 승인하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/customer-organizations/${connectionId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        alert("연결이 승인되었습니다.");
        fetchConnections();
      } else {
        const data = await res.json();
        alert(data.error || "승인 실패");
      }
    } catch (error) {
      console.error("Error approving connection:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (connectionId: string) => {
    if (!confirm("이 연결 초대를 거부하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/customer-organizations/${connectionId}/reject`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("연결이 거부되었습니다.");
        fetchConnections();
      } else {
        const data = await res.json();
        alert(data.error || "거부 실패");
      }
    } catch (error) {
      console.error("Error rejecting connection:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("이 환경측정기업과의 연결을 해제하시겠습니까? 기존 데이터는 읽기 전용으로 유지됩니다.")) return;

    try {
      const res = await fetch(`/api/customer-organizations/${connectionId}/disconnect`, {
        method: "POST",
      });

      if (res.ok) {
        alert("연결이 해제되었습니다.");
        fetchConnections();
      } else {
        const data = await res.json();
        alert(data.error || "연결 해제 실패");
      }
    } catch (error) {
      console.error("Error disconnecting:", error);
      alert("연결 해제 중 오류가 발생했습니다.");
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const matchesSearch = conn.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conn.organization.businessNumber.includes(searchTerm);
    const matchesStatus = statusFilter === "ALL" || conn.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      DISCONNECTED: "bg-gray-100 text-gray-800",
    };
    const labels = {
      PENDING: "대기중",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
      DISCONNECTED: "연결해제",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRequestedByBadge = (requestedBy: string) => {
    return requestedBy === "CUSTOMER" ? (
      <span className="text-xs text-blue-600">우리가 요청</span>
    ) : (
      <span className="text-xs text-purple-600">기업 초대</span>
    );
  };

  const userRole = (session?.user as any)?.role;
  const isAdmin = userRole === "CUSTOMER_ADMIN" || userRole === "SUPER_ADMIN";

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      {/* Compact Header - 반응형 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">환경측정기업 관리</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          <div className="flex flex-col" style={{ width: '300px', minWidth: '300px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">검색</label>
            <input
              type="text"
              placeholder="기업명 또는 사업자등록번호 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-sm h-8 px-3 border rounded dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
          <div className="flex flex-col" style={{ width: '140px', minWidth: '140px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm h-8 px-2 border rounded dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="ALL">전체</option>
              <option value="PENDING">대기중</option>
              <option value="APPROVED">승인됨</option>
              <option value="REJECTED">거부됨</option>
              <option value="DISCONNECTED">연결해제</option>
            </select>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowRequestModal(true)}
              className="ml-auto mb-1.5 bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700"
            >
              + 환경측정기업 연결 요청
            </button>
          )}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청구분</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기업명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사업자등록번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">계약기간</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">잔여일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사업장</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredConnections.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  연결된 환경측정기업이 없습니다.
                </td>
              </tr>
            ) : (
              filteredConnections.map((conn) => (
                <tr key={conn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(conn.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRequestedByBadge(conn.requestedBy)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {conn.organization.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {conn.organization.businessNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{conn.organization.phone}</div>
                    <div className="text-xs text-gray-400">{conn.organization.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conn.contractStartDate && conn.contractEndDate ? (
                      <div>{new Date(conn.contractStartDate).toLocaleDateString()} ~ {new Date(conn.contractEndDate).toLocaleDateString()}</div>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {conn.daysRemaining !== null ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        conn.daysRemaining < 0 ? 'bg-red-100 text-red-700' :
                        conn.daysRemaining <= 7 ? 'bg-red-50 text-red-600' :
                        conn.daysRemaining <= 28 ? 'bg-yellow-50 text-yellow-700' :
                        'bg-green-50 text-green-700'
                      }`}>
                        {conn.daysRemaining < 0 ? `만료 ${Math.abs(conn.daysRemaining)}일` : `${conn.daysRemaining}일`}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {conn.siteType || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {conn.status === "PENDING" && conn.requestedBy === "ORGANIZATION" && isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(conn.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(conn.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          거부
                        </button>
                      </div>
                    )}
                    {conn.status === "APPROVED" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/customer/organizations/${conn.organization.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          상세
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            연결해제
                          </button>
                        )}
                      </div>
                    )}
                    {conn.status === "PENDING" && conn.requestedBy === "CUSTOMER" && (
                      <span className="text-gray-500">대기중</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredConnections.length === 0 ? (
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-6 text-center text-gray-500">
            연결된 환경측정기업이 없습니다.
          </div>
        ) : (
          filteredConnections.map((conn) => (
            <div key={conn.id} className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-2">
              <div className="flex items-center justify-between mb-2">
                {getStatusBadge(conn.status)}
                {getRequestedByBadge(conn.requestedBy)}
              </div>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="font-medium text-lg">{conn.organization.name}</div>
                <div><span className="text-gray-500">💼 사업자:</span> {conn.organization.businessNumber}</div>
                <div><span className="text-gray-500">📞 연락처:</span> {conn.organization.phone}</div>
                <div className="text-xs text-gray-500">📧 {conn.organization.email}</div>
                {conn.contractStartDate && conn.contractEndDate && (
                  <div><span className="text-gray-500">📅 계약:</span> {new Date(conn.contractStartDate).toLocaleDateString()} ~ {new Date(conn.contractEndDate).toLocaleDateString()}</div>
                )}
                {conn.daysRemaining !== null && (
                  <div>
                    <span className="text-gray-500">⏱️ 잔여:</span>{" "}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      conn.daysRemaining < 0 ? 'bg-red-100 text-red-700' :
                      conn.daysRemaining <= 7 ? 'bg-red-50 text-red-600' :
                      conn.daysRemaining <= 28 ? 'bg-yellow-50 text-yellow-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      {conn.daysRemaining < 0 ? `만료 ${Math.abs(conn.daysRemaining)}일` : `${conn.daysRemaining}일`}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  {conn.status === "PENDING" && conn.requestedBy === "ORGANIZATION" && isAdmin && (
                    <>
                      <button onClick={() => handleApprove(conn.id)} className="w-full px-3 py-2 bg-green-500 text-white hover:bg-green-600 rounded text-sm">
                        승인
                      </button>
                      <button onClick={() => handleReject(conn.id)} className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm">
                        거부
                      </button>
                    </>
                  )}
                  {conn.status === "APPROVED" && (
                    <>
                      <button onClick={() => router.push(`/customer/organizations/${conn.organization.id}`)} className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm">
                        상세
                      </button>
                      {isAdmin && (
                        <button onClick={() => handleDisconnect(conn.id)} className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm">
                          연결해제
                        </button>
                      )}
                    </>
                  )}
                  {conn.status === "PENDING" && conn.requestedBy === "CUSTOMER" && (
                    <div className="text-center text-gray-500">대기중</div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 연결 요청 모달 */}
      <OrganizationRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={fetchConnections}
      />
    </section>
  );
}
