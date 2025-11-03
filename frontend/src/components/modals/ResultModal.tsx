"use client";

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
}

export default function ResultModal({ isOpen, onClose, title, message, type = "info" }: ResultModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30 text-green-900 dark:text-green-200",
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/30 text-red-900 dark:text-red-200",
    warning: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30 text-yellow-900 dark:text-yellow-200",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30 text-blue-900 dark:text-blue-200",
  };

  const iconMap = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`rounded-t-lg border-b p-4 ${typeStyles[type]}`}>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="text-2xl">{iconMap[type]}</span>
            {title}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{message}</p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
