"use client";
import { useState, useEffect } from "react";
import Input from "@/components/ui/Input";

interface MeasurementEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  measurement: any;
}

export default function MeasurementEditModal({
  isOpen,
  onClose,
  onSuccess,
  measurement,
}: MeasurementEditModalProps) {
  const [formData, setFormData] = useState({
    value: "",
    measuredAt: "",
    note: "",
    editReason: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (measurement && isOpen) {
      const measuredDate = new Date(measurement.measuredAt);
      const formattedDate = measuredDate.toISOString().slice(0, 16);
      
      setFormData({
        value: measurement.value?.toString() || "",
        measuredAt: formattedDate,
        note: measurement.note || "",
        editReason: "",
      });
      setError("");
    }
  }, [measurement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.value) {
      setError("측정값은 필수입니다.");
      return;
    }

    if (!formData.editReason) {
      setError("수정 사유를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/measurements/${measurement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          value: parseFloat(formData.value),
          measuredAt: formData.measuredAt,
          note: formData.note,
          editReason: formData.editReason,
          editedBy: "admin", // 실제로는 현재 사용자 정보 사용
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "수정 실패");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !measurement) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">측정 기록 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* 기존 정보 표시 */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">고객사:</span>
              <span className="font-medium">{measurement.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">굴뚝:</span>
              <span className="font-medium">{measurement.stack?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">측정항목:</span>
              <span className="font-medium">{measurement.item?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">원본 측정값:</span>
              <span className="font-medium text-blue-600">
                {measurement.value} {measurement.item?.unit}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              측정값 <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  value: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder="측정값 입력"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              측정 일시 <span className="text-red-500">*</span>
            </label>
            <Input
              type="datetime-local"
              value={formData.measuredAt}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  measuredAt: (e.target as HTMLInputElement).value,
                }))
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">비고</label>
            <Input
              value={formData.note}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  note: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder="비고 입력"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              수정 사유 <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.editReason}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  editReason: (e.target as HTMLInputElement).value,
                }))
              }
              placeholder="예: 측정값 오입력 정정"
              required
            />
            <p className="text-xs text-gray-500">
              수정 사유는 이력 추적을 위해 필수로 입력해야 합니다.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
