"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import NewStackRequestModal from "@/components/modals/NewStackRequestModal";

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
  customer: {
    id: string;
    name: string;
  };
  stack?: {
    id: string;
    name: string;
  };
}

export default function OrgStackRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<StackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== "ORG_ADMIN" && userRole !== "OPERATOR" && userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchRequests();
    }
  }, [session, status, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const organizationId = (session?.user as any)?.organizationId;
      const res = await fetch(`/api/stack-requests?organizationId=${organizationId}`);
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
  const canRequest = userRole === "ORG_ADMIN" || userRole === "OPERATOR";

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
        <h1 className="text-2xl font-bold text-gray-900">굴뚝 등록 요청</h1>
        <p className="text-gray-600 mt-1">고객사 굴뚝 등록 및 담당 요청 관리</p>
      </div>

      {/* 필터 및 액션 */}
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

        <div className="text-sm text-gray-500">
          총 {filteredRequests.length}건
        </div>

        {canRequest && (
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="ml-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + 신규 굴뚝 등록 요청
          </button>
        )}
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청유형</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객사</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">굴뚝명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">굴뚝코드</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">위치</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제원</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청일</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
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
                    {req.customer.name}
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 신규 굴뚝 등록 요청 모달 */}
      <NewStackRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSuccess={fetchRequests}
      />
    </div>
  );
}
