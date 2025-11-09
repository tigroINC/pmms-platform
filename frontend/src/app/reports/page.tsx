"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/Table";
import { exportReportsToExcel } from "@/lib/exportReportToExcel";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";

type Report = {
  id: string;
  version: number;
  customerId: string;
  stackId: string;
  measuredAt: string;
  status: string;
  createdBy: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    fullName: string;
  };
  stack: {
    id: string;
    name: string;
    fullName: string;
  };
};

type InsightReport = {
  id: string;
  customerId: string;
  itemKey: string;
  itemName: string;
  periods: number;
  pdfBase64: string;
  sharedAt: string | null;
  createdAt: string;
  createdBy: string;
  customer: {
    name: string;
  };
  createdByUser: {
    name: string;
  };
};

export default function ReportsPage() {
  const { user } = useAuth();
  const role = user?.role;

  const [activeTab, setActiveTab] = useState<"measurement" | "insight">("measurement");
  const [reports, setReports] = useState<Report[]>([]);
  const [insightReports, setInsightReports] = useState<InsightReport[]>([]);
  const [loading, setLoading] = useState(false);

  // 필터
  const [customerFilter, setCustomerFilter] = useState("전체");
  const [stackFilter, setStackFilter] = useState("전체");
  const [statusFilter, setStatusFilter] = useState("전체");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { list: customers } = useCustomers();
  const selectedCustomerId = useMemo(
    () => (customerFilter === "전체" ? undefined : customers.find((c) => c.name === customerFilter)?.id),
    [customerFilter, customers]
  );
  const { list: stacks } = useStacks(selectedCustomerId);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCustomerId) params.append("customerId", selectedCustomerId);
      if (stackFilter !== "전체") {
        const stackId = stacks.find((s) => s.name === stackFilter)?.id;
        if (stackId) params.append("stackId", stackId);
      }
      if (statusFilter !== "전체") params.append("status", statusFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const json = await res.json();

      if (res.ok) {
        setReports(json.data || []);
      } else {
        console.error("보고서 조회 실패:", json.error);
        setReports([]);
      }
    } catch (error) {
      console.error("보고서 조회 오류:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "measurement") {
      fetchReports();
    } else {
      fetchInsightReports();
    }
  }, [activeTab, selectedCustomerId, stackFilter, statusFilter, startDate, endDate]);

  const fetchInsightReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCustomerId) params.append("customerId", selectedCustomerId);
      
      const res = await fetch(`/api/insight-reports?${params.toString()}`);
      const json = await res.json();
      setInsightReports(json.data || []);
    } catch (error) {
      console.error("인사이트 보고서 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("삭제되었습니다.");
        fetchReports();
      } else {
        const json = await res.json();
        alert(json.error || "삭제 실패");
      }
    } catch (error: any) {
      alert(error.message || "삭제 중 오류가 발생했습니다.");
    }
  };

  const handleShare = async (id: string) => {
    if (!confirm("이 보고서를 고객사와 공유하시겠습니까?")) return;

    try {
      const res = await fetch(`/api/reports/${id}/share`, {
        method: "POST",
      });

      if (res.ok) {
        alert("고객사와 공유되었습니다.");
        fetchReports();
      } else {
        const json = await res.json();
        alert(json.error || "공유 실패");
      }
    } catch (error: any) {
      alert(error.message || "공유 중 오류가 발생했습니다.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">작성중</span>;
      case "CONFIRMED":
        return <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">확정</span>;
      case "SHARED":
        return <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">공유됨</span>;
      default:
        return status;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">보고서 관리</h1>
        {(role === "SUPER_ADMIN" || role === "ORG_ADMIN" || role === "ORG_USER") && activeTab === "measurement" && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => exportReportsToExcel(reports as any)}>
              📊 엑셀 내보내기
            </Button>
            <Button onClick={() => (window.location.href = "/reports/new")}>
              📝 신규 작성
            </Button>
          </div>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("measurement")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "measurement"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          대기측정기록부
        </button>
        <button
          onClick={() => setActiveTab("insight")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "insight"
              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          }`}
        >
          인사이트 보고서
        </button>
      </div>

      {/* 필터 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-3">
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-col" style={{ width: "176px", minWidth: "176px" }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">고객사</label>
            <Select
              className="text-sm h-8 w-full"
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setStackFilter("전체");
              }}
            >
              {["전체", ...customers.map((c) => c.name)].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col" style={{ width: "176px", minWidth: "176px" }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">굴뚝명</label>
            <Select className="text-sm h-8 w-full" value={stackFilter} onChange={(e) => setStackFilter(e.target.value)}>
              {["전체", ...(selectedCustomerId ? stacks.map((s) => s.name) : [])].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col" style={{ width: "120px", minWidth: "120px" }}>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">상태</label>
            <Select className="text-sm h-8 w-full" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>전체</option>
              <option value="DRAFT">작성중</option>
              <option value="CONFIRMED">확정</option>
              <option value="SHARED">공유됨</option>
            </Select>
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">시작일</label>
            <Input className="text-sm h-8" style={{ width: "144px", minWidth: "144px" }} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <span className="text-xs text-gray-500 mb-1.5">~</span>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">종료일</label>
            <Input className="text-sm h-8" style={{ width: "144px", minWidth: "144px" }} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-1.5 ml-auto mb-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCustomerFilter("전체");
                setStackFilter("전체");
                setStatusFilter("전체");
                setStartDate("");
                setEndDate("");
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* 테이블 - 데스크톱 */}
      <div className="hidden md:block rounded-lg border overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : activeTab === "measurement" && reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">보고서가 없습니다.</div>
        ) : activeTab === "insight" && insightReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">인사이트 보고서가 없습니다.</div>
        ) : activeTab === "measurement" ? (
          <Table className="min-w-[1000px]">
            <Thead className="bg-gray-50 dark:bg-white/10">
              <Tr>
                <Th>버전</Th>
                <Th>고객사</Th>
                <Th>굴뚝명</Th>
                <Th>측정일자</Th>
                <Th>상태</Th>
                <Th>작성일</Th>
                {(role === "SUPER_ADMIN" || role === "ORG_ADMIN" || role === "ORG_USER") && <Th>액션</Th>}
              </Tr>
            </Thead>
            <Tbody>
              {reports.map((report) => (
                <Tr key={report.id}>
                  <Td>v{report.version}</Td>
                  <Td>{report.customer.fullName || report.customer.name}</Td>
                  <Td>{report.stack.fullName || report.stack.name}</Td>
                  <Td>{new Date(report.measuredAt).toLocaleDateString()}</Td>
                  <Td>{getStatusBadge(report.status)}</Td>
                  <Td>{new Date(report.createdAt).toLocaleDateString()}</Td>
                  {(role === "SUPER_ADMIN" || role === "ORG_ADMIN" || role === "ORG_USER") && (
                    <Td>
                      <div className="flex gap-2">
                        <button onClick={() => (window.location.href = `/reports/${report.id}`)} className="text-xs text-blue-600 hover:underline">
                          {report.status === "DRAFT" ? "수정" : "조회"}
                        </button>
                        <button onClick={() => window.open(`/reports/${report.id}/pdf`, '_blank')} className="text-xs text-purple-600 hover:underline">
                          PDF
                        </button>
                        {report.status === "CONFIRMED" && (role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                          <button onClick={() => handleShare(report.id)} className="text-xs text-green-600 hover:underline">
                            고객공유
                          </button>
                        )}
                        {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                          <button onClick={() => handleDelete(report.id)} className="text-xs text-red-600 hover:underline">
                            삭제
                          </button>
                        )}
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Table className="min-w-[1000px]">
            <Thead className="bg-gray-50 dark:bg-white/10">
              <Tr>
                <Th>고객사</Th>
                <Th>항목</Th>
                <Th>예측기간</Th>
                <Th>생성일</Th>
                <Th>공유상태</Th>
                <Th>액션</Th>
              </Tr>
            </Thead>
            <Tbody>
              {insightReports.map((report) => (
                <Tr key={report.id}>
                  <Td>{report.customer.name}</Td>
                  <Td>{report.itemName}</Td>
                  <Td>{report.periods}일</Td>
                  <Td>{new Date(report.createdAt).toLocaleDateString()}</Td>
                  <Td>
                    {report.sharedAt ? (
                      <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        공유됨 ({new Date(report.sharedAt).toLocaleDateString()})
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        미공유
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const byteCharacters = atob(report.pdfBase64);
                          const byteNumbers = new Array(byteCharacters.length);
                          for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                          }
                          const byteArray = new Uint8Array(byteNumbers);
                          const blob = new Blob([byteArray], { type: 'application/pdf' });
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                        }}
                        className="text-xs text-purple-600 hover:underline"
                      >
                        PDF 보기
                      </button>
                      {!report.sharedAt && (role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                        <button
                          onClick={async () => {
                            if (!confirm("이 인사이트 보고서를 고객사와 공유하시겠습니까?")) return;
                            try {
                              const res = await fetch(`/api/insight-reports/${report.id}/share`, { method: "POST" });
                              if (res.ok) {
                                alert("고객사와 공유되었습니다.");
                                fetchInsightReports();
                              } else {
                                alert("공유 실패");
                              }
                            } catch (error) {
                              alert("공유 중 오류가 발생했습니다.");
                            }
                          }}
                          className="text-xs text-green-600 hover:underline"
                        >
                          고객공유
                        </button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>

      {/* 카드 뷰 - 모바일 */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="p-6 text-center text-gray-500">로딩 중...</div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">보고서가 없습니다.</div>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="rounded-lg border bg-white dark:bg-gray-800 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">v{report.version} - {report.customer.fullName || report.customer.name}</div>
                  <div className="text-sm text-gray-500">{report.stack.fullName || report.stack.name}</div>
                  <div className="text-sm text-gray-500">{new Date(report.measuredAt).toLocaleDateString()}</div>
                </div>
                {getStatusBadge(report.status)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                작성일: {new Date(report.createdAt).toLocaleDateString()}
              </div>
              {(role === "SUPER_ADMIN" || role === "ORG_ADMIN" || role === "ORG_USER") && (
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => (window.location.href = `/reports/${report.id}`)} className="text-sm text-blue-600 hover:underline">
                    {report.status === "DRAFT" ? "수정" : "조회"}
                  </button>
                  <button onClick={() => window.open(`/reports/${report.id}/pdf`, '_blank')} className="text-sm text-purple-600 hover:underline">
                    PDF
                  </button>
                  {report.status === "CONFIRMED" && (role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                    <button onClick={() => handleShare(report.id)} className="text-sm text-green-600 hover:underline">
                      고객공유
                    </button>
                  )}
                  {(role === "SUPER_ADMIN" || role === "ORG_ADMIN") && (
                    <button onClick={() => handleDelete(report.id)} className="text-sm text-red-600 hover:underline">
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
