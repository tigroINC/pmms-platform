"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface StackRequest {
  id: string;
  requestType: string;
  stackName: string;
  stackCode: string | null;
  location: string;
  height: number | null;
  diameter: number | null;
  status: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
  };
  stack?: {
    id: string;
    name: string;
  };
}

export default function CustomerStackRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<StackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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
      fetchRequests();
    }
  }, [session, status, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const customerId = (session?.user as any)?.customerId;
      const res = await fetch(`/api/stack-requests?customerId=${customerId}`);
      const data = await res.json();
      
      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        console.error("Failed to fetch requests:", data.error);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string, requestType: string) => {
    const action = requestType === "NEW_STACK" ? "create_new" : "assign_existing";
    
    if (!confirm(`이 굴뚝 ${requestType === "NEW_STACK" ? "등록" : "담당"} 요청을 승인하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/stack-requests/${requestId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        alert("요청이 승인되었습니다.");
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || "승인 실패");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm("이 요청을 거부하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/stack-requests/${requestId}/reject`, {
        method: "PATCH",
      });

      if (res.ok) {
        alert("요청이 거부되었습니다.");
        fetchRequests();
      } else {
        const data = await res.json();
        alert(data.error || "거부 실패");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const filteredRequests = requests.filter((req) => {
    return statusFilter === "ALL" || req.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    const labels = {
      PENDING: "대기중",
      APPROVED: "승인됨",
      REJECTED: "거부됨",
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getRequestTypeBadge = (type: string) => {
    return type === "NEW_STACK" ? (
      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
        신규 등록
      </span>
    ) : (
      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
        담당 추가
      </span>
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">굴뚝 등록 요청 관리</h1>
        <p className="text-gray-600 mt-1">환경측정기업의 굴뚝 등록 및 담당 요청 관리</p>
      </div>

      {/* 필터 */}
      <div className="mb-4 flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="ALL">전체</option>
          <option value="PENDING">대기중</option>
          <option value="APPROVED">승인됨</option>
          <option value="REJECTED">거부됨</option>
        </select>

        <div className="ml-auto text-sm text-gray-500">
          총 {filteredRequests.length}건
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청기업</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">굴뚝명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">굴뚝코드</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  굴뚝 등록 요청이 없습니다.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRequestTypeBadge(req.requestType)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    {req.organization.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {req.stackName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {req.stackCode || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                    {req.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {req.height && req.diameter ? (
                      <div>
                        <div>높이: {req.height}m</div>
                        <div>직경: {req.diameter}m</div>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {req.status === "PENDING" && isAdmin && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(req.id, req.requestType)}
                          className="text-green-600 hover:text-green-900"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          거부
                        </button>
                      </div>
                    )}
                    {req.status !== "PENDING" && (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
