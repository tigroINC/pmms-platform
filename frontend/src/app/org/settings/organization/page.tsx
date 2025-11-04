"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

interface OrganizationInfo {
  id: string;
  name: string;
  businessNumber: string | null;
  corporateNumber: string | null;
  businessType: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  representative: string | null;
  website: string | null;
  fax: string | null;
  establishedDate: string | null;
}

export default function OrganizationSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { selectedOrg } = useOrganization();
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<OrganizationInfo>>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (session?.user) {
      const userRole = (session.user as any).role;
      if (userRole !== "ORG_ADMIN" && userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
        return;
      }
      fetchOrganization();
    }
  }, [session, status, router, selectedOrg]);

  const fetchOrganization = async () => {
    if (!selectedOrg) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${selectedOrg.id}`);
      const data = await response.json();

      if (response.ok) {
        setOrganization(data.organization);
        setFormData(data.organization);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedOrg) return;

    // 업데이트 가능한 필드만 추출 (빈 문자열은 null로 변환)
    const updateData = {
      representative: formData.representative || null,
      businessType: formData.businessType || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      fax: formData.fax || null,
      establishedDate: formData.establishedDate || null,
    };

    try {
      const response = await fetch(`/api/organizations/${selectedOrg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("조직 정보가 수정되었습니다.");
        setEditing(false);
        fetchOrganization();
      } else {
        console.error("Update failed:", data);
        console.error("Error details:", data.details);
        setError(data.error || "조직 정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update organization error:", error);
      setError("조직 정보 수정 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">조직 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">조직 정보</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">조직의 기본 정보를 관리합니다</p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setEditing(false);
                setFormData(organization);
                setError("");
                setSuccess("");
              }}
            >
              취소
            </Button>
            <Button type="submit" form="org-form">
              저장
            </Button>
          </div>
        ) : (
          <Button type="button" size="sm" onClick={() => setEditing(true)}>
            수정
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      <form id="org-form" onSubmit={handleSubmit}>
        {/* 기본 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">기본 정보</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                기업명 (수정 불가)
              </label>
              <Input
                name="name"
                value={formData.name || ""}
                onChange={handleChange}
                disabled={true}
                className="bg-gray-100"
                placeholder="기업명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                사업자등록번호 (수정 불가)
              </label>
              <Input
                name="businessNumber"
                value={formData.businessNumber || ""}
                onChange={handleChange}
                disabled={true}
                className="bg-gray-100"
                placeholder="000-00-00000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                대표자명
              </label>
              <Input
                name="representative"
                value={formData.representative || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="대표자 성명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                업종/업태
              </label>
              <Input
                name="businessType"
                value={formData.businessType || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="예: 환경측정업"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                설립일
              </label>
              <Input
                name="establishedDate"
                type="date"
                value={formData.establishedDate ? formData.establishedDate.split('T')[0] : ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="YYYY-MM-DD"
              />
            </div>
          </div>
        </div>

        {/* 연락처 정보 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">연락처 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                대표 전화번호
              </label>
              <Input
                name="phone"
                value={formData.phone || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="02-1234-5678 또는 010-1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                대표 이메일
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="company@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                팩스번호
              </label>
              <Input
                name="fax"
                value={formData.fax || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="02-1234-5679"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                회사 웹사이트
              </label>
              <Input
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="https://www.example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                회사 주소
              </label>
              <Input
                name="address"
                value={formData.address || ""}
                onChange={handleChange}
                disabled={!editing}
                placeholder="서울특별시 강남구 ..."
                className="w-full"
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
