"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const reportId = searchParams.get('id');
    if (reportId) {
      try {
        const reportData = sessionStorage.getItem(reportId);
        if (reportData) {
          const decoded = JSON.parse(reportData);
          setReport(decoded);
          // 데이터 읽은 후 삭제 (메모리 절약)
          sessionStorage.removeItem(reportId);
        } else {
          console.error('Report data not found in sessionStorage');
        }
      } catch (err) {
        console.error('Failed to parse report data:', err);
      }
    }
    setLoading(false);
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">보고서 로딩 중...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">보고서 데이터를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          
          @page {
            margin: 20mm 15mm;
            size: A4;
          }
          
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .report-content {
            padding: 0 !important;
          }
          
          .report-content > *:first-child {
            margin-top: 0 !important;
          }
          
          .report-content > *:last-child {
            margin-bottom: 0 !important;
          }
          
          /* 인쇄 시 모든 박스 스타일 제거 */
          .report-content div[style*="border"],
          .report-content div[style*="background"],
          .report-content div[style*="padding"] {
            border: none !important;
            background: none !important;
            background-color: transparent !important;
            padding: 0 !important;
            margin: 15px 0 !important;
            box-shadow: none !important;
          }
          
          /* 섹션 구분선 추가 */
          .report-content h2::after {
            content: "";
            display: block;
            width: 100%;
            height: 1px;
            background: #ccc;
            margin-top: 8px;
          }
          
          .report-content h1 { 
            color: #000; 
            border-bottom: 2px solid #000; 
            padding-bottom: 8px; 
            margin: 20px 0 15px 0;
            font-size: 18pt;
            page-break-after: avoid;
          }
          
          .report-content h2 { 
            color: #000; 
            margin-top: 20px; 
            margin-bottom: 10px;
            padding-bottom: 4px;
            font-size: 14pt;
            page-break-after: avoid;
          }
          
          .report-content h3 { 
            color: #000; 
            margin-top: 12px;
            margin-bottom: 6px;
            font-size: 12pt;
            page-break-after: avoid;
          }
          
          .report-content h4 {
            margin: 10px 0 5px 0;
            font-size: 11pt;
            page-break-after: avoid;
            color: #000;
          }
          
          .report-content p { 
            margin: 6px 0; 
            line-height: 1.5;
          }
          
          .report-content strong { 
            color: #000;
            font-weight: bold;
          }
          
          .report-content hr { 
            border: none; 
            border-top: 1px solid #ccc; 
            margin: 15px 0; 
          }
          
          .report-content ul, 
          .report-content ol { 
            padding-left: 20px; 
            margin: 8px 0;
          }
          
          .report-content li { 
            margin: 4px 0; 
            line-height: 1.5;
          }
          
          .report-content table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            page-break-inside: avoid;
          }
          
          .report-content th, 
          .report-content td {
            border: 1px solid #999;
            padding: 6px 8px;
            text-align: left;
          }
          
          .report-content th {
            background-color: #f0f0f0 !important;
            color: #000 !important;
            font-weight: bold;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        
        @media screen {
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
          
          .report-content {
            font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif;
            line-height: 1.6;
            font-size: 12pt;
          }
          
          /* 화면에서 제목 크게 표시 */
          .report-content h1 {
            font-size: 32pt !important;
            color: #1e40af !important;
            margin-bottom: 20px !important;
          }
          
          .report-content h2 {
            font-size: 20pt !important;
            color: #2563eb !important;
            margin-top: 30px !important;
          }
          
          .report-content h3 {
            font-size: 16pt !important;
            color: #3b82f6 !important;
          }
        }
      `}</style>

      {/* 인쇄 버튼 (화면에만 표시) */}
      <div className="no-print fixed top-6 right-6 z-50">
        <button
          onClick={handlePrint}
          className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-xl hover:bg-blue-700 transition-colors font-bold text-lg"
        >
          🖨️ 인쇄 / PDF 저장
        </button>
      </div>

      {/* 보고서 내용 */}
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-12 py-10 report-content">
          <div dangerouslySetInnerHTML={{ __html: report.narrative }} />
        </div>
      </div>
    </>
  );
}
