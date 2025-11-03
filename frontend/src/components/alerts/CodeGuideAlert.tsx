"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import Button from "@/components/ui/Button";

interface CodeGuideAlertProps {
  pageType: "org" | "customer";
}

export function CodeGuideAlert({ pageType }: CodeGuideAlertProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dontShowAgain = localStorage.getItem(`codeGuide_${pageType}_hidden`);
    if (!dontShowAgain) {
      setShow(true);
    }
  }, [pageType]);

  const handleDontShowAgain = () => {
    localStorage.setItem(`codeGuide_${pageType}_hidden`, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">
              💡 코드 안내
            </h3>
            <button
              onClick={() => setShow(false)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {pageType === "org" ? (
            <>
              <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <p className="mb-1">
                  • <strong>내부 코드</strong>: 우리 회사에서 사용하는 관리 코드
                </p>
                <p className="mb-1">
                  • <strong>현장 코드</strong>: 고객사 현장에서 사용하는 코드
                </p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                예: 삼성전자는 "A-001"로 부르지만, 우리는 "S-001"로 관리합니다.
              </p>
            </>
          ) : (
            <>
              <div className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <p className="mb-1">
                  • <strong>현장 코드</strong>: 우리 현장에서 사용하는 굴뚝 코드
                </p>
                <p className="mb-1">
                  • <strong>측정업체 코드</strong>: 각 환경측정기업이 내부적으로 사용하는 코드
                </p>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                측정업체마다 다른 코드를 사용할 수 있으며, 시스템이 자동으로 연결합니다.
              </p>
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDontShowAgain}
            className="text-xs"
          >
            다시 보지 않기
          </Button>
        </div>
      </div>
    </div>
  );
}
