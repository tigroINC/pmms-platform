"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

export default function CreateStackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    siteCode: "",
    siteName: "",
    location: "",
    facilityType: "",
    height: "",
    diameter: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.siteCode || !formData.siteName) {
      alert("현장 코드와 명칭은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customer/stacks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("굴뚝이 등록되었습니다.");
        router.push("/customer/stacks");
      } else {
        const data = await res.json();
        alert(data.error || "등록 실패");
      }
    } catch (error) {
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button onClick={() => router.back()} className="mb-2 text-sm">
          ← 돌아가기
        </Button>
        <h1 className="text-2xl font-bold mb-1">굴뚝 직접 등록</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          우리 현장의 굴뚝 정보를 직접 등록할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            현장 코드 <span className="text-red-500">*</span>
            <InfoTooltip
              title="현장 코드란?"
              content="우리 현장에서 실제로 사용하는 굴뚝 식별 코드입니다."
            />
          </label>
          <Input
            value={formData.siteCode}
            onChange={(e) =>
              setFormData({ ...formData, siteCode: e.target.value })
            }
            placeholder="예: A-001"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            현장 명칭 <span className="text-red-500">*</span>
            <InfoTooltip content="현장에서 사용하는 굴뚝의 공식 명칭입니다. (예: 1공장 1호 배출시설 굴뚝, Silp PC 300 B/F)" />
          </label>
          <Input
            value={formData.siteName}
            onChange={(e) =>
              setFormData({ ...formData, siteName: e.target.value })
            }
            placeholder="예: 1공장 1호 배출시설 굴뚝"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            위치
            <InfoTooltip content="굴뚝이 설치된 구체적인 위치를 입력해주세요." />
          </label>
          <Input
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
            placeholder="예: 1공장 북측"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            배출시설 종류
            <InfoTooltip content="해당 굴뚝이 연결된 배출시설의 종류를 입력해주세요. (예: 고체입자상물질 저장시설, 연소시설)" />
          </label>
          <Input
            value={formData.facilityType}
            onChange={(e) =>
              setFormData({ ...formData, facilityType: e.target.value })
            }
            placeholder="예: 고체입자상물질 저장시설"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              굴뚝 높이 (m)
              <InfoTooltip content="굴뚝의 지상으로부터의 높이를 미터 단위로 입력해주세요." />
            </label>
            <Input
              type="number"
              step="0.1"
              value={formData.height}
              onChange={(e) =>
                setFormData({ ...formData, height: e.target.value })
              }
              placeholder="예: 19.6"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              굴뚝 안지름 (m)
              <InfoTooltip content="굴뚝 내부의 지름을 미터 단위로 입력해주세요." />
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.diameter}
              onChange={(e) =>
                setFormData({ ...formData, diameter: e.target.value })
              }
              placeholder="예: 0.30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              굴뚝 종별 (종)
              <InfoTooltip content="배출허용기준 적용을 위한 굴뚝 종별을 입력해주세요. (예: 1종, 2종, 3종, 4종, 5종)" />
            </label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="예: 5"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-500 hover:bg-gray-600"
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
