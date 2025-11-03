"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type StackEditModalProps = {
  stackId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function StackEditModal({
  stackId,
  isOpen,
  onClose,
  onSuccess,
}: StackEditModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stack, setStack] = useState<any>(null);
  const [formData, setFormData] = useState({
    code: "",
    fullName: "",
    facilityType: "",
    location: "",
    height: "",
    diameter: "",
    description: "",
    changeReason: "",
  });

  useEffect(() => {
    if (isOpen && stackId) {
      fetchStack();
    }
  }, [isOpen, stackId]);

  const fetchStack = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stacks/${stackId}`);
      if (!res.ok) {
        alert("굴뚝 정보를 불러올 수 없습니다.");
        onClose();
        return;
      }
      const data = await res.json();
      setStack(data.data);
      setFormData({
        code: data.data.code || "",
        fullName: data.data.fullName || "",
        facilityType: data.data.facilityType || "",
        location: data.data.location || "",
        height: data.data.height?.toString() || "",
        diameter: data.data.diameter?.toString() || "",
        description: data.data.description || "",
        changeReason: "",
      });
    } catch (error) {
      console.error("Failed to fetch stack:", error);
      alert("오류가 발생했습니다.");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.changeReason.trim()) {
      alert("수정 사유를 입력해주세요.");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch(`/api/stacks/${stackId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.code || null,
          fullName: formData.fullName || null,
          facilityType: formData.facilityType || null,
          location: formData.location || null,
          height: formData.height ? parseFloat(formData.height) : null,
          diameter: formData.diameter ? parseFloat(formData.diameter) : null,
          description: formData.description || null,
          changeReason: formData.changeReason,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("굴뚝 정보가 수정되었습니다.");
        onSuccess();
        onClose();
      } else {
        alert(data.error || "수정 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">굴뚝 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 읽기 전용 정보 */}
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      굴뚝번호 (읽기 전용)
                    </label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {stack?.name || "-"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      현장 코드
                    </label>
                    <div className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                      {stack?.siteCode || "-"}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    현장 명칭
                  </label>
                  <div className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {stack?.siteName || "-"}
                  </div>
                </div>
              </div>

              {/* 수정 가능 필드 */}
              <div className="space-y-4">
                <Input
                  label="굴뚝 코드"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="예: CUST001-#A2020007"
                />

                <Input
                  label="굴뚝 정식 명칭"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  placeholder="예: Silp PC 300 B/F"
                />

                <Input
                  label="배출시설 종류"
                  value={formData.facilityType}
                  onChange={(e) =>
                    setFormData({ ...formData, facilityType: e.target.value })
                  }
                  placeholder="예: 소각로"
                />

                <Input
                  label="위치"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="예: 1공장 동측"
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="높이 (m)"
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    placeholder="예: 30.5"
                  />

                  <Input
                    label="직경 (m)"
                    type="number"
                    step="0.1"
                    value={formData.diameter}
                    onChange={(e) =>
                      setFormData({ ...formData, diameter: e.target.value })
                    }
                    placeholder="예: 1.2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    rows={3}
                    placeholder="추가 설명이나 특이사항을 입력하세요"
                  />
                </div>

                {/* 수정 사유 (필수) */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <label className="block text-sm font-medium mb-1 text-yellow-900 dark:text-yellow-300">
                    수정 사유 (필수) *
                  </label>
                  <textarea
                    value={formData.changeReason}
                    onChange={(e) =>
                      setFormData({ ...formData, changeReason: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                    rows={2}
                    placeholder="수정 사유를 입력해주세요 (예: 실측 결과 높이 변경)"
                    required
                  />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                    ⚠️ 수정 사유는 필수 입력 항목이며, 모든 수정 이력이 자동으로
                    기록됩니다.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end pt-4 border-t dark:border-gray-700">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  취소
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "저장 중..." : "저장"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
