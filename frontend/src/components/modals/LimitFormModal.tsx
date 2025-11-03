"use client";
import { useEffect, useState } from "react";
import { useCustomers } from "@/hooks/useCustomers";
import { useStacks } from "@/hooks/useStacks";
import { useMeasurementItems } from "@/hooks/useMeasurements";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";

interface LimitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  limit?: any;
}

export default function LimitFormModal({
  isOpen,
  onClose,
  onSuccess,
  limit,
}: LimitFormModalProps) {
  const { list: customers } = useCustomers();
  const { items } = useMeasurementItems();
  
  const [customerId, setCustomerId] = useState("");
  const [stackId, setStackId] = useState("");
  const [itemKey, setItemKey] = useState("");
  const [limitValue, setLimitValue] = useState("");
  const [region, setRegion] = useState("일반지역");
  const [loading, setLoading] = useState(false);

  const { list: stacks } = useStacks(customerId || undefined);

  // 허용기준이 있는 항목만 필터링
  const itemsWithLimit = items.filter((item: any) => item.hasLimit);

  useEffect(() => {
    if (isOpen && limit) {
      // 수정 모드
      setCustomerId(limit.customerId || "");
      setStackId(limit.stackId || "");
      setItemKey(limit.itemKey || "");
      setLimitValue(String(limit.limit || ""));
      setRegion(limit.region || "");
    } else if (isOpen) {
      // 신규 모드
      setCustomerId("");
      setStackId("");
      setItemKey("");
      setLimitValue("");
      setRegion("");
    }
  }, [isOpen, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemKey || !limitValue) {
      alert("항목과 기준값을 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      if (limit?.id) {
        // 수정 모드: 기존 레코드 업데이트
        // 기존 레코드를 삭제하고 새로운 조건으로 생성
        // (customerId, stackId, itemKey가 변경될 수 있으므로)
        
        // 1. 기존 레코드 삭제
        await fetch(`/api/limits?id=${limit.id}`, {
          method: "DELETE",
        });
        
        // 2. 새로운 조건으로 생성
        const requestData = {
          limits: [{
            itemKey,
            limit: parseFloat(limitValue),
          }],
          customerId: customerId || "",
          stackId: stackId || "",
          region: region || "",
          createdBy: "admin",
        };

        const res = await fetch("/api/limits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (res.ok) {
          alert("수정되었습니다.");
          onSuccess();
          onClose();
        } else {
          const json = await res.json();
          alert(json.error || "수정 실패");
        }
      } else {
        // 신규 모드
        const requestData = {
          limits: [{
            itemKey,
            limit: parseFloat(limitValue),
          }],
          customerId: customerId || "",
          stackId: stackId || "",
          region: region || "",
          createdBy: "admin",
        };

        const res = await fetch("/api/limits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });

        if (res.ok) {
          alert("저장되었습니다.");
          onSuccess();
          onClose();
        } else {
          const json = await res.json();
          alert(json.error || "저장 실패");
        }
      }
    } catch (error) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold">
            {limit ? "배출허용기준 수정" : "배출허용기준 추가"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">고객사</label>
            <Select
              value={customerId}
              onChange={(e) => {
                setCustomerId((e.target as HTMLSelectElement).value);
                setStackId("");
              }}
            >
              <option value="">전체</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">굴뚝</label>
            <Select
              value={stackId}
              onChange={(e) => setStackId((e.target as HTMLSelectElement).value)}
              disabled={!customerId}
            >
              <option value="">전체</option>
              {stacks.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">측정항목 *</label>
            <Select
              value={itemKey}
              onChange={(e) => setItemKey((e.target as HTMLSelectElement).value)}
              required
            >
              <option value="">선택하세요</option>
              {itemsWithLimit.map((item: any) => (
                <option key={item.key} value={item.key}>
                  {item.name} ({item.key})
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">기준값 *</label>
            <Input
              type="number"
              step="0.01"
              value={limitValue}
              onChange={(e) => setLimitValue((e.target as HTMLInputElement).value)}
              placeholder="예: 20"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">지역 구분</label>
            <Select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="">전체</option>
              <option value="일반지역">일반지역</option>
              <option value="특별대책지역">특별대책지역</option>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
