"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { exportReportsToExcel } from "@/lib/exportReportToExcel";

export default function CustomerReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const res = await fetch(`/api/reports/${id}`);
      const json = await res.json();
      setReport(json.data);
    } catch (error) {
      console.error("보고서 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">로딩 중...</div>;
  }

  if (!report) {
    return <div className="p-6 text-center">보고서를 찾을 수 없습니다.</div>;
  }

  const measurements = JSON.parse(report.measurements || "[]").filter(
    (m: any) => m.value !== null && m.value !== undefined && m.value !== "" && m.value !== 0
  );

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">대기측정기록부</h1>
            <p className="text-sm text-gray-500">
              버전 {report.version} | 공유됨
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => exportReportsToExcel([report], `보고서_${report.companyName}_${new Date(report.measuredAt).toLocaleDateString()}.xlsx`)}
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
            <Button variant="secondary" onClick={() => router.push("/customer/reports")} className="flex-1 md:flex-none">
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
            <Input value={report.companyName || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">주소</label>
            <Input value={report.address || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">대표자</label>
            <Input value={report.representative || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">환경기술인</label>
            <Input value={report.environmentalTech || ""} disabled />
          </div>
        </div>
      </div>

      {/* 일반현황 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">일반현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">업종</label>
            <Input value={report.industry || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">시설종류</label>
            <Input value={report.facilityType || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">사업장종별</label>
            <Input value={report.siteCategory || ""} disabled />
          </div>
        </div>
      </div>

      {/* 의뢰내용 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">의뢰내용</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">측정용도</label>
            <Input value={report.purpose || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">굴뚝명칭</label>
            <Input value={report.stackName || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">높이(m)</label>
            <Input type="number" value={report.stackHeight || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">안지름(m)</label>
            <Input type="number" value={report.stackDiameter || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">굴뚝종별</label>
            <Input value={report.stackType || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">의뢰항목</label>
            <Input value={report.requestedItems || ""} disabled />
          </div>
        </div>
      </div>

      {/* 시료채취 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">시료채취</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">날씨</label>
            <Input value={report.weather || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">기온(℃)</label>
            <Input type="number" value={report.temp || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">습도(%)</label>
            <Input type="number" value={report.humidity || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">기압(mmHg)</label>
            <Input type="number" value={report.pressure || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">풍향</label>
            <Input value={report.windDir || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">풍속(m/sec)</label>
            <Input type="number" value={report.wind || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">가스속도(m/s)</label>
            <Input type="number" value={report.gasVel || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">가스온도(℃)</label>
            <Input type="number" value={report.gasTemp || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">수분함량(%)</label>
            <Input type="number" value={report.moisture || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">실측산소농도(%)</label>
            <Input type="number" value={report.o2Measured || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">표준산소농도(%)</label>
            <Input type="number" value={report.o2Standard || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">배출가스유량(S㎥/min)</label>
            <Input type="number" value={report.flow || ""} disabled />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">배출가스 기타</label>
          <Input value={report.gasNote || ""} disabled />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">채취일</label>
            <Input
              type="date"
              value={report.samplingDate ? new Date(report.samplingDate).toISOString().split('T')[0] : ""}
              disabled
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">채취시간 시작</label>
            <Input type="time" value={report.samplingStart || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">채취시간 종료</label>
            <Input type="time" value={report.samplingEnd || ""} disabled />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">시료채취자1</label>
            <Input value={report.sampler || ""} disabled />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">시료채취자2</label>
            <Input value={report.sampler2 || ""} disabled />
          </div>
        </div>
      </div>

      {/* 측정분석결과 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">측정분석결과</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="border p-2">측정항목</th>
                <th className="border p-2">허용기준</th>
                <th className="border p-2">분석값</th>
                <th className="border p-2">단위</th>
                <th className="border p-2">측정분석방법</th>
                <th className="border p-2">측정시간 시작</th>
                <th className="border p-2">측정시간 종료</th>
                <th className="border p-2">비고</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m: any, idx: number) => (
                <tr key={idx}>
                  <td className="border p-2">{m.item}</td>
                  <td className="border p-2">{m.limit}</td>
                  <td className="border p-2">{m.value}</td>
                  <td className="border p-2">{m.unit}</td>
                  <td className="border p-2">{m.method}</td>
                  <td className="border p-2">{m.startTime}</td>
                  <td className="border p-2">{m.endTime}</td>
                  <td className="border p-2">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기간 시작</label>
            <Input type="date" value={report.analysisStart || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기간 종료</label>
            <Input type="date" value={report.analysisEnd || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">분석기술인</label>
            <Input value={report.analyst || ""} disabled />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">책임기술인</label>
            <Input value={report.chiefTech || ""} disabled />
          </div>
        </div>
      </div>

      {/* 종합의견 */}
      <div className="rounded-lg border bg-white/50 dark:bg-white/5 p-4 md:p-6 space-y-4">
        <h2 className="text-lg font-semibold">종합의견</h2>
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded min-h-[120px]">
          {report.opinion || ""}
        </div>
      </div>
    </div>
  );
}
