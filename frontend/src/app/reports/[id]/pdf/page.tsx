"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import "./print.css";

export default function ReportPDFPage() {
  const params = useParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${params.id}`);
        const json = await res.json();
        setReport(json.data);
      } catch (error) {
        console.error("보고서 조회 오류:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [params.id]);

  useEffect(() => {
    if (!loading && report) {
      // 페이지 로드 후 자동으로 인쇄 대화상자 표시
      setTimeout(() => window.print(), 500);
    }
  }, [loading, report]);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!report) {
    return <div className="loading">보고서를 찾을 수 없습니다.</div>;
  }

  const measurements = JSON.parse(report.measurements || "[]").filter(
    (m: any) => m.value !== null && m.value !== undefined && m.value !== "" && m.value !== 0
  );

  return (
    <div className="report-container">
      {/* 헤더 */}
      <div className="page-header">
        <span className="header-left">1-1. 대기분야 측정기록부</span>
        <span className="header-right">1 / 1 page</span>
      </div>
      
      {/* 제목 */}
      <table className="report-table">
        <tbody>
          <tr>
            <td colSpan={14} className="title-cell">
              <div className="title">대기측정기록부</div>
              <div className="subtitle">
                (이 서식은 「대기환경보전법 시행규칙」 별표 8 대기오염물질의 배출허용기준 항목을 굴뚝에서 측정할 경우에 작성한다.)
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 의뢰인 + 일반현황 */}
      <div className="two-column-section">
        <table className="report-table half-width">
          <tbody>
            <tr className="equal-height-4">
              <td className="vertical-label" rowSpan={4}>①의뢰인</td>
              <td className="label">상호(사업장명)</td>
              <td className="value">{report.companyName || ""}</td>
            </tr>
            <tr className="equal-height-4">
              <td className="label">사업장소재지(주소)</td>
              <td className="value">{report.address || ""}</td>
            </tr>
            <tr className="equal-height-4">
              <td className="label">대표자(의뢰인)</td>
              <td className="value">{report.representative || ""}</td>
            </tr>
            <tr className="equal-height-4">
              <td className="label">환경기술인</td>
              <td className="value">{report.environmentalTech || ""}</td>
            </tr>
          </tbody>
        </table>
        <table className="report-table half-width">
          <tbody>
            <tr className="equal-height-3">
              <td className="vertical-label" rowSpan={3}>②일반현황</td>
              <td className="label">업종</td>
              <td className="value">{report.industry || ""}</td>
            </tr>
            <tr className="equal-height-3">
              <td className="label">시설종류</td>
              <td className="value">{report.facilityType || ""}</td>
            </tr>
            <tr className="equal-height-3">
              <td className="label">사업장종별</td>
              <td className="value">{report.siteCategory || ""}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 의뢰내용 */}
      <table className="report-table">
        <tbody>
          <tr>
            <td className="vertical-label" rowSpan={4}>③의뢰내용</td>
            <td className="label">측정용도</td>
            <td className="value" colSpan={8}>{report.purpose || ""}</td>
          </tr>
          <tr>
            <td className="label" rowSpan={2}>굴뚝정보</td>
            <td className="sub-label" colSpan={2}>굴뚝명칭</td>
            <td className="sub-label" colSpan={2}>높이</td>
            <td className="sub-label" colSpan={2}>안지름(측정공)</td>
            <td className="sub-label" colSpan={2}>굴뚝종별</td>
          </tr>
          <tr>
            <td className="value" colSpan={2}>{report.stackName || ""}</td>
            <td className="value" colSpan={2}>{report.stackHeight || ""} m</td>
            <td className="value" colSpan={2}>{report.stackDiameter || ""} m</td>
            <td className="value" colSpan={2}>{report.stackType || ""}</td>
          </tr>
          <tr>
            <td className="label">의뢰항목</td>
            <td className="value" colSpan={8}>{report.requestedItems || ""}</td>
          </tr>
        </tbody>
      </table>

      {/* 시료채취 */}
      <table className="report-table">
        <tbody>
          <tr>
            <td className="vertical-label" rowSpan={8}>④시료채취</td>
            <td className="label" rowSpan={2}>현장기상</td>
            <td className="sub-label">날씨</td>
            <td className="sub-label">기온</td>
            <td className="sub-label">습도</td>
            <td className="sub-label">기압</td>
            <td className="sub-label">풍향</td>
            <td className="sub-label">풍속</td>
          </tr>
          <tr>
            <td className="value">{report.weather || ""}</td>
            <td className="value">{report.temp || ""} ℃</td>
            <td className="value">{report.humidity || ""} %</td>
            <td className="value">{report.pressure || ""} mmHg</td>
            <td className="value">{report.windDir || ""}</td>
            <td className="value">{report.wind || ""} m/s</td>
          </tr>
          <tr>
            <td className="label" rowSpan={4}>배출가스</td>
            <td className="sub-label" colSpan={1}>표준산소농도</td>
            <td className="sub-label" colSpan={1}>실측산소농도</td>
            <td className="sub-label" colSpan={2}>배출가스 유량 (산소보정 전)</td>
            <td className="sub-label" colSpan={2}>배출가스 유량 (산소보정 후)</td>
          </tr>
          <tr>
            <td className="value" colSpan={1}>{report.o2Standard || ""} %</td>
            <td className="value" colSpan={1}>{report.o2Measured || ""} %</td>
            <td className="value" colSpan={2}>{report.flow || ""} Sm3/m</td>
            <td className="value" colSpan={2}>{report.flowCorrected || ""} Sm3/m</td>
          </tr>
          <tr>
            <td className="sub-label" colSpan={1}>수분량</td>
            <td className="sub-label" colSpan={1}>배출가스 온도</td>
            <td className="sub-label" colSpan={2}>배출가스 유속</td>
            <td className="sub-label" colSpan={2}>기타</td>
          </tr>
          <tr>
            <td className="value" colSpan={1}>{report.moisture || ""} %</td>
            <td className="value" colSpan={1}>{report.gasTemp || ""} ℃</td>
            <td className="value" colSpan={2}>{report.gasVel || ""} m/s</td>
            <td className="value" colSpan={2}>{report.gasNote || ""}</td>
          </tr>
          <tr>
            <td className="label">채취일</td>
            <td className="value" colSpan={2}>{new Date(report.samplingDate).toLocaleDateString()}</td>
            <td className="label" rowSpan={2}>시료채취자</td>
            <td className="value" colSpan={3}>
              <span style={{marginLeft: '3ch'}}>{report.sampler || ""}</span>
              <span style={{float: 'right'}}>(서 명)</span>
            </td>
          </tr>
          <tr>
            <td className="label">채취시간</td>
            <td className="value" colSpan={2}>{report.samplingStart || ""} ~ {report.samplingEnd || ""}</td>
            <td className="value" colSpan={3}>
              <span style={{marginLeft: '3ch'}}>{report.sampler2 || ""}</span>
              <span style={{float: 'right'}}>(서 명)</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 측정분석결과 */}
      <table className="report-table">
        <tbody>
          <tr>
            <td className="vertical-label" rowSpan={measurements.length + 1}>⑤측정분석결과</td>
            <th className="col-item">측정항목</th>
            <th className="col-limit">허용기준</th>
            <th className="col-value">분석값</th>
            <th className="col-unit">단위</th>
            <th className="col-method">측정분석방법</th>
            <th className="col-time">측정시간</th>
            <th className="col-note">비고</th>
          </tr>
          {measurements.map((m: any, idx: number) => (
            <tr key={idx}>
              <td className="value col-item">{m.item || ""}</td>
              <td className="value col-limit">{m.limit || ""}</td>
              <td className="value col-value">{m.value || ""}</td>
              <td className="value col-unit">{m.unit || ""}</td>
              <td className="value col-method">{m.method || ""}</td>
              <td className="value col-time">{m.startTime || ""} ~ {m.endTime || ""}</td>
              <td className="value col-note">{m.note || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 분석 및 의견 */}
      <table className="report-table bottom-table">
        <tbody>
          <tr>
            <td className="label bottom-label" rowSpan={2}>분석기간</td>
            <td className="value" rowSpan={2} colSpan={2}>{report.analysisStart || ""} ~ {report.analysisEnd || ""}</td>
            <td className="label bottom-label-right">분석기술인</td>
            <td className="value tech-value" colSpan={3}>
              <span style={{marginLeft: '3ch'}}>{report.analyst || ""}</span>
              <span style={{float: 'right'}}>(서 명)</span>
            </td>
          </tr>
          <tr>
            <td className="label bottom-label-right">책임기술인</td>
            <td className="value tech-value" colSpan={3}>
              <span style={{marginLeft: '3ch'}}>{report.chiefTech || ""}</span>
              <span style={{float: 'right'}}>(서 명)</span>
            </td>
          </tr>
          <tr>
            <td className="label bottom-label">종합의견</td>
            <td className="value" colSpan={6}>{report.opinion || ""}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
