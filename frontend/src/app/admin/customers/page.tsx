"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import AdminHeader from "@/components/layout/AdminHeader";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  businessNumber: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  representative: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
  }>;
}

export default function CustomersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchCustomers();
      }
    }
  }, [status, session, router]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customers");
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers);
      } else {
        alert(data.error || "고객회사 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch customers error:", error);
      alert("고객회사 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm("이 고객회사를 승인하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchCustomers();
      } else {
        alert(data.error || "승인에 실패했습니다.");
      }
    } catch (error) {
      console.error("Approve error:", error);
      alert("승인 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("이 고객회사를 거부하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        fetchCustomers();
      } else {
        alert(data.error || "거부에 실패했습니다.");
      }
    } catch (error) {
      console.error("Reject error:", error);
      alert("거부 중 오류가 발생했습니다.");
    }
  };

  const handleViewSystem = (customerId: string) => {
    // 세션 스토리지에 임시로 조회할 업체 ID 저장
    sessionStorage.setItem("viewAsCustomer", customerId);
    router.push("/dashboard");
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              고객회사 관리
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              고객회사 승인 및 관리
            </p>
          </div>
          <Link href="/admin/dashboard">
            <Button>← 대시보드로</Button>
          </Link>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">전체</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {customers.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">승인 대기</div>
            <div className="text-2xl font-bold text-yellow-600">
              {customers.filter((c) => !c.isActive).length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">활성</div>
            <div className="text-2xl font-bold text-green-600">
              {customers.filter((c) => c.isActive).length}
            </div>
          </div>
        </div>

        {/* 목록 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    회사명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사업자등록번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    관리자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    사용자 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </div>
                      {customer.address && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {customer.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {customer.businessNumber || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.users[0] ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.users[0].name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {customer.users[0].email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {customer._count.users}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                          customer.isActive
                        )}`}
                      >
                        {customer.isActive ? "활성" : "승인 대기"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!customer.isActive ? (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleApprove(customer.id)}
                            className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 rounded text-left"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(customer.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 rounded text-left"
                          >
                            거부
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => router.push(`/admin/customers/${customer.id}`)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded text-left"
                          >
                            상세
                          </button>
                          <button
                            onClick={() => handleViewSystem(customer.id)}
                            className="px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-800 rounded text-left"
                          >
                            시스템 보기
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              등록된 고객회사가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
