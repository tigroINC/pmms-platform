"use client";

interface AnomalyWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  inputValue: number;
  lowerBound: number;
  upperBound: number;
  itemName: string;
}

export default function AnomalyWarningModal({
  isOpen,
  onClose,
  onConfirm,
  inputValue,
  lowerBound,
  upperBound,
  itemName,
}: AnomalyWarningModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              측정값 확인 필요
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              입력하신 <span className="font-semibold text-blue-600 dark:text-blue-400">{itemName}</span> 값({inputValue.toFixed(2)})이 
              예상 범위(<span className="font-medium">{lowerBound.toFixed(2)} ~ {upperBound.toFixed(2)}</span>)를 벗어났습니다.
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">💡 확인이 필요한 사항:</p>
              <ul className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                <li>• 측정 장비의 상태를 확인해주세요</li>
                <li>• 측정 조건을 재확인해주세요</li>
                <li>• 실제 배출 상황을 점검해주세요</li>
              </ul>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400">
              이대로 저장하시겠습니까?
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            확인하고 저장
          </button>
        </div>
      </div>
    </div>
  );
}
