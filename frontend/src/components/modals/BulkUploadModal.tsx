"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  templateHeaders: string[];
  exampleRow: string[];
  templateFileName: string;
  onUpload: (file: File) => Promise<{ success: boolean; message: string; count?: number }>;
  parseInstructions?: string;
}

export default function BulkUploadModal({
  isOpen,
  onClose,
  title,
  templateHeaders,
  exampleRow,
  templateFileName,
  onUpload,
  parseInstructions = "양식에 맞게 작성한 CSV 파일을 업로드하세요."
}: BulkUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const downloadTemplate = () => {
    const header = templateHeaders.map(h => `"${h}"`).join(",");
    const example = exampleRow.map(v => `"${v}"`).join(",");
    const csv = header + "\n" + example + "\n";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("파일을 선택해주세요.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      console.log("[BulkUpload] 파일 업로드 시작:", selectedFile.name);
      const result = await onUpload(selectedFile);
      console.log("[BulkUpload] 업로드 결과:", result);
      
      if (result.success) {
        const msg = result.message || "업로드 완료";
        setMessage(`✅ ${msg}`);
        setSelectedFile(null);
      } else {
        console.error("[BulkUpload] 업로드 실패:", result.message);
        setMessage(`❌ ${result.message || "업로드 실패"}`);
      }
    } catch (error: any) {
      console.error("[BulkUpload] 예외 발생:", error);
      setMessage(`❌ 오류: ${error.message || "업로드 중 문제가 발생했습니다."}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setMessage("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* 안내 */}
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
            <p className="font-medium mb-1">📋 업로드 절차</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>아래 "업로드 양식 다운로드" 버튼을 클릭하여 CSV 양식을 다운로드합니다.</li>
              <li>다운로드한 양식에 데이터를 입력합니다. (예시 행 참고)</li>
              <li>"파일 선택" 버튼을 클릭하여 작성한 CSV 파일을 선택합니다.</li>
              <li>"업로드" 버튼을 클릭하여 데이터를 등록합니다.</li>
            </ol>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {parseInstructions}
          </div>

          {/* 버튼 영역 */}
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={downloadTemplate}
                disabled={uploading}
                className="flex-1"
              >
                📥 업로드 양식 다운로드
              </Button>
            </div>

            <div className="flex gap-2">
              <label className="flex-1">
                <div className={`px-4 py-2 border-2 border-dashed rounded cursor-pointer text-center transition-colors ${
                  selectedFile
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {selectedFile ? (
                    <span className="text-sm">
                      📄 {selectedFile.name}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      📁 파일 선택 (CSV)
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
              </label>
            </div>

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? "업로드 중..." : "업로드"}
            </Button>
          </div>

          {/* 메시지 */}
          {message && (
            <div className={`text-sm p-4 rounded border-2 ${
              message.startsWith("✅")
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-500"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-500"
            }`}>
              <div className="flex flex-col gap-3">
                <pre className="whitespace-pre-wrap font-sans">{message}</pre>
                <Button
                  size="sm"
                  onClick={() => {
                    setMessage("");
                    handleClose();
                  }}
                  className="self-end"
                >
                  확인
                </Button>
              </div>
            </div>
          )}
        </div>

        {!message && (
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleClose}
              disabled={uploading}
            >
              닫기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
