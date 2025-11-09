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
  corporateNumber?: string;
  fullName?: string;
  representative?: string;
  siteType?: string;
  address?: string;
  businessType?: string;
  industry?: string;
  siteCategory?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  hideSubscriptionInfo: boolean;
  isActive: boolean;
  isVerified?: boolean;
  lastModifiedBy?: "ORG" | "CUSTOMER" | null;
  lastModifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerOrganizationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<CustomerOrganization | null>(null);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingRowData, setEditingRowData] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    businessNumber: "",
    corporateNumber: "",
    fullName: "",
    representative: "",
    siteType: "",
    address: "",
    businessType: "",
    industry: "",
    siteCategory: "",
    contractStartDate: "",
    contractEndDate: "",
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
      
      // 고객사 정보 조회
      const response = await fetch(`/api/customer/organization`);
      const data = await response.json();

      if (response.ok && data.organization) {
        setOrganization(data.organization);
        setFormData({
          name: data.organization.name || "",
          code: data.organization.code || "",
          businessNumber: data.organization.businessNumber || "",
          corporateNumber: data.organization.corporateNumber || "",
          fullName: data.organization.fullName || "",
          representative: data.organization.representative || "",
          siteType: data.organization.siteType || "",
          address: data.organization.address || "",
          businessType: data.organization.businessType || "",
          industry: data.organization.industry || "",
          siteCategory: data.organization.siteCategory || "",
          contractStartDate: data.organization.contractStartDate ? data.organization.contractStartDate.split('T')[0] : "",
          contractEndDate: data.organization.contractEndDate ? data.organization.contractEndDate.split('T')[0] : "",
        });
      } else {
        setError(data.error || "조직 정보를 불러오는데 실패했습니다.");
      }
      
      // 연결된 환경측정기업 정보 조회
      const connRes = await fetch(`/api/connections/by-customer?customerId=${customerId}`);
      const connData = await connRes.json();
      if (connRes.ok && connData.connections) {
        setConnections(connData.connections.filter((c: any) => c.status === "APPROVED"));
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

  const handleSaveRow = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/customer-organizations/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedData: editingRowData }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("정보가 수정되었습니다.");
        setEditingRowId(null);
        setEditingRowData({});
        fetchOrganization();
      } else {
        setError(data.error || "정보 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Update row error:", error);
      setError("정보 수정에 실패했습니다.");
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
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">조직 정보</h1>
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

        {/* 안내 문구 */}
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            자체입력한 회사정보와 환경측정기업에서 등록한 회사정보를 관리합니다. 체크해서 오류가 발견되면 수정할 수 있습니다.
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[8%]">고객사명</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[7%]">사업자번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[7%]">법인번호</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">정식명칭</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[6%]">대표자</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[7%]">사업장구분</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[14%]">주소</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[6%]">업태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12%]">업종</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[5%]">사업장종별</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[6%]">가입일</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[9%]">정보출처</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[13%]">액션</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="name" type="text" value={formData.name} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.name}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.businessNumber || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.corporateNumber || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <div className="break-words">{organization.fullName || "-"}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="representative" type="text" value={formData.representative} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.representative || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="siteType" type="text" value={formData.siteType} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.siteType || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="address" type="text" value={formData.address} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.address || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="businessType" type="text" value={formData.businessType} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.businessType || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="industry" type="text" value={formData.industry} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.industry || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    {editing ? (
                      <Input name="siteCategory" type="text" value={formData.siteCategory} onChange={handleChange} className="w-full text-xs" />
                    ) : (
                      <div className="break-words">{organization.siteCategory || "-"}</div>
                    )}
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                    <div className="break-words">{new Date(organization.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">자체입력</span>
                  </td>
                  <td className="px-2 py-3 text-xs">
                    {editing ? (
                      <div className="flex gap-1">
                        <Button onClick={handleSubmit} className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded whitespace-nowrap">저장</Button>
                        <Button onClick={() => {
                          setEditing(false);
                          setFormData({
                            name: organization.name || "",
                            code: organization.code || "",
                            businessNumber: organization.businessNumber || "",
                            corporateNumber: organization.corporateNumber || "",
                            fullName: organization.fullName || "",
                            representative: organization.representative || "",
                            siteType: organization.siteType || "",
                            address: organization.address || "",
                            businessType: organization.businessType || "",
                            industry: organization.industry || "",
                            siteCategory: organization.siteCategory || "",
                            contractStartDate: organization.contractStartDate ? organization.contractStartDate.split('T')[0] : "",
                            contractEndDate: organization.contractEndDate ? organization.contractEndDate.split('T')[0] : "",
                          });
                        }} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded whitespace-nowrap">취소</Button>
                      </div>
                    ) : (
                      <Button onClick={() => setEditing(true)} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded whitespace-nowrap">수정</Button>
                    )}
                  </td>
                </tr>
                
                {/* 연결된 환경측정기업이 등록한 정보 */}
                {connections.map((conn) => {
                  const data = conn.proposedData || {};
                  const isEditing = editingRowId === conn.id;
                  const rowData = isEditing ? editingRowData : data;
                  
                  return (
                    <tr key={conn.id} className="bg-blue-50/30 dark:bg-blue-900/10">
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.name || ""} onChange={(e) => setEditingRowData({...editingRowData, name: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.name || organization.name || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        <div className="break-words">{data.businessNumber || organization.businessNumber || "-"}</div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        <div className="break-words">{data.corporateNumber || "-"}</div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.fullName || ""} onChange={(e) => setEditingRowData({...editingRowData, fullName: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.fullName || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.representative || ""} onChange={(e) => setEditingRowData({...editingRowData, representative: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.representative || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.siteType || ""} onChange={(e) => setEditingRowData({...editingRowData, siteType: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.siteType || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.address || ""} onChange={(e) => setEditingRowData({...editingRowData, address: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.address || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.businessType || ""} onChange={(e) => setEditingRowData({...editingRowData, businessType: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.businessType || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.industry || ""} onChange={(e) => setEditingRowData({...editingRowData, industry: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.industry || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        {isEditing ? (
                          <Input value={rowData.siteCategory || ""} onChange={(e) => setEditingRowData({...editingRowData, siteCategory: e.target.value})} className="w-full text-xs" />
                        ) : (
                          <div className="break-words">{data.siteCategory || "-"}</div>
                        )}
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="break-words">-</div>
                      </td>
                      <td className="px-2 py-3 text-xs text-gray-900 dark:text-gray-100">
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                          {conn.organization.name}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-xs">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button onClick={() => handleSaveRow(conn.id)} className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded whitespace-nowrap">저장</Button>
                            <Button onClick={() => {setEditingRowId(null); setEditingRowData({});}} className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded whitespace-nowrap">취소</Button>
                          </div>
                        ) : (
                          <Button onClick={() => {setEditingRowId(conn.id); setEditingRowData(data);}} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded whitespace-nowrap">수정</Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {/* 자체입력 카드 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">자체입력</span>
              {editing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">저장</Button>
                  <Button onClick={() => {
                    setEditing(false);
                    setFormData({
                      name: organization.name || "",
                      code: organization.code || "",
                      businessNumber: organization.businessNumber || "",
                      corporateNumber: organization.corporateNumber || "",
                      fullName: organization.fullName || "",
                      representative: organization.representative || "",
                      siteType: organization.siteType || "",
                      address: organization.address || "",
                      businessType: organization.businessType || "",
                      industry: organization.industry || "",
                      siteCategory: organization.siteCategory || "",
                      contractStartDate: organization.contractStartDate ? organization.contractStartDate.split('T')[0] : "",
                      contractEndDate: organization.contractEndDate ? organization.contractEndDate.split('T')[0] : "",
                    });
                  }} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded">취소</Button>
                </div>
              ) : (
                <Button onClick={() => setEditing(true)} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">수정</Button>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">고객사명:</span> {editing ? <Input name="name" value={formData.name} onChange={handleChange} className="mt-1" /> : ` ${organization.name}`}</div>
              <div><span className="text-gray-500">사업자번호:</span> {organization.businessNumber || "-"}</div>
              <div><span className="text-gray-500">법인번호:</span> {organization.corporateNumber || "-"}</div>
              <div><span className="text-gray-500">정식명칭:</span> {organization.fullName || "-"}</div>
              <div><span className="text-gray-500">대표자:</span> {editing ? <Input name="representative" value={formData.representative} onChange={handleChange} className="mt-1" /> : ` ${organization.representative || "-"}`}</div>
              <div><span className="text-gray-500">사업장구분:</span> {editing ? <Input name="siteType" value={formData.siteType} onChange={handleChange} className="mt-1" /> : ` ${organization.siteType || "-"}`}</div>
              <div><span className="text-gray-500">주소:</span> {editing ? <Input name="address" value={formData.address} onChange={handleChange} className="mt-1" /> : ` ${organization.address || "-"}`}</div>
              <div><span className="text-gray-500">업태:</span> {editing ? <Input name="businessType" value={formData.businessType} onChange={handleChange} className="mt-1" /> : ` ${organization.businessType || "-"}`}</div>
              <div><span className="text-gray-500">업종:</span> {editing ? <Input name="industry" value={formData.industry} onChange={handleChange} className="mt-1" /> : ` ${organization.industry || "-"}`}</div>
              <div><span className="text-gray-500">사업장종별:</span> {editing ? <Input name="siteCategory" value={formData.siteCategory} onChange={handleChange} className="mt-1" /> : ` ${organization.siteCategory || "-"}`}</div>
              <div><span className="text-gray-500">가입일:</span> {new Date(organization.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* 연결된 환경측정기업 카드들 */}
          {connections.map((conn) => {
            const data = conn.proposedData || {};
            const isEditing = editingRowId === conn.id;
            const rowData = isEditing ? editingRowData : data;
            
            return (
              <div key={conn.id} className="bg-blue-50/50 dark:bg-blue-900/10 rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                    {conn.organization.name}
                  </span>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button onClick={() => handleSaveRow(conn.id)} className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded">저장</Button>
                      <Button onClick={() => {setEditingRowId(null); setEditingRowData({});}} className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded">취소</Button>
                    </div>
                  ) : (
                    <Button onClick={() => {setEditingRowId(conn.id); setEditingRowData(data);}} className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded">수정</Button>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div><span className="text-gray-500">고객사명:</span> {isEditing ? <Input value={rowData.name || ""} onChange={(e) => setEditingRowData({...editingRowData, name: e.target.value})} className="mt-1" /> : ` ${data.name || organization.name || "-"}`}</div>
                  <div><span className="text-gray-500">사업자번호:</span> {data.businessNumber || organization.businessNumber || "-"}</div>
                  <div><span className="text-gray-500">법인번호:</span> {data.corporateNumber || "-"}</div>
                  <div><span className="text-gray-500">정식명칭:</span> {isEditing ? <Input value={rowData.fullName || ""} onChange={(e) => setEditingRowData({...editingRowData, fullName: e.target.value})} className="mt-1" /> : ` ${data.fullName || "-"}`}</div>
                  <div><span className="text-gray-500">대표자:</span> {isEditing ? <Input value={rowData.representative || ""} onChange={(e) => setEditingRowData({...editingRowData, representative: e.target.value})} className="mt-1" /> : ` ${data.representative || "-"}`}</div>
                  <div><span className="text-gray-500">사업장구분:</span> {isEditing ? <Input value={rowData.siteType || ""} onChange={(e) => setEditingRowData({...editingRowData, siteType: e.target.value})} className="mt-1" /> : ` ${data.siteType || "-"}`}</div>
                  <div><span className="text-gray-500">주소:</span> {isEditing ? <Input value={rowData.address || ""} onChange={(e) => setEditingRowData({...editingRowData, address: e.target.value})} className="mt-1" /> : ` ${data.address || "-"}`}</div>
                  <div><span className="text-gray-500">업태:</span> {isEditing ? <Input value={rowData.businessType || ""} onChange={(e) => setEditingRowData({...editingRowData, businessType: e.target.value})} className="mt-1" /> : ` ${data.businessType || "-"}`}</div>
                  <div><span className="text-gray-500">업종:</span> {isEditing ? <Input value={rowData.industry || ""} onChange={(e) => setEditingRowData({...editingRowData, industry: e.target.value})} className="mt-1" /> : ` ${data.industry || "-"}`}</div>
                  <div><span className="text-gray-500">사업장종별:</span> {isEditing ? <Input value={rowData.siteCategory || ""} onChange={(e) => setEditingRowData({...editingRowData, siteCategory: e.target.value})} className="mt-1" /> : ` ${data.siteCategory || "-"}`}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
