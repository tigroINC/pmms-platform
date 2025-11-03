"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Building2, Plus, Trash2, FileStack } from "lucide-react";

type DraftCustomer = {
  customerId: string;
  name: string;
  businessNumber: string | null;
  address: string | null;
  phone: string | null;
  status: string;
  stackCount: number;
  createdAt: string;
};

export default function DraftCustomersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<DraftCustomer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    name: string;
    businessNumber: string;
    address: string;
    phone: string;
  }>({
    name: "",
    businessNumber: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (user?.role !== "ORG_ADMIN" && user?.role !== "OPERATOR") {
      router.push("/dashboard");
      return;
    }
    fetchCustomers();
  }, [user, router]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/org/draft-customers");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Failed to fetch draft customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert("고객사명은 필수입니다.");
      return;
    }

    try {
      const res = await fetch("/api/org/draft-customers/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("임시 고객이 등록되었습니다.");
        setShowModal(false);
        setFormData({ name: "", businessNumber: "", address: "", phone: "" });
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || "등록 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  const handleDelete = async (customerId: string, name: string) => {
    if (!confirm(`"${name}" 고객을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchCustomers();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">임시 고객 관리</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            연결 전에 고객사 정보를 미리 등록하고 굴뚝을 관리할 수 있습니다.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          신규 고객 등록
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            등록된 임시 고객이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.customerId}
              className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{customer.name}</h3>
                  <span className="inline-block px-2 py-0.5 text-xs rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    임시 등록
                  </span>
                </div>
              </div>

              {customer.businessNumber && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  사업자번호: {customer.businessNumber}
                </p>
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                굴뚝: <strong>{customer.stackCount}개</strong>
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    router.push(`/org/draft-customers/${customer.customerId}/stacks`)
                  }
                  className="flex-1"
                >
                  <FileStack className="h-3 w-3 mr-1" />
                  굴뚝 관리
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleDelete(customer.customerId, customer.name)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 신규 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">임시 고객 등록</h2>
            <form onSubmit={handleCreate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    고객사명 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 삼성전자"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    사업자등록번호
                  </label>
                  <Input
                    value={formData.businessNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, businessNumber: e.target.value })
                    }
                    placeholder="123-45-67890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">주소</label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="경기도 화성시..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">전화번호</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="02-1234-5678"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ name: "", businessNumber: "", address: "", phone: "" });
                  }}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button type="submit" className="flex-1">
                  등록
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
