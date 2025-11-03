"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function CustomerStackEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const stackId = params?.id as string;

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
    if (user?.role !== "CUSTOMER_ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchStack();
  }, [user, router, stackId]);

  const fetchStack = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/stacks/${stackId}`);
      if (!res.ok) {
        alert("굴뚝 정보를 불러올 수 없습니다.");
        router.push("/customer/stacks");
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
      router.push("/customer/stacks");
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
        router.push("/customer/stacks?tab=confirmed");
      } else {
        alert(data.error || "수정 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!stack) {
    return null;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">굴뚝 정보 수정</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          굴뚝번호: <span className="font-mono font-semibold">{stack.name}</span>
        </p>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>수정 가능 항목:</strong> 굴뚝코드, 정식 명칭, 배출시설 종류, 위치, 높이, 직경, 설명
        </p>
        <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
          ⚠️ <strong>수정 불가 항목:</strong> 굴뚝번호 (환경측정기업 관리)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            굴뚝코드 (선택)
          </label>
          <Input
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="예: STACK-001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            굴뚝 정식 명칭 (선택)
          </label>
          <Input
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="예: 제1공장 배출구"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            배출시설 종류 (선택)
          </label>
          <Input
            value={formData.facilityType}
            onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
            placeholder="예: 소각시설"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            위치 (선택)
          </label>
          <Input
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="예: 제1공장 동측"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              굴뚝 높이 (m)
            </label>
            <Input
              type="number"
              step="0.1"
              value={formData.height}
              onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              placeholder="예: 25.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              굴뚝 안지름 (m)
            </label>
            <Input
              type="number"
              step="0.1"
              value={formData.diameter}
              onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
              placeholder="예: 1.2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            설명 (선택)
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="추가 설명을 입력하세요"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            rows={3}
          />
        </div>

        <div className="border-t pt-4">
          <label className="block text-sm font-medium mb-1 text-red-600 dark:text-red-400">
            수정 사유 (필수) *
          </label>
          <textarea
            value={formData.changeReason}
            onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
            placeholder="수정 사유를 입력해주세요 (예: 현장 코드 변경, 높이 측정값 보정)"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
            rows={2}
            required
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/customer/stacks?tab=confirmed")}
            disabled={saving}
          >
            취소
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </form>
    </div>
  );
}
