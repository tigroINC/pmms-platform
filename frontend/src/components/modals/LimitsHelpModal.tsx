"use client";
import Button from "@/components/ui/Button";

interface LimitsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LimitsHelpModal({ isOpen, onClose }: LimitsHelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            ❓ 배출허용기준 관리 도움말
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* 컬럼 설명 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              📋 컬럼 설명
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="font-medium min-w-[80px]">범위:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  배출허용기준이 어느 수준에서 적용되는지 표시 (전체/고객사별/굴뚝별)
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium min-w-[80px]">고객사:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  실제 어느 고객사에 적용되는지 표시 (범위가 "전체"면 "전체" 표시)
                </span>
              </div>
              <div className="flex gap-3">
                <span className="font-medium min-w-[80px]">굴뚝:</span>
                <span className="text-gray-600 dark:text-gray-400">
                  특정 굴뚝에만 적용되는 경우 굴뚝명 표시
                </span>
              </div>
            </div>
          </div>

          {/* 범위 종류 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              🎯 범위 종류
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 whitespace-nowrap">
                  공통
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">공통 기준</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    모든 고객사, 모든 굴뚝에 적용되는 기본 기준입니다.
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 whitespace-nowrap">
                  고객사별
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">고객사별 기준</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    특정 고객사의 모든 굴뚝에 적용됩니다. (예: A기업 전체)
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">
                  굴뚝별
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm">굴뚝별 기준</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    특정 고객사의 특정 굴뚝에만 적용됩니다. (예: A기업 S-001)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우선순위 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              ⚡ 적용 우선순위 (높음 → 낮음)
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  1순위
                </span>
                <span className="text-sm font-medium">굴뚝별 기준</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (특정 굴뚝에만 적용)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  2순위
                </span>
                <span className="text-sm font-medium">고객사별 기준</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (해당 고객사 전체)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  3순위
                </span>
                <span className="text-sm font-medium">공통 기준</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (모든 고객사/굴뚝)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                  기본
                </span>
                <span className="text-sm font-medium">기본 기준</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  (측정항목 테이블의 기본값)
                </span>
              </div>
            </div>
          </div>

          {/* 사용 예시 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              💡 사용 예시
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2 text-sm">
              <div className="font-medium">시나리오: 먼지(PM) 배출허용기준</div>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 pl-4">
                <div>• 일반 기준: 20 mg/Sm³ (공통 기준)</div>
                <div>• A기업: 15 mg/Sm³ (고객사별 기준 - 특별관리 대상)</div>
                <div>• A기업 S-001: 18 mg/Sm³ (굴뚝별 기준 - 노후화로 완화)</div>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="font-medium text-xs">적용 결과:</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 pl-4 space-y-1">
                  <div>→ A기업 S-001: <strong>18</strong> (굴뚝별 우선)</div>
                  <div>→ A기업 S-002: <strong>15</strong> (고객사별 적용)</div>
                  <div>→ B기업: <strong>20</strong> (공통 기준 적용)</div>
                </div>
              </div>
            </div>
          </div>

          {/* 안내사항 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              📌 안내사항
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>특별대책지역은 일반지역 기준의 80%가 자동 계산됩니다</li>
              <li>비활성화된 기준은 적용되지 않습니다</li>
              <li>관리자만 추가/수정/삭제가 가능합니다</li>
              <li>수정 시 고객사, 굴뚝, 항목을 모두 변경할 수 있습니다</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <Button onClick={onClose}>
            확인
          </Button>
        </div>
      </div>
    </div>
  );
}
