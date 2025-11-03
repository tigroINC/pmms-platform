"use client";
import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface StackFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  stack?: any; // 수정 시 기존 굴뚝 데이터
}

export default function StackFormModal({ isOpen, onClose, onSuccess, stack }: StackFormModalProps) {
  const isEditMode = !!stack;
  const [customers, setCustomers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: stack?.customerId || "",
    name: stack?.name || "",
    code: stack?.code || "",
    fullName: stack?.fullName || "",
    facilityType: stack?.facilityType || "",
    height: stack?.height?.toString() || "",
    diameter: stack?.innerDiameter?.toString() || "",
    category: stack?.category || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchCustomers();
    }
  }, [isOpen]);

  // stack prop이 변경될 때 formData 업데이트
  useEffect(() => {
    if (stack) {
      setFormData({
        customerId: stack.customerId || "",
        name: stack.name || "",
        code: stack.code || "",
        fullName: stack.fullName || "",
        facilityType: stack.facilityType || "",
        height: stack.height?.toString() || "",
        diameter: stack.innerDiameter?.toString() || "",
        category: stack.category || "",
      });
    } else {
      setFormData({
        customerId: "",
        name: "",
        code: "",
        fullName: "",
        facilityType: "",
        height: "",
        diameter: "",
        category: "",
      });
    }
    setError("");
  }, [stack, isOpen]);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers");
      const json = await res.json();
      const activeCustomers = (json.data || []).filter((c: any) => c.isActive !== false);
      setCustomers(activeCustomers.sort((a: any, b: any) => {
        if (a.code === 'CUST999') return 1;
        if (b.code === 'CUST999') return -1;
        return (a.code || a.name).localeCompare(b.code || b.name);
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.customerId) {
      setError("고객사를 선택해주세요.");
      return;
    }
    if (!formData.name) {
      setError("굴뚝번호는 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        customerId: formData.customerId,
        name: formData.name,
      };
      
      if (formData.code) payload.code = formData.code;
      if (formData.fullName) payload.fullName = formData.fullName;
      if (formData.facilityType) payload.facilityType = formData.facilityType;
      if (formData.height) payload.height = parseFloat(formData.height);
      if (formData.diameter) payload.diameter = parseFloat(formData.diameter);
      if (formData.category) payload.category = formData.category;

      const url = isEditMode ? `/api/stacks/${stack.id}` : "/api/stacks";
      const method = isEditMode ? "PATCH" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "저장 실패");
      }

      // 성공
      if (!isEditMode) {
        setFormData({
          customerId: "",
          name: "",
          code: "",
          fullName: "",
          facilityType: "",
          height: "",
          diameter: "",
          category: "",
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditMode ? "굴뚝 정보 수정" : "신규 굴뚝 추가"}
          </h2>
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

          <div className="space-y-1">
            <label className="text-sm font-medium">
              고객사 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.customerId}
              onChange={(e) => handleChange("customerId", e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
              required
            >
              <option value="">고객사를 선택하세요</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code || "코드없음"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                굴뚝번호 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", (e.target as HTMLInputElement).value)}
                placeholder="예: #A2020007"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                굴뚝코드 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.code}
                onChange={(e) => handleChange("code", (e.target as HTMLInputElement).value)}
                placeholder="예: CUST001-#A2020007"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              굴뚝 정식 명칭 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", (e.target as HTMLInputElement).value)}
              placeholder="예: Silp PC 300 B/F"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              배출시설 종류 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.facilityType}
              onChange={(e) => handleChange("facilityType", (e.target as HTMLInputElement).value)}
              placeholder="예: 고체입자상물질 저장시설"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                굴뚝 높이(m) <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                type="number"
                step="0.1"
                value={formData.height}
                onChange={(e) => handleChange("height", (e.target as HTMLInputElement).value)}
                placeholder="예: 19.6"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                굴뚝 안지름(m) <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.diameter}
                onChange={(e) => handleChange("diameter", (e.target as HTMLInputElement).value)}
                placeholder="예: 0.30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                굴뚝 종별(종) <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.category}
                onChange={(e) => handleChange("category", (e.target as HTMLInputElement).value)}
                placeholder="예: 5"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
