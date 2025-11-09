"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { exportReportsToExcel } from "@/lib/exportReportToExcel";

type Report = {
  id: string;
  version: number;
  customer: { id: string; name: string; fullName: string | null };
  stack: { id: string; name: string; fullName: string | null };
  measuredAt: string;
  status: string;
  createdAt: string;
  createdBy: string;
  createdByUser?: { name: string; organization?: { name: string } };
};

type InsightReport = {
  id: string;
  itemName: string;
  periods: number;
  pdfBase64: string;
  sharedAt: string;
  createdAt: string;
  createdByUser: { name: string };
};

export default function CustomerReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"measurement" | "insight">("measurement");
  const [reports, setReports] = useState<Report[]>([]);
  const [insightReports, setInsightReports] = useState<InsightReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    stackId: "",
    startDate: "",
    endDate: "",
    organization: "",
  });
  const [stacks, setStacks] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchStacks();
  }, [filters]);

  const fetchStacks = async () => {
    try {
      const res = await fetch('/api/stacks');
      const json = await res.json();
      setStacks(json.stacks || []);
    } catch (error) {
      console.error('굴뚝 조회 오류:', error);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.stackId) params.append("stackId", filters.stackId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      
      const res = await fetch(`/api/customer/reports?${params.toString()}`);
      const json = await res.json();
      console.log("고객사 보고서 데이터:", json.data);
      
      // 클라이언트 사이드에서 환경측정기업 필터링
      let filteredReports = json.data || [];
      if (filters.organization) {
        filteredReports = filteredReports.filter((r: Report) => 
          r.createdByUser?.organization?.name?.includes(filters.organization)
        );
      }
      
      setReports(filteredReports);
    } catch (error) {
      console.error("보고서 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SHARED":
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">공유됨</span>;
      default:
        return status;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-2.5">
        <div className="flex flex-wrap items-end gap-2">
          <h1 className="text-lg font-semibold whitespace-nowrap mb-1.5">받은 보고서</h1>
          <span className="text-gray-300 dark:text-gray-600 mb-1.5">|</span>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">굴뚝</label>
            <Select className="text-sm h-8 w-full" value={filters.stackId} onChange={(e) => setFilters({ ...filters, stackId: e.target.value })}>
              <option value="">전체</option>
              {stacks.map((s) => (
                <option key={s.id} value={s.id}>{s.fullName || s.name}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">시작일</label>
            <Input
              className="text-sm h-8"
              style={{ width: '144px', minWidth: '144px' }}
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <span className="text-xs text-gray-500 mb-1.5">~</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">종료일</label>
            <Input
              className="text-sm h-8"
              style={{ width: '144px', minWidth: '144px' }}
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="flex flex-col" style={{ width: '176px', minWidth: '176px' }}>
            <Input
              className="text-sm h-8 w-full"
              type="text"
              value={filters.organization}
              onChange={(e) => setFilters({ ...filters, organization: e.target.value })}
              placeholder="환경측정기업 검색"
            />
          </div>
          <div className="flex gap-1.5 mb-1.5 ml-auto">
            <Button size="sm" onClick={() => exportReportsToExcel(reports as any)}>📊 엑셀</Button>
          </div>
        </div>
      </div>

      {/* 테이블 - 데스크톱 */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">받은 보고서가 없습니다.</div>
        ) : (
          <Table>
            <Thead className="bg-gray-50 dark:bg-white/10 sticky top-0 z-10">
              <Tr>
                <Th>버전</Th>
                <Th>굴뚝명</Th>
                <Th>측정일자</Th>
                <Th>상태</Th>
                <Th>공유일</Th>
                <Th>환경측정기업</Th>
                <Th>액션</Th>
              </Tr>
            </Thead>
            <Tbody>
              {reports.map((report) => {
                console.log("렌더링 중인 보고서:", report.id);
                return (
                  <Tr key={report.id}>
                    <Td>v{report.version}</Td>
                    <Td>{report.stack?.fullName || report.stack?.name || '-'}</Td>
                    <Td>{new Date(report.measuredAt).toLocaleDateString()}</Td>
                    <Td>{getStatusBadge(report.status)}</Td>
                    <Td>{new Date(report.createdAt).toLocaleDateString()}</Td>
                    <Td>{report.createdByUser?.organization?.name || "-"}</Td>
                    <Td>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => router.push(`/customer/reports/${report.id}`)} 
                          className="text-xs text-blue-600 hover:underline"
                        >
                          조회
                        </button>
                        <button 
                          onClick={() => window.open(`/reports/${report.id}/pdf`, '_blank')} 
                          className="text-xs text-purple-600 hover:underline"
                        >
                          PDF
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        )}
        </div>
      </div>

      {/* 카드 뷰 - 모바일 */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">받은 보고서가 없습니다.</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-lg border bg-white dark:bg-gray-800 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">v{report.version} - {report.stack?.fullName || report.stack?.name || '-'}</div>
                  <div className="text-sm text-gray-500">{new Date(report.measuredAt).toLocaleDateString()}</div>
                </div>
                {getStatusBadge(report.status)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>공유일: {new Date(report.createdAt).toLocaleDateString()}</div>
                <div>환경측정기업: {report.createdByUser?.organization?.name || "-"}</div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => router.push(`/customer/reports/${report.id}`)} 
                  className="text-sm text-blue-600 hover:underline"
                >
                  조회
                </button>
                <button 
                  onClick={() => window.open(`/reports/${report.id}/pdf`, '_blank')} 
                  className="text-sm text-purple-600 hover:underline"
                >
                  PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
