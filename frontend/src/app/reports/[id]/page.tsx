"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { exportReportsToExcel } from "@/lib/exportReportToExcel";

type Report = {
  id: string;
  version: number;
  customerId: string;
  stackId: string;
  measuredAt: string;
  companyName: string;
  address: string | null;
  representative: string | null;
  environmentalTech: string | null;
  industry: string | null;
  facilityType: string | null;
  siteCategory: string | null;
  purpose: string | null;
  stackName: string;
  stackHeight: number | null;
  stackDiameter: number | null;
  stackType: string | null;
  requestedItems: string | null;
  weather: string | null;
  temp: number | null;
  humidity: number | null;
  pressure: number | null;
  windDir: string | null;
  wind: number | null;
  o2Standard: number | null;
  o2Measured: number | null;
  flow: number | null;
  flowCorrected: number | null;
  moisture: number | null;
  gasTemp: number | null;
  gasVel: number | null;
  gasNote: string | null;
  samplingDate: string;
  samplingStart: string | null;
  samplingEnd: string | null;
  sampler: string | null;
  sampler2: string | null;
  measurements: string;
  analysisStart: string | null;
  analysisEnd: string | null;
  analyst: string | null;
  chiefTech: string | null;
  opinion: string | null;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function ReportDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [formData, setFormData] = useState<Partial<Report>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isReadOnly = report?.status !== "DRAFT";

  useEffect(() => {
    if (id) {
      fetchReport();
    }
  }, [id]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const json = await res.json();

      if (res.ok) {
        setReport(json.data);
        const data = json.data;
        
        // 분석기간 시작일이 없으면 측정일자로 설정
        if (!data.analysisStart && data.measuredAt) {
          data.analysisStart = new Date(data.measuredAt).toISOString().split('T')[0];
        }
        
        // 채취일이 없으면 측정일자로 설정
        if (!data.samplingDate && data.measuredAt) {
          data.samplingDate = data.measuredAt;
        }
        
        setFormData(data);
      } else {
        alert(json.error || "보고서 조회 실패");
        router.push("/reports");
      }
    } catch (error: any) {
      alert(error.message || "보고서 조회 중 오류가 발생했습니다.");
      router.push("/reports");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (newStatus?: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: newStatus || formData.status,
        }),
      });

      const json = await res.json();

      if (res.ok) {
        alert(newStatus === "CONFIRMED" ? "보고서가 확정되었습니다." : "저장되었습니다.");
        
        // 새 버전이 생성된 경우
        if (json.data.id !== id) {
          router.push(`/reports/${json.data.id}`);
        } else {
          fetchReport();
        }
      } else {
        alert(json.error || "저장 실패");
      }
    } catch (error: any) {
      alert(error.message || "저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleMeasurementsChange = (originalIndex: number, field: string, value: any) => {
    const allMeasurements = JSON.parse(formData.measurements || "[]");
    allMeasurements[originalIndex][field] = value;
    setFormData((prev) => ({ ...prev, measurements: JSON.stringify(allMeasurements) }));
  };

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  if (!report) {
    return <div className="p-6 text-center">보고서를 찾을 수 없습니다.</div>;
  }

  const measurements = JSON.parse(formData.measurements || "[]")
    .map((m: any, index: number) => ({ ...m, __index: index }))
    .filter(
      (m: any) => m.value !== null && m.value !== undefined && m.value !== "" && m.value !== 0
    );

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">대기측정기록부</h1>
            <p className="text-sm text-gray-500">
              버전 {report.version} | {report.status === "DRAFT" ? "작성중" : report.status === "CONFIRMED" ? "확정" : "공유됨"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => exportReportsToExcel([report as any], `보고서_${report.companyName}_${new Date(report.measuredAt).toLocaleDateString()}.xlsx`)}
              className="flex-1 md:flex-none"
            >
              📊 엑셀
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.open(`/reports/${id}/pdf`, '_blank')}
              className="flex-1 md:flex-none"
            >
              PDF 출력
            </Button>
            {!isReadOnly && (
              <>
                <Button variant="secondary" onClick={() => handleSave()} className="flex-1 md:flex-none">
                  임시저장
                </Button>
                <Button onClick={() => handleSave("CONFIRMED")} className="flex-1 md:flex-none">
                  확정
                </Button>
              </>
            )}
            <Button variant="secondary" onClick={() => router.push("/reports")} className="flex-1 md:flex-none">
              목록
            </Button>
          </div>
        </div>
      </div>

      {/* 의뢰인 정보 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">의뢰인 정보</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">상호(사업장명)</label>
            <Input
              value={formData.companyName || ""}
              onChange={(e) => handleChange("companyName", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">주소</label>
            <Input
              value={formData.address || ""}
              onChange={(e) => handleChange("address", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대표자</label>
            <Input
              value={formData.representative || ""}
              onChange={(e) => handleChange("representative", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">환경기술인</label>
            <Input
              value={formData.environmentalTech || ""}
              onChange={(e) => handleChange("environmentalTech", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
        </div>
      </div>

      {/* 일반현황 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">일반현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">업종</label>
            <Input
              value={formData.industry || ""}
              onChange={(e) => handleChange("industry", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">시설종류</label>
            <Input
              value={formData.facilityType || ""}
              onChange={(e) => handleChange("facilityType", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">사업장종별</label>
            <Input
              value={formData.siteCategory || ""}
              onChange={(e) => handleChange("siteCategory", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
      </div>

      {/* 의뢰내용 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">의뢰내용</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">측정용도</label>
            <Input
              value={formData.purpose || ""}
              onChange={(e) => handleChange("purpose", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">굴뚝명칭</label>
            <Input
              value={formData.stackName || ""}
              onChange={(e) => handleChange("stackName", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">높이(m)</label>
            <Input
              type="number"
              value={formData.stackHeight || ""}
              onChange={(e) => handleChange("stackHeight", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">안지름(m)</label>
            <Input
              type="number"
              value={formData.stackDiameter || ""}
              onChange={(e) => handleChange("stackDiameter", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">굴뚝종별</label>
            <Input
              value={formData.stackType || ""}
              onChange={(e) => handleChange("stackType", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">의뢰항목</label>
            <Input
              value={formData.requestedItems || ""}
              onChange={(e) => handleChange("requestedItems", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
        </div>
      </div>

      {/* 시료채취 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">시료채취</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">날씨</label>
            <Input
              value={formData.weather || ""}
              onChange={(e) => handleChange("weather", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">기온(℃)</label>
            <Input
              type="number"
              value={formData.temp || ""}
              onChange={(e) => handleChange("temp", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">습도(%)</label>
            <Input
              type="number"
              value={formData.humidity || ""}
              onChange={(e) => handleChange("humidity", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">기압(mmHg)</label>
            <Input
              type="number"
              value={formData.pressure || ""}
              onChange={(e) => handleChange("pressure", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">풍향</label>
            <Input
              value={formData.windDir || ""}
              onChange={(e) => handleChange("windDir", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">풍속(m/sec)</label>
            <Input
              type="number"
              value={formData.wind || ""}
              onChange={(e) => handleChange("wind", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">가스속도(m/s)</label>
            <Input
              type="number"
              value={formData.gasVel || ""}
              onChange={(e) => handleChange("gasVel", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">가스온도(℃)</label>
            <Input
              type="number"
              value={formData.gasTemp || ""}
              onChange={(e) => handleChange("gasTemp", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">수분함량(%)</label>
            <Input
              type="number"
              value={formData.moisture || ""}
              onChange={(e) => handleChange("moisture", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">실측산소농도(%)</label>
            <Input
              type="number"
              value={formData.o2Measured || ""}
              onChange={(e) => handleChange("o2Measured", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">표준산소농도(%)</label>
            <Input
              type="number"
              value={formData.o2Standard || ""}
              onChange={(e) => handleChange("o2Standard", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">배출가스유량(S㎥/min)</label>
            <Input
              type="number"
              value={formData.flow || ""}
              onChange={(e) => handleChange("flow", parseFloat(e.target.value))}
              disabled={isReadOnly}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">배출가스 기타</label>
          <Input
            value={formData.gasNote || ""}
            onChange={(e) => handleChange("gasNote", e.target.value)}
            disabled={isReadOnly}
            placeholder="직접 입력"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">채취일</label>
            <Input
              type="date"
              value={formData.samplingDate ? new Date(formData.samplingDate).toISOString().split('T')[0] : ""}
              onChange={(e) => handleChange("samplingDate", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">채취시간 시작</label>
            <Input
              type="time"
              value={formData.samplingStart || ""}
              onChange={(e) => handleChange("samplingStart", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">채취시간 종료</label>
            <Input
              type="time"
              value={formData.samplingEnd || ""}
              onChange={(e) => handleChange("samplingEnd", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">시료채취자1</label>
            <Input
              value={formData.sampler || ""}
              onChange={(e) => handleChange("sampler", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">시료채취자2</label>
            <Input
              value={formData.sampler2 || ""}
              onChange={(e) => handleChange("sampler2", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
        </div>
      </div>

      {/* 측정분석결과 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">측정분석결과</h2>
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="border p-2 w-32">측정항목</th>
                <th className="border p-2 w-24">허용기준</th>
                <th className="border p-2 w-24">분석값</th>
                <th className="border p-2 w-20">단위</th>
                <th className="border p-2 w-40">측정분석방법</th>
                <th className="border p-2 w-32">측정시간 시작</th>
                <th className="border p-2 w-32">측정시간 종료</th>
                <th className="border p-2 w-40">비고</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="border p-2 break-words">{m.item}</td>
                  <td className="border p-2">
                    <Input
                      type="number"
                      value={m.limit || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "limit", parseFloat(e.target.value))}
                      disabled={isReadOnly}
                      className="text-sm w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      type="number"
                      value={m.value || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "value", parseFloat(e.target.value))}
                      disabled={isReadOnly}
                      className="text-sm w-full"
                    />
                  </td>
                  <td className="border p-2 break-words">{m.unit}</td>
                  <td className="border p-2">
                    <textarea
                      value={m.method || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "method", e.target.value)}
                      disabled={isReadOnly}
                      rows={2}
                      className="text-sm w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      type="time"
                      value={m.startTime || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "startTime", e.target.value)}
                      disabled={isReadOnly}
                      className="text-sm w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <Input
                      type="time"
                      value={m.endTime || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "endTime", e.target.value)}
                      disabled={isReadOnly}
                      className="text-sm w-full"
                    />
                  </td>
                  <td className="border p-2">
                    <textarea
                      value={m.note || ""}
                      onChange={(e) => handleMeasurementsChange(m.__index, "note", e.target.value)}
                      disabled={isReadOnly}
                      rows={2}
                      placeholder="비고"
                      className="text-sm w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* 모바일 카드 뷰 */}
        <div className="md:hidden space-y-4">
          {measurements.map((m: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-white dark:bg-gray-800">
              <div className="font-semibold text-base border-b pb-2">{m.item}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-400">허용기준</label>
                  <Input
                    type="number"
                    value={m.limit || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "limit", parseFloat(e.target.value))}
                    disabled={isReadOnly}
                    className="text-sm w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs text-gray-600 dark:text-gray-400">분석값</label>
                  <Input
                    type="number"
                    value={m.value || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "value", parseFloat(e.target.value))}
                    disabled={isReadOnly}
                    className="text-sm w-full"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">단위</label>
                  <div className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">{m.unit}</div>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">측정분석방법</label>
                  <Input
                    value={m.method || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "method", e.target.value)}
                    disabled={isReadOnly}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">측정시간 시작</label>
                  <Input
                    type="time"
                    value={m.startTime || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "startTime", e.target.value)}
                    disabled={isReadOnly}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 dark:text-gray-400">측정시간 종료</label>
                  <Input
                    type="time"
                    value={m.endTime || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "endTime", e.target.value)}
                    disabled={isReadOnly}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs text-gray-600 dark:text-gray-400">비고</label>
                  <Input
                    value={m.note || ""}
                    onChange={(e) => handleMeasurementsChange(m.__index, "note", e.target.value)}
                    disabled={isReadOnly}
                    className="text-sm"
                    placeholder="비고"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기간 시작</label>
            <Input
              type="date"
              value={formData.analysisStart || ""}
              onChange={(e) => handleChange("analysisStart", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기간 종료</label>
            <Input
              type="date"
              value={formData.analysisEnd || ""}
              onChange={(e) => handleChange("analysisEnd", e.target.value)}
              disabled={isReadOnly}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기술인</label>
            <Input
              value={formData.analyst || ""}
              onChange={(e) => handleChange("analyst", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">책임기술인</label>
            <Input
              value={formData.chiefTech || ""}
              onChange={(e) => handleChange("chiefTech", e.target.value)}
              disabled={isReadOnly}
              placeholder="직접 입력"
            />
          </div>
        </div>
      </div>

      {/* 종합의견 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">종합의견</h2>
        <textarea
          className="w-full border rounded p-3 min-h-[120px] dark:bg-gray-800"
          value={formData.opinion || ""}
          onChange={(e) => handleChange("opinion", e.target.value)}
          disabled={isReadOnly}
          placeholder="종합의견을 입력하세요"
        />
      </div>

      {/* 하단 버튼 */}
      <div className="flex gap-2 justify-end">
        {!isReadOnly && (
          <>
            <Button variant="secondary" onClick={() => handleSave()} disabled={saving}>
              {saving ? "저장 중..." : "임시저장"}
            </Button>
            <Button onClick={() => handleSave("CONFIRMED")} disabled={saving}>
              {saving ? "저장 중..." : "확정"}
            </Button>
          </>
        )}
        <Button variant="secondary" onClick={() => router.push("/reports")}>
          목록
        </Button>
      </div>
    </div>
  );
}
