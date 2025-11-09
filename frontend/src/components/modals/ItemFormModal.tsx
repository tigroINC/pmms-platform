"use client";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item?: any; // 수정할 항목 (없으면 신규 등록)
}

export default function ItemFormModal({ isOpen, onClose, onSuccess, item }: ItemFormModalProps) {
  const isEditMode = !!item;
  const [formData, setFormData] = useState({
    key: "",
    name: "",
    englishName: "",
    unit: "",
    limit: "",
    category: "",
    classification: "",
    analysisMethod: "",
    hasLimit: true,
    inputType: "number",
    options: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (isOpen && item) {
      setFormData({
        key: item.key || "",
        name: item.name || "",
        englishName: item.englishName || "",
        unit: item.unit || "",
        limit: item.limit?.toString() || "",
        category: item.category || "",
        classification: item.classification || "",
        analysisMethod: item.analysisMethod || "",
        hasLimit: item.hasLimit !== false,
        inputType: item.inputType || "number",
        options: item.options || "",
      });
    } else if (isOpen && !item) {
      // 신규 등록 모드일 때 초기화
      setFormData({
        key: "",
        name: "",
        englishName: "",
        unit: "",
        limit: "",
        category: "",
        classification: "",
        analysisMethod: "",
        hasLimit: true,
        inputType: "number",
        options: "",
      });
    }
    setError("");
  }, [isOpen, item]);

  const categoryOptions = [
    "오염물질",
    "채취환경",
  ];

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!formData.key) {
      setError("항목코드는 필수입니다.");
      return;
    }
    if (!formData.name) {
      setError("항목명(한글)은 필수입니다.");
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        key: formData.key.trim(),
        name: formData.name.trim(),
        unit: formData.unit.trim(),
        limit: formData.limit ? parseFloat(formData.limit) : null,
        hasLimit: formData.hasLimit,
        inputType: formData.inputType,
      };
      
      if (formData.englishName) payload.englishName = formData.englishName.trim();
      if (formData.category) payload.category = formData.category;
      if (formData.classification) payload.classification = formData.classification.trim();
      if (formData.analysisMethod) payload.analysisMethod = formData.analysisMethod.trim();
      if (formData.options) payload.options = formData.options.trim();

      const url = isEditMode ? `/api/items/${item.id}` : "/api/items";
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
      setFormData({
        key: "",
        name: "",
        englishName: "",
        unit: "",
        limit: "",
        category: "",
        classification: "",
        analysisMethod: "",
        hasLimit: true,
        inputType: "number",
        options: "",
      });
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isEditMode ? "측정항목 수정" : "신규 측정항목 추가"}</h2>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                항목코드 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.key}
                onChange={(e) => handleChange("key", (e.target as HTMLInputElement).value)}
                placeholder="예: EA-I-0001"
                required
              />
              <p className="text-xs text-gray-500">형식: EA-[I/M/V]-0000</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                구분 <span className="text-gray-400">(선택)</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
              >
                <option value="">선택하세요</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">오염물질 또는 채취환경</p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              항목명(한글) <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange("name", (e.target as HTMLInputElement).value)}
              placeholder="예: 먼지"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              항목명(영문) <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.englishName}
              onChange={(e) => handleChange("englishName", (e.target as HTMLInputElement).value)}
              placeholder="예: Particulate Matter"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              항목분류 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.classification}
              onChange={(e) => handleChange("classification", (e.target as HTMLInputElement).value)}
              placeholder="예: 무기물질(기본항목), 금속화합물, 휘발성유기화합물 등"
            />
            <p className="text-xs text-gray-500">자유롭게 입력하세요 (예: 무기물질(기본항목), 금속화합물, 휘발성유기화합물 등)</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">
                기본단위 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                value={formData.unit}
                onChange={(e) => handleChange("unit", (e.target as HTMLInputElement).value)}
                placeholder="예: ppm, mg/S㎥, 도"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                허용기준값 <span className="text-gray-400">(선택)</span>
              </label>
              <Input
                type="number"
                step="0.001"
                value={formData.limit}
                onChange={(e) => handleChange("limit", (e.target as HTMLInputElement).value)}
                placeholder="예: 50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              측정분석방법 <span className="text-gray-400">(선택)</span>
            </label>
            <Input
              value={formData.analysisMethod}
              onChange={(e) => handleChange("analysisMethod", (e.target as HTMLInputElement).value)}
              placeholder="예: ES 01301.1b"
            />
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.hasLimit}
                onChange={(e) => handleChange("hasLimit", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">허용기준 적용 항목</span>
            </label>
            <p className="text-xs text-gray-500 ml-6">
              체크 시 배출허용기준이 있는 항목으로 표시됩니다
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              입력 타입 <span className="text-gray-400">(선택)</span>
            </label>
            <select
              value={formData.inputType}
              onChange={(e) => handleChange("inputType", e.target.value)}
              className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700"
            >
              <option value="number">숫자 입력</option>
              <option value="select">선택 입력 (드롭다운)</option>
              <option value="text">텍스트 입력</option>
            </select>
          </div>

          {formData.inputType === "select" && (
            <div className="space-y-1">
              <label className="text-sm font-medium">
                선택 옵션 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.options}
                onChange={(e) => handleChange("options", (e.target as HTMLInputElement).value)}
                placeholder='예: ["맑음","구름","비","눈"]'
              />
              <p className="text-xs text-gray-500">JSON 배열 형식으로 입력하세요</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "저장 중..." : (isEditMode ? "수정" : "저장")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
