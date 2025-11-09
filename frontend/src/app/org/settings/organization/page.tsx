"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useOrganization } from "@/contexts/OrganizationContext";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Navbar from "@/components/layout/Navbar";

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
  subscriptionPlan: string;
  subscriptionStatus: string;
  subscriptionStartAt: string | null;
  subscriptionEndAt: string | null;
  maxUsers: number;
  maxStacks: number;
  maxDataRetention: number;
  billingEmail: string | null;
  billingContact: string | null;
  lastPaymentAt: string | null;
  nextBillingAt: string | null;
  hasContractManagement: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hideSubscriptionInfo: boolean;
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
        console.log("Organization data:", data.organization);
        console.log("hideSubscriptionInfo:", data.organization.hideSubscriptionInfo);
        console.log("Should show subscription:", !data.organization.hideSubscriptionInfo);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">조직 정보</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            조직의 기본 정보를 확인하고 수정할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="text-sm font-medium text-red-800 dark:text-red-200">{error}</div>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="text-sm font-medium text-green-800 dark:text-green-200">{success}</div>
          </div>
        )}

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">조직 정보</h2>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  정보 수정
                </Button>
              )}
            </div>
          </div>
          <div>
            <table className="w-full table-fixed divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">기업명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">사업자번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">법인번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">대표자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">업종</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">설립일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">전화</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">이메일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">팩스</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">웹사이트</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">주소</th>
                  {!organization.hideSubscriptionInfo && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">구독플랜</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">구독상태</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">활성상태</th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">가입일</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.name}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.businessNumber || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.corporateNumber || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="representative"
                        type="text"
                        value={formData.representative || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.representative || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="businessType"
                        type="text"
                        value={formData.businessType || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.businessType || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="establishedDate"
                        type="date"
                        value={formData.establishedDate ? formData.establishedDate.split('T')[0] : ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.establishedDate ? new Date(organization.establishedDate).toLocaleDateString() : "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.phone || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-all">{organization.email || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="fax"
                        type="tel"
                        value={formData.fax || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.fax || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="website"
                        type="url"
                        value={formData.website || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-all">{organization.website || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input
                        name="address"
                        type="text"
                        value={formData.address || ""}
                        onChange={handleChange}
                        className="w-full text-xs"
                      />
                    ) : (
                      <div className="break-words">{organization.address || "-"}</div>
                    )}
                  </td>
                  {!organization.hideSubscriptionInfo && (
                    <>
                      <td className="px-2 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 inline-block">
                          {organization.subscriptionPlan}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                          organization.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          organization.subscriptionStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {organization.subscriptionStatus}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full inline-block ${
                          organization.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {organization.isActive ? '활성' : '비활성'}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="break-words">{new Date(organization.createdAt).toLocaleDateString()}</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {editing && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  저장
                </Button>
                <Button
                  onClick={() => {
                    setEditing(false);
                    setFormData(organization);
                  }}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md"
                >
                  취소
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">조직 정보</h2>
              {!editing && (
                <Button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                >
                  수정
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div><span className="text-gray-500">🏢 기업명:</span> {organization.name}</div>
              <div><span className="text-gray-500">📋 사업자번호:</span> {organization.businessNumber || "-"}</div>
              <div><span className="text-gray-500">🆔 법인번호:</span> {organization.corporateNumber || "-"}</div>
              <div>
                <span className="text-gray-500">👤 대표자:</span>
                {editing ? (
                  <Input
                    name="representative"
                    type="text"
                    value={formData.representative || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.representative || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">💼 업종:</span>
                {editing ? (
                  <Input
                    name="businessType"
                    type="text"
                    value={formData.businessType || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.businessType || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">🏗️ 설립일:</span>
                {editing ? (
                  <Input
                    name="establishedDate"
                    type="date"
                    value={formData.establishedDate ? formData.establishedDate.split('T')[0] : ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.establishedDate ? new Date(organization.establishedDate).toLocaleDateString() : "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">📞 전화:</span>
                {editing ? (
                  <Input
                    name="phone"
                    type="tel"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.phone || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">📧 이메일:</span>
                {editing ? (
                  <Input
                    name="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.email || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">📠 팩스:</span>
                {editing ? (
                  <Input
                    name="fax"
                    type="tel"
                    value={formData.fax || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.fax || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">🌐 웹사이트:</span>
                {editing ? (
                  <Input
                    name="website"
                    type="url"
                    value={formData.website || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.website || "-"}`
                )}
              </div>
              <div>
                <span className="text-gray-500">📍 주소:</span>
                {editing ? (
                  <Input
                    name="address"
                    type="text"
                    value={formData.address || ""}
                    onChange={handleChange}
                    className="w-full mt-1"
                  />
                ) : (
                  ` ${organization.address || "-"}`
                )}
              </div>
              {!organization.hideSubscriptionInfo && (
                <>
                  <div>
                    <span className="text-gray-500">💳 구독플랜:</span>
                    <span className="ml-2 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      {organization.subscriptionPlan}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">📊 구독상태:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      organization.subscriptionStatus === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      organization.subscriptionStatus === 'TRIAL' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {organization.subscriptionStatus}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">✅ 활성상태:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                      organization.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {organization.isActive ? '활성' : '비활성'}
                    </span>
                  </div>
                </>
              )}
              <div><span className="text-gray-500">📅 가입일:</span> {new Date(organization.createdAt).toLocaleDateString()}</div>
            </div>
            {editing && (
              <div className="flex flex-col gap-2 pt-2">
                <button onClick={handleSubmit} className="w-full px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded text-sm">
                  저장
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData(organization);
                  }}
                  className="w-full px-3 py-2 bg-gray-500 text-white hover:bg-gray-600 rounded text-sm"
                >
                  취소
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
