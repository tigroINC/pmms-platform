"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface CustomerOrganization {
  id: string;
  name: string;
  code?: string;
  businessNumber?: string;
  address?: string;
  industry?: string;
  siteType?: string;
  siteCategory?: string;
  contactPerson?: string;
  contactPhone?: string;
  isVerified?: boolean;
  lastModifiedBy?: "ORG" | "CUSTOMER" | null;
  lastModifiedAt?: string | null;
}

export default function CustomerOrganizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<CustomerOrganization | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessNumber: "",
    address: "",
    industry: "",
    siteType: "",
    siteCategory: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchOrganization();
    }
  }, [status, router]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const customerId = (session?.user as any)?.customerId;
      const response = await fetch(`/api/customer/organization`);
      const data = await response.json();

      if (response.ok && data.organization) {
        setOrganization(data.organization);
        setFormData({
          name: data.organization.name || "",
          businessNumber: data.organization.businessNumber || "",
          address: data.organization.address || "",
          industry: data.organization.industry || "",
          siteType: data.organization.siteType || "",
          siteCategory: data.organization.siteCategory || "",
        });
      } else {
        setError(data.error || "조직 정보를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("Fetch organization error:", error);
      setError("조직 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/customer/organization`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("조직 정보가 수정되었습니다.");
        setEditing(false);
        fetchOrganization();
      } else {
        setError(data.error || "조직 정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update organization error:", error);
      setError("조직 정보 수정에 실패했습니다.");
    }
  };

  const handleConfirm = async () => {
    try {
      const response = await fetch(`/api/customer/organization/confirm`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("조직 정보를 확인했습니다.");
        fetchOrganization();
      } else {
        setError(data.error || "확인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("Confirm organization error:", error);
      setError("확인 처리에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500">조직 정보를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const needsVerification = organization.isVerified === false && organization.lastModifiedBy === "ORG";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">조직 정보</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              고객사 조직 정보를 확인하고 수정할 수 있습니다.
            </p>
          </div>
          
          {/* 버튼 */}
          <div className="flex gap-3">
            {editing ? (
              <>
                <Button type="button" onClick={handleSubmit}>저장</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: organization.name || "",
                      businessNumber: organization.businessNumber || "",
                      address: organization.address || "",
                      industry: organization.industry || "",
                      siteType: organization.siteType || "",
                      siteCategory: organization.siteCategory || "",
                    });
                  }}
                >
                  취소
                </Button>
              </>
            ) : (
              <Button type="button" onClick={() => setEditing(true)}>
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 확인 필요 배너 */}
        {needsVerification && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">환경측정기업이 정보를 수정했습니다</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">변경된 내용을 확인하고 확인 버튼을 눌러주세요.</p>
                </div>
              </div>
              <Button onClick={handleConfirm} className="bg-yellow-600 hover:bg-yellow-700">
                확인
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
            {success}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      회사명 *
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={!editing}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업자번호
                    </label>
                    <Input
                      name="businessNumber"
                      value={formData.businessNumber}
                      onChange={handleChange}
                      disabled={!editing}
                      placeholder="000-00-00000"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      주소
                    </label>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      disabled={!editing}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      업종
                    </label>
                    <Input
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업장
                    </label>
                    <Input
                      name="siteType"
                      value={formData.siteType}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      사업장종별
                    </label>
                    <Input
                      name="siteCategory"
                      value={formData.siteCategory}
                      onChange={handleChange}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>

              {/* 수정 이력 */}
              {organization.lastModifiedAt && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    최종 수정: {new Date(organization.lastModifiedAt).toLocaleString('ko-KR')}
                    {organization.lastModifiedBy && ` (${organization.lastModifiedBy === 'ORG' ? '환경측정기업' : '고객사'})`}
                  </p>
                </div>
              )}

            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
