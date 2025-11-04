"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Organization {
  id: string;
  name: string;
  businessNumber: string;
  phone: string;
  email: string;
  address: string;
  representative: string | null;
  establishedDate: string | null;
  website: string | null;
  createdAt: string;
}

interface Contract {
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const organizationId = params.id as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const customerId = (session?.user as any)?.customerId;
      
      // 조직 정보 조회
      const orgRes = await fetch(`/api/organizations/${organizationId}`);
      const orgData = await orgRes.json();
      
      if (orgRes.ok) {
        setOrganization(orgData.organization);
        
        // 계약 정보 조회 - 고객사의 연결 목록에서 가져오기
        const connectionsRes = await fetch(`/api/connections/by-customer?customerId=${customerId}`);
        const connectionsData = await connectionsRes.json();
        
        if (connectionsRes.ok && connectionsData.connections) {
          const connection = connectionsData.connections.find(
            (conn: any) => conn.organization.id === organizationId
          );
          
          if (connection) {
            // 계약 정보
            if (connection.contractStartDate && connection.contractEndDate) {
              const now = new Date();
              const endDate = new Date(connection.contractEndDate);
              const diffTime = endDate.getTime() - now.getTime();
              const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              setContract({
                startDate: connection.contractStartDate,
                endDate: connection.contractEndDate,
                daysRemaining
              });
            }
          }
          
          // 관리자 목록 조회
          const managersRes = await fetch(`/api/organizations/${organizationId}/managers`);
          const managersData = await managersRes.json();
          
          if (managersRes.ok) {
            setManagers(managersData.managers || []);
          }
        }
      } else {
        setError(orgData.error || "환경측정기업 정보를 불러올 수 없습니다.");
      }
    } catch (error) {
      console.error("Error fetching organization:", error);
      setError("환경측정기업 정보 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || "환경측정기업을 찾을 수 없습니다."}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-1"
        >
          ← 돌아가기
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
        <p className="text-gray-600 mt-1">환경측정기업 상세 정보</p>
      </div>

      {/* 기본 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">기본 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">기업명</label>
            <p className="mt-1 text-gray-900">{organization.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">사업자등록번호</label>
            <p className="mt-1 text-gray-900">{organization.businessNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">대표자</label>
            <p className="mt-1 text-gray-900">{organization.representative || "-"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">설립일</label>
            <p className="mt-1 text-gray-900">
              {organization.establishedDate 
                ? new Date(organization.establishedDate).toLocaleDateString() 
                : "-"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">등록일</label>
            <p className="mt-1 text-gray-900">
              {new Date(organization.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 계약 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">계약 정보</h2>
        {contract ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">계약 시작일</label>
              <p className="mt-1 text-gray-900">{new Date(contract.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">계약 종료일</label>
              <p className="mt-1 text-gray-900">{new Date(contract.endDate).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">잔여 계약일</label>
              <p className={`mt-1 font-semibold ${
                contract.daysRemaining < 0 ? 'text-red-600' :
                contract.daysRemaining <= 7 ? 'text-red-500' :
                contract.daysRemaining <= 28 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {contract.daysRemaining < 0 
                  ? `만료됨 (${Math.abs(contract.daysRemaining)}일 경과)` 
                  : `${contract.daysRemaining}일`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">계약 정보가 없습니다. 환경측정기업에 문의하세요.</p>
        )}
      </div>

      {/* 연락처 정보 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">연락처 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">전화번호</label>
            <p className="mt-1 text-gray-900">{organization.phone || "-"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">이메일</label>
            <p className="mt-1 text-gray-900">{organization.email || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">주소</label>
            <p className="mt-1 text-gray-900">{organization.address || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">웹사이트</label>
            <p className="mt-1 text-gray-900">
              {organization.website ? (
                <a 
                  href={organization.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  {organization.website}
                </a>
              ) : "-"}
            </p>
          </div>
        </div>
      </div>

      {/* 관리자 목록 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">관리자 목록</h2>
        {managers.length > 0 ? (
          <div className="space-y-3">
            {managers.map((manager) => (
              <div key={manager.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{manager.name}</p>
                  <p className="text-sm text-gray-600">{manager.email}</p>
                </div>
                {manager.phone && (
                  <p className="text-sm text-gray-600">{manager.phone}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">등록된 관리자가 없습니다.</p>
        )}
      </div>

    </div>
  );
}
