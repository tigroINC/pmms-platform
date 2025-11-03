"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import AdminHeader from "@/components/layout/AdminHeader";
import Link from "next/link";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  corporateNumber?: string;
  businessType?: string;
  address?: string;
  phone?: string;
  email?: string;
  representative?: string;
  website?: string;
  fax?: string;
  establishedDate?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users: Array<{
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    department?: string;
    position?: string;
    status: string;
    isActive: boolean;
    createdAt: string;
  }>;
  customers: Array<{
    customer: {
      id: string;
      name: string;
      businessNumber?: string;
    };
  }>;
  _count: {
    users: number;
    customers: number;
  };
}

export default function OrganizationDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminChange, setShowAdminChange] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Organization>>({});

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        fetchOrganization();
      }
    }
  }, [status, session, router, id]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${id}`);
      const data = await response.json();

      if (response.ok) {
        setOrganization(data.organization);
      } else {
        alert(data.error || "조직 정보를 불러오는데 실패했습니다.");
        router.push("/admin/organizations");
      }
    } catch (error) {
      console.error("Fetch organization error:", error);
      alert("조직 정보를 불러오는데 실패했습니다.");
      router.push("/admin/organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAdmin = async () => {
    if (!selectedNewAdmin) {
      alert("새 관리자를 선택해주세요.");
      return;
    }

    if (!confirm("관리자를 변경하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/organizations/${id}/change-admin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminId: selectedNewAdmin }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setShowAdminChange(false);
        fetchOrganization();
      } else {
        alert(data.error || "관리자 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("Change admin error:", error);
      alert("관리자 변경 중 오류가 발생했습니다.");
    }
  };

  const handleEditClick = () => {
    setEditData({
      name: organization?.name,
      businessNumber: organization?.businessNumber,
      corporateNumber: organization?.corporateNumber || "",
      businessType: organization?.businessType || "",
      address: organization?.address || "",
      phone: organization?.phone || "",
      email: organization?.email || "",
      representative: organization?.representative || "",
      website: organization?.website || "",
      fax: organization?.fax || "",
      establishedDate: organization?.establishedDate || "",
    });
    setIsEditing(true);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!confirm("회사 정보를 수정하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        setIsEditing(false);
        fetchOrganization();
      } else {
        alert(data.error || "정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update organization error:", error);
      alert("정보 수정 중 오류가 발생했습니다.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  if (loading || !organization) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  const currentAdmin = organization.users.find(u => u.role === "ORG_ADMIN");
  const otherUsers = organization.users.filter(u => u.role === "OPERATOR" && u.status === "APPROVED");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader />
      
      <div className="max-w-7xl mx-auto p-8">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              환경측정기업 상세
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {organization.name}
            </p>
          </div>
          <Link href="/admin/organizations">
            <Button>← 목록으로</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 회사 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 기본 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  회사 정보
                </h2>
                {!isEditing ? (
                  <Button onClick={handleEditClick} className="text-sm px-3 py-1">
                    수정
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button onClick={handleSaveEdit} className="text-sm px-3 py-1 bg-green-600 hover:bg-green-700 text-white">
                      저장
                    </Button>
                    <Button onClick={handleCancelEdit} className="text-sm px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-800">
                      취소
                    </Button>
                  </div>
                )}
              </div>
              
              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="법인명" value={organization.name} />
                  <InfoItem label="사업자등록번호" value={organization.businessNumber} />
                  <InfoItem label="법인등록번호" value={organization.corporateNumber} />
                  <InfoItem label="업종" value={organization.businessType} />
                  <InfoItem label="대표자명" value={organization.representative} />
                  <InfoItem label="전화번호" value={organization.phone} />
                  <InfoItem label="이메일" value={organization.email} />
                  <InfoItem label="팩스번호" value={organization.fax} />
                  <InfoItem label="홈페이지" value={organization.website} />
                  <InfoItem 
                    label="설립일" 
                    value={organization.establishedDate ? new Date(organization.establishedDate).toLocaleDateString() : undefined} 
                  />
                  <InfoItem label="주소" value={organization.address} className="md:col-span-2" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <EditField label="법인명" value={editData.name || ""} onChange={(v) => handleEditChange("name", v)} required />
                  <EditField label="사업자등록번호" value={editData.businessNumber || ""} onChange={(v) => handleEditChange("businessNumber", v)} required />
                  <EditField label="법인등록번호" value={editData.corporateNumber || ""} onChange={(v) => handleEditChange("corporateNumber", v)} />
                  <EditField label="업종" value={editData.businessType || ""} onChange={(v) => handleEditChange("businessType", v)} />
                  <EditField label="대표자명" value={editData.representative || ""} onChange={(v) => handleEditChange("representative", v)} />
                  <EditField label="전화번호" value={editData.phone || ""} onChange={(v) => handleEditChange("phone", v)} />
                  <EditField label="이메일" value={editData.email || ""} onChange={(v) => handleEditChange("email", v)} type="email" />
                  <EditField label="팩스번호" value={editData.fax || ""} onChange={(v) => handleEditChange("fax", v)} />
                  <EditField label="홈페이지" value={editData.website || ""} onChange={(v) => handleEditChange("website", v)} />
                  <EditField 
                    label="설립일" 
                    value={editData.establishedDate ? editData.establishedDate.split('T')[0] : ""} 
                    onChange={(v) => handleEditChange("establishedDate", v)} 
                    type="date"
                  />
                  <EditField label="주소" value={editData.address || ""} onChange={(v) => handleEditChange("address", v)} className="md:col-span-2" />
                </div>
              )}
            </div>

            {/* 구독 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                구독 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem label="플랜" value={organization.subscriptionPlan} />
                <InfoItem label="상태" value={organization.subscriptionStatus} />
                <InfoItem 
                  label="승인 상태" 
                  value={organization.isActive ? "활성" : "승인 대기"}
                  valueClassName={organization.isActive ? "text-green-600" : "text-yellow-600"}
                />
                <InfoItem 
                  label="등록일" 
                  value={new Date(organization.createdAt).toLocaleString()} 
                />
              </div>
            </div>

            {/* 관리자 정보 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  관리자 정보
                </h2>
                {otherUsers.length > 0 && (
                  <Button
                    onClick={() => setShowAdminChange(!showAdminChange)}
                    className="text-sm px-3 py-1"
                  >
                    {showAdminChange ? "취소" : "관리자 변경"}
                  </Button>
                )}
              </div>

              {currentAdmin ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoItem label="이름" value={currentAdmin.name} />
                  <InfoItem label="이메일" value={currentAdmin.email} />
                  <InfoItem label="전화번호" value={currentAdmin.phone} />
                  <InfoItem label="부서" value={currentAdmin.department} />
                  <InfoItem label="직책" value={currentAdmin.position} />
                  <InfoItem 
                    label="상태" 
                    value={currentAdmin.isActive ? "활성" : "비활성"}
                    valueClassName={currentAdmin.isActive ? "text-green-600" : "text-gray-400"}
                  />
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">관리자가 없습니다.</p>
              )}

              {/* 관리자 변경 UI */}
              {showAdminChange && otherUsers.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    새 관리자 선택
                  </h3>
                  <select
                    value={selectedNewAdmin}
                    onChange={(e) => setSelectedNewAdmin(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white mb-3"
                  >
                    <option value="">선택하세요</option>
                    {otherUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.email}) - {user.department || "부서 없음"}
                      </option>
                    ))}
                  </select>
                  <Button
                    onClick={handleChangeAdmin}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    관리자 변경
                  </Button>
                </div>
              )}
            </div>

            {/* 임직원 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                임직원 목록 ({organization.users.length}명)
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        이름
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        이메일
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        역할
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        부서/직책
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {organization.users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {user.email}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === "ORG_ADMIN" 
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          }`}>
                            {user.role === "ORG_ADMIN" ? "관리자" : "임직원"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {user.department || "-"} / {user.position || "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                          }`}>
                            {user.isActive ? "활성" : "비활성"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 사이드바 - 통계 */}
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                통계
              </h2>
              <div className="space-y-4">
                <StatItem label="임직원 수" value={organization._count.users} />
                <StatItem label="고객사 수" value={organization._count.customers} />
              </div>
            </div>

            {/* 고객사 목록 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                고객사 목록
              </h2>
              {organization.customers.length > 0 ? (
                <div className="space-y-2">
                  {organization.customers.map((co) => (
                    <div
                      key={co.customer.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {co.customer.name}
                      </div>
                      {co.customer.businessNumber && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {co.customer.businessNumber}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  등록된 고객사가 없습니다.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ 
  label, 
  value, 
  className = "",
  valueClassName = ""
}: { 
  label: string; 
  value?: string | null; 
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`mt-1 text-sm text-gray-900 dark:text-white ${valueClassName}`}>
        {value || "-"}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function EditField({ 
  label, 
  value, 
  onChange, 
  className = "",
  type = "text",
  required = false
}: { 
  label: string; 
  value: string; 
  onChange: (value: string) => void;
  className?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
