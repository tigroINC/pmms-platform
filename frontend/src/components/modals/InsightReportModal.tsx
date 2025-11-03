"use client";
import { useEffect, useRef, useState } from "react";

interface InsightReportModalProps {
  open: boolean;
  onClose: () => void;
  report: any;
}

export default function InsightReportModal({ open, onClose, report }: InsightReportModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  if (!open || !report || !isClient) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${report.customer} - ${report.item} 예측 분석 보고서</title>
            <style>
              * {
                box-sizing: border-box;
              }
              
              @page {
                margin: 20mm 15mm;
                size: A4;
              }
              
              body { 
                font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif; 
                padding: 20px; 
                line-height: 1.4;
                font-size: 11pt;
                color: #000;
                margin: 0;
              }
              
              @media print {
                body {
                  padding: 20mm 15mm !important;
                  margin: 0 !important;
                }
                
                /* 첫 번째와 마지막 요소에 추가 여백 */
                body > *:first-child {
                  margin-top: 15mm !important;
                }
                
                body > *:last-child {
                  margin-bottom: 15mm !important;
                }
                
                /* 인쇄 시 모든 박스 스타일 제거 */
                div[style*="border"],
                div[style*="background"],
                div[style*="padding"] {
                  border: none !important;
                  background: none !important;
                  background-color: transparent !important;
                  padding: 0 !important;
                  margin: 15px 0 !important;
                  box-shadow: none !important;
                }
                
                /* 섹션 구분선 추가 */
                h2::after {
                  content: "";
                  display: block;
                  width: 100%;
                  height: 1px;
                  background: #ccc;
                  margin-top: 8px;
                }
              }
              
              h1 { 
                color: #000; 
                border-bottom: 2px solid #000; 
                padding-bottom: 8px; 
                margin: 20px 0 15px 0;
                font-size: 18pt;
                page-break-after: avoid;
              }
              
              h2 { 
                color: #000; 
                margin-top: 20px; 
                margin-bottom: 10px;
                padding-bottom: 4px;
                font-size: 14pt;
                page-break-after: avoid;
              }
              
              h3 { 
                color: #000; 
                margin-top: 12px;
                margin-bottom: 6px;
                font-size: 12pt;
                page-break-after: avoid;
              }
              
              h4 {
                margin: 10px 0 5px 0;
                font-size: 11pt;
                page-break-after: avoid;
                color: #000;
              }
              
              p { 
                margin: 6px 0; 
                line-height: 1.5;
              }
              
              strong { 
                color: #000;
                font-weight: bold;
              }
              
              hr { 
                border: none; 
                border-top: 1px solid #ccc; 
                margin: 15px 0; 
              }
              
              ul, ol { 
                padding-left: 20px; 
                margin: 8px 0;
              }
              
              li { 
                margin: 4px 0; 
                line-height: 1.5;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                page-break-inside: avoid;
              }
              
              th, td {
                border: 1px solid #999;
                padding: 6px 8px;
                text-align: left;
              }
              
              th {
                background-color: #f0f0f0 !important;
                color: #000 !important;
                font-weight: bold;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* 페이지 나누기 방지 */
              .no-break {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            ${report.narrative}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const { summary } = report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              📊 AI 예측 인사이트 보고서
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {report.customer} - {report.item}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 위험도 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">위험도</div>
              <div className={`text-2xl font-bold ${
                summary.risk.level === '매우 높음' || summary.risk.level === '높음' ? 'text-red-600' :
                summary.risk.level === '보통' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {summary.risk.level}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                점수: {summary.risk.score}/100
              </div>
            </div>

            {/* 예측 추세 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">예측 추세</div>
              <div className="text-2xl font-bold text-blue-600">
                {summary.prediction.trend}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                평균: {summary.prediction.average}
              </div>
            </div>

            {/* 기준 초과 확률 */}
            {summary.prediction.exceed_probability !== undefined && (
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">기준 초과 확률</div>
                <div className={`text-2xl font-bold ${
                  summary.prediction.exceed_probability > 50 ? 'text-red-600' :
                  summary.prediction.exceed_probability > 20 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {summary.prediction.exceed_probability}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {summary.prediction.exceed_days}일 / 30일
                </div>
              </div>
            )}

            {/* 데이터 품질 */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">데이터 품질</div>
              <div className="text-2xl font-bold text-indigo-600">
                {summary.historical.volatility}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                변동성: {summary.historical.std_dev.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div 
            className="prose prose-blue max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: report.narrative }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            생성 시각: {report.report_date}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              🖨️ 인쇄 / PDF 저장
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
